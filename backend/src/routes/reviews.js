const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')

// Rate limiting for review operations
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many review requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// GET /api/reviews - Get user's reviews
router.get('/', authenticateToken, reviewLimiter, async (req, res) => {
  try {
    const userId = req.userId

    // For now, return empty reviews array to fix dashboard loading
    // Later we can implement full review management with proper tables
    const reviews = []

    // You could also query file_requests table as reviews if needed:
    // const result = await pool.query(
    //   'SELECT id, title, status, created_at FROM file_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
    //   [userId]
    // )
    // const reviews = result.rows || []

    res.json({
      success: true,
      reviews: reviews
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({
      error: 'Failed to fetch reviews',
      reviews: [] // Return empty array as fallback
    })
  }
})

module.exports = router