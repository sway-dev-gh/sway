const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')
const rateLimit = require('express-rate-limit')
const Joi = require('joi')
const { createNotification } = require('./notifications')

// Rate limiting for review operations
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many review requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Validation schemas
const createReviewSchema = Joi.object({
  project_id: Joi.string().uuid(),
  request_id: Joi.string().uuid(),
  upload_id: Joi.string().uuid(),
  reviewer_id: Joi.string().uuid().required(),
  title: Joi.string().max(255).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  due_date: Joi.date().iso().optional(),
  review_data: Joi.object().default({})
}).xor('project_id', 'request_id', 'upload_id') // Must have exactly one of these

const updateReviewSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'approved', 'rejected', 'needs_changes'),
  feedback: Joi.string().allow(''),
  rating: Joi.number().integer().min(1).max(5),
  review_data: Joi.object(),
  completed_at: Joi.date().iso()
})

const addCommentSchema = Joi.object({
  content: Joi.string().required().max(10000),
  comment_type: Joi.string().valid('comment', 'suggestion', 'approval', 'rejection').default('comment'),
  parent_id: Joi.string().uuid().optional(),
  metadata: Joi.object().default({})
})

// =====================================================
// GET /api/reviews - Get user's reviews (assigned to or created by)
// =====================================================
router.get('/', authenticateToken, reviewLimiter, asyncHandler(async (req, res) => {
  const userId = req.userId
  const { status, project_id, type = 'assigned' } = req.query

  let query = `
    SELECT
      r.id,
      r.title,
      r.status,
      r.priority,
      r.feedback,
      r.rating,
      r.due_date,
      r.started_at,
      r.completed_at,
      r.created_at,
      r.updated_at,

      -- Project info
      p.id as project_id,
      p.title as project_title,
      p.project_type,

      -- Request info
      fr.id as request_id,
      fr.title as request_title,

      -- Upload info
      u.id as upload_id,
      u.original_filename,

      -- Reviewer info
      reviewer.email as reviewer_email,
      reviewer.name as reviewer_name,

      -- Assigned by info
      assigner.email as assigned_by_email,
      assigner.name as assigned_by_name,

      -- Comment count
      (SELECT COUNT(*) FROM review_comments WHERE review_id = r.id) as comment_count

    FROM reviews r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN file_requests fr ON r.request_id = fr.id
    LEFT JOIN project_files u ON r.upload_id = u.id
    LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
    LEFT JOIN users assigner ON r.assigned_by_id = assigner.id
    WHERE 1=1
  `

  const params = []
  let paramIndex = 1

  // Filter by type (assigned to user vs created by user)
  if (type === 'assigned') {
    query += ` AND r.reviewer_id = $${paramIndex++}`
    params.push(userId)
  } else if (type === 'created') {
    query += ` AND r.assigned_by_id = $${paramIndex++}`
    params.push(userId)
  } else {
    // Both assigned to and created by
    query += ` AND (r.reviewer_id = $${paramIndex++} OR r.assigned_by_id = $${paramIndex++})`
    params.push(userId, userId)
  }

  // Filter by status
  if (status) {
    query += ` AND r.status = $${paramIndex++}`
    params.push(status)
  }

  // Filter by project
  if (project_id) {
    query += ` AND r.project_id = $${paramIndex++}`
    params.push(project_id)
  }

  query += ` ORDER BY r.created_at DESC`

  const result = await pool.query(query, params)

  res.json({
    success: true,
    reviews: result.rows,
    count: result.rows.length
  })
}))

