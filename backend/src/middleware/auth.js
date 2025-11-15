const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const pool = require('../db/pool')
const tokenBlacklist = require('../services/tokenBlacklist')

// CRITICAL SECURITY: Validate JWT_SECRET exists at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set!')
  console.error('Application cannot start without a secure JWT secret.')
  process.exit(1)
}

// Session management - track active sessions
const activeSessions = new Map()

// Helper function to generate device fingerprint
const generateDeviceFingerprint = (req) => {
  const userAgent = req.get('User-Agent') || ''
  const acceptLanguage = req.get('Accept-Language') || ''
  const acceptEncoding = req.get('Accept-Encoding') || ''
  const ip = req.ip || req.connection.remoteAddress || ''

  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}${acceptLanguage}${acceptEncoding}${ip}`)
    .digest('hex')
    .substring(0, 32)

  return fingerprint
}

// Helper function to log security events
const logSecurityEvent = async (event, userId, details = {}) => {
  try {
    // SECURITY FIX: Skip logging if no valid user ID to avoid foreign key errors
    if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
      console.log(`⚠️ Skipping security log for ${event} - no valid user ID`);
      return;
    }

    await pool.query(
      `INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        event,
        'security',
        userId,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          ip: details.ip,
          userAgent: details.userAgent,
          fingerprint: details.fingerprint,
          ...details
        })
      ]
    )
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

// Token blacklist cleanup is now handled automatically by Redis TTL
// Run periodic cleanup for statistics and health monitoring
setInterval(async () => {
  try {
    await tokenBlacklist.cleanupExpiredTokens()
  } catch (error) {
    console.error('Token blacklist cleanup error:', error)
  }
}, 60 * 60 * 1000) // Check stats every hour

const authenticateToken = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress
  const userAgent = req.get('User-Agent')
  const fingerprint = generateDeviceFingerprint(req)

  try {
    // Check for admin secret key first (timing-safe comparison)
    const adminKey = req.headers['x-admin-key']
    if (adminKey && process.env.ADMIN_SECRET_KEY) {
      let isValidAdminKey = false
      try {
        // Timing-safe comparison to prevent timing attacks
        if (adminKey.length === process.env.ADMIN_SECRET_KEY.length) {
          const adminKeyBuffer = Buffer.from(adminKey, 'utf8')
          const secretBuffer = Buffer.from(process.env.ADMIN_SECRET_KEY, 'utf8')
          isValidAdminKey = crypto.timingSafeEqual(adminKeyBuffer, secretBuffer)
        }
      } catch (error) {
        isValidAdminKey = false
      }

      if (isValidAdminKey) {
        req.isAdmin = true
        req.userId = '00000000-0000-0000-0000-000000000000'
        req.userEmail = 'admin@sway.com'
        req.deviceFingerprint = fingerprint

        await logSecurityEvent('admin_access', req.userId, { ip, userAgent, fingerprint })
        return next()
      }
    }

    // Get token from cookies or Authorization header
    let token = null

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    } else if (req.headers && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '')
    }

    if (!token) {
      await logSecurityEvent('auth_failed_no_token', null, { ip, userAgent, fingerprint })
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Check if token is blacklisted (using Redis)
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token)
    if (isBlacklisted) {
      await logSecurityEvent('auth_failed_blacklisted_token', null, { ip, userAgent, fingerprint, token: token.substring(0, 20) + '...' })
      return res.status(401).json({ error: 'Token has been revoked' })
    }

    // SECURITY: No fallback secret - will throw if JWT_SECRET missing
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check token expiry (additional validation)
    const now = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < now) {
      await logSecurityEvent('auth_failed_expired_token', decoded.userId || decoded.guestId, { ip, userAgent, fingerprint })
      return res.status(401).json({ error: 'Token expired' })
    }

    // Handle guest authentication
    if (decoded.isGuest && decoded.guestId) {
      try {
        // Verify guest exists and is active
        const guestResult = await pool.query(
          'SELECT guest_id, display_name, is_active FROM guest_users WHERE guest_id = $1 AND is_active = true',
          [decoded.guestId]
        )

        if (guestResult.rows.length === 0) {
          await logSecurityEvent('auth_failed_guest_not_found', decoded.guestId, { ip, userAgent, fingerprint })
          return res.status(401).json({ error: 'Guest session not found' })
        }

        const guest = guestResult.rows[0]
        req.guestId = guest.guest_id
        req.displayName = guest.display_name
        req.isGuest = true
        req.isAdmin = false
        req.deviceFingerprint = fingerprint

        // Track guest session
        const sessionKey = `guest-${decoded.guestId}-${fingerprint}`
        activeSessions.set(sessionKey, {
          guestId: decoded.guestId,
          fingerprint,
          lastActivity: now,
          ip,
          userAgent
        })

        // Log successful guest authentication (only for sensitive actions)
        if (req.method !== 'GET' || req.path.includes('/admin')) {
          await logSecurityEvent('guest_auth_success', decoded.guestId, {
            ip,
            userAgent,
            fingerprint,
            action: `${req.method} ${req.path}`
          })
        }

        return next()

      } catch (dbError) {
        console.error('Database error during guest auth:', dbError)
        await logSecurityEvent('auth_failed_db_error', decoded.guestId, { ip, userAgent, fingerprint })
        return res.status(500).json({ error: 'Authentication service unavailable' })
      }
    }

    // Handle regular user authentication
    try {
      const userResult = await pool.query('SELECT id, email, plan FROM users WHERE id = $1', [decoded.userId])
      if (userResult.rows.length === 0) {
        await logSecurityEvent('auth_failed_user_not_found', decoded.userId, { ip, userAgent, fingerprint })
        return res.status(401).json({ error: 'User account not found' })
      }

      const user = userResult.rows[0]
      req.userId = user.id
      req.userEmail = user.email
      req.userPlan = user.plan
      req.isGuest = false
      req.isAdmin = false
      req.deviceFingerprint = fingerprint

      // Track session
      const sessionKey = `${decoded.userId}-${fingerprint}`
      activeSessions.set(sessionKey, {
        userId: decoded.userId,
        fingerprint,
        lastActivity: now,
        ip,
        userAgent
      })

      // Log successful authentication (only for sensitive actions)
      if (req.method !== 'GET' || req.path.includes('/admin')) {
        await logSecurityEvent('auth_success', decoded.userId, {
          ip,
          userAgent,
          fingerprint,
          action: `${req.method} ${req.path}`
        })
      }

      next()

    } catch (dbError) {
      console.error('Database error during auth:', dbError)
      await logSecurityEvent('auth_failed_db_error', decoded.userId, { ip, userAgent, fingerprint })
      return res.status(500).json({ error: 'Authentication service unavailable' })
    }

  } catch (err) {
    let errorType = 'auth_failed_invalid_token'
    let errorMessage = 'Invalid authentication token'

    if (err.name === 'TokenExpiredError') {
      errorType = 'auth_failed_expired_token'
      errorMessage = 'Authentication token expired'
    } else if (err.name === 'JsonWebTokenError') {
      errorType = 'auth_failed_malformed_token'
      errorMessage = 'Malformed authentication token'
    } else if (err.name === 'NotBeforeError') {
      errorType = 'auth_failed_premature_token'
      errorMessage = 'Token not yet valid'
    }

    console.error('Auth error:', err.message)
    await logSecurityEvent(errorType, null, {
      ip,
      userAgent,
      fingerprint,
      error: err.message,
      tokenPrefix: (req.headers.authorization || '').substring(0, 20) + '...'
    })

    return res.status(401).json({ error: errorMessage })
  }
}

