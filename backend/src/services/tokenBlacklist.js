/**
 * Persistent Redis Token Blacklist Service
 * Enterprise-grade token management with Redis persistence
 */

const redis = require('redis')
const jwt = require('jsonwebtoken')

class TokenBlacklist {
  constructor() {
    this.redisClient = null
    this.isConnected = false
    this.fallbackSet = new Set() // Fallback to in-memory if Redis unavailable
    this.keyPrefix = 'blacklist:token:'
    this.redisErrorLogged = false // Prevent spam logging
    this.init()
  }

  async init() {
    try {
      // Create Redis client with connection options
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            if (!this.redisErrorLogged && process.env.NODE_ENV !== 'production') {
              console.log('⚠️ Redis connection refused, using fallback in-memory blacklist')
              this.redisErrorLogged = true
            }
            return undefined
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            if (!this.redisErrorLogged && process.env.NODE_ENV !== 'production') {
              console.log('⚠️ Redis retry time exhausted, using fallback')
              this.redisErrorLogged = true
            }
            return undefined
          }
          if (options.attempt > 10) {
            return undefined
          }
          return Math.min(options.attempt * 100, 3000)
        }
      })

      // Handle Redis connection events
      this.redisClient.on('connect', () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('✓ Redis connected for token blacklist')
        }
        this.isConnected = true
      })

      this.redisClient.on('error', (err) => {
        if (!this.redisErrorLogged) {
          // Only log in development - silent fallback in production
          if (process.env.NODE_ENV !== 'production') {
            console.log('⚠️ Redis unavailable, using in-memory fallback:', err.message)
          }
          this.redisErrorLogged = true
        }
        this.isConnected = false
      })

      this.redisClient.on('end', () => {
        if (!this.redisErrorLogged && process.env.NODE_ENV !== 'production') {
          console.log('⚠️ Redis disconnected, using fallback blacklist')
          this.redisErrorLogged = true
        }
        this.isConnected = false
      })

      // Connect to Redis
      await this.redisClient.connect()
    } catch (error) {
      if (!this.redisErrorLogged && process.env.NODE_ENV !== 'production') {
        console.log('⚠️ Redis initialization failed, using in-memory fallback:', error.message)
      }
      this.redisErrorLogged = true
      this.isConnected = false
    }
  }

  // Add token to blacklist with automatic expiration
  async blacklistToken(token, userId, reason = 'logout', customExpiration = null) {
    try {
      // Extract expiration from JWT for automatic cleanup
      let expiration = customExpiration
      if (!expiration) {
        const decoded = jwt.decode(token, { complete: true })
        if (decoded && decoded.payload.exp) {
          expiration = decoded.payload.exp - Math.floor(Date.now() / 1000)
        } else {
          expiration = 86400 // 24 hours fallback
        }
      }

      const key = `${this.keyPrefix}${token}`
      const value = {
        userId,
        reason,
        blacklistedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (expiration * 1000)).toISOString()
      }

      if (this.isConnected) {
        // Use Redis with automatic expiration
        await this.redisClient.setEx(key, expiration, JSON.stringify(value))
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Token blacklisted in Redis (expires in ${expiration}s)`)
        }
      } else {
        // Fallback to in-memory
        this.fallbackSet.add(token)
        if (process.env.NODE_ENV === 'development') {
          console.log('✓ Token blacklisted in memory (fallback)')
        }

        // Auto-cleanup for in-memory fallback
        setTimeout(() => {
          this.fallbackSet.delete(token)
        }, expiration * 1000)
      }

      return true
    } catch (error) {
      console.error('Failed to blacklist token:', error)
      // Emergency fallback
      this.fallbackSet.add(token)
      return false
    }
  }

  // Check if token is blacklisted
  async isBlacklisted(token) {
    try {
      if (this.isConnected) {
        const key = `${this.keyPrefix}${token}`
        const result = await this.redisClient.get(key)
        return result !== null
      } else {
        // Fallback to in-memory check
        return this.fallbackSet.has(token)
      }
    } catch (error) {
      console.error('Failed to check token blacklist:', error)
      // Emergency fallback check
      return this.fallbackSet.has(token)
    }
  }

  // Get blacklist info for a token (for logging/debugging)
  async getBlacklistInfo(token) {
    try {
      if (this.isConnected) {
        const key = `${this.keyPrefix}${token}`
        const result = await this.redisClient.get(key)
        return result ? JSON.parse(result) : null
      } else {
        return this.fallbackSet.has(token) ? { source: 'fallback', blacklistedAt: new Date().toISOString() } : null
      }
    } catch (error) {
      console.error('Failed to get blacklist info:', error)
      return null
    }
  }

  // Clean up expired tokens (manual cleanup for fallback)
  async cleanupExpiredTokens() {
    try {
      if (this.isConnected) {
        // Redis handles expiration automatically, but we can get stats
        const keys = await this.redisClient.keys(`${this.keyPrefix}*`)
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Redis token blacklist contains ${keys.length} active tokens`)
        }
        return keys.length
      } else {
        // For fallback, we rely on setTimeout cleanup
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ In-memory token blacklist contains ${this.fallbackSet.size} active tokens`)
        }
        return this.fallbackSet.size
      }
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error)
      return 0
    }
  }

  // Blacklist all tokens for a specific user (for security incidents)
  async blacklistAllUserTokens(userId, reason = 'security_incident') {
    try {
      // This would require maintaining a user->token mapping
      // For now, we implement the API for future enhancement
      console.log(`⚠️ User ${userId} token invalidation requested (${reason})`)

      // In production, you'd:
      // 1. Query database for all user sessions
      // 2. Blacklist each token
      // 3. Force re-authentication

      return true
    } catch (error) {
      console.error('Failed to blacklist all user tokens:', error)
      return false
    }
  }

  // Get blacklist statistics (for monitoring)
  async getStats() {
    try {
      if (this.isConnected) {
        const keys = await this.redisClient.keys(`${this.keyPrefix}*`)
        return {
          storage: 'redis',
          totalBlacklistedTokens: keys.length,
          connected: this.isConnected
        }
      } else {
        return {
          storage: 'memory',
          totalBlacklistedTokens: this.fallbackSet.size,
          connected: false
        }
      }
    } catch (error) {
      return {
        storage: 'error',
        totalBlacklistedTokens: this.fallbackSet.size,
        connected: false,
        error: error.message
      }
    }
  }

  // Graceful shutdown
  async shutdown() {
    try {
      if (this.redisClient && this.isConnected) {
        await this.redisClient.quit()
        console.log('✓ Redis token blacklist service shutdown gracefully')
      }
    } catch (error) {
      console.error('Error during token blacklist shutdown:', error)
    }
  }
}

// Create singleton instance
const tokenBlacklist = new TokenBlacklist()

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await tokenBlacklist.shutdown()
})

process.on('SIGTERM', async () => {
  await tokenBlacklist.shutdown()
})

module.exports = tokenBlacklist