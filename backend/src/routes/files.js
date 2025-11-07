const express = require('express')
const router = express.Router()
const path = require('path')
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// GET /api/files/:id - Download file (protected)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Get upload details
    const uploadResult = await pool.query(
      `SELECT u.*, r.user_id
       FROM uploads u
       JOIN file_requests r ON u.request_id = r.id
       WHERE u.id = $1`,
      [id]
    )

    if (uploadResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    const upload = uploadResult.rows[0]

    // Verify user owns this request
    if (upload.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Send file
    const filePath = path.join(__dirname, '../uploads', upload.storage_path)
    res.download(filePath, upload.file_name)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
})

module.exports = router
