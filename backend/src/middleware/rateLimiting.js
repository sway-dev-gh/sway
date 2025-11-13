/**
 * Advanced Rate Limiting Middleware
 * Integrates with RateLimitingService for comprehensive request throttling
 */

const rateLimitingService = require('../services/rateLimiting')
const pool = require('../db/pool')

/**
 * Create rate limiting middleware
 */
const createRateLimiter = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Skip rate limiting for whitelisted IPs or specific conditions
      if (await shouldSkipRateLimit(req, options)) {
        return next()
      }

      // Check rate limit
      const result = await rateLimitingService.checkRateLimit(req, options.config)

      // Add rate limit headers
      addRateLimitHeaders(res, result)

      if (result.allowed) {
        // Request allowed - continue
        return next()
      } else {
        // Request blocked - return rate limit error
        return handleRateLimitExceeded(req, res, result, options)
      }

    } catch (error) {
      console.error('Rate limiting middleware error:', error)

      // Fail open - allow request if rate limiting fails
      if (options.failClosed) {
        return res.status(500).json({
          error: 'Rate limiting service unavailable',
          code: 'RATE_LIMIT_ERROR'
        })
      }

      return next()
    }
  }
}

/**
 * Determine if rate limiting should be skipped
 */
async function shouldSkipRateLimit(req, options) {
  try {
    const ip = rateLimitingService.getClientIP(req)

    // Check if IP is whitelisted
    const ipCheck = await pool.query(
      'SELECT is_whitelisted FROM ip_reputation WHERE ip_address = $1 AND is_whitelisted = true',
      [ip]
    )

    if (ipCheck.rows.length > 0) {
      return true
    }

    // Skip for admin with valid admin key (for emergency access)
    if (req.isAdmin && options.skipForAdmin) {
      return true
    }

    // Skip for certain user agents (internal monitoring tools)
    const userAgent = req.get('User-Agent') || ''
    const skipUserAgents = [
      'HealthCheck',
      'Pingdom',
      'UptimeRobot'
    ]

    if (skipUserAgents.some(agent => userAgent.includes(agent))) {
      return true
    }

    return false
  } catch (error) {
    console.error('Error checking rate limit skip conditions:', error)
    return false
  }
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(res, result) {
  // Standard rate limit headers
  res.set({
    'X-RateLimit-Limit': result.limit || 'unknown',
    'X-RateLimit-Remaining': Math.max(0, (result.limit || 0) - (result.current || 0)),
    'X-RateLimit-Reset': result.resetTime ? Math.ceil(result.resetTime / 1000) : 'unknown'
  })

  // Additional SwayFiles-specific headers
  if (result.retryAfter) {
    res.set('Retry-After', result.retryAfter)
  }

  if (result.fallback) {
    res.set('X-RateLimit-Source', 'fallback')
  }

  if (result.error) {
    res.set('X-RateLimit-Error', 'true')
  }
}

/**
 * Handle rate limit exceeded responses
 */
async function handleRateLimitExceeded(req, res, result, options) {
  const ip = rateLimitingService.getClientIP(req)
  const endpoint = rateLimitingService.getEndpointType(req.path)

  // Log security event for repeated violations
  if (result.current > result.limit * 2) {
    await logSecurityThreat('aggressive_rate_limit_violation', {
      ip,
      endpoint,
      requests: result.current,
      limit: result.limit,
      userAgent: req.get('User-Agent'),
      path: req.path
    })
  }

  // Determine response based on endpoint type and violation severity
  const responseData = {
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    limit: result.limit,
    current: result.current,
    retryAfter: result.retryAfter,
    resetTime: result.resetTime
  }

  // Add helpful messages for different scenarios
  if (endpoint === 'auth') {
    responseData.message = 'Too many authentication attempts. Please wait before trying again.'
    responseData.security = 'This protection prevents brute force attacks.'
  } else if (endpoint === 'upload') {
    responseData.message = 'Upload rate limit exceeded. Please wait before uploading more files.'
  } else if (endpoint === 'api') {
    responseData.message = 'API rate limit exceeded. Consider optimizing your request patterns.'
  } else {
    responseData.message = 'Rate limit exceeded. Please slow down your requests.'
  }

  // Return 429 Too Many Requests
  return res.status(429).json(responseData)
}

/**
 * Log security threats
 */
async function logSecurityThreat(threatType, details) {
  try {
    await pool.query(`
      INSERT INTO security_audit_log (event_type, ip_address, resource_type, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      threatType,
      details.ip,
      'rate_limit',
      JSON.stringify(details),
      'high'
    ])
  } catch (error) {
    console.error('Failed to log security threat:', error)
  }
}

/**
 * Predefined rate limiters for common use cases
 */
const rateLimiters = {
  // Authentication endpoints - very strict
  auth: createRateLimiter({
    name: 'auth',
    config: {
      algorithm: 'sliding_window',
      requests: 5,
      windowMs: 5 * 60 * 1000, // 5 minutes
      skipIfAuthenticated: false,
      escalation: true
    },
    failClosed: true
  }),

  // Admin endpoints - strict with admin bypass
  admin: createRateLimiter({
    name: 'admin',
    config: {
      algorithm: 'sliding_window',
      requests: 20,
      windowMs: 60 * 1000, // 1 minute
      skipIfAuthenticated: false
    },
    skipForAdmin: true,
    failClosed: true
  }),

  // API endpoints - moderate
  api: createRateLimiter({
    name: 'api',
    config: {
      algorithm: 'token_bucket',
      requests: 100,
      windowMs: 60 * 1000, // 1 minute
      skipIfAuthenticated: true,
      bucketSize: 150,
      refillRate: 2
    }
  }),

  // Upload endpoints - burst limiting
  upload: createRateLimiter({
    name: 'upload',
    config: {
      algorithm: 'fixed_window',
      requests: 10,
      windowMs: 60 * 1000, // 1 minute
      skipIfAuthenticated: true,
      sizeBasedLimiting: true,
      maxSizePerWindow: 100 * 1024 * 1024 // 100MB
    }
  }),

  // Guest endpoints - adaptive
  guest: createRateLimiter({
    name: 'guest',
    config: {
      algorithm: 'adaptive',
      requests: 30,
      windowMs: 60 * 1000, // 1 minute
      adaptiveMultiplier: 0.8,
      trustScore: true
    }
  }),

  // Global catch-all
  global: createRateLimiter({
    name: 'global',
    config: {
      algorithm: 'sliding_window',
      requests: 1000,
      windowMs: 60 * 1000, // 1 minute
      skipIfAuthenticated: false
    }
  }),

  // Strict limiter for suspicious behavior
  strict: createRateLimiter({
    name: 'strict',
    config: {
      algorithm: 'sliding_window',
      requests: 10,
      windowMs: 5 * 60 * 1000, // 5 minutes
      skipIfAuthenticated: false,
      blockDuration: 30 * 60 * 1000 // 30 minutes
    },
    failClosed: true
  })
}

/**
 * Dynamic rate limiter that adjusts based on endpoint
 */
const dynamicRateLimiter = async (req, res, next) => {
  const endpoint = rateLimitingService.getEndpointType(req.path)
  const rateLimiter = rateLimiters[endpoint] || rateLimiters.global

  return rateLimiter(req, res, next)
}

/**
 * Intelligent rate limiter with threat detection
 */
const intelligentRateLimiter = async (req, res, next) => {
  try {
    const ip = rateLimitingService.getClientIP(req)

    // Check for suspicious patterns
    const suspiciousActivity = await detectSuspiciousActivity(req, ip)

    if (suspiciousActivity.level === 'high') {
      // Apply strict rate limiting
      return rateLimiters.strict(req, res, next)
    } else if (suspiciousActivity.level === 'medium') {
      // Apply normal rate limiting with reduced limits
      const endpoint = rateLimitingService.getEndpointType(req.path)
      const baseLimiter = rateLimiters[endpoint] || rateLimiters.global

      // Reduce limits by 50%
      const strictConfig = {
        ...baseLimiter.config,
        requests: Math.floor((baseLimiter.config?.requests || 100) * 0.5)
      }

      return createRateLimiter({ config: strictConfig })(req, res, next)
    } else {
      // Normal rate limiting
      return dynamicRateLimiter(req, res, next)
    }
  } catch (error) {
    console.error('Intelligent rate limiter error:', error)
    return dynamicRateLimiter(req, res, next)
  }
}

/**
 * Detect suspicious activity patterns
 */
async function detectSuspiciousActivity(req, ip) {
  try {
    const now = Date.now()
    const lookbackTime = 10 * 60 * 1000 // 10 minutes

    // Check recent violations
    const violations = await pool.query(`
      SELECT COUNT(*) as violation_count, MAX(created_at) as last_violation
      FROM rate_limit_violations
      WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '10 minutes'
    `, [ip])

    const violationData = violations.rows[0]
    const violationCount = parseInt(violationData.violation_count)

    // Check IP reputation
    const reputation = await pool.query(`
      SELECT trust_score, violation_count as total_violations
      FROM ip_reputation
      WHERE ip_address = $1
    `, [ip])

    const reputationData = reputation.rows[0] || { trust_score: 1.0, total_violations: 0 }

    // Determine threat level
    let threatLevel = 'low'

    if (violationCount >= 5 || reputationData.trust_score < 0.3) {
      threatLevel = 'high'
    } else if (violationCount >= 2 || reputationData.trust_score < 0.6) {
      threatLevel = 'medium'
    }

    return {
      level: threatLevel,
      recentViolations: violationCount,
      trustScore: reputationData.trust_score,
      totalViolations: reputationData.total_violations
    }
  } catch (error) {
    console.error('Error detecting suspicious activity:', error)
    return { level: 'low' }
  }
}

/**
 * Middleware to initialize rate limiting service
 */
const initializeRateLimiting = async (req, res, next) => {
  if (!rateLimitingService.initialized) {
    await rateLimitingService.initialize()
  }
  next()
}

module.exports = {
  createRateLimiter,
  rateLimiters,
  dynamicRateLimiter,
  intelligentRateLimiter,
  initializeRateLimiting,

  // Export individual limiters for specific use
  authRateLimit: rateLimiters.auth,
  adminRateLimit: rateLimiters.admin,
  apiRateLimit: rateLimiters.api,
  uploadRateLimit: rateLimiters.upload,
  guestRateLimit: rateLimiters.guest,
  globalRateLimit: rateLimiters.global,
  strictRateLimit: rateLimiters.strict
}