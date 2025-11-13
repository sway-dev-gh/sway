/**
 * Enhanced Authentication Service
 * Integrates with Key Rotation Service for enterprise-grade security
 * Provides secure JWT generation, verification, and session management
 */

const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const pool = require('../db/pool')
const keyRotationService = require('./keyRotation')

class EnhancedAuthService {
  constructor() {
    this.initialized = false
    this.sessionStore = new Map()
  }

  /**
   * Initialize the enhanced auth service
   */
  async initialize() {
    try {
      console.log('Initializing Enhanced Authentication Service...')

      // Initialize key rotation service
      if (!keyRotationService.initialized) {
        await keyRotationService.initialize()
      }

      // Set up session cleanup
      this.setupSessionCleanup()

      this.initialized = true
      console.log('✓ Enhanced Authentication Service initialized')

      return true
    } catch (error) {
      console.error('Failed to initialize Enhanced Auth Service:', error)
      throw error
    }
  }

  /**
   * Generate JWT token with rotating keys
   */
  async generateToken(payload, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Get active JWT signing key
      const signingKey = keyRotationService.getActiveKey(keyRotationService.keyTypes.JWT_PRIMARY)

      // Add security metadata
      const enhancedPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID(), // JWT ID for blacklisting
        keyVersion: keyRotationService.activeKeys.get(keyRotationService.keyTypes.JWT_PRIMARY).keyId
      }

      const tokenOptions = {
        expiresIn: options.expiresIn || '24h',
        issuer: 'SwayFiles',
        audience: 'SwayFiles-Users',
        algorithm: 'HS512',
        ...options
      }

      const token = jwt.sign(enhancedPayload, signingKey, tokenOptions)

      // Store token metadata for tracking
      await this.storeTokenMetadata(enhancedPayload.jti, {
        userId: payload.userId || payload.guestId,
        keyVersion: enhancedPayload.keyVersion,
        issuedAt: enhancedPayload.iat,
        expiresAt: enhancedPayload.iat + this.parseExpiry(tokenOptions.expiresIn),
        isGuest: payload.isGuest || false
      })

