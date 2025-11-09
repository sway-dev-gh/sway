const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')

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

    // Constant-time comparison to prevent timing attacks
    const isValid = password === ADMIN_PASSWORD

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

module.exports = router
