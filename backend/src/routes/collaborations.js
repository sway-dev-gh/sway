const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')

// Rate limiting for collaboration operations
const collaborationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many collaboration requests. Please try again later.' },
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
// GET /api/collaborations - Get user's collaborations
// =====================================================
router.get('/', authenticateToken, collaborationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { status, role, type = 'all' } = req.query

    // Get collaborations where user is owner (they started)
    let ownedCollaborationsQuery = `
      SELECT
        c.*,
        collaborator.name as collaborator_name,
        collaborator.email as collaborator_email,
        p.title as project_title,
        p.description as project_description,
        p.project_type,
        fr.title as request_title,
        fr.short_code as request_code,
        COUNT(DISTINCT r.id) as pending_reviews,
        COUNT(DISTINCT pf.id) as shared_files
      FROM collaborations c
      JOIN users collaborator ON c.collaborator_id = collaborator.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN file_requests fr ON c.request_id = fr.id
      LEFT JOIN reviews r ON (r.project_id = p.id OR r.request_id = fr.id) AND r.status = 'pending'
      LEFT JOIN project_files pf ON pf.project_id = p.id
      WHERE c.owner_id = $1
    `

    // Get collaborations where user is collaborator (they were invited)
    let memberCollaborationsQuery = `
      SELECT
        c.*,
        owner.name as owner_name,
        owner.email as owner_email,
        p.title as project_title,
        p.description as project_description,
        p.project_type,
        fr.title as request_title,
        fr.short_code as request_code,
        COUNT(DISTINCT r.id) as pending_reviews,
        COUNT(DISTINCT pf.id) as shared_files
      FROM collaborations c
      JOIN users owner ON c.owner_id = owner.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN file_requests fr ON c.request_id = fr.id
      LEFT JOIN reviews r ON (r.project_id = p.id OR r.request_id = fr.id) AND r.status = 'pending'
      LEFT JOIN project_files pf ON pf.project_id = p.id
      WHERE c.collaborator_id = $1
    `

    const queryParams = [userId]
    const conditions = []

    // Apply filters
    if (status && ['pending', 'active', 'paused', 'ended'].includes(status)) {
      conditions.push(`c.status = $${queryParams.length + 1}`)
      queryParams.push(status)
    }

    if (role && ['viewer', 'editor', 'reviewer', 'owner'].includes(role)) {
      conditions.push(`c.role = $${queryParams.length + 1}`)
      queryParams.push(role)
    }

    // Add conditions to queries
    if (conditions.length > 0) {
      const conditionString = ` AND ${conditions.join(' AND ')}`
      ownedCollaborationsQuery += conditionString
      memberCollaborationsQuery += conditionString
    }

    // Add GROUP BY and ORDER BY
    ownedCollaborationsQuery += `
      GROUP BY c.id, collaborator.name, collaborator.email, p.title, p.description, p.project_type, fr.title, fr.short_code
      ORDER BY c.last_activity_at DESC
    `

    memberCollaborationsQuery += `
      GROUP BY c.id, owner.name, owner.email, p.title, p.description, p.project_type, fr.title, fr.short_code
      ORDER BY c.last_activity_at DESC
    `

    let collaborationsResult = { owned: [], member_of: [] }

    if (type === 'owned') {
      const ownedResult = await pool.query(ownedCollaborationsQuery, queryParams)
      collaborationsResult.owned = ownedResult.rows
    } else if (type === 'member_of') {
      const memberResult = await pool.query(memberCollaborationsQuery, queryParams)
      collaborationsResult.member_of = memberResult.rows
    } else {
      // Get both
      const [ownedResult, memberResult] = await Promise.all([
        pool.query(ownedCollaborationsQuery, queryParams),
        pool.query(memberCollaborationsQuery, queryParams)
      ])
      collaborationsResult.owned = ownedResult.rows
      collaborationsResult.member_of = memberResult.rows
    }

    // Get collaboration stats
    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE c.owner_id = $1 AND c.status = 'active') as owned_active,
        COUNT(*) FILTER (WHERE c.collaborator_id = $1 AND c.status = 'active') as member_active,
        COUNT(*) FILTER (WHERE c.owner_id = $1 AND c.status = 'pending') as owned_pending,
        COUNT(*) FILTER (WHERE c.collaborator_id = $1 AND c.status = 'pending') as member_pending,
        COUNT(*) FILTER (WHERE c.owner_id = $1) as total_owned,
        COUNT(*) FILTER (WHERE c.collaborator_id = $1) as total_member_of
      FROM collaborations c
      WHERE (c.owner_id = $1 OR c.collaborator_id = $1)
    `

    const statsResult = await pool.query(statsQuery, [userId])
    const stats = statsResult.rows[0]

    res.json({
      success: true,
      collaborations: collaborationsResult,
      stats: {
        owned_active: parseInt(stats.owned_active) || 0,
        member_active: parseInt(stats.member_active) || 0,
        owned_pending: parseInt(stats.owned_pending) || 0,
        member_pending: parseInt(stats.member_pending) || 0,
        total_owned: parseInt(stats.total_owned) || 0,
        total_member_of: parseInt(stats.total_member_of) || 0,
        total_collaborations: (collaborationsResult.owned?.length || 0) + (collaborationsResult.member_of?.length || 0)
      }
    })

  } catch (error) {
    console.error('Get collaborations error:', error)
    res.status(500).json({
      error: 'Failed to fetch collaborations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/collaborations - Create new collaboration
// =====================================================
router.post('/', authenticateToken, collaborationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      project_id,
      request_id,
      collaborator_id,
      role = 'viewer',
      permissions,
      message
    } = req.body

    // Input validation
    if (!collaborator_id) {
      return res.status(400).json({ error: 'Collaborator ID is required' })
    }

    if (!['viewer', 'editor', 'reviewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be viewer, editor, or reviewer' })
    }

    if (!project_id && !request_id) {
      return res.status(400).json({ error: 'Either project_id or request_id is required' })
    }

    // Cannot collaborate with yourself
    if (collaborator_id === userId) {
      return res.status(400).json({ error: 'You cannot collaborate with yourself' })
    }

    // Verify collaborator exists
    const collaboratorQuery = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [collaborator_id])
    if (collaboratorQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Collaborator not found' })
    }
    const collaborator = collaboratorQuery.rows[0]

    // Verify project/request ownership
    if (project_id) {
      const projectQuery = await pool.query(
        'SELECT title FROM projects WHERE id = $1 AND user_id = $2',
        [project_id, userId]
      )
      if (projectQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found or access denied' })
      }
    }

    if (request_id) {
      const requestQuery = await pool.query(
        'SELECT title FROM file_requests WHERE id = $1 AND user_id = $2',
        [request_id, userId]
      )
      if (requestQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Request not found or access denied' })
      }
    }

    // Check if collaboration already exists
    const existingQuery = `
      SELECT id FROM collaborations
      WHERE owner_id = $1 AND collaborator_id = $2
      AND (project_id = $3 OR request_id = $4)
      AND status != 'ended'
    `
    const existing = await pool.query(existingQuery, [userId, collaborator_id, project_id, request_id])

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Collaboration already exists' })
    }

    // Set default permissions based on role
    const defaultPermissions = {
      viewer: { can_view: true, can_edit: false, can_review: false, can_invite: false, can_manage: false },
      editor: { can_view: true, can_edit: true, can_review: false, can_invite: false, can_manage: false },
      reviewer: { can_view: true, can_edit: false, can_review: true, can_invite: false, can_manage: false }
    }

    const finalPermissions = permissions || defaultPermissions[role]

    // Create collaboration
    const insertQuery = `
      INSERT INTO collaborations
      (owner_id, collaborator_id, project_id, request_id, role, permissions, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING id, created_at
    `

    const insertResult = await pool.query(insertQuery, [
      userId,
      collaborator_id,
      project_id || null,
      request_id || null,
      role,
      JSON.stringify(finalPermissions)
    ])

    const collaboration = insertResult.rows[0]

    // Log activity
    await logActivity(userId, 'collaboration_created', 'collaboration', collaboration.id, {
      collaborator_id,
      collaborator_email: collaborator.email,
      role,
      project_id,
      request_id,
      message
    })

    await logActivity(collaborator_id, 'collaboration_invited', 'collaboration', collaboration.id, {
      owner_id: userId,
      role,
      project_id,
      request_id
    })

    res.json({
      success: true,
      collaboration: {
        id: collaboration.id,
        collaborator: {
          id: collaborator.id,
          email: collaborator.email,
          name: collaborator.name
        },
        role,
        permissions: finalPermissions,
        status: 'active',
        created_at: collaboration.created_at
      },
      message: 'Collaboration created successfully'
    })

  } catch (error) {
    console.error('Create collaboration error:', error)
    res.status(500).json({
      error: 'Failed to create collaboration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// PATCH /api/collaborations/:collaborationId - Update collaboration
// =====================================================
router.patch('/:collaborationId', authenticateToken, collaborationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const collaborationId = req.params.collaborationId
    const { role, permissions, status } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(collaborationId)) {
      return res.status(400).json({ error: 'Invalid collaboration ID format' })
    }

    // Get collaboration and verify permissions
    const collaborationQuery = `
      SELECT * FROM collaborations
      WHERE id = $1 AND owner_id = $2
    `
    const collaborationResult = await pool.query(collaborationQuery, [collaborationId, userId])

    if (collaborationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collaboration not found or access denied' })
    }

    const collaboration = collaborationResult.rows[0]

    // Build update query
    const updateFields = []
    const updateValues = []
    let paramCounter = 1

    if (role && ['viewer', 'editor', 'reviewer'].includes(role)) {
      updateFields.push(`role = $${paramCounter}`)
      updateValues.push(role)
      paramCounter++
    }

    if (permissions) {
      updateFields.push(`permissions = $${paramCounter}`)
      updateValues.push(JSON.stringify(permissions))
      paramCounter++
    }

    if (status && ['active', 'paused', 'ended'].includes(status)) {
      updateFields.push(`status = $${paramCounter}`)
      updateValues.push(status)
      paramCounter++
    }

    updateFields.push(`updated_at = NOW()`)
    updateFields.push(`last_activity_at = NOW()`)

    if (updateFields.length === 2) { // Only timestamps
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updateValues.push(collaborationId)
    const updateQuery = `
      UPDATE collaborations
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `

    const updateResult = await pool.query(updateQuery, updateValues)
    const updatedCollaboration = updateResult.rows[0]

    // Log activity
    const actionMap = {
      'active': 'collaboration_activated',
      'paused': 'collaboration_paused',
      'ended': 'collaboration_ended'
    }

    const action = (status && actionMap[status]) || 'collaboration_updated'
    await logActivity(userId, action, 'collaboration', collaborationId, {
      collaborator_id: collaboration.collaborator_id,
      role: role || collaboration.role,
      status: status || collaboration.status,
      permissions_updated: !!permissions
    })

    res.json({
      success: true,
      collaboration: updatedCollaboration,
      message: 'Collaboration updated successfully'
    })

  } catch (error) {
    console.error('Update collaboration error:', error)
    res.status(500).json({
      error: 'Failed to update collaboration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// DELETE /api/collaborations/:collaborationId - End collaboration
// =====================================================
router.delete('/:collaborationId', authenticateToken, collaborationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const collaborationId = req.params.collaborationId

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(collaborationId)) {
      return res.status(400).json({ error: 'Invalid collaboration ID format' })
    }

    // Check if collaboration exists and user has permission
    const collaborationQuery = `
      SELECT * FROM collaborations
      WHERE id = $1 AND (owner_id = $2 OR collaborator_id = $2) AND status != 'ended'
    `
    const collaborationResult = await pool.query(collaborationQuery, [collaborationId, userId])

    if (collaborationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collaboration not found or already ended' })
    }

    const collaboration = collaborationResult.rows[0]

    // End the collaboration
    await pool.query(
      'UPDATE collaborations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['ended', collaborationId]
    )

    // Log activity for both users
    await logActivity(userId, 'collaboration_ended', 'collaboration', collaborationId, {
      ended_by: userId,
      collaborator_id: collaboration.collaborator_id,
      owner_id: collaboration.owner_id
    })

    const otherUserId = collaboration.owner_id === userId ? collaboration.collaborator_id : collaboration.owner_id
    await logActivity(otherUserId, 'collaboration_ended', 'collaboration', collaborationId, {
      ended_by: userId,
      collaborator_id: collaboration.collaborator_id,
      owner_id: collaboration.owner_id
    })

    res.json({
      success: true,
      message: 'Collaboration ended successfully'
    })

  } catch (error) {
    console.error('Delete collaboration error:', error)
    res.status(500).json({
      error: 'Failed to end collaboration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// GET /api/collaborations/:collaborationId - Get specific collaboration details
// =====================================================
router.get('/:collaborationId', authenticateToken, collaborationLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const collaborationId = req.params.collaborationId

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(collaborationId)) {
      return res.status(400).json({ error: 'Invalid collaboration ID format' })
    }

    // Get collaboration with access check
    const collaborationQuery = `
      SELECT
        c.*,
        owner.name as owner_name,
        owner.email as owner_email,
        collaborator.name as collaborator_name,
        collaborator.email as collaborator_email,
        p.title as project_title,
        p.description as project_description,
        fr.title as request_title,
        fr.short_code as request_code
      FROM collaborations c
      JOIN users owner ON c.owner_id = owner.id
      JOIN users collaborator ON c.collaborator_id = collaborator.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN file_requests fr ON c.request_id = fr.id
      WHERE c.id = $1 AND (c.owner_id = $2 OR c.collaborator_id = $2)
    `

    const collaborationResult = await pool.query(collaborationQuery, [collaborationId, userId])

    if (collaborationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collaboration not found or access denied' })
    }

    const collaboration = collaborationResult.rows[0]

    // Get recent activity for this collaboration
    const activityQuery = `
      SELECT
        a.*,
        u.name as user_name
      FROM activity_log a
      JOIN users u ON a.user_id = u.id
      WHERE a.resource_id = $1 AND a.resource_type = 'collaboration'
      ORDER BY a.created_at DESC
      LIMIT 20
    `

    const activityResult = await pool.query(activityQuery, [collaborationId])

    res.json({
      success: true,
      collaboration: {
        ...collaboration,
        recent_activity: activityResult.rows,
        my_role: collaboration.owner_id === userId ? 'owner' : 'collaborator'
      }
    })

  } catch (error) {
    console.error('Get collaboration details error:', error)
    res.status(500).json({
      error: 'Failed to fetch collaboration details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router