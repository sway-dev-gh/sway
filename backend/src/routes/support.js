const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Create a new support ticket
router.post('/tickets', authenticateToken, async (req, res) => {
  try {
    const { subject, message, priority } = req.body
    const userId = req.userId

    // Validate input
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' })
    }

    // Check user's plan (Pro or Business required) - bypass for admins
    if (!req.isAdmin) {
      const userResult = await pool.query(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )

      const userPlan = userResult.rows[0]?.plan?.toLowerCase()
      if (userPlan !== 'pro' && userPlan !== 'business') {
        return res.status(403).json({ error: 'Pro or Business plan required for priority support' })
      }
    }

    // Create ticket
    const result = await pool.query(
      `INSERT INTO support_tickets (user_id, subject, message, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, subject, message, priority, status, created_at`,
      [userId, subject, message, priority || 'normal']
    )

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    res.status(500).json({ error: 'Failed to create support ticket' })
  }
})

// Get all tickets for the authenticated user
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, subject, message, priority, status, created_at, updated_at
       FROM support_tickets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({ tickets: result.rows })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    res.status(500).json({ error: 'Failed to fetch support tickets' })
  }
})

// Get a single ticket by ID
router.get('/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, subject, message, priority, status, created_at, updated_at
       FROM support_tickets
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    res.json({ ticket: result.rows[0] })
  } catch (error) {
    console.error('Error fetching support ticket:', error)
    res.status(500).json({ error: 'Failed to fetch support ticket' })
  }
})

module.exports = router
