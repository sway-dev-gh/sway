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

// SECURITY FIX: Get current user data securely via authenticated endpoint
// Replaces localStorage user data access to prevent XSS vulnerabilities
router.get('/me', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId

    // Fetch user data from database
    const userQuery = `
      SELECT
        id,
        email,
        name as username,
        plan,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
    `

    const result = await pool.query(userQuery, [userId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account may have been deleted'
      })
    }

    const user = result.rows[0]

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        plan: user.plan || 'free',
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })

  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      error: 'Failed to fetch user data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
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

// Update workspace settings
router.put('/workspace-settings', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      theme = 'light',
      language = 'en',
      timezone = 'UTC',
      auto_save = true,
      show_line_numbers = true,
      word_wrap = false,
      tab_size = 2,
      show_minimap = false,
      font_size = 14,
      font_family = 'monospace',
      layout = 'default',
      sidebar_collapsed = false,
      file_tree_expanded = true
    } = req.body

    // Validate workspace settings
    const validThemes = ['light', 'dark', 'auto']
    const validLanguages = ['en', 'es', 'fr', 'de', 'ja', 'zh']

    if (!validThemes.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme selection' })
    }

    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language selection' })
    }

    if (font_size < 8 || font_size > 24) {
      return res.status(400).json({ error: 'Font size must be between 8 and 24' })
    }

    const workspaceSettings = {
      theme,
      language,
      timezone,
      auto_save,
      show_line_numbers,
      word_wrap,
      tab_size,
      show_minimap,
      font_size,
      font_family,
      layout,
      sidebar_collapsed,
      file_tree_expanded,
      updated_at: new Date()
    }

    // Check if workspace settings already exist
    const existingQuery = 'SELECT id FROM user_workspace_settings WHERE user_id = $1'
    const existing = await pool.query(existingQuery, [userId])

    if (existing.rows.length > 0) {
      // Update existing settings
      await pool.query(
        'UPDATE user_workspace_settings SET settings = $1, updated_at = NOW() WHERE user_id = $2',
        [JSON.stringify(workspaceSettings), userId]
      )
    } else {
      // Create new settings
      await pool.query(
        `INSERT INTO user_workspace_settings (user_id, settings, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, JSON.stringify(workspaceSettings)]
      )
    }

    res.json({
      success: true,
      message: 'Workspace settings updated successfully',
      settings: workspaceSettings
    })

  } catch (error) {
    console.error('Update workspace settings error:', error)
    res.status(500).json({
      error: 'Failed to update workspace settings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Update automation settings
router.put('/automation-settings', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      auto_backup = true,
      backup_frequency = 'daily',
      auto_sync_enabled = true,
      sync_on_file_change = false,
      webhook_notifications = false,
      webhook_url = null,
      slack_integration = false,
      slack_webhook = null,
      email_reports = true,
      report_frequency = 'weekly',
      auto_cleanup_enabled = false,
      cleanup_after_days = 30,
      auto_archive_projects = false,
      archive_after_days = 90,
      git_auto_commit = false,
      commit_frequency = 'daily'
    } = req.body

    // Validate automation settings
    const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly']

    if (!validFrequencies.includes(backup_frequency)) {
      return res.status(400).json({ error: 'Invalid backup frequency' })
    }

    if (!validFrequencies.includes(report_frequency)) {
      return res.status(400).json({ error: 'Invalid report frequency' })
    }

    if (cleanup_after_days < 1 || cleanup_after_days > 365) {
      return res.status(400).json({ error: 'Cleanup days must be between 1 and 365' })
    }

    if (archive_after_days < 7 || archive_after_days > 730) {
      return res.status(400).json({ error: 'Archive days must be between 7 and 730' })
    }

    // Validate webhook URL if provided
    if (webhook_notifications && webhook_url) {
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(webhook_url)) {
        return res.status(400).json({ error: 'Invalid webhook URL format' })
      }
    }

    const automationSettings = {
      auto_backup,
      backup_frequency,
      auto_sync_enabled,
      sync_on_file_change,
      webhook_notifications,
      webhook_url: webhook_notifications ? webhook_url : null,
      slack_integration,
      slack_webhook: slack_integration ? slack_webhook : null,
      email_reports,
      report_frequency,
      auto_cleanup_enabled,
      cleanup_after_days,
      auto_archive_projects,
      archive_after_days,
      git_auto_commit,
      commit_frequency,
      updated_at: new Date()
    }

    // Check if automation settings already exist
    const existingQuery = 'SELECT id FROM user_automation_settings WHERE user_id = $1'
    const existing = await pool.query(existingQuery, [userId])

    if (existing.rows.length > 0) {
      // Update existing settings
      await pool.query(
        'UPDATE user_automation_settings SET settings = $1, updated_at = NOW() WHERE user_id = $2',
        [JSON.stringify(automationSettings), userId]
      )
    } else {
      // Create new settings
      await pool.query(
        `INSERT INTO user_automation_settings (user_id, settings, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, JSON.stringify(automationSettings)]
      )
    }

    res.json({
      success: true,
      message: 'Automation settings updated successfully',
      settings: automationSettings
    })

  } catch (error) {
    console.error('Update automation settings error:', error)
    res.status(500).json({
      error: 'Failed to update automation settings',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
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