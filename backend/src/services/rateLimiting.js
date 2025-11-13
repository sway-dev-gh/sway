/**
 * Enterprise Rate Limiting Service
 * Comprehensive protection against abuse, DoS attacks, and automated threats
 * Implements multiple algorithms: sliding window, token bucket, adaptive limiting
 */

const Redis = require('redis')
const crypto = require('crypto')
const pool = require('../db/pool')

class RateLimitingService {
  constructor() {
    this.redisClient = null
    this.fallbackStore = new Map() // In-memory fallback
    this.initialized = false
    this.algorithms = {
      SLIDING_WINDOW: 'sliding_window',
      TOKEN_BUCKET: 'token_bucket',
      FIXED_WINDOW: 'fixed_window',
      ADAPTIVE: 'adaptive'
    }

    // Rate limit configurations by endpoint type
    this.rateLimitConfigs = {
      // Authentication endpoints - strict limits
      auth: {
        algorithm: this.algorithms.SLIDING_WINDOW,
        requests: 5,
        windowMs: 5 * 60 * 1000, // 5 minutes
        skipIfAuthenticated: false,
        blockDuration: 15 * 60 * 1000, // 15 minutes block
        escalation: true
      },

      // API endpoints - moderate limits
      api: {
        algorithm: this.algorithms.TOKEN_BUCKET,
        requests: 100,
        windowMs: 60 * 1000, // 1 minute
        skipIfAuthenticated: true,
        bucketSize: 150,
        refillRate: 2 // tokens per second
      },

      // File upload endpoints - burst limits
      upload: {
        algorithm: this.algorithms.FIXED_WINDOW,
        requests: 10,
        windowMs: 60 * 1000, // 1 minute
        skipIfAuthenticated: true,
        sizeBasedLimiting: true,
        maxSizePerWindow: 100 * 1024 * 1024 // 100MB per window
      },

      // Admin endpoints - very strict
      admin: {
        algorithm: this.algorithms.SLIDING_WINDOW,
        requests: 20,
        windowMs: 60 * 1000, // 1 minute
        skipIfAuthenticated: false,
        requiresVerification: true
      },

      // Guest endpoints - balanced limits
      guest: {
        algorithm: this.algorithms.ADAPTIVE,
        requests: 30,
        windowMs: 60 * 1000, // 1 minute
        adaptiveMultiplier: 0.8,
        trustScore: true
      },

      // Global fallback
      global: {
        algorithm: this.algorithms.SLIDING_WINDOW,
        requests: 1000,
        windowMs: 60 * 1000, // 1 minute
        skipIfAuthenticated: false
      }
    }

    // Suspicious behavior detection patterns
    this.threatPatterns = {
      rapidRequests: { threshold: 50, timeWindow: 10000 }, // 50 req/10s
      distributedAttack: { threshold: 100, uniqueIPs: 10 }, // 100 req from 10+ IPs
      patternMatching: { threshold: 0.8 }, // 80% similar requests
      resourceExhaustion: { threshold: 1024 * 1024 * 100 } // 100MB uploads
    }
  }

  /**
   * Initialize the rate limiting service
   */
  async initialize() {
    try {
      console.log('Initializing Rate Limiting Service...')

      // Initialize Redis connection
      await this.initializeRedis()

      // Create database tables for rate limit tracking
      await this.createRateLimitTables()

      // Start cleanup and monitoring tasks
      this.startBackgroundTasks()

      this.initialized = true
      console.log('✓ Rate Limiting Service initialized successfully')

      return true
    } catch (error) {
      console.error('Failed to initialize Rate Limiting Service:', error)
      console.log('⚠️ Falling back to in-memory rate limiting')
      this.initialized = true // Still usable with fallback
      return false
    }
  }

