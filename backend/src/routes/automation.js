const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')

// Rate limiter for automation operations
const automationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 automation requests per 15 minutes
  message: { error: 'Too many automation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Create automation rule
router.post('/rules', authenticateToken, automationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { name, trigger, action, enabled = true } = req.body

    if (!name || !trigger || !action) {
      return res.status(400).json({ error: 'Rule name, trigger, and action are required' })
    }

    // Validate trigger types
    const validTriggers = [
      'file_change',
      'review_requested',
      'project_created',
      'team_member_added',
      'approval_received',
      'comment_added'
    ]

    if (!validTriggers.includes(trigger)) {
      return res.status(400).json({ error: 'Invalid trigger type' })
    }

    // Validate action types
    const validActions = [
      'auto_approve',
      'notify_team',
      'assign_reviewer',
      'send_email',
      'create_task',
      'archive_project'
    ]

    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action type' })
    }

    // Create automation rule
    const result = await pool.query(
      `INSERT INTO automation_rules (user_id, name, trigger_type, action_type, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [userId, name.trim(), trigger, action, enabled]
    )

    res.json({
      success: true,
      rule: result.rows[0],
      message: 'Automation rule created successfully'
    })

  } catch (error) {
    console.error('Create automation rule error:', error)

    // Handle unique constraint violation (duplicate rule name for user)
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Rule with this name already exists' })
    }

    res.status(500).json({ error: 'Failed to create automation rule' })
  }
})

// Get user's automation rules
router.get('/rules', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, name, trigger_type, action_type, enabled, created_at, updated_at
       FROM automation_rules
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({
      success: true,
      rules: result.rows
    })

  } catch (error) {
    console.error('Get automation rules error:', error)
    res.status(500).json({ error: 'Failed to get automation rules' })
  }
})

// Update automation rule
router.put('/rules/:ruleId', authenticateToken, automationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const ruleId = req.params.ruleId
    const { name, trigger, action, enabled } = req.body

    // Verify rule ownership
    const ownershipResult = await pool.query(
      'SELECT id FROM automation_rules WHERE id = $1 AND user_id = $2',
      [ruleId, userId]
    )

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Automation rule not found' })
    }

    // Build dynamic update query
    let updateQuery = 'UPDATE automation_rules SET updated_at = NOW()'
    const queryParams = []
    let paramIndex = 1

    if (name) {
      updateQuery += `, name = $${paramIndex}`
      queryParams.push(name.trim())
      paramIndex++
    }

    if (trigger) {
      updateQuery += `, trigger_type = $${paramIndex}`
      queryParams.push(trigger)
      paramIndex++
    }

    if (action) {
      updateQuery += `, action_type = $${paramIndex}`
      queryParams.push(action)
      paramIndex++
    }

    if (enabled !== undefined) {
      updateQuery += `, enabled = $${paramIndex}`
      queryParams.push(enabled)
      paramIndex++
    }

    updateQuery += ` WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`
    queryParams.push(ruleId, userId)

    const result = await pool.query(updateQuery, queryParams)

    res.json({
      success: true,
      rule: result.rows[0],
      message: 'Automation rule updated successfully'
    })

  } catch (error) {
    console.error('Update automation rule error:', error)
    res.status(500).json({ error: 'Failed to update automation rule' })
  }
})

// Delete automation rule
router.delete('/rules/:ruleId', authenticateToken, automationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const ruleId = req.params.ruleId

    const result = await pool.query(
      'DELETE FROM automation_rules WHERE id = $1 AND user_id = $2 RETURNING id',
      [ruleId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Automation rule not found' })
    }

    res.json({
      success: true,
      message: 'Automation rule deleted successfully'
    })

  } catch (error) {
    console.error('Delete automation rule error:', error)
    res.status(500).json({ error: 'Failed to delete automation rule' })
  }
})

// Execute automation (for testing purposes)
router.post('/rules/:ruleId/execute', authenticateToken, automationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const ruleId = req.params.ruleId

    // Get the rule
    const ruleResult = await pool.query(
      'SELECT * FROM automation_rules WHERE id = $1 AND user_id = $2 AND enabled = true',
      [ruleId, userId]
    )

    if (ruleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Automation rule not found or disabled' })
    }

    const rule = ruleResult.rows[0]

    // Simulate rule execution
    console.log(`Executing automation rule: ${rule.name}`)
    console.log(`Trigger: ${rule.trigger_type}, Action: ${rule.action_type}`)

    // Log the execution
    await pool.query(
      `INSERT INTO automation_log (rule_id, user_id, execution_result, executed_at)
       VALUES ($1, $2, $3, NOW())`,
      [ruleId, userId, JSON.stringify({ status: 'success', message: 'Rule executed successfully in test mode' })]
    )

    res.json({
      success: true,
      message: `Automation rule "${rule.name}" executed successfully`,
      execution: {
        rule: rule.name,
        trigger: rule.trigger_type,
        action: rule.action_type,
        result: 'Test execution completed'
      }
    })

  } catch (error) {
    console.error('Execute automation rule error:', error)
    res.status(500).json({ error: 'Failed to execute automation rule' })
  }
})

module.exports = router