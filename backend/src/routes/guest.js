const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const pool = require('../db/pool')
const rateLimit = require('express-rate-limit')
const { authenticateToken } = require('../middleware/auth')

// Rate limiter for guest session creation
const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 guest sessions per 15 minutes per IP
  message: { error: 'Too many guest sessions created. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

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

// POST /api/guest/create - Create a persistent guest session
router.post('/create', guestLimiter, async (req, res) => {
  try {
    const deviceFingerprint = generateDeviceFingerprint(req)
    const guestId = crypto.randomUUID()
    const displayName = req.body.displayName || `Guest ${Math.random().toString(36).substring(2, 8)}`

    // Check if guest already exists for this device
    const existingGuest = await pool.query(
      'SELECT id, guest_id, display_name, created_at FROM guest_users WHERE device_fingerprint = $1',
      [deviceFingerprint]
    )

    let guestUser
    if (existingGuest.rows.length > 0) {
      // Return existing guest session
      guestUser = existingGuest.rows[0]
    } else {
      // Create new guest user in database
      const result = await pool.query(
        `INSERT INTO guest_users (guest_id, display_name, device_fingerprint, session_data, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, guest_id, display_name, created_at`,
        [guestId, displayName, deviceFingerprint, JSON.stringify({}), true]
      )
      guestUser = result.rows[0]
    }

    // Generate persistent guest token (no expiration)
    const token = jwt.sign(
      {
        guestId: guestUser.guest_id,
        displayName: guestUser.display_name,
        isGuest: true,
        deviceFingerprint
      },
      process.env.JWT_SECRET,
      { expiresIn: '365d' } // Long expiration for persistence
    )

    res.json({
      success: true,
      token,
      guestUser: {
        id: guestUser.guest_id,
        displayName: guestUser.display_name,
        isGuest: true,
        createdAt: guestUser.created_at
      }
    })

  } catch (error) {
    console.error('Guest session creation error:', error)
    res.status(500).json({ error: 'Failed to create guest session' })
  }
})

// POST /api/guest/convert - Convert guest to full user account
router.post('/convert', authenticateToken, async (req, res) => {
  try {
    const { email, password, name } = req.body

    // Verify this is a guest session
    if (!req.isGuest) {
      return res.status(400).json({ error: 'Only guest users can convert to full accounts' })
    }

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Validate password strength
    if (password.length < 12) {
      return res.status(400).json({
        error: 'Password must be at least 12 characters long'
      })
    }

    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        error: 'Password must contain uppercase, lowercase, number, and special character'
      })
    }

    // Check if email is already registered
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' })
    }

    // Get guest user data
    const guestResult = await pool.query(
      'SELECT * FROM guest_users WHERE guest_id = $1',
      [req.guestId]
    )

    if (guestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Guest session not found' })
    }

    const guestUser = guestResult.rows[0]

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Begin transaction to convert guest to full user
    await pool.query('BEGIN')

    try {
      // Create full user account
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, name, plan, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING id, email, name, plan, created_at`,
        [email.toLowerCase(), passwordHash, name || guestUser.display_name, 'free']
      )

      const newUser = userResult.rows[0]

      // Transfer guest data to user account (projects, files, etc.)
      // Update any projects owned by guest
      await pool.query(
        'UPDATE projects SET user_id = $1 WHERE guest_id = $2',
        [newUser.id, req.guestId]
      )

      // Update any file requests owned by guest
      await pool.query(
        'UPDATE file_requests SET user_id = $1 WHERE guest_id = $2',
        [newUser.id, req.guestId]
      )

      // Mark guest as converted (keep for audit trail)
      await pool.query(
        'UPDATE guest_users SET is_active = false, converted_user_id = $1, converted_at = NOW() WHERE guest_id = $2',
        [newUser.id, req.guestId]
      )

      await pool.query('COMMIT')

      // Generate new JWT for full user
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      )

      res.json({
        success: true,
        message: 'Successfully converted to full account',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          plan: newUser.plan,
          createdAt: newUser.created_at
        }
      })

    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }

  } catch (error) {
    console.error('Guest conversion error:', error)
    res.status(500).json({ error: 'Failed to convert guest account' })
  }
})

// GET /api/guest/me - Get current guest info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.isGuest) {
      return res.status(400).json({ error: 'Not a guest session' })
    }

    // Get guest user details from database
    const result = await pool.query(
      `SELECT guest_id, display_name, session_data, created_at, is_active
       FROM guest_users WHERE guest_id = $1 AND is_active = true`,
      [req.guestId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest session not found' })
    }

    const guestUser = result.rows[0]

    res.json({
      success: true,
      guestUser: {
        id: guestUser.guest_id,
        displayName: guestUser.display_name,
        isGuest: true,
        sessionData: guestUser.session_data,
        createdAt: guestUser.created_at
      }
    })

  } catch (error) {
    console.error('Get guest info error:', error)
    res.status(500).json({ error: 'Failed to get guest info' })
  }
})

// PUT /api/guest/update - Update guest session data
router.put('/update', authenticateToken, async (req, res) => {
  try {
    if (!req.isGuest) {
      return res.status(400).json({ error: 'Not a guest session' })
    }

    const { displayName, sessionData } = req.body

    const updateQuery = `
      UPDATE guest_users
      SET display_name = COALESCE($1, display_name),
          session_data = COALESCE($2, session_data),
          updated_at = NOW()
      WHERE guest_id = $3 AND is_active = true
      RETURNING guest_id, display_name, session_data, updated_at
    `

    const result = await pool.query(updateQuery, [
      displayName,
      sessionData ? JSON.stringify(sessionData) : null,
      req.guestId
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Guest session not found' })
    }

    const updatedGuest = result.rows[0]

    res.json({
      success: true,
      message: 'Guest session updated',
      guestUser: {
        id: updatedGuest.guest_id,
        displayName: updatedGuest.display_name,
        sessionData: updatedGuest.session_data,
        updatedAt: updatedGuest.updated_at
      }
    })

  } catch (error) {
    console.error('Update guest error:', error)
    res.status(500).json({ error: 'Failed to update guest session' })
  }
})

module.exports = router