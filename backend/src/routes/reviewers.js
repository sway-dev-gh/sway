const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')

// Rate limiting for reviewer operations
const reviewerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many reviewer requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// GET /api/reviewers - Get user's reviewers/team members
router.get('/', authenticateToken, reviewerLimiter, async (req, res) => {
  try {
    const userId = req.userId

    // For now, return empty reviewers array to fix dashboard loading
    // Later we can implement full reviewer management
    const reviewers = []

    // You could also query users table if needed:
    // const result = await pool.query(
    //   'SELECT id, email FROM users WHERE id != $1 LIMIT 10',
    //   [userId]
    // )
    // const reviewers = result.rows || []

    res.json({
      success: true,
      reviewers: reviewers
    })
  } catch (error) {
    console.error('Error fetching reviewers:', error)
    res.status(500).json({
      error: 'Failed to fetch reviewers',
      reviewers: [] // Return empty array as fallback
    })
  }
})

module.exports = router