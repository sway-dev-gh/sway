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

// Helper function to log activity
const logActivity = async (userId, action, resourceType, resourceId, metadata = {}) => {
  try {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, resourceId, JSON.stringify(metadata)]
    )
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

// =====================================================
// GET /api/reviews - Get user's reviews (as reviewer and owner)
// =====================================================
router.get('/', authenticateToken, reviewLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { status, type = 'all' } = req.query

    let baseQuery = `
      SELECT
        r.id,
        r.title,
        r.status,
        r.priority,
        r.feedback,
        r.rating,
        r.due_date,
        r.requested_at,
        r.approved_at,
        r.completed_at,
        r.reviewer_id,
        r.assigned_by_id,

        -- Project info
        p.title as project_title,
        p.description as project_description,

        -- Request info
        fr.title as request_title,
        fr.short_code as request_code,

        -- Upload info
        u.file_name,
        u.file_size,
        u.uploaded_at,
        u.uploader_name,

        -- Reviewer info
        reviewer.name as reviewer_name,
        reviewer.email as reviewer_email,

        -- Assigner info
        assigner.name as assigned_by_name,
        assigner.email as assigned_by_email,

        -- Comment count
        (SELECT COUNT(*) FROM review_comments WHERE review_id = r.id) as comment_count

      FROM reviews r
      LEFT JOIN projects p ON r.project_id = p.id
      LEFT JOIN file_requests fr ON r.request_id = fr.id
      LEFT JOIN uploads u ON r.upload_id = u.id
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users assigner ON r.assigned_by_id = assigner.id
    `

    const queryParams = [userId]
    let whereConditions = []

    // Filter by type (reviews I need to do vs reviews I assigned)
    if (type === 'assigned_to_me') {
      whereConditions.push('r.reviewer_id = $1')
    } else if (type === 'assigned_by_me') {
      whereConditions.push('r.assigned_by_id = $1')
    } else {
      // All reviews where user is involved
      whereConditions.push('(r.reviewer_id = $1 OR r.assigned_by_id = $1)')
    }

    // Filter by status if provided
    if (status && ['pending', 'in_progress', 'approved', 'rejected', 'needs_changes'].includes(status)) {
      queryParams.push(status)
      whereConditions.push(`r.status = $${queryParams.length}`)
    }

    const finalQuery = `
      ${baseQuery}
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY r.requested_at DESC
      LIMIT 100
    `

    const result = await pool.query(finalQuery, queryParams)

    // Get review stats
    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE r.status = 'pending' AND r.reviewer_id = $1) as pending_reviews,
        COUNT(*) FILTER (WHERE r.status = 'approved' AND r.reviewer_id = $1) as approved_reviews,
        COUNT(*) FILTER (WHERE r.status = 'rejected' AND r.reviewer_id = $1) as rejected_reviews,
        COUNT(*) FILTER (WHERE r.assigned_by_id = $1) as reviews_assigned,
        COUNT(*) FILTER (WHERE r.reviewer_id = $1) as reviews_received,
        AVG(r.rating) FILTER (WHERE r.rating IS NOT NULL AND r.reviewer_id = $1) as avg_rating
      FROM reviews r
      WHERE (r.reviewer_id = $1 OR r.assigned_by_id = $1)
    `

    const statsResult = await pool.query(statsQuery, [userId])
    const stats = statsResult.rows[0]

    res.json({
      success: true,
      reviews: result.rows,
      stats: {
        pending_reviews: parseInt(stats.pending_reviews) || 0,
        approved_reviews: parseInt(stats.approved_reviews) || 0,
        rejected_reviews: parseInt(stats.rejected_reviews) || 0,
        reviews_assigned: parseInt(stats.reviews_assigned) || 0,
        reviews_received: parseInt(stats.reviews_received) || 0,
        avg_rating: parseFloat(stats.avg_rating) || 0,
        total_reviews: result.rows.length
      }
    })

  } catch (error) {
    console.error('Get reviews error:', error)
    res.status(500).json({
      error: 'Failed to fetch reviews',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/reviews - Create new review assignment
// =====================================================
router.post('/', authenticateToken, reviewLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      project_id,
      request_id,
      upload_id,
      reviewer_id,
      title,
      priority = 'medium',
      due_date,
      description
    } = req.body

    // Input validation
    if (!reviewer_id) {
      return res.status(400).json({ error: 'Reviewer ID is required' })
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Review title is required' })
    }

    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority level' })
    }

    // Validate reviewer exists and is not the same as assigner
    if (reviewer_id === userId) {
      return res.status(400).json({ error: 'You cannot assign a review to yourself' })
    }

    const reviewerQuery = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [reviewer_id])
    if (reviewerQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    const reviewer = reviewerQuery.rows[0]

    // Validate project ownership if project_id provided
    if (project_id) {
      const projectQuery = await pool.query(
        'SELECT title FROM projects WHERE id = $1 AND user_id = $2',
        [project_id, userId]
      )

      if (projectQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found or access denied' })
      }
    }

    // Validate request ownership if request_id provided
    if (request_id) {
      const requestQuery = await pool.query(
        'SELECT title FROM file_requests WHERE id = $1 AND user_id = $2',
        [request_id, userId]
      )

      if (requestQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Request not found or access denied' })
      }
    }

    // Create review
    const insertQuery = `
      INSERT INTO reviews
      (project_id, request_id, upload_id, reviewer_id, assigned_by_id, title, status, priority, due_date, review_data)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
      RETURNING id, requested_at
    `

    const reviewData = { description: description || '', assigned_note: 'Review requested' }

    const insertResult = await pool.query(insertQuery, [
      project_id || null,
      request_id || null,
      upload_id || null,
      reviewer_id,
      userId,
      title.trim(),
      priority,
      due_date || null,
      JSON.stringify(reviewData)
    ])

    const review = insertResult.rows[0]

    // Log activity for both users
    await logActivity(userId, 'review_assigned', 'review', review.id, {
      reviewer_id,
      reviewer_email: reviewer.email,
      title,
      priority,
      project_id,
      request_id
    })

    await logActivity(reviewer_id, 'review_received', 'review', review.id, {
      assigner_id: userId,
      title,
      priority,
      project_id,
      request_id
    })

    res.json({
      success: true,
      review: {
        id: review.id,
        title,
        status: 'pending',
        priority,
        reviewer: {
          id: reviewer.id,
          email: reviewer.email,
          name: reviewer.name
        },
        requested_at: review.requested_at,
        due_date
      },
      message: 'Review assignment created successfully'
    })

  } catch (error) {
    console.error('Create review error:', error)
    res.status(500).json({
      error: 'Failed to create review assignment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// PATCH /api/reviews/:reviewId - Update review (submit feedback, approve, etc.)
// =====================================================
router.patch('/:reviewId', authenticateToken, reviewLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const reviewId = req.params.reviewId
    const { status, feedback, rating } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID format' })
    }

    // Get review and verify permissions
    const reviewQuery = `
      SELECT * FROM reviews
      WHERE id = $1 AND (reviewer_id = $2 OR assigned_by_id = $2)
    `

    const reviewResult = await pool.query(reviewQuery, [reviewId, userId])

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or access denied' })
    }

    const review = reviewResult.rows[0]

    // Validate status transition
    const validStatuses = ['pending', 'in_progress', 'approved', 'rejected', 'needs_changes']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    // Build update query
    const updateFields = []
    const updateValues = []
    let paramCounter = 1

    if (status) {
      updateFields.push(`status = $${paramCounter}`)
      updateValues.push(status)
      paramCounter++

      // Set completion timestamp for final statuses
      if (['approved', 'rejected'].includes(status)) {
        updateFields.push(`completed_at = NOW()`)
      } else if (status === 'in_progress' && !review.started_at) {
        updateFields.push(`started_at = NOW()`)
      }
    }

    if (feedback) {
      updateFields.push(`feedback = $${paramCounter}`)
      updateValues.push(feedback.trim())
      paramCounter++
    }

    if (rating) {
      updateFields.push(`rating = $${paramCounter}`)
      updateValues.push(rating)
      paramCounter++
    }

    updateFields.push(`updated_at = NOW()`)

    if (updateFields.length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updateValues.push(reviewId)
    const updateQuery = `
      UPDATE reviews
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `

    const updateResult = await pool.query(updateQuery, updateValues)
    const updatedReview = updateResult.rows[0]

    // Log activity
    const actionMap = {
      'approved': 'review_approved',
      'rejected': 'review_rejected',
      'in_progress': 'review_started',
      'needs_changes': 'review_changes_requested'
    }

    const action = actionMap[status] || 'review_updated'
    await logActivity(userId, action, 'review', reviewId, {
      status,
      rating,
      has_feedback: !!feedback,
      review_title: review.title
    })

    res.json({
      success: true,
      review: updatedReview,
      message: 'Review updated successfully'
    })

  } catch (error) {
    console.error('Update review error:', error)
    res.status(500).json({
      error: 'Failed to update review',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// GET /api/reviews/:reviewId/comments - Get review comments
// =====================================================
router.get('/:reviewId/comments', authenticateToken, reviewLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const reviewId = req.params.reviewId

    // Verify review access
    const reviewQuery = `
      SELECT id FROM reviews
      WHERE id = $1 AND (reviewer_id = $2 OR assigned_by_id = $2)
    `

    const reviewResult = await pool.query(reviewQuery, [reviewId, userId])

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or access denied' })
    }

    // Get comments with threading
    const commentsQuery = `
      SELECT
        rc.*,
        u.name as user_name,
        u.email as user_email,
        resolver.name as resolved_by_name
      FROM review_comments rc
      JOIN users u ON rc.user_id = u.id
      LEFT JOIN users resolver ON rc.resolved_by_id = resolver.id
      WHERE rc.review_id = $1
      ORDER BY rc.created_at ASC
    `

    const commentsResult = await pool.query(commentsQuery, [reviewId])

    res.json({
      success: true,
      comments: commentsResult.rows
    })

  } catch (error) {
    console.error('Get review comments error:', error)
    res.status(500).json({
      error: 'Failed to fetch review comments',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/reviews/:reviewId/comments - Add review comment
// =====================================================
router.post('/:reviewId/comments', authenticateToken, reviewLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const reviewId = req.params.reviewId
    const { content, comment_type = 'comment', parent_id, metadata } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Comment content is required' })
    }

    // Verify review access
    const reviewQuery = `
      SELECT id FROM reviews
      WHERE id = $1 AND (reviewer_id = $2 OR assigned_by_id = $2)
    `

    const reviewResult = await pool.query(reviewQuery, [reviewId, userId])

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or access denied' })
    }

    // Create comment
    const insertQuery = `
      INSERT INTO review_comments
      (review_id, user_id, parent_id, content, comment_type, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at
    `

    const insertResult = await pool.query(insertQuery, [
      reviewId,
      userId,
      parent_id || null,
      content.trim(),
      comment_type,
      JSON.stringify(metadata || {})
    ])

    const comment = insertResult.rows[0]

    // Log activity
    await logActivity(userId, 'review_comment_added', 'review_comment', comment.id, {
      review_id: reviewId,
      comment_type,
      is_reply: !!parent_id
    })

    res.json({
      success: true,
      comment: {
        id: comment.id,
        content: content.trim(),
        comment_type,
        parent_id,
        created_at: comment.created_at
      },
      message: 'Comment added successfully'
    })

  } catch (error) {
    console.error('Add review comment error:', error)
    res.status(500).json({
      error: 'Failed to add comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router