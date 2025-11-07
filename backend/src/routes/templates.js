const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// GET /api/templates - Get templates (from existing requests) (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user's requests and convert them to templates
    const result = await pool.query(
      `SELECT id, title, description, request_type, time_limit_days, custom_fields, created_at
       FROM file_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.userId]
    )

    // Format as templates
    const templates = result.rows.map(req => ({
      id: req.id,
      name: req.title,
      description: req.description || 'No description',
      requestType: req.request_type,
      timeLimitDays: req.time_limit_days,
      customFields: req.custom_fields,
      createdAt: req.created_at
    }))

    res.json({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
})

module.exports = router