// =====================================================
// GET /api/reviews/:reviewId - Get specific review details
// =====================================================
router.get('/:reviewId', authenticateToken, reviewLimiter, asyncHandler(async (req, res) => {
  const { reviewId } = req.params
  const userId = req.userId

  const query = `
    SELECT
      r.*,

      -- Project info
      p.title as project_title,
      p.description as project_description,
      p.project_type,

      -- Request info
      fr.title as request_title,
      fr.description as request_description,

      -- Upload info
      u.original_filename,
      u.file_size,
      u.storage_path,

      -- Reviewer info
      reviewer.email as reviewer_email,
      reviewer.name as reviewer_name,

      -- Assigned by info
      assigner.email as assigned_by_email,
      assigner.first_name as assigned_by_first_name,
      assigner.last_name as assigned_by_last_name

    FROM reviews r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN file_requests fr ON r.request_id = fr.id
    LEFT JOIN project_files u ON r.upload_id = u.id
    LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
    LEFT JOIN users assigner ON r.assigned_by_id = assigner.id
    WHERE r.id = $1
      AND (r.reviewer_id = $2 OR r.assigned_by_id = $2
           OR EXISTS (
             SELECT 1 FROM collaborations c
             WHERE (c.project_id = r.project_id OR c.request_id = r.request_id)
               AND c.collaborator_id = $2
               AND c.status = 'active'
           ))
  `

  const result = await pool.query(query, [reviewId, userId])

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Review not found or access denied'
    })
  }

  // Get comments for this review
  const commentsQuery = `
    SELECT
      rc.*,
      u.email as author_email,
      u.name as author_name,

      -- Reply count for threaded comments
      (SELECT COUNT(*) FROM review_comments WHERE parent_id = rc.id) as reply_count

    FROM review_comments rc
    LEFT JOIN users u ON rc.user_id = u.id
    WHERE rc.review_id = $1
    ORDER BY rc.created_at ASC
  `

  const commentsResult = await pool.query(commentsQuery, [reviewId])

  res.json({
    success: true,
    review: {
      ...result.rows[0],
      comments: commentsResult.rows
    }
  })
}))

// =====================================================
// POST /api/reviews - Create new review
// =====================================================
router.post('/', authenticateToken, reviewLimiter, asyncHandler(async (req, res) => {
  const userId = req.userId

  // Validate input
  const { error, value } = createReviewSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: error.details.map(d => d.message)
    })
  }

  const {
    project_id,
    request_id,
    upload_id,
    reviewer_id,
    title,
    priority,
    due_date,
    review_data
  } = value

  // Check if user has permission to create reviews for this resource
  let permissionQuery = ''
  let permissionParams = []

  if (project_id) {
    permissionQuery = `
      SELECT 1 FROM projects WHERE id = $1 AND user_id = $2
      UNION
      SELECT 1 FROM collaborations WHERE project_id = $1 AND collaborator_id = $2 AND status = 'active'
        AND (permissions->>'can_manage' = 'true' OR permissions->>'can_review' = 'true')
    `
    permissionParams = [project_id, userId]
  } else if (request_id) {
    permissionQuery = `
      SELECT 1 FROM file_requests WHERE id = $1 AND user_id = $2
      UNION
      SELECT 1 FROM collaborations WHERE request_id = $1 AND collaborator_id = $2 AND status = 'active'
        AND (permissions->>'can_manage' = 'true' OR permissions->>'can_review' = 'true')
    `
    permissionParams = [request_id, userId]
  }

  if (permissionQuery) {
    const permissionResult = await pool.query(permissionQuery, permissionParams)
    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied - you cannot create reviews for this resource'
      })
    }
  }

  // Create the review
  const insertQuery = `
    INSERT INTO reviews (
      project_id, request_id, upload_id, reviewer_id, assigned_by_id,
      title, status, priority, due_date, review_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
    RETURNING *
  `

  const insertParams = [
    project_id || null,
    request_id || null,
    upload_id || null,
    reviewer_id,
    userId,
    title,
    priority,
    due_date || null,
    JSON.stringify(review_data)
  ]

  const result = await pool.query(insertQuery, insertParams)
  const review = result.rows[0]

  // Log activity
  await pool.query(`
    INSERT INTO activity_log (user_id, actor_id, action, resource_type, resource_id, metadata)
    VALUES ($1, $2, 'review_assigned', 'review', $3, $4)
  `, [
    reviewer_id,
    userId,
    review.id,
    JSON.stringify({
      review_title: title,
      priority: priority,
      assigned_by: userId,
      due_date: due_date
    })
  ])

  // Create notification for review assignment
  try {
    await createNotification(
      reviewer_id,
      userId,
      'review_assigned',
      'New Review Assignment',
      `You have been assigned a new review: "${title}"`,
      {
        priority: priority === 'urgent' ? 'urgent' : priority === 'high' ? 'high' : 'medium',
        action_url: `/review/${review.id}`,
        metadata: {
          review_id: review.id,
          project_id,
          request_id,
          upload_id,
          due_date
        }
      }
    )
  } catch (notificationError) {
    console.error('Failed to create notification:', notificationError)
    // Don't fail the review creation if notification fails
  }

  res.status(201).json({
    success: true,
    review: review,
    message: 'Review created and assigned successfully'
  })
}))

