const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const fs = require('fs')
const path = require('path')
const { moderateText } = require('../utils/security')
const bcrypt = require('bcryptjs')

// Helper to generate short code
function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// POST /api/requests - Create new request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, type, timeLimit, fields, customFields, fieldRequirements, password, requireEmail, requireName } = req.body

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    // SECURITY: Moderate title and description for inappropriate content
    const titleModeration = moderateText(title)
    if (!titleModeration.safe) {
      return res.status(400).json({
        error: 'Request title contains inappropriate content',
        reason: titleModeration.reason
      })
    }

    if (description) {
      const descriptionModeration = moderateText(description)
      if (!descriptionModeration.safe) {
        return res.status(400).json({
          error: 'Request description contains inappropriate content',
          reason: descriptionModeration.reason
        })
      }
    }

    // Check user's plan and enforce request limits (skip for admin)
    if (!req.isAdmin) {
      const userResult = await pool.query('SELECT plan FROM users WHERE id = $1', [req.userId])
      const userPlan = userResult.rows[0]?.plan || 'free'

      // FREE: 20 active requests limit | PRO: unlimited
      if (userPlan === 'free') {
        const activeRequestsResult = await pool.query(
          'SELECT COUNT(*) as count FROM file_requests WHERE user_id = $1 AND is_active = true',
          [req.userId]
        )
        const activeCount = parseInt(activeRequestsResult.rows[0].count)

        if (activeCount >= 20) {
          return res.status(403).json({
            error: 'Free plan allows 20 active requests. Upgrade to Pro ($15/mo) for unlimited requests.',
            limitReached: true,
            currentPlan: 'free',
            upgradeRequired: 'pro'
          })
        }
      }
    }

    // Generate unique short code
    let shortCode = generateShortCode()
    let exists = await pool.query('SELECT id FROM file_requests WHERE short_code = $1', [shortCode])
    while (exists.rows.length > 0) {
      shortCode = generateShortCode()
      exists = await pool.query('SELECT id FROM file_requests WHERE short_code = $1', [shortCode])
    }

    // Calculate expiration date if timeLimit is provided
    let expiresAt = null
    if (timeLimit && timeLimit !== 'never') {
      const timeLimitStr = String(timeLimit)
      if (timeLimitStr.startsWith('custom:')) {
        // Custom time in minutes format: "custom:XXX"
        const minutes = parseInt(timeLimitStr.split(':')[1])
        if (minutes >= 5) { // Minimum 5 minutes
          expiresAt = new Date()
          expiresAt.setMinutes(expiresAt.getMinutes() + minutes)
        }
      } else if (parseInt(timeLimitStr) > 0) {
        // Preset time in days
        const days = parseInt(timeLimitStr)
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + days)
      }
    }

    // Hash password if provided (Pro feature)
    let passwordHash = null
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10)
    }

    // Create request
    const result = await pool.query(
      `INSERT INTO file_requests (user_id, short_code, title, description, request_type, time_limit_days, custom_fields, field_requirements, expires_at, password_hash, require_email, require_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, short_code, title, description, request_type, time_limit_days, custom_fields, field_requirements, expires_at, created_at, require_email, require_name`,
      [
        req.userId,
        shortCode,
        title,
        description || null,
        type || null,
        timeLimit ? parseInt(timeLimit) : null,
        customFields ? JSON.stringify(customFields) : null,
        fieldRequirements ? JSON.stringify(fieldRequirements) : null,
        expiresAt,
        passwordHash,
        requireEmail || false,
        requireName || false
      ]
    )

    const request = result.rows[0]

    res.json({
      id: request.id,
      shortCode: request.short_code,
      title: request.title,
      description: request.description,
      requestType: request.request_type,
      timeLimitDays: request.time_limit_days,
      customFields: request.custom_fields,
      expiresAt: request.expires_at,
      createdAt: request.created_at
    })
  } catch (error) {
    console.error('Create request error:', error)
    res.status(500).json({ error: 'Failed to create request' })
  }
})

