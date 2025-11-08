const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get all team members for the authenticated user
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    // Check user's plan (Business required)
    if (!req.isAdmin) {
      const userResult = await pool.query(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )

      const userPlan = userResult.rows[0]?.plan?.toLowerCase()
      if (userPlan !== 'business') {
        return res.status(403).json({ error: 'Business plan required for team access' })
      }
    }

    // Get team members
    const result = await pool.query(
      `SELECT id, email, role, status, invited_at, accepted_at
       FROM team_members
       WHERE owner_id = $1 AND status != 'removed'
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({ teamMembers: result.rows })
  } catch (error) {
    console.error('Error fetching team members:', error)
    res.status(500).json({ error: 'Failed to fetch team members' })
  }
})

// Invite a new team member
router.post('/members', authenticateToken, async (req, res) => {
  try {
    const { email, role } = req.body
    const userId = req.userId

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Check user's plan (Business required)
    if (!req.isAdmin) {
      const userResult = await pool.query(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )

      const userPlan = userResult.rows[0]?.plan?.toLowerCase()
      if (userPlan !== 'business') {
        return res.status(403).json({ error: 'Business plan required for team access' })
      }
    }

    // Check if already at limit (5 members max)
    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM team_members
       WHERE owner_id = $1 AND status != 'removed'`,
      [userId]
    )

    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: 'Maximum of 5 team members allowed' })
    }

    // Check if email already invited
    const existingResult = await pool.query(
      `SELECT id, status FROM team_members
       WHERE owner_id = $1 AND email = $2`,
      [userId, email]
    )

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0]
      if (existing.status !== 'removed') {
        return res.status(400).json({ error: 'This email has already been invited' })
      }

      // Reactivate removed member
      const result = await pool.query(
        `UPDATE team_members
         SET status = 'pending',
             role = $1,
             invited_at = NOW(),
             removed_at = NULL,
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, role, status, invited_at`,
        [role || 'member', existing.id]
      )

      return res.json({ teamMember: result.rows[0] })
    }

    // Insert new team member
    const result = await pool.query(
      `INSERT INTO team_members (owner_id, email, role, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, email, role, status, invited_at`,
      [userId, email, role || 'member']
    )

    res.json({ teamMember: result.rows[0] })
  } catch (error) {
    console.error('Error inviting team member:', error)
    res.status(500).json({ error: 'Failed to invite team member' })
  }
})

// Remove a team member
router.delete('/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    // Verify ownership
    const checkResult = await pool.query(
      'SELECT owner_id FROM team_members WHERE id = $1',
      [id]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    if (checkResult.rows[0].owner_id !== userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to remove this team member' })
    }

    // Mark as removed instead of deleting
    await pool.query(
      `UPDATE team_members
       SET status = 'removed',
           removed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [id]
    )

    res.json({ message: 'Team member removed successfully' })
  } catch (error) {
    console.error('Error removing team member:', error)
    res.status(500).json({ error: 'Failed to remove team member' })
  }
})

module.exports = router