// =====================================================
// PUT /api/reviews/:reviewId - Update review status/feedback
// =====================================================
router.put('/:reviewId', authenticateToken, reviewLimiter, asyncHandler(async (req, res) => {
  const { reviewId } = req.params
  const userId = req.userId

  // Validate input
  const { error, value } = updateReviewSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: error.details.map(d => d.message)
    })
  }

  const { status, feedback, rating, review_data, completed_at } = value

  // Check if user can update this review
  const permissionQuery = `
    SELECT r.*, p.user_id as project_owner_id, fr.user_id as request_owner_id
    FROM reviews r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN file_requests fr ON r.request_id = fr.id
    WHERE r.id = $1
      AND (r.reviewer_id = $2 OR r.assigned_by_id = $2 OR p.user_id = $2 OR fr.user_id = $2)
  `

  const permissionResult = await pool.query(permissionQuery, [reviewId, userId])

  if (permissionResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Review not found or access denied'
    })
  }

  // Build update query dynamically
  const updates = []
  const params = []
  let paramIndex = 1

  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`)
    params.push(status)

    // Auto-set timestamps based on status
    if (status === 'in_progress' && !permissionResult.rows[0].started_at) {
      updates.push(`started_at = NOW()`)
    }
    if (['approved', 'rejected', 'needs_changes'].includes(status)) {
      updates.push(`completed_at = NOW()`)
    }
  }

  if (feedback !== undefined) {
    updates.push(`feedback = $${paramIndex++}`)
    params.push(feedback)
  }

  if (rating !== undefined) {
    updates.push(`rating = $${paramIndex++}`)
    params.push(rating)
  }

  if (review_data !== undefined) {
    updates.push(`review_data = $${paramIndex++}`)
    params.push(JSON.stringify(review_data))
  }

  if (completed_at !== undefined) {
    updates.push(`completed_at = $${paramIndex++}`)
    params.push(completed_at)
  }

  if (updates.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid fields to update'
    })
  }

  const updateQuery = `
    UPDATE reviews
    SET ${updates.join(', ')}, updated_at = NOW()
    WHERE id = $${paramIndex}
    RETURNING *
  `

  params.push(reviewId)
  const result = await pool.query(updateQuery, params)

  // Log activity
  await pool.query(`
    INSERT INTO activity_log (user_id, actor_id, action, resource_type, resource_id, metadata)
    VALUES ($1, $2, 'review_updated', 'review', $3, $4)
  `, [
    permissionResult.rows[0].reviewer_id,
    userId,
    reviewId,
    JSON.stringify({
      status: status,
      updated_by: userId,
      has_feedback: !!feedback,
      rating: rating
    })
  ])

  // Create notification for significant status changes
  if (status && ['approved', 'rejected', 'needs_changes', 'completed'].includes(status)) {
    try {
      const reviewData = permissionResult.rows[0]
      const assignedByUserId = reviewData.assigned_by_id

      if (assignedByUserId && assignedByUserId !== userId) {
        let notificationTitle = 'Review Update'
        let notificationMessage = ''
        let notificationPriority = 'medium'

        switch (status) {
          case 'approved':
            notificationTitle = 'Review Approved'
            notificationMessage = `Review "${reviewData.title}" has been approved`
            notificationPriority = 'medium'
            break
          case 'rejected':
            notificationTitle = 'Review Rejected'
            notificationMessage = `Review "${reviewData.title}" has been rejected`
            notificationPriority = 'high'
            break
          case 'needs_changes':
            notificationTitle = 'Review Needs Changes'
            notificationMessage = `Review "${reviewData.title}" needs changes`
            notificationPriority = 'medium'
            break
          case 'completed':
            notificationTitle = 'Review Completed'
            notificationMessage = `Review "${reviewData.title}" has been completed`
            notificationPriority = 'medium'
            break
        }

        await createNotification(
          assignedByUserId,
          userId,
          'review_completed',
          notificationTitle,
          notificationMessage,
          {
            priority: notificationPriority,
            action_url: `/review/${reviewId}`,
            metadata: {
              review_id: reviewId,
              status: status,
              rating: rating,
              has_feedback: !!feedback
            }
          }
        )
      }
    } catch (notificationError) {
      console.error('Failed to create review update notification:', notificationError)
    }
  }

  res.json({
    success: true,
    review: result.rows[0],
    message: 'Review updated successfully'
  })
}))

// =====================================================
// POST /api/reviews/:reviewId/comments - Add comment to review
// =====================================================
router.post('/:reviewId/comments', authenticateToken, reviewLimiter, asyncHandler(async (req, res) => {
  const { reviewId } = req.params
  const userId = req.userId

  // Validate input
  const { error, value } = addCommentSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: error.details.map(d => d.message)
    })
  }

  const { content, comment_type, parent_id, metadata } = value

  // Check if review exists and user has access
  const reviewQuery = `
    SELECT r.* FROM reviews r
    WHERE r.id = $1
      AND (r.reviewer_id = $2 OR r.assigned_by_id = $2
           OR EXISTS (
             SELECT 1 FROM collaborations c
             WHERE (c.project_id = r.project_id OR c.request_id = r.request_id)
               AND c.collaborator_id = $2
               AND c.status = 'active'
           ))
  `

  const reviewResult = await pool.query(reviewQuery, [reviewId, userId])

  if (reviewResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Review not found or access denied'
    })
  }

  // Add the comment
  const insertQuery = `
    INSERT INTO review_comments (review_id, user_id, parent_id, content, comment_type, metadata)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `

  const result = await pool.query(insertQuery, [
    reviewId,
    userId,
    parent_id || null,
    content,
    comment_type,
    JSON.stringify(metadata)
  ])

  const comment = result.rows[0]

  // Get comment with author info
  const commentWithAuthor = await pool.query(`
    SELECT
      rc.*,
      u.email as author_email,
      u.first_name as author_first_name,
      u.last_name as author_last_name
    FROM review_comments rc
    LEFT JOIN users u ON rc.user_id = u.id
    WHERE rc.id = $1
  `, [comment.id])

  // Log activity
  await pool.query(`
    INSERT INTO activity_log (user_id, actor_id, action, resource_type, resource_id, metadata)
    VALUES ($1, $2, 'comment_added', 'review_comment', $3, $4)
  `, [
    reviewResult.rows[0].reviewer_id,
    userId,
    comment.id,
    JSON.stringify({
      review_id: reviewId,
      comment_type: comment_type,
      is_reply: !!parent_id,
      content_length: content.length
    })
  ])

  // Create notification for comment addition
  try {
    const reviewData = reviewResult.rows[0]
    const reviewerUserId = reviewData.reviewer_id
    const assignedByUserId = reviewData.assigned_by_id

    // Notify reviewer if comment is from assignee
    if (reviewerUserId && reviewerUserId !== userId) {
      await createNotification(
        reviewerUserId,
        userId,
        'comment_added',
        'New Comment on Review',
        `A new comment was added to review: "${reviewData.title}"`,
        {
          priority: parent_id ? 'low' : 'medium', // Replies are lower priority
          action_url: `/review/${reviewId}#comment-${comment.id}`,
          metadata: {
            review_id: reviewId,
            comment_id: comment.id,
            comment_type: comment_type,
            is_reply: !!parent_id
          }
        }
      )
    }

    // Notify assignee if comment is from reviewer
    if (assignedByUserId && assignedByUserId !== userId && assignedByUserId !== reviewerUserId) {
      await createNotification(
        assignedByUserId,
        userId,
        'comment_added',
        'New Comment on Review',
        `A new comment was added to review: "${reviewData.title}"`,
        {
          priority: parent_id ? 'low' : 'medium',
          action_url: `/review/${reviewId}#comment-${comment.id}`,
          metadata: {
            review_id: reviewId,
            comment_id: comment.id,
            comment_type: comment_type,
            is_reply: !!parent_id
          }
        }
      )
    }

    // If it's a reply, notify the parent comment author
    if (parent_id) {
      const parentCommentResult = await pool.query(
        'SELECT user_id FROM review_comments WHERE id = $1',
        [parent_id]
      )

      if (parentCommentResult.rows.length > 0) {
        const parentAuthorId = parentCommentResult.rows[0].user_id

        if (parentAuthorId !== userId) {
          await createNotification(
            parentAuthorId,
            userId,
            'comment_added',
            'Reply to Your Comment',
            `Someone replied to your comment on review: "${reviewData.title}"`,
            {
              priority: 'medium',
              action_url: `/review/${reviewId}#comment-${comment.id}`,
              metadata: {
                review_id: reviewId,
                comment_id: comment.id,
                parent_comment_id: parent_id,
                comment_type: comment_type
              }
            }
          )
        }
      }
    }
  } catch (notificationError) {
    console.error('Failed to create comment notification:', notificationError)
  }

  res.status(201).json({
    success: true,
    comment: commentWithAuthor.rows[0],
    message: 'Comment added successfully'
  })
}))