      return token
    } catch (error) {
      console.error('Token generation failed:', error)
      throw new Error('Failed to generate authentication token')
    }
  }

  /**
   * Verify JWT token with key rotation support
   */
  async verifyToken(token) {
    try {
      if (!this.initialized) {
        await this.initialize()
      }

      // Try verification with rotating keys
      const decoded = await keyRotationService.verifyJWT(token)

      // Validate token metadata
      await this.validateTokenMetadata(decoded.jti, decoded)

      return decoded
    } catch (error) {
      console.error('Token verification failed:', error)
      throw error
    }
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(userId, deviceFingerprint) {
    try {
      const refreshTokenId = crypto.randomUUID()
      const refreshKey = keyRotationService.getActiveKey(keyRotationService.keyTypes.SESSION_SECRET)

      const payload = {
        userId,
        deviceFingerprint,
        type: 'refresh',
        tokenId: refreshTokenId
      }

      const refreshToken = jwt.sign(payload, refreshKey, {
        expiresIn: '30d',
        issuer: 'SwayFiles',
        audience: 'SwayFiles-Refresh'
      })

      // Store refresh token in database
      await pool.query(`
        INSERT INTO refresh_tokens (token_id, user_id, device_fingerprint, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        refreshTokenId,
        userId,
        deviceFingerprint,
        crypto.createHash('sha256').update(refreshToken).digest('hex'),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        new Date()
      ])

      return refreshToken
    } catch (error) {
      console.error('Refresh token generation failed:', error)
      throw error
    }
  }

  /**
   * Verify and rotate access token using refresh token
   */
  async refreshAccessToken(refreshToken, deviceFingerprint) {
    try {
      const refreshKey = keyRotationService.getActiveKey(keyRotationService.keyTypes.SESSION_SECRET)
      const decoded = jwt.verify(refreshToken, refreshKey)

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      // Verify refresh token exists and is valid
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
      const tokenResult = await pool.query(`
        SELECT user_id, device_fingerprint FROM refresh_tokens
        WHERE token_id = $1 AND token_hash = $2 AND expires_at > NOW() AND is_revoked = false
      `, [decoded.tokenId, tokenHash])

      if (tokenResult.rows.length === 0) {
        throw new Error('Refresh token not found or expired')
      }

      const tokenData = tokenResult.rows[0]

      // Verify device fingerprint matches
      if (tokenData.device_fingerprint !== deviceFingerprint) {
        throw new Error('Device fingerprint mismatch')
      }

      // Get user data
      const userResult = await pool.query('SELECT id, email, plan FROM users WHERE id = $1', [tokenData.user_id])
      if (userResult.rows.length === 0) {
        throw new Error('User not found')
      }

      const user = userResult.rows[0]

      // Generate new access token
      const newAccessToken = await this.generateToken({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        deviceFingerprint
      })

      // Update refresh token last used
      await pool.query(`
        UPDATE refresh_tokens SET last_used_at = NOW() WHERE token_id = $1
      `, [decoded.tokenId])

      return {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Store token metadata for validation
   */
  async storeTokenMetadata(jti, metadata) {
    try {
      await pool.query(`
        INSERT INTO token_metadata (jti, user_id, key_version, issued_at, expires_at, is_guest, created_at)
        VALUES ($1, $2, $3, to_timestamp($4), to_timestamp($5), $6, NOW())
        ON CONFLICT (jti) DO NOTHING
      `, [
        jti,
        metadata.userId,
        metadata.keyVersion,
        metadata.issuedAt,
        metadata.expiresAt,
        metadata.isGuest
      ])
    } catch (error) {
      console.error('Failed to store token metadata:', error)
      // Non-critical error, don't throw
    }
  }

  /**
   * Validate token metadata
   */
  async validateTokenMetadata(jti, decoded) {
    try {
      const result = await pool.query(`
        SELECT key_version, is_revoked FROM token_metadata
        WHERE jti = $1 AND expires_at > NOW()
      `, [jti])

      if (result.rows.length === 0) {
        throw new Error('Token metadata not found or expired')
      }

      const metadata = result.rows[0]

      if (metadata.is_revoked) {
        throw new Error('Token has been revoked')
      }

      // Check if key version is still valid (not too old)
      const keyAge = await this.getKeyAge(metadata.key_version)
      if (keyAge > 90) { // Keys older than 90 days are rejected
        throw new Error('Token signed with deprecated key')
      }
    } catch (error) {
      console.error('Token metadata validation failed:', error)
      throw error
    }
  }

  /**
   * Get age of signing key
   */
  async getKeyAge(keyVersion) {
    try {
      const result = await pool.query(`
        SELECT created_at FROM encryption_keys WHERE key_id = $1
      `, [keyVersion])

      if (result.rows.length === 0) {
        return 999 // Unknown key age, consider very old
      }

      const createdAt = new Date(result.rows[0].created_at)
      const ageInDays = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
      return ageInDays
    } catch (error) {
      console.error('Failed to get key age:', error)
      return 999
    }
  }

  /**
   * Revoke specific token
   */
  async revokeToken(jti, reason = 'manual_revocation') {
    try {
      await pool.query(`
        UPDATE token_metadata SET is_revoked = true, revoked_at = NOW(), revocation_reason = $2
        WHERE jti = $1
      `, [jti, reason])

      console.log(`✓ Token revoked: ${jti} (${reason})`)
      return true
    } catch (error) {
      console.error('Failed to revoke token:', error)
      return false
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId, reason = 'security_action') {
    try {
      const result = await pool.query(`
        UPDATE token_metadata
        SET is_revoked = true, revoked_at = NOW(), revocation_reason = $2
        WHERE user_id = $1 AND is_revoked = false
        RETURNING jti
      `, [userId, reason])

      // Also revoke refresh tokens
      await pool.query(`
        UPDATE refresh_tokens
        SET is_revoked = true, revoked_at = NOW()
        WHERE user_id = $1 AND is_revoked = false
      `, [userId])

      console.log(`✓ Revoked ${result.rows.length} tokens for user ${userId}`)
      return result.rows.length
    } catch (error) {
      console.error('Failed to revoke user tokens:', error)
      return 0
    }
  }

  /**
   * Create secure session
   */
  async createSession(userId, deviceFingerprint, metadata = {}) {
    try {
      const sessionId = crypto.randomUUID()
      const sessionKey = keyRotationService.getActiveKey(keyRotationService.keyTypes.SESSION_SECRET)

      const sessionData = {
        userId,
        deviceFingerprint,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        metadata
      }

      // Encrypt session data
      const encryptedSession = this.encryptSessionData(sessionData, sessionKey)

      // Store in memory for fast access
      this.sessionStore.set(sessionId, {
        ...sessionData,
        encrypted: encryptedSession
      })

      // Store in database for persistence
      await pool.query(`
        INSERT INTO user_sessions (session_id, user_id, device_fingerprint, session_data, expires_at, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        sessionId,
        userId,
        deviceFingerprint,
        JSON.stringify(encryptedSession),
        new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        new Date()
      ])

      return sessionId
    } catch (error) {
      console.error('Session creation failed:', error)
      throw error
    }
  }

  /**
   * Encrypt session data
   */
  encryptSessionData(data, key) {
    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipher(algorithm, key)

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm
    }
  }

  /**
   * Parse expiry string to seconds
   */
  parseExpiry(expiresIn) {
    if (typeof expiresIn === 'number') return expiresIn

    const units = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) return 3600 // Default 1 hour

    return parseInt(match[1]) * units[match[2]]
  }

  /**
   * Setup automatic session cleanup
   */
  setupSessionCleanup() {
    // Clean up expired sessions every hour
    setInterval(async () => {
      try {
        // Clean memory store
        const now = Date.now()
        for (const [sessionId, sessionData] of this.sessionStore.entries()) {
          if (now - sessionData.lastActivity > 24 * 60 * 60 * 1000) { // 24 hours
            this.sessionStore.delete(sessionId)
          }
        }

        // Clean database
        await pool.query(`
          DELETE FROM user_sessions WHERE expires_at < NOW()
        `)

        await pool.query(`
          DELETE FROM token_metadata WHERE expires_at < NOW()
        `)

        await pool.query(`
          UPDATE refresh_tokens SET is_revoked = true
          WHERE expires_at < NOW() AND is_revoked = false
        `)
      } catch (error) {
        console.error('Session cleanup failed:', error)
      }
    }, 60 * 60 * 1000) // Every hour
  }

  /**
   * Get authentication statistics
   */
  async getAuthStats() {
    try {
      const stats = await pool.query(`
        SELECT
          COUNT(*) as total_tokens,
          COUNT(*) FILTER (WHERE is_revoked = false) as active_tokens,
          COUNT(*) FILTER (WHERE is_guest = true) as guest_tokens,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as tokens_24h
        FROM token_metadata
        WHERE expires_at > NOW()
      `)

      const refreshStats = await pool.query(`
        SELECT
          COUNT(*) as total_refresh_tokens,
          COUNT(*) FILTER (WHERE is_revoked = false) as active_refresh_tokens,
          COUNT(*) FILTER (WHERE last_used_at > NOW() - INTERVAL '24 hours') as used_24h
        FROM refresh_tokens
        WHERE expires_at > NOW()
      `)

      return {
        tokens: stats.rows[0],
        refreshTokens: refreshStats.rows[0],
        keyRotationStatus: await keyRotationService.getRotationStatus(),
        sessionsInMemory: this.sessionStore.size
      }
    } catch (error) {
      console.error('Failed to get auth stats:', error)
      return null
    }
  }
}

// Create singleton instance
const enhancedAuthService = new EnhancedAuthService()

module.exports = enhancedAuthService