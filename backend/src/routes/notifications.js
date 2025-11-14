/**
 * Comprehensive Notification System API
 * Handles notifications, real-time updates, and user preferences
 */

const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const Joi = require('joi')
const rateLimit = require('express-rate-limit')
const { authenticateToken } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

// Rate limiting for notification endpoints
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user to 200 requests per windowMs
  message: { error: 'Too many notification requests' },
  standardHeaders: true,
  legacyHeaders: false
})

// Validation schemas
const createNotificationSchema = Joi.object({
  recipient_id: Joi.string().uuid().required(),
  type: Joi.string().valid(
    'review_assigned',
    'review_completed',
    'comment_added',
    'file_uploaded',
    'project_shared',
    'collaboration_invite',
    'system_alert',
    'reminder'
  ).required(),
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(1000).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  action_url: Joi.string().uri({ allowRelative: true }).optional(),
  metadata: Joi.object().optional()
})

const updateNotificationSchema = Joi.object({
  is_read: Joi.boolean().optional(),
  is_dismissed: Joi.boolean().optional()
})

const notificationPreferencesSchema = Joi.object({
  email_notifications: Joi.boolean().default(true),
  push_notifications: Joi.boolean().default(true),
  notification_types: Joi.object({
    review_assigned: Joi.boolean().default(true),
    review_completed: Joi.boolean().default(true),
    comment_added: Joi.boolean().default(true),
    file_uploaded: Joi.boolean().default(true),
    project_shared: Joi.boolean().default(true),
    collaboration_invite: Joi.boolean().default(true),
    system_alert: Joi.boolean().default(true),
    reminder: Joi.boolean().default(true)
  }).default({})
})

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, notificationLimiter, asyncHandler(async (req, res) => {
  const userId = req.userId
  const {
    page = 1,
    limit = 50,
    type,
    is_read,
    priority,
    start_date,
    end_date
  } = req.query

  const offset = (page - 1) * limit

  let query = `
    SELECT
      n.id,
      n.type,
      n.title,
      n.message,
      n.priority,
      n.is_read,
      n.is_dismissed,
      n.action_url,
      n.metadata,
      n.created_at,
      n.updated_at,
      -- Sender info
      sender.email as sender_email,
      sender.first_name as sender_first_name,
      sender.last_name as sender_last_name
    FROM notifications n
    LEFT JOIN users sender ON n.sender_id = sender.id
    WHERE n.recipient_id = $1
  `

  const params = [userId]
  let paramIndex = 2

  // Add filters
  if (type) {
    query += ` AND n.type = $${paramIndex}`
    params.push(type)
    paramIndex++
  }

  if (is_read !== undefined) {
    query += ` AND n.is_read = $${paramIndex}`
    params.push(is_read === 'true')
    paramIndex++
  }

  if (priority) {
    query += ` AND n.priority = $${paramIndex}`
    params.push(priority)
    paramIndex++
  }

  if (start_date) {
    query += ` AND n.created_at >= $${paramIndex}`
    params.push(start_date)
    paramIndex++
  }

  if (end_date) {
    query += ` AND n.created_at <= $${paramIndex}`
    params.push(end_date)
    paramIndex++
  }

  // Don't show dismissed notifications unless specifically requested
  if (!req.query.include_dismissed) {
    query += ` AND n.is_dismissed = false`
  }

  query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(limit, offset)

  const result = await pool.query(query, params)

  // Get total count for pagination
  let countQuery = `
    SELECT COUNT(*) as total
    FROM notifications n
    WHERE n.recipient_id = $1
  `
  const countParams = [userId]
  let countParamIndex = 2

  // Apply same filters to count query
  if (type) {
    countQuery += ` AND n.type = $${countParamIndex}`
    countParams.push(type)
    countParamIndex++
  }

  if (is_read !== undefined) {
    countQuery += ` AND n.is_read = $${countParamIndex}`
    countParams.push(is_read === 'true')
    countParamIndex++
  }

  if (priority) {
    countQuery += ` AND n.priority = $${countParamIndex}`
    countParams.push(priority)
    countParamIndex++
  }

  if (start_date) {
    countQuery += ` AND n.created_at >= $${countParamIndex}`
    countParams.push(start_date)
    countParamIndex++
  }

  if (end_date) {
    countQuery += ` AND n.created_at <= $${countParamIndex}`
    countParams.push(end_date)
    countParamIndex++
  }

  if (!req.query.include_dismissed) {
    countQuery += ` AND n.is_dismissed = false`
  }

  const countResult = await pool.query(countQuery, countParams)
  const totalNotifications = parseInt(countResult.rows[0].total)

  // Get unread count
  const unreadResult = await pool.query(
    `SELECT COUNT(*) as unread_count
     FROM notifications
     WHERE recipient_id = $1 AND is_read = false AND is_dismissed = false`,
    [userId]
  )

  res.json({
    success: true,
    notifications: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalNotifications,
      pages: Math.ceil(totalNotifications / limit)
    },
    unread_count: parseInt(unreadResult.rows[0].unread_count)
  })
}))

// POST /api/notifications - Create a new notification
router.post('/', authenticateToken, notificationLimiter, asyncHandler(async (req, res) => {
  const { error, value } = createNotificationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    })
  }

  const {
    recipient_id,
    type,
    title,
    message,
    priority,
    action_url,
    metadata
  } = value

  const senderId = req.userId

  // Check if recipient exists and is not blocked
  const recipientCheck = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [recipient_id]
  )

  if (recipientCheck.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Recipient not found'
    })
  }

  // Create notification
  const notificationResult = await pool.query(
    `INSERT INTO notifications
     (recipient_id, sender_id, type, title, message, priority, action_url, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [recipient_id, senderId, type, title, message, priority, action_url, JSON.stringify(metadata)]
  )

  const notification = notificationResult.rows[0]

  // Log activity
  await pool.query(
    `INSERT INTO activity_logs
     (user_id, action, details, metadata)
     VALUES ($1, 'notification_sent', $2, $3)`,
    [
      senderId,
      `Sent ${type} notification to user`,
      JSON.stringify({
        notification_id: notification.id,
        recipient_id,
        type,
        title
      })
    ]
  )

  res.status(201).json({
    success: true,
    notification
  })
}))

// PUT /api/notifications/:id - Update notification (mark as read/dismissed)
router.put('/:id', authenticateToken, notificationLimiter, asyncHandler(async (req, res) => {
  const { error, value } = updateNotificationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    })
  }

  const notificationId = req.params.id
  const userId = req.userId
  const { is_read, is_dismissed } = value

  // Check if notification exists and belongs to user
  const notificationCheck = await pool.query(
    'SELECT id FROM notifications WHERE id = $1 AND recipient_id = $2',
    [notificationId, userId]
  )

  if (notificationCheck.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    })
  }

  // Build update query dynamically
  const updateFields = []
  const updateParams = []
  let paramIndex = 1

  if (is_read !== undefined) {
    updateFields.push(`is_read = $${paramIndex}`)
    updateParams.push(is_read)
    paramIndex++
  }

  if (is_dismissed !== undefined) {
    updateFields.push(`is_dismissed = $${paramIndex}`)
    updateParams.push(is_dismissed)
    paramIndex++
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid fields to update'
    })
  }

  updateFields.push(`updated_at = NOW()`)
  updateParams.push(notificationId)

  const updateQuery = `
    UPDATE notifications
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `

  const result = await pool.query(updateQuery, updateParams)

  res.json({
    success: true,
    notification: result.rows[0]
  })
}))

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', authenticateToken, notificationLimiter, asyncHandler(async (req, res) => {
  const userId = req.userId

  const result = await pool.query(
    `UPDATE notifications
     SET is_read = true, updated_at = NOW()
     WHERE recipient_id = $1 AND is_read = false
     RETURNING COUNT(*) as updated_count`,
    [userId]
  )

  res.json({
    success: true,
    message: 'All notifications marked as read',
    updated_count: result.rowCount
  })
}))

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticateToken, notificationLimiter, asyncHandler(async (req, res) => {
  const notificationId = req.params.id
  const userId = req.userId

  // Check if notification exists and belongs to user
  const notificationCheck = await pool.query(
    'SELECT id FROM notifications WHERE id = $1 AND recipient_id = $2',
    [notificationId, userId]
  )

  if (notificationCheck.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found'
    })
  }

  await pool.query(
    'DELETE FROM notifications WHERE id = $1',
    [notificationId]
  )

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  })
}))

// GET /api/notifications/preferences - Get user notification preferences
router.get('/preferences', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId

  const result = await pool.query(
    'SELECT notification_preferences FROM users WHERE id = $1',
    [userId]
  )

  const preferences = result.rows[0]?.notification_preferences || {}

  res.json({
    success: true,
    preferences
  })
}))

// PUT /api/notifications/preferences - Update user notification preferences
router.put('/preferences', authenticateToken, asyncHandler(async (req, res) => {
  const { error, value } = notificationPreferencesSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details[0].message
    })
  }

  const userId = req.userId

  await pool.query(
    'UPDATE users SET notification_preferences = $1 WHERE id = $2',
    [JSON.stringify(value), userId]
  )

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    preferences: value
  })
}))

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.userId

  const stats = await pool.query(`
    SELECT
      COUNT(*) as total_notifications,
      COUNT(*) FILTER (WHERE is_read = false) as unread_count,
      COUNT(*) FILTER (WHERE is_dismissed = true) as dismissed_count,
      COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
      COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h_count,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_week_count
    FROM notifications
    WHERE recipient_id = $1
  `, [userId])

  const typeStats = await pool.query(`
    SELECT
      type,
      COUNT(*) as count
    FROM notifications
    WHERE recipient_id = $1
    GROUP BY type
    ORDER BY count DESC
  `, [userId])

  res.json({
    success: true,
    stats: stats.rows[0],
    type_breakdown: typeStats.rows
  })
}))

/**
 * Helper function to create a notification (for use in other modules)
 * @param {string} recipientId - User ID of notification recipient
 * @param {string} senderId - User ID of notification sender (optional)
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} options - Optional parameters (priority, action_url, metadata)
 */
async function createNotification(recipientId, senderId, type, title, message, options = {}) {
  try {
    const {
      priority = 'medium',
      action_url = null,
      metadata = {}
    } = options

    const result = await pool.query(
      `INSERT INTO notifications
       (recipient_id, sender_id, type, title, message, priority, action_url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [recipientId, senderId, type, title, message, priority, action_url, JSON.stringify(metadata)]
    )

    return result.rows[0]
  } catch (error) {
    console.error('Create notification error:', error)
    throw error
  }
}

/**
 * Helper function to create bulk notifications
 * @param {Array} notifications - Array of notification objects
 */
async function createBulkNotifications(notifications) {
  try {
    if (!notifications || notifications.length === 0) return []

    const values = []
    const placeholders = []
    let paramIndex = 1

    for (let i = 0; i < notifications.length; i++) {
      const {
        recipient_id,
        sender_id,
        type,
        title,
        message,
        priority = 'medium',
        action_url = null,
        metadata = {}
      } = notifications[i]

      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`
      )

      values.push(
        recipient_id,
        sender_id,
        type,
        title,
        message,
        priority,
        action_url,
        JSON.stringify(metadata)
      )

      paramIndex += 8
    }

    const query = `
      INSERT INTO notifications
      (recipient_id, sender_id, type, title, message, priority, action_url, metadata)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `

    const result = await pool.query(query, values)
    return result.rows
  } catch (error) {
    console.error('Create bulk notifications error:', error)
    throw error
  }
}

module.exports = {
  router,
  createNotification,
  createBulkNotifications
}
