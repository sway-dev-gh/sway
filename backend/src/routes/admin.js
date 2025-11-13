const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const keyRotationRouter = require('./admin/keyRotation')
const rateLimitingRouter = require('./admin/rateLimiting')

// Rate limit for admin verification - strict limit
const adminVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  message: { error: 'Too many admin verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// POST /api/admin/verify - Verify admin password
router.post('/verify', adminVerifyLimiter, async (req, res) => {
  try {
    const { password } = req.body

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required', valid: false })
    }

    // Check against environment variable
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD environment variable not set')
      return res.status(500).json({ error: 'Admin mode not configured', valid: false })
    }

    // Timing-safe comparison to prevent timing attacks
    let isValid = false
    try {
      // Both strings must be same length for timingSafeEqual to work
      if (password.length === ADMIN_PASSWORD.length) {
        const passwordBuffer = Buffer.from(password, 'utf8')
        const adminPasswordBuffer = Buffer.from(ADMIN_PASSWORD, 'utf8')
        isValid = crypto.timingSafeEqual(passwordBuffer, adminPasswordBuffer)
      }
    } catch (error) {
      // If there's any error in comparison, fail securely
      isValid = false
    }

    if (isValid) {
      // Log successful admin authentication (for security monitoring)
      console.log('Admin mode activated from IP:', req.ip)
      return res.json({ valid: true })
    } else {
      // Log failed attempt
      console.warn('Failed admin verification attempt from IP:', req.ip)
      return res.status(401).json({ error: 'Invalid password', valid: false })
    }
  } catch (error) {
    console.error('Admin verification error:', error)
    res.status(500).json({ error: 'Verification failed', valid: false })
  }
})

// Require admin authentication for all subsequent routes
const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

// PUT /api/admin/user-plan - Change a user's plan (admin only)
router.put('/user-plan', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userEmail, plan } = req.body

    if (!userEmail || !plan) {
      return res.status(400).json({ error: 'User email and plan are required' })
    }

    if (!['free', 'pro'].includes(plan.toLowerCase())) {
      return res.status(400).json({ error: 'Plan must be "free" or "pro"' })
    }

    // Check if user exists
    const userQuery = await pool.query('SELECT id, name, plan FROM users WHERE email = $1', [userEmail.toLowerCase()])

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userQuery.rows[0]
    const newPlan = plan.toLowerCase()

    // Update user's plan
    const updateQuery = await pool.query(
      'UPDATE users SET plan = $1, updated_at = NOW() WHERE email = $2 RETURNING *',
      [newPlan, userEmail.toLowerCase()]
    )

    console.log(`Admin changed user ${userEmail} plan from ${user.plan} to ${newPlan}`)

    res.json({
      success: true,
      message: `User ${userEmail} plan changed to ${newPlan}`,
      user: {
        id: user.id,
        name: user.name,
        email: userEmail,
        previousPlan: user.plan,
        newPlan: newPlan
      }
    })

  } catch (error) {
    console.error('Admin plan change error:', error)
    res.status(500).json({
      error: 'Failed to change user plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Mount key rotation admin routes
router.use('/key-rotation', authenticateToken, keyRotationRouter)

// Mount rate limiting admin routes
router.use('/rate-limiting', authenticateToken, rateLimitingRouter)

module.exports = router