  /**
   * Initialize Redis connection for persistent rate limiting
   */
  async initializeRedis() {
    try {
      this.redisClient = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis connection refused, using fallback store')
            return undefined
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return undefined
          }
          return Math.min(options.attempt * 100, 3000)
        }
      })

      await this.redisClient.connect()
      console.log('✓ Redis connected for rate limiting')

    } catch (error) {
      console.log('⚠️ Redis unavailable, using in-memory fallback:', error.message)
      this.redisClient = null
    }
  }

  /**
   * Create database tables for rate limiting analytics
   */
  async createRateLimitTables() {
    const createTablesSQL = `
      -- Rate limit violations log
      CREATE TABLE IF NOT EXISTS rate_limit_violations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_address INET NOT NULL,
        user_id UUID,
        endpoint VARCHAR(255) NOT NULL,
        violation_type VARCHAR(50) NOT NULL,
        requests_count INTEGER NOT NULL,
        time_window INTEGER NOT NULL,
        blocked_until TIMESTAMP WITH TIME ZONE,
        threat_score INTEGER DEFAULT 0,
        user_agent TEXT,
        request_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Rate limit statistics
      CREATE TABLE IF NOT EXISTS rate_limit_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        endpoint_type VARCHAR(50) NOT NULL,
        total_requests BIGINT DEFAULT 0,
        blocked_requests BIGINT DEFAULT 0,
        unique_ips INTEGER DEFAULT 0,
        avg_response_time DECIMAL(10,3) DEFAULT 0,
        peak_requests_per_minute INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, endpoint_type)
      );

      -- IP reputation tracking
      CREATE TABLE IF NOT EXISTS ip_reputation (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ip_address INET NOT NULL UNIQUE,
        trust_score DECIMAL(3,2) DEFAULT 1.00 CHECK (trust_score BETWEEN 0.00 AND 1.00),
        violation_count INTEGER DEFAULT 0,
        last_violation TIMESTAMP WITH TIME ZONE,
        is_whitelisted BOOLEAN DEFAULT false,
        is_blacklisted BOOLEAN DEFAULT false,
        country_code CHAR(2),
        asn INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations(ip_address);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_created_at ON rate_limit_violations(created_at);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_endpoint ON rate_limit_violations(endpoint);
      CREATE INDEX IF NOT EXISTS idx_rate_limit_stats_date ON rate_limit_stats(date);
      CREATE INDEX IF NOT EXISTS idx_ip_reputation_ip ON ip_reputation(ip_address);
      CREATE INDEX IF NOT EXISTS idx_ip_reputation_trust_score ON ip_reputation(trust_score);
    `

    await pool.query(createTablesSQL)
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(req, config = null) {
    try {
      const ip = this.getClientIP(req)
      const userId = req.userId || req.guestId || null
      const endpoint = this.getEndpointType(req.path)

      // Get configuration for this endpoint type
      const rateLimitConfig = config || this.getRateLimitConfig(endpoint)

      // Skip if authenticated user and config allows
      if (rateLimitConfig.skipIfAuthenticated && userId && !req.isGuest) {
        return { allowed: true, skipReason: 'authenticated_user' }
      }

      // Check IP reputation
      const ipReputation = await this.getIPReputation(ip)
      if (ipReputation.is_blacklisted) {
        return {
          allowed: false,
          reason: 'ip_blacklisted',
          retryAfter: null,
          permanent: true
        }
      }

      // Apply trust score multiplier
      const adjustedConfig = this.applyTrustScore(rateLimitConfig, ipReputation.trust_score)

      // Apply rate limiting algorithm
      const result = await this.applyRateLimit(ip, userId, endpoint, adjustedConfig)

      // Log violations
      if (!result.allowed) {
        await this.logViolation(ip, userId, endpoint, result, req)
      }

      // Update statistics
      await this.updateStats(endpoint, result.allowed)

      return result
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Fail open - allow request if rate limiting fails
      return { allowed: true, error: true }
    }
  }

  /**
   * Apply specific rate limiting algorithm
   */
  async applyRateLimit(ip, userId, endpoint, config) {
    const identifier = userId || ip
    const key = `rate_limit:${endpoint}:${identifier}`

    switch (config.algorithm) {
      case this.algorithms.SLIDING_WINDOW:
        return await this.slidingWindowLimit(key, config)

      case this.algorithms.TOKEN_BUCKET:
        return await this.tokenBucketLimit(key, config)

      case this.algorithms.FIXED_WINDOW:
        return await this.fixedWindowLimit(key, config)

      case this.algorithms.ADAPTIVE:
        return await this.adaptiveLimit(key, config, ip)

      default:
        return await this.slidingWindowLimit(key, config)
    }
  }

  /**
   * Sliding window rate limiting
   */
  async slidingWindowLimit(key, config) {
    const now = Date.now()
    const windowStart = now - config.windowMs

    try {
      if (this.redisClient) {
        // Redis implementation with sliding window
        const pipe = this.redisClient.multi()

        // Remove old entries
        pipe.zRemRangeByScore(key, 0, windowStart)

        // Count current entries
        pipe.zCard(key)

        // Add current request
        pipe.zAdd(key, { score: now, value: `${now}-${Math.random()}` })

        // Set expiration
        pipe.expire(key, Math.ceil(config.windowMs / 1000))

        const results = await pipe.exec()
        const currentCount = results[1] + 1 // +1 for current request

        const allowed = currentCount <= config.requests
        const retryAfter = allowed ? null : Math.ceil(config.windowMs / 1000)

        return {
          allowed,
          limit: config.requests,
          current: currentCount,
          retryAfter,
          resetTime: now + config.windowMs
        }
      } else {
        // Fallback implementation
        return this.fallbackRateLimit(key, config)
      }
    } catch (error) {
      console.error('Sliding window rate limit error:', error)
      return { allowed: true, error: true }
    }
  }

  /**
   * Token bucket rate limiting
   */
  async tokenBucketLimit(key, config) {
    const now = Date.now()

    try {
      if (this.redisClient) {
        // Get or initialize bucket
        const bucketData = await this.redisClient.get(key)
        let bucket = bucketData ? JSON.parse(bucketData) : {
          tokens: config.bucketSize,
          lastRefill: now
        }

        // Calculate tokens to add based on time elapsed
        const timeDelta = (now - bucket.lastRefill) / 1000
        const tokensToAdd = Math.floor(timeDelta * config.refillRate)

        bucket.tokens = Math.min(config.bucketSize, bucket.tokens + tokensToAdd)
        bucket.lastRefill = now

        // Check if request can be served
        const allowed = bucket.tokens >= 1

        if (allowed) {
          bucket.tokens -= 1
        }

        // Save bucket state
        await this.redisClient.setEx(key, Math.ceil(config.windowMs / 1000), JSON.stringify(bucket))

        const retryAfter = allowed ? null : Math.ceil((1 - bucket.tokens) / config.refillRate)

        return {
          allowed,
          limit: config.bucketSize,
          current: config.bucketSize - bucket.tokens,
          retryAfter,
          resetTime: null
        }
      } else {
        return this.fallbackRateLimit(key, config)
      }
    } catch (error) {
      console.error('Token bucket rate limit error:', error)
      return { allowed: true, error: true }
    }
  }

  /**
   * Fixed window rate limiting
   */
  async fixedWindowLimit(key, config) {
    const now = Date.now()
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs
    const windowKey = `${key}:${windowStart}`

    try {
      if (this.redisClient) {
        const current = await this.redisClient.incr(windowKey)

        if (current === 1) {
          await this.redisClient.expire(windowKey, Math.ceil(config.windowMs / 1000))
        }

        const allowed = current <= config.requests
        const retryAfter = allowed ? null : Math.ceil((windowStart + config.windowMs - now) / 1000)

        return {
          allowed,
          limit: config.requests,
          current,
          retryAfter,
          resetTime: windowStart + config.windowMs
        }
      } else {
        return this.fallbackRateLimit(key, config)
      }
    } catch (error) {
      console.error('Fixed window rate limit error:', error)
      return { allowed: true, error: true }
    }
  }

  /**
   * Adaptive rate limiting based on behavior patterns
   */
  async adaptiveLimit(key, config, ip) {
    // Get base rate limit
    const baseResult = await this.slidingWindowLimit(key, config)

    // Apply adaptive adjustments
    const ipReputation = await this.getIPReputation(ip)
    const adaptiveMultiplier = config.adaptiveMultiplier || 0.8

    // Adjust based on trust score
    const adjustedLimit = Math.floor(config.requests * (ipReputation.trust_score * adaptiveMultiplier + (1 - adaptiveMultiplier)))

    baseResult.limit = adjustedLimit
    baseResult.allowed = baseResult.current <= adjustedLimit

    return baseResult
  }

  /**
   * Fallback rate limiting for when Redis is unavailable
   */
  fallbackRateLimit(key, config) {
    const now = Date.now()

    if (!this.fallbackStore.has(key)) {
      this.fallbackStore.set(key, { count: 0, resetTime: now + config.windowMs })
    }

    const entry = this.fallbackStore.get(key)

    // Reset window if expired
    if (now > entry.resetTime) {
      entry.count = 0
      entry.resetTime = now + config.windowMs
    }

    entry.count++

    const allowed = entry.count <= config.requests
    const retryAfter = allowed ? null : Math.ceil((entry.resetTime - now) / 1000)

    return {
      allowed,
      limit: config.requests,
      current: entry.count,
      retryAfter,
      resetTime: entry.resetTime,
      fallback: true
    }
  }

  /**
   * Get or create IP reputation
   */
  async getIPReputation(ip) {
    try {
      const result = await pool.query(
        'SELECT * FROM ip_reputation WHERE ip_address = $1',
        [ip]
      )

      if (result.rows.length > 0) {
        return result.rows[0]
      }

      // Create new IP reputation entry
      const newReputation = await pool.query(`
        INSERT INTO ip_reputation (ip_address, trust_score)
        VALUES ($1, 1.00)
        RETURNING *
      `, [ip])

      return newReputation.rows[0]
    } catch (error) {
      console.error('Error getting IP reputation:', error)
      return { ip_address: ip, trust_score: 1.0, is_blacklisted: false, is_whitelisted: false }
    }
  }

  /**
   * Apply trust score to rate limit configuration
   */
  applyTrustScore(config, trustScore) {
    const adjustedConfig = { ...config }

    // Lower trust score = stricter limits
    if (trustScore < 0.5) {
      adjustedConfig.requests = Math.floor(config.requests * 0.5)
    } else if (trustScore < 0.8) {
      adjustedConfig.requests = Math.floor(config.requests * 0.7)
    }

    return adjustedConfig
  }

  /**
   * Log rate limit violations
   */
  async logViolation(ip, userId, endpoint, result, req) {
    try {
      await pool.query(`
        INSERT INTO rate_limit_violations
        (ip_address, user_id, endpoint, violation_type, requests_count, time_window, blocked_until, user_agent, request_data)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        ip,
        userId,
        endpoint,
        'rate_limit_exceeded',
        result.current,
        result.resetTime - Date.now(),
        result.retryAfter ? new Date(Date.now() + result.retryAfter * 1000) : null,
        req.get('User-Agent'),
        JSON.stringify({
          method: req.method,
          path: req.path,
          limit: result.limit,
          current: result.current
        })
      ])

      // Update IP reputation
      await this.updateIPReputation(ip, 'violation')
    } catch (error) {
      console.error('Failed to log rate limit violation:', error)
    }
  }

  /**
   * Update IP reputation based on behavior
   */
  async updateIPReputation(ip, action) {
    try {
      if (action === 'violation') {
        await pool.query(`
          UPDATE ip_reputation
          SET
            trust_score = GREATEST(0.1, trust_score - 0.1),
            violation_count = violation_count + 1,
            last_violation = NOW(),
            updated_at = NOW()
          WHERE ip_address = $1
        `, [ip])
      } else if (action === 'good_behavior') {
        await pool.query(`
          UPDATE ip_reputation
          SET
            trust_score = LEAST(1.0, trust_score + 0.05),
            updated_at = NOW()
          WHERE ip_address = $1
        `, [ip])
      }
    } catch (error) {
      console.error('Failed to update IP reputation:', error)
    }
  }

  /**
   * Update rate limiting statistics
   */
  async updateStats(endpoint, allowed) {
    try {
      const today = new Date().toISOString().split('T')[0]

      await pool.query(`
        INSERT INTO rate_limit_stats (date, endpoint_type, total_requests, blocked_requests, unique_ips)
        VALUES ($1, $2, 1, $3, 0)
        ON CONFLICT (date, endpoint_type)
        DO UPDATE SET
          total_requests = rate_limit_stats.total_requests + 1,
          blocked_requests = rate_limit_stats.blocked_requests + $3
      `, [today, endpoint, allowed ? 0 : 1])
    } catch (error) {
      console.error('Failed to update rate limit stats:', error)
    }
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.ip ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0'
  }

  /**
   * Determine endpoint type from request path
   */
  getEndpointType(path) {
    if (path.startsWith('/api/auth')) return 'auth'
    if (path.startsWith('/api/admin')) return 'admin'
    if (path.startsWith('/api/upload') || path.startsWith('/api/r')) return 'upload'
    if (path.startsWith('/api/guest')) return 'guest'
    if (path.startsWith('/api')) return 'api'
    return 'global'
  }

  /**
   * Get rate limit configuration for endpoint type
   */
  getRateLimitConfig(endpointType) {
    return this.rateLimitConfigs[endpointType] || this.rateLimitConfigs.global
  }

  /**
   * Start background cleanup and monitoring tasks
   */
  startBackgroundTasks() {
    // Clean up old rate limit data every hour
    setInterval(async () => {
      try {
        await this.cleanupOldData()
      } catch (error) {
        console.error('Rate limit cleanup error:', error)
      }
    }, 60 * 60 * 1000) // 1 hour

    // Clean fallback store every 10 minutes
    setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.fallbackStore.entries()) {
        if (now > value.resetTime) {
          this.fallbackStore.delete(key)
        }
      }
    }, 10 * 60 * 1000) // 10 minutes

    // Update trust scores every 6 hours
    setInterval(async () => {
      try {
        await this.decayTrustScores()
      } catch (error) {
        console.error('Trust score decay error:', error)
      }
    }, 6 * 60 * 60 * 1000) // 6 hours
  }

  /**
   * Clean up old rate limit data
   */
  async cleanupOldData() {
    try {
      // Remove violations older than 30 days
      await pool.query(`
        DELETE FROM rate_limit_violations
        WHERE created_at < NOW() - INTERVAL '30 days'
      `)

      // Remove stats older than 90 days
      await pool.query(`
        DELETE FROM rate_limit_stats
        WHERE created_at < NOW() - INTERVAL '90 days'
      `)

      console.log('✓ Rate limit data cleanup completed')
    } catch (error) {
      console.error('Rate limit cleanup failed:', error)
    }
  }

  /**
   * Gradually improve trust scores for IPs with good behavior
   */
  async decayTrustScores() {
    try {
      // Improve trust scores for IPs without recent violations
      await pool.query(`
        UPDATE ip_reputation
        SET
          trust_score = LEAST(1.0, trust_score + 0.1),
          updated_at = NOW()
        WHERE last_violation IS NULL
           OR last_violation < NOW() - INTERVAL '7 days'
      `)

      console.log('✓ Trust score decay completed')
    } catch (error) {
      console.error('Trust score decay failed:', error)
    }
  }

  /**
   * Get rate limiting statistics
   */
  async getStatistics(days = 7) {
    try {
      const stats = await pool.query(`
        SELECT
          endpoint_type,
          SUM(total_requests) as total_requests,
          SUM(blocked_requests) as blocked_requests,
          AVG(avg_response_time) as avg_response_time,
          MAX(peak_requests_per_minute) as peak_requests_per_minute
        FROM rate_limit_stats
        WHERE date >= CURRENT_DATE - $1::interval
        GROUP BY endpoint_type
        ORDER BY total_requests DESC
      `, [`${days} days`])

      const violations = await pool.query(`
        SELECT
          COUNT(*) as total_violations,
          COUNT(DISTINCT ip_address) as unique_violating_ips,
          endpoint,
          AVG(requests_count) as avg_violation_size
        FROM rate_limit_violations
        WHERE created_at >= NOW() - $1::interval
        GROUP BY endpoint
        ORDER BY total_violations DESC
      `, [`${days} days`])

      return {
        endpointStats: stats.rows,
        violations: violations.rows,
        period: `${days} days`
      }
    } catch (error) {
      console.error('Failed to get rate limit statistics:', error)
      return null
    }
  }
}

// Create singleton instance
const rateLimitingService = new RateLimitingService()

module.exports = rateLimitingService