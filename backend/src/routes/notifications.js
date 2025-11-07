const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Helper function to create a notification
async function createNotification(userId, type, title, message, metadata = null) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
    )
  } catch (error) {
    console.error('Create notification error:', error)
  }
}

// GET /api/notifications - Get all notifications for user (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, title, message, metadata, read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.userId]
    )

    const notifications = result.rows.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      read: n.read,
      createdAt: n.created_at
    }))

    res.json({ notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// POST /api/notifications/mark-read - Mark notification as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.body

    await pool.query(
      `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
      [notificationId, req.userId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET read = true WHERE user_id = $1`,
      [req.userId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

module.exports = router
module.exports.createNotification = createNotification
