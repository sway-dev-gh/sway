const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// GET /api/analytics - Get user analytics
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    // Get user plan
    const userResult = await pool.query('SELECT plan FROM users WHERE id = $1', [userId])
    const userPlan = userResult.rows[0]?.plan || 'free'

    // Basic stats (available to all users)
    const totalRequestsResult = await pool.query(
      'SELECT COUNT(*) as count FROM file_requests WHERE user_id = $1',
      [userId]
    )
    const totalRequests = parseInt(totalRequestsResult.rows[0].count)

    const activeRequestsResult = await pool.query(
      'SELECT COUNT(*) as count FROM file_requests WHERE user_id = $1 AND is_active = true',
      [userId]
    )
    const activeRequests = parseInt(activeRequestsResult.rows[0].count)

    const totalUploadsResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM uploads u
       JOIN file_requests fr ON u.request_id = fr.id
       WHERE fr.user_id = $1`,
      [userId]
    )
    const totalUploads = parseInt(totalUploadsResult.rows[0].count)

    const totalStorageResult = await pool.query(
      `SELECT COALESCE(SUM(u.file_size), 0) as total_bytes
       FROM uploads u
       JOIN file_requests fr ON u.request_id = fr.id
       WHERE fr.user_id = $1`,
      [userId]
    )
    const totalStorageBytes = parseInt(totalStorageResult.rows[0].total_bytes)
    const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)

    // Upload trend (last 7 days) - available to all users
    const uploadsByDayResult = await pool.query(
      `SELECT DATE(u.created_at) as date, COUNT(*) as count
       FROM uploads u
       JOIN file_requests fr ON u.request_id = fr.id
       WHERE fr.user_id = $1 AND u.created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(u.created_at)
       ORDER BY date ASC`,
      [userId]
    )

    // Fill in missing days with 0 uploads
    const uploadsByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const existing = uploadsByDayResult.rows.find(row => {
        const rowDate = new Date(row.date)
        return rowDate.toDateString() === date.toDateString()
      })
      uploadsByDay.push({
        date: dateStr,
        count: existing ? parseInt(existing.count) : 0
      })
    }

    // Request types breakdown - available to all users
    const requestsByTypeResult = await pool.query(
      `SELECT request_type, COUNT(*) as count
       FROM file_requests
       WHERE user_id = $1
       GROUP BY request_type`,
      [userId]
    )
    const requestsByType = {}
    requestsByTypeResult.rows.forEach(row => {
      requestsByType[row.request_type || 'unknown'] = parseInt(row.count)
    })

    // Basic response for free users
    const basicStats = {
      totalRequests,
      activeRequests,
      totalUploads,
      totalStorageGB: parseFloat(totalStorageGB),
      uploadsByDay,
      requestsByType,
      plan: userPlan
    }

    // Pro users get advanced analytics
    if (userPlan === 'pro') {
      // Recent activity (last 7 days)
      const recentActivityResult = await pool.query(
        `SELECT DATE(u.created_at) as date, COUNT(*) as uploads
         FROM uploads u
         JOIN file_requests fr ON u.request_id = fr.id
         WHERE fr.user_id = $1 AND u.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(u.created_at)
         ORDER BY date DESC`,
        [userId]
      )

      // Most active requests
      const topRequestsResult = await pool.query(
        `SELECT fr.title, COUNT(u.id) as upload_count
         FROM file_requests fr
         LEFT JOIN uploads u ON fr.id = u.request_id
         WHERE fr.user_id = $1
         GROUP BY fr.id, fr.title
         ORDER BY upload_count DESC
         LIMIT 5`,
        [userId]
      )

      // File type breakdown
      const fileTypeResult = await pool.query(
        `SELECT
          CASE
            WHEN u.file_name LIKE '%.pdf' THEN 'PDF'
            WHEN u.file_name LIKE '%.jpg' OR u.file_name LIKE '%.jpeg' OR u.file_name LIKE '%.png' OR u.file_name LIKE '%.gif' THEN 'Image'
            WHEN u.file_name LIKE '%.doc' OR u.file_name LIKE '%.docx' THEN 'Document'
            WHEN u.file_name LIKE '%.xls' OR u.file_name LIKE '%.xlsx' THEN 'Spreadsheet'
            WHEN u.file_name LIKE '%.mp4' OR u.file_name LIKE '%.mov' OR u.file_name LIKE '%.avi' THEN 'Video'
            ELSE 'Other'
          END as file_type,
          COUNT(*) as count
         FROM uploads u
         JOIN file_requests fr ON u.request_id = fr.id
         WHERE fr.user_id = $1
         GROUP BY file_type
         ORDER BY count DESC`,
        [userId]
      )

      // Average uploads per request
      const avgUploadsPerRequest = totalRequests > 0 ? (totalUploads / totalRequests).toFixed(1) : 0

      return res.json({
        ...basicStats,
        advanced: {
          recentActivity: recentActivityResult.rows,
          topRequests: topRequestsResult.rows,
          fileTypeBreakdown: fileTypeResult.rows,
          avgUploadsPerRequest: parseFloat(avgUploadsPerRequest)
        }
      })
    }

    // Return basic stats for free users
    res.json(basicStats)
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

module.exports = router
