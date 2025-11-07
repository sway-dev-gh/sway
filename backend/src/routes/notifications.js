const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// GET /api/notifications - Get all notifications for user (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get all uploads for user's requests
    const result = await pool.query(
      `SELECT u.id, u.file_name, u.uploader_name, u.uploader_email, u.uploaded_at,
              r.title as request_title, r.short_code
       FROM uploads u
       JOIN file_requests r ON u.request_id = r.id
       WHERE r.user_id = $1
       ORDER BY u.uploaded_at DESC
       LIMIT 50`,
      [req.userId]
    )

    // Format as notifications
    const notifications = result.rows.map(upload => ({
      id: upload.id,
      type: 'file_uploaded',
      title: 'New file uploaded',
      message: `${upload.uploader_name} uploaded "${upload.file_name}" to "${upload.request_title}"`,
      requestTitle: upload.request_title,
      requestCode: upload.short_code,
      uploaderName: upload.uploader_name,
      uploaderEmail: upload.uploader_email,
      fileName: upload.file_name,
      createdAt: upload.uploaded_at,
      read: true // For MVP, mark all as read
    }))

    res.json({ notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

module.exports = router