// =====================================================
// GET /api/reviews/:reviewId/comments - Get review comments
// =====================================================
router.get('/:reviewId/comments', authenticateToken, reviewLimiter, asyncHandler(async (req, res) => {
  const { reviewId } = req.params
  const userId = req.userId

  // Check if user has access to review
  const reviewQuery = `
    SELECT 1 FROM reviews r
    WHERE r.id = $1
      AND (r.reviewer_id = $2 OR r.assigned_by_id = $2
           OR EXISTS (
             SELECT 1 FROM collaborations c
             WHERE (c.project_id = r.project_id OR c.request_id = r.request_id)
               AND c.collaborator_id = $2
               AND c.status = 'active'
           ))
  `

  const reviewResult = await pool.query(reviewQuery, [reviewId, userId])

  if (reviewResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Review not found or access denied'
    })
  }

  // Get comments with author info and threading structure
  const query = `
    WITH RECURSIVE comment_tree AS (
      -- Root comments
      SELECT
        rc.*,
        u.email as author_email,
        u.name as author_name,
        0 as depth,
        ARRAY[rc.created_at] as path
      FROM review_comments rc
      LEFT JOIN users u ON rc.user_id = u.id
      WHERE rc.review_id = $1 AND rc.parent_id IS NULL

      UNION ALL

      -- Child comments
      SELECT
        rc.*,
        u.email as author_email,
        u.name as author_name,
        ct.depth + 1,
        ct.path || rc.created_at
      FROM review_comments rc
      LEFT JOIN users u ON rc.user_id = u.id
      JOIN comment_tree ct ON rc.parent_id = ct.id
      WHERE ct.depth < 5  -- Limit nesting to 5 levels
    )
    SELECT * FROM comment_tree
    ORDER BY path
  `

  const result = await pool.query(query, [reviewId])

  res.json({
    success: true,
    comments: result.rows,
    count: result.rows.length
  })
}))

