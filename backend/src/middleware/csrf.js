/**
 * Enterprise CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const csrf = require('csrf')
const crypto = require('crypto')

// Create CSRF instance with secure configuration
const csrfProtection = new csrf({
  saltLength: 16,  // 16 bytes = 128 bits of entropy
  secretLength: 32 // 32 bytes = 256 bits of entropy
})

// In-memory token store (use Redis in production for scalability)
const tokenStore = new Map()

// Generate cryptographically secure secret
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex')
}

// Get or create secret for session
const getSessionSecret = (sessionId) => {
  if (!sessionId) {
    // Generate temporary session ID for stateless tokens
    sessionId = crypto.randomBytes(16).toString('hex')
  }

  if (!tokenStore.has(sessionId)) {
    tokenStore.set(sessionId, {
      secret: generateSecret(),
      createdAt: Date.now(),
      usedTokens: new Set() // Prevent token reuse
    })
  }

  return tokenStore.get(sessionId)
}

// Clean up expired tokens (run periodically)
const cleanupExpiredTokens = () => {
  const now = Date.now()
  const maxAge = 4 * 60 * 60 * 1000 // 4 hours

  for (const [sessionId, sessionData] of tokenStore.entries()) {
    if (now - sessionData.createdAt > maxAge) {
      tokenStore.delete(sessionId)
    }
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000)

// Endpoints that should be excluded from CSRF protection
const CSRF_EXEMPT_PATHS = [
  '/health',
  '/api/stripe/webhook',  // Stripe webhook needs raw body
  '/api/auth/login',      // Auth endpoints need to work without session
  '/api/auth/signup',     // Auth endpoints need to work without session
  '/api/auth/register',   // Auth endpoints need to work without session
  '/api/projects',        // Temporarily exempt projects for serverless compatibility
  // Add other webhook endpoints here
]

// Check if path should be exempt from CSRF protection
const isExemptPath = (path) => {
  return CSRF_EXEMPT_PATHS.some(exemptPath =>
    path.startsWith(exemptPath)
  )
}

// Generate CSRF token for a session
const generateCSRFToken = (sessionId, userId) => {
  try {
    const sessionData = getSessionSecret(sessionId || userId)
    const token = csrfProtection.create(sessionData.secret)

    // Log token generation for security monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ CSRF token generated for session: ${sessionId || userId || 'anonymous'}`)
    }

    return {
      token,
      sessionId: sessionId || userId
    }
  } catch (error) {
    console.error('CSRF token generation failed:', error)
    throw new Error('Failed to generate CSRF token')
  }
}

// Verify CSRF token
const verifyCSRFToken = (token, sessionId, userId) => {
  try {
    if (!token) {
      throw new Error('CSRF token is required')
    }

    if (!sessionId && !userId) {
      throw new Error('Session ID or User ID is required')
    }

    const sessionData = getSessionSecret(sessionId || userId)

    if (!sessionData) {
      throw new Error('Invalid session for CSRF verification')
    }

    // Check if token was already used (prevent replay attacks)
    if (sessionData.usedTokens.has(token)) {
      throw new Error('CSRF token has already been used')
    }

    // Verify token
    const isValid = csrfProtection.verify(sessionData.secret, token)

    if (!isValid) {
      throw new Error('Invalid CSRF token')
    }

    // Mark token as used
    sessionData.usedTokens.add(token)

    // Clean up old used tokens (keep last 100)
    if (sessionData.usedTokens.size > 100) {
      const tokensArray = Array.from(sessionData.usedTokens)
      sessionData.usedTokens = new Set(tokensArray.slice(-50))
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ CSRF token verified for session: ${sessionId || userId || 'anonymous'}`)
    }
    return true

  } catch (error) {
    console.log(`✗ CSRF token verification failed: ${error.message}`)
    return false
  }
}

// Main CSRF middleware
const csrfMiddleware = (req, res, next) => {
  // Skip CSRF protection for exempt paths
  if (isExemptPath(req.path)) {
    return next()
  }

  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  try {
    // Extract CSRF token from multiple possible locations
    const token = req.headers['x-csrf-token'] ||
                  req.headers['x-xsrf-token'] ||
                  req.body?.csrfToken ||
                  req.query.csrfToken

    // Get session identifier (user ID or session ID)
    const sessionId = req.sessionID || req.session?.id
    const userId = req.userId || req.user?.id

    // Verify CSRF token
    const isValid = verifyCSRFToken(token, sessionId, userId)

    if (!isValid) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token validation failed',
        errorId: crypto.randomBytes(8).toString('hex'),
        timestamp: new Date().toISOString(),
        message: 'Invalid or missing CSRF token. Please refresh and try again.'
      })
    }

    next()

  } catch (error) {
    console.error('CSRF middleware error:', error)

    res.status(403).json({
      success: false,
      error: 'CSRF protection error',
      errorId: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      message: 'Request blocked by CSRF protection'
    })
  }
}

// Route to get CSRF token
const getCSRFTokenRoute = (req, res) => {
  try {
    const sessionId = req.sessionID || req.session?.id
    const userId = req.userId || req.user?.id

    const { token, sessionId: generatedSessionId } = generateCSRFToken(sessionId, userId)

    res.json({
      success: true,
      csrfToken: token,
      sessionId: generatedSessionId,
      expires: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
    })

  } catch (error) {
    console.error('CSRF token route error:', error)

    res.status(500).json({
      success: false,
      error: 'Failed to generate CSRF token',
      errorId: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString()
    })
  }
}

// Enhanced middleware that also sets CSRF token in response headers
const csrfWithTokenResponse = (req, res, next) => {
  // Add CSRF token to response for GET requests
  if (req.method === 'GET' && !isExemptPath(req.path)) {
    try {
      const sessionId = req.sessionID || req.session?.id
      const userId = req.userId || req.user?.id

      if (sessionId || userId) {
        const { token } = generateCSRFToken(sessionId, userId)
        res.setHeader('X-CSRF-Token', token)
      }
    } catch (error) {
      console.error('Failed to set CSRF token in response:', error)
    }
  }

  next()
}

// Middleware to inject CSRF protection into security middleware
const applyCSRFProtection = (app) => {
  // Add cookie parser for session management
  const cookieParser = require('cookie-parser')
  app.use(cookieParser())

  // Add CSRF token route
  app.get('/api/csrf-token', getCSRFTokenRoute)

  // Apply CSRF protection middleware
  app.use(csrfMiddleware)

  // Add token to responses
  app.use(csrfWithTokenResponse)

  console.log('✓ CSRF protection enabled')
}

// Get statistics for monitoring
const getCSRFStats = () => {
  return {
    activeSessions: tokenStore.size,
    totalTokensGenerated: Array.from(tokenStore.values())
      .reduce((total, session) => total + session.usedTokens.size, 0),
    oldestSession: tokenStore.size > 0 ?
      Math.min(...Array.from(tokenStore.values()).map(s => s.createdAt)) : null
  }
}

module.exports = {
  csrfMiddleware,
  getCSRFTokenRoute,
  csrfWithTokenResponse,
  applyCSRFProtection,
  generateCSRFToken,
  verifyCSRFToken,
  getCSRFStats,
  cleanupExpiredTokens
}