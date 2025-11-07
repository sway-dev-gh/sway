const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const { createNotification } = require('./notifications')

// GET /api/stats - Get user statistics (protected)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user's plan and storage limit
    const userResult = await pool.query(
      'SELECT plan, storage_limit_gb FROM users WHERE id = $1',
      [req.userId]
    )
    const userPlan = userResult.rows[0]?.plan || 'free'
    const storageLimitGB = userResult.rows[0]?.storage_limit_gb || 1

    // Get total requests count
    const requestsResult = await pool.query(
      'SELECT COUNT(*) as count FROM file_requests WHERE user_id = $1',
      [req.userId]
    )
    const totalRequests = parseInt(requestsResult.rows[0].count)

    // Get total uploads count
    const uploadsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM uploads u
       JOIN file_requests r ON u.request_id = r.id
       WHERE r.user_id = $1`,
      [req.userId]
    )
    const totalUploads = parseInt(uploadsResult.rows[0].count)

    // Get total storage used (sum of all file sizes)
    const storageResult = await pool.query(
      `SELECT COALESCE(SUM(u.file_size), 0) as total_bytes
       FROM uploads u
       JOIN file_requests r ON u.request_id = r.id
       WHERE r.user_id = $1`,
      [req.userId]
    )
    const storageBytes = parseInt(storageResult.rows[0].total_bytes)
    const storageMB = Math.round(storageBytes / (1024 * 1024) * 100) / 100
    const storageGB = storageMB / 1024

    // Check if storage exceeds 80% and create notification
    const storagePercentage = (storageGB / storageLimitGB) * 100
    if (storagePercentage >= 80) {
      // Check if we've already sent a notification recently (within last 24 hours)
      const recentNotificationResult = await pool.query(
        `SELECT id FROM notifications
         WHERE user_id = $1
           AND type = 'storage_warning'
           AND created_at >= NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [req.userId]
      )

      // Only create notification if we haven't sent one recently
      if (recentNotificationResult.rows.length === 0) {
        const severity = storagePercentage >= 90 ? 'critical' : 'warning'
        const title = storagePercentage >= 90
          ? 'Storage Almost Full'
          : 'Storage Limit Approaching'
        const message = storagePercentage >= 90
          ? `You're using ${storageGB.toFixed(2)} GB of ${storageLimitGB} GB (${storagePercentage.toFixed(1)}%). Please upgrade your plan or delete old files to free up space.`
          : `You're using ${storageGB.toFixed(2)} GB of ${storageLimitGB} GB (${storagePercentage.toFixed(1)}%). Consider upgrading your plan for more storage.`

        await createNotification(
          req.userId,
          'storage_warning',
          title,
          message,
          { storageGB, storageLimitGB, percentage: storagePercentage, severity }
        )
      }
    }

    // Get recent upload activity (last 30 days)
    const activityResult = await pool.query(
      `SELECT DATE(u.uploaded_at) as date, COUNT(*) as count
       FROM uploads u
       JOIN file_requests r ON u.request_id = r.id
       WHERE r.user_id = $1
         AND u.uploaded_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(u.uploaded_at)
       ORDER BY date DESC`,
      [req.userId]
    )

    // Get active requests count
    const activeRequestsResult = await pool.query(
      'SELECT COUNT(*) as count FROM file_requests WHERE user_id = $1 AND is_active = true',
      [req.userId]
    )
    const activeRequests = parseInt(activeRequestsResult.rows[0].count)

    res.json({
      totalRequests,
      totalUploads,
      storageMB,
      storageBytes,
      activeRequests,
      uploadActivity: activityResult.rows
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

module.exports = router