// GET /api/requests - List all requests for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        r.id, r.short_code, r.title, r.description, r.created_at,
        COUNT(u.id) as upload_count
       FROM file_requests r
       LEFT JOIN uploads u ON r.id = u.request_id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.created_at DESC`,
      [req.userId]
    )

    res.json({
      requests: result.rows.map(r => ({
        id: r.id,
        shortCode: r.short_code,
        title: r.title,
        description: r.description,
        uploadCount: parseInt(r.upload_count),
        createdAt: r.created_at
      }))
    })
  } catch (error) {
    console.error('List requests error:', error)
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
})

// GET /api/requests/:id - Get single request with uploads
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Get request details
    const requestResult = await pool.query(
      'SELECT * FROM file_requests WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    const request = requestResult.rows[0]

    // Get uploads
    const uploadsResult = await pool.query(
      `SELECT id, uploader_name, uploader_email, file_name, file_size, uploaded_at
       FROM uploads
       WHERE request_id = $1
       ORDER BY uploaded_at DESC`,
      [req.params.id]
    )

    res.json({
      request: {
        id: request.id,
        shortCode: request.short_code,
        title: request.title,
        description: request.description,
        isActive: request.is_active,
        createdAt: request.created_at
      },
      uploads: uploadsResult.rows.map(u => ({
        id: u.id,
        uploaderName: u.uploader_name,
        uploaderEmail: u.uploader_email,
        fileName: u.file_name,
        fileSize: u.file_size,
        uploadedAt: u.uploaded_at,
        downloadUrl: `/api/files/${u.id}`
      }))
    })
  } catch (error) {
    console.error('Get request error:', error)
    res.status(500).json({ error: 'Failed to fetch request' })
  }
})

// DELETE /api/requests/:id - Delete request
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // First, get all file paths for this request before deleting
    const uploadsResult = await pool.query(
      `SELECT u.storage_path
       FROM uploads u
       WHERE u.request_id = $1`,
      [req.params.id]
    )

    // Delete the request (CASCADE will delete uploads from DB)
    const result = await pool.query(
      'DELETE FROM file_requests WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    // Delete physical files from disk
    const uploadsDir = path.join(__dirname, '../uploads')
    for (const upload of uploadsResult.rows) {
      const filePath = path.join(uploadsDir, upload.storage_path)
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      } catch (fileError) {
        console.error(`Failed to delete file ${upload.storage_path}:`, fileError)
        // Continue deleting other files even if one fails
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Delete request error:', error)
    res.status(500).json({ error: 'Failed to delete request' })
  }
})

// PATCH /api/requests/:id/toggle-active - Toggle request active status
router.patch('/:id/toggle-active', authenticateToken, async (req, res) => {
  try {
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' })
    }

    // If trying to activate, check active request limits (skip for admin)
    if (isActive === true && !req.isAdmin) {
      const userResult = await pool.query('SELECT plan FROM users WHERE id = $1', [req.userId])
      const userPlan = userResult.rows[0]?.plan || 'free'

      // FREE: 20 active requests limit | PRO: unlimited
      if (userPlan === 'free') {
        const activeRequestsResult = await pool.query(
          'SELECT COUNT(*) as count FROM file_requests WHERE user_id = $1 AND is_active = true',
          [req.userId]
        )
        const activeCount = parseInt(activeRequestsResult.rows[0].count)

        if (activeCount >= 20) {
          return res.status(403).json({
            error: 'Free plan allows 20 active requests. Upgrade to Pro ($15/mo) for unlimited requests.',
            limitReached: true,
            currentPlan: 'free',
            upgradeRequired: 'pro'
          })
        }
      }
    }

    const result = await pool.query(
      'UPDATE file_requests SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [isActive, req.params.id, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }

    res.json({ success: true, request: result.rows[0] })
  } catch (error) {
    console.error('Toggle active error:', error)
    res.status(500).json({ error: 'Failed to update request' })
  }
})

module.exports = router
