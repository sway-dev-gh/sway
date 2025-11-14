const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const { validateInput } = require('../middleware/validation')
const bcrypt = require('bcrypt')
const rateLimit = require('express-rate-limit')

// Rate limiter for user settings operations
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: { error: 'Too many user requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Update user settings
router.put('/settings', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { email, username, emailNotifications, projectUpdates } = req.body

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' })
      }

      // Check if email is already taken by another user
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), userId]
      )

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use by another account' })
      }
    }

    // Validate username if provided
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens'
        })
      }

      // Check if username is already taken
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      )

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already taken' })
      }
    }

    // Update user settings
    let updateQuery = 'UPDATE users SET updated_at = NOW()'
    const queryParams = []
    let paramIndex = 1

    if (email) {
      updateQuery += `, email = $${paramIndex}`
      queryParams.push(email.toLowerCase())
      paramIndex++
    }

    if (username) {
      updateQuery += `, username = $${paramIndex}`
      queryParams.push(username)
      paramIndex++
    }

    // Store preferences in JSONB field
    const preferences = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      projectUpdates: projectUpdates !== undefined ? projectUpdates : true
    }

    updateQuery += `, preferences = $${paramIndex}`
    queryParams.push(JSON.stringify(preferences))
    paramIndex++

    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, email, username, preferences`
    queryParams.push(userId)

    const result = await pool.query(updateQuery, queryParams)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      user: result.rows[0]
    })

  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// Change password
router.post('/change-password', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }

    // Get current user
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password
    await pool.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    )

    res.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// Generate API key
router.post('/generate-api-key', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId

    // Generate a secure API key
    const crypto = require('crypto')
    const apiKey = 'sk_' + crypto.randomBytes(32).toString('hex')

    // Store API key hash in database
    const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex')

    await pool.query(
      `UPDATE users SET
       api_key_hash = $1,
       api_key_created_at = NOW(),
       updated_at = NOW()
       WHERE id = $2`,
      [hashedApiKey, userId]
    )

    res.json({
      success: true,
      apiKey: apiKey,
      message: 'API key generated successfully. Store it safely as it cannot be retrieved again.'
    })

  } catch (error) {
    console.error('Generate API key error:', error)
    res.status(500).json({ error: 'Failed to generate API key' })
  }
})

// Get user settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      'SELECT id, email, username, preferences, plan, storage_limit_gb FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = result.rows[0]
    const preferences = user.preferences || {}

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan,
        storage_limit_gb: user.storage_limit_gb,
        preferences: {
          emailNotifications: preferences.emailNotifications !== false,
          projectUpdates: preferences.projectUpdates !== false,
        }
      }
    })

  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Failed to get settings' })
  }
})

module.exports = router