// =====================================================
// DELETE /api/reviews/:reviewId - Delete review (soft delete)
// =====================================================
router.delete('/:reviewId', authenticateToken, reviewLimiter, asyncHandler(async (req, res) => {
  const { reviewId } = req.params
  const userId = req.userId

  // Check if user can delete this review (only creator or owner)
  const permissionQuery = `
    SELECT r.*, p.user_id as project_owner_id, fr.user_id as request_owner_id
    FROM reviews r
    LEFT JOIN projects p ON r.project_id = p.id
    LEFT JOIN file_requests fr ON r.request_id = fr.id
    WHERE r.id = $1
      AND (r.assigned_by_id = $2 OR p.user_id = $2 OR fr.user_id = $2)
  `

  const result = await pool.query(permissionQuery, [reviewId, userId])

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Review not found or permission denied'
    })
  }

  // Soft delete by updating status
  await pool.query(`
    UPDATE reviews
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1
  `, [reviewId])

  // Log activity
  await pool.query(`
    INSERT INTO activity_log (user_id, actor_id, action, resource_type, resource_id, metadata)
    VALUES ($1, $2, 'review_cancelled', 'review', $3, $4)
  `, [
    result.rows[0].reviewer_id,
    userId,
    reviewId,
    JSON.stringify({
      cancelled_by: userId,
      original_status: result.rows[0].status
    })
  ])

  res.json({
    success: true,
    message: 'Review cancelled successfully'
  })
}))

module.exports = router