const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get all team members for the authenticated user
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, email, role, status, invited_at, joined_at, created_at, updated_at
       FROM team_members
       WHERE owner_user_id = $1
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Check user's plan (Business required) - bypass for admins
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

    // Check team member limit (5 max)
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM team_members WHERE owner_user_id = $1',
      [userId]
    )

    if (parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({ error: 'Maximum team member limit (5) reached' })
    }

    // Add team member
    const result = await pool.query(
      `INSERT INTO team_members (owner_user_id, email, role, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, email, role, status, invited_at, created_at`,
      [userId, email.toLowerCase(), role || 'member']
    )

    // TODO: In production, send invitation email here

    res.status(201).json({
      message: 'Team member invited successfully',
      teamMember: result.rows[0]
    })
  } catch (error) {
    console.error('Error inviting team member:', error)
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Team member already invited' })
    }
    res.status(500).json({ error: 'Failed to invite team member' })
  }
})

// Remove a team member
router.delete('/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    const result = await pool.query(
      'DELETE FROM team_members WHERE id = $1 AND owner_user_id = $2 RETURNING email',
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    res.json({ message: 'Team member removed successfully' })
  } catch (error) {
    console.error('Error removing team member:', error)
    res.status(500).json({ error: 'Failed to remove team member' })
  }
})

// Update team member role
router.patch('/members/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body
    const userId = req.userId

    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (admin or member)' })
    }

    const result = await pool.query(
      `UPDATE team_members
       SET role = $1, updated_at = NOW()
       WHERE id = $2 AND owner_user_id = $3
       RETURNING id, email, role, status, updated_at`,
      [role, id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found' })
    }

    res.json({
      message: 'Team member role updated successfully',
      teamMember: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating team member:', error)
    res.status(500).json({ error: 'Failed to update team member' })
  }
})

module.exports = router