// Token blacklisting function (using Redis)
const blacklistToken = async (token, userId, reason = 'logout') => {
  try {
    // Blacklist token with automatic expiration
    const success = await tokenBlacklist.blacklistToken(token, userId, reason)

    if (success) {
      // Log the blacklisting
      await logSecurityEvent('token_blacklisted', userId, {
        reason,
        tokenPrefix: token.substring(0, 20) + '...',
        timestamp: new Date().toISOString(),
        storage: 'redis'
      })
    }

    return success
  } catch (error) {
    console.error('Failed to blacklist token:', error)
    return false
  }
}

// Session invalidation function
const invalidateSession = (userId, fingerprint) => {
  const sessionKey = `${userId}-${fingerprint}`
  return activeSessions.delete(sessionKey)
}

// Get active sessions for a user
const getActiveSessions = (userId) => {
  const userSessions = []
  for (const [key, session] of activeSessions.entries()) {
    if (session.userId === userId) {
      userSessions.push({
        fingerprint: session.fingerprint,
        lastActivity: session.lastActivity,
        ip: session.ip,
        userAgent: session.userAgent
      })
    }
  }
  return userSessions
}

// Clean up expired sessions
const cleanupExpiredSessions = () => {
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 30 * 24 * 60 * 60 // 30 days

  for (const [key, session] of activeSessions.entries()) {
    if (now - session.lastActivity > maxAge) {
      activeSessions.delete(key)
    }
  }
}

// Run session cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000)

// Enhanced logout function
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token
    const userId = req.userId
    const fingerprint = req.deviceFingerprint

    if (token) {
      await blacklistToken(token, userId, 'manual_logout')
    }

    if (userId && fingerprint) {
      invalidateSession(userId, fingerprint)
    }

    // Clear cookies if they exist
    res.clearCookie('token')
    res.clearCookie('refreshToken')

    await logSecurityEvent('user_logout', userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      fingerprint
    })

    res.json({
      success: true,
      message: 'Successfully logged out'
    })

  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
}

// Logout from all devices
const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.userId

    // Get all active sessions for the user
    const userSessions = getActiveSessions(userId)

    // Invalidate all sessions
    for (const session of userSessions) {
      invalidateSession(userId, session.fingerprint)
    }

    // Note: In a production system with refresh tokens stored in DB,
    // you would invalidate all refresh tokens here as well

    await logSecurityEvent('logout_all_devices', userId, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionsInvalidated: userSessions.length
    })

    res.json({
      success: true,
      message: `Logged out from ${userSessions.length} devices`,
      devicesLoggedOut: userSessions.length
    })

  } catch (error) {
    console.error('Logout all devices error:', error)
    res.status(500).json({ error: 'Failed to logout from all devices' })
  }
}

// Get current user's active sessions
const getMyActiveSessions = async (req, res) => {
  try {
    const userId = req.userId
    const currentFingerprint = req.deviceFingerprint

    const sessions = getActiveSessions(userId).map(session => ({
      ...session,
      isCurrent: session.fingerprint === currentFingerprint,
      lastActivityFormatted: new Date(session.lastActivity * 1000).toISOString()
    }))

    res.json({
      success: true,
      sessions,
      totalSessions: sessions.length
    })

  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Failed to retrieve sessions' })
  }
}

module.exports = {
  authenticateToken,
  blacklistToken,
  invalidateSession,
  getActiveSessions,
  logout,
  logoutAllDevices,
  getMyActiveSessions,
  cleanupExpiredSessions
}
