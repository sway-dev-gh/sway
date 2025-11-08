const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get all notifications for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, type, title, message, link, is_read, created_at, read_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    )

    res.json({ notifications: result.rows })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = true,
           read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_read, read_at`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ notification: result.rows[0] })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to update notification' })
  }
})

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    )

    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    await pool.query(
      `UPDATE notifications
       SET is_read = true,
           read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    )

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error marking all as read:', error)
    res.status(500).json({ error: 'Failed to update notifications' })
  }
})

module.exports = router
