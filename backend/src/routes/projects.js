const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const { validateProjects, validationRateLimit } = require('../middleware/validation')
const rateLimit = require('express-rate-limit')

// Rate limiting - production compatible configuration
const projectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many project requests. Please try again later.' },
  validate: false, // Disable strict IP validation
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID for rate limiting if available, fallback to IP
  keyGenerator: (req) => {
    return req.userId || req.ip || req.connection.remoteAddress || 'anonymous'
  },
  // Skip rate limiting if we can't identify the request
  skip: (req) => {
    return !req.userId && !req.ip && !req.connection.remoteAddress
  }
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
// GET /api/projects - Get user's projects and shared projects
// =====================================================
router.get('/', authenticateToken, projectLimiter, async (req, res) => {
  // SECURITY FIX: Removed hardcoded CORS headers - using centralized security middleware

  try {
    const userId = req.userId

    // SECURITY FIX: Validate userId exists and is valid
    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
        code: 'AUTH_REQUIRED'
      })
    }

    // SECURITY FIX: Validate userId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return res.status(401).json({
        error: 'Invalid user identifier',
        code: 'AUTH_INVALID'
      })
    }

    const { status, visibility } = req.query

    // SECURITY FIX: Calculate real statistics instead of hardcoded values
    let ownedProjectsQuery = `
      SELECT
        p.*,
        COALESCE(c.collaborator_count, 0) as collaborator_count,
        COALESCE(r.pending_reviews, 0) as pending_reviews,
        COALESCE(f.file_count, 0) as file_count,
        COALESCE(c.collaborator_emails, '[]'::jsonb) as collaborator_emails
      FROM projects p
      LEFT JOIN (
        SELECT
          project_id,
          COUNT(*) as collaborator_count,
          jsonb_agg(DISTINCT u.email) as collaborator_emails
        FROM collaborations col
        JOIN users u ON col.collaborator_id = u.id
        WHERE col.status = 'active'
        GROUP BY project_id
      ) c ON p.id = c.project_id
      LEFT JOIN (
        SELECT project_id, COUNT(*) as pending_reviews
        FROM reviews
        WHERE status = 'pending'
        GROUP BY project_id
      ) r ON p.id = r.project_id
      LEFT JOIN (
        SELECT project_id, COUNT(*) as file_count
        FROM project_files
        WHERE is_current_version = true
        GROUP BY project_id
      ) f ON p.id = f.project_id
      WHERE p.user_id = $1::UUID
    `

    const queryParams = [userId]
    const conditions = []

    if (status) {
      queryParams.push(status)
      conditions.push(`p.status = $${queryParams.length}`)
    }

    if (visibility) {
      queryParams.push(visibility)
      conditions.push(`p.visibility = $${queryParams.length}`)
    }

    if (conditions.length > 0) {
      ownedProjectsQuery += ` AND ${conditions.join(' AND ')}`
    }

    ownedProjectsQuery += `
      ORDER BY p.id DESC
    `

    // SECURITY FIX: Get real collaborating projects instead of empty array
    // Build the collaborating query with proper parameter indexing
    let collaboratingProjectsQuery = `
      SELECT
        p.*,
        c.role as my_role,
        c.permissions as my_permissions,
        COALESCE(collab_stats.collaborator_count, 0) as collaborator_count,
        COALESCE(r.pending_reviews, 0) as pending_reviews,
        COALESCE(f.file_count, 0) as file_count,
        COALESCE(collab_stats.collaborator_emails, '[]'::jsonb) as collaborator_emails
      FROM projects p
      JOIN collaborations c ON p.id = c.project_id
      LEFT JOIN (
        SELECT
          project_id,
          COUNT(*) as collaborator_count,
          jsonb_agg(DISTINCT u.email) as collaborator_emails
        FROM collaborations col
        JOIN users u ON col.collaborator_id = u.id
        WHERE col.status = 'active'
        GROUP BY project_id
      ) collab_stats ON p.id = collab_stats.project_id
      LEFT JOIN (
        SELECT project_id, COUNT(*) as pending_reviews
        FROM reviews
        WHERE status = 'pending'
        GROUP BY project_id
      ) r ON p.id = r.project_id
      LEFT JOIN (
        SELECT project_id, COUNT(*) as file_count
        FROM project_files
        WHERE is_current_version = true
        GROUP BY project_id
      ) f ON p.id = f.project_id
      WHERE c.collaborator_id = $1::UUID AND c.status = 'active'
    `

    // Apply the same filters as the owned projects query
    const collaboratingConditions = []
    const collaboratingQueryParams = [userId] // Start with userId as $1

    if (status) {
      collaboratingQueryParams.push(status)
      collaboratingConditions.push(`p.status = $${collaboratingQueryParams.length}`)
    }

    if (visibility) {
      collaboratingQueryParams.push(visibility)
      collaboratingConditions.push(`p.visibility = $${collaboratingQueryParams.length}`)
    }

    if (collaboratingConditions.length > 0) {
      collaboratingProjectsQuery += ` AND ${collaboratingConditions.join(' AND ')}`
    }

    collaboratingProjectsQuery += ` ORDER BY p.updated_at DESC`

    const ownedResult = await pool.query(ownedProjectsQuery, queryParams)
    const collaboratingResult = await pool.query(collaboratingProjectsQuery, collaboratingQueryParams)

    // SECURITY FIX: Calculate comprehensive project statistics
    const statsQuery = `
      WITH owned_stats AS (
        SELECT
          COUNT(*) as owned_projects,
          COUNT(*) FILTER (WHERE p.status = 'active') as owned_active,
          COUNT(*) FILTER (WHERE p.status = 'completed') as owned_completed
        FROM projects p
        WHERE p.user_id = $1::UUID
      ),
      collaborating_stats AS (
        SELECT COUNT(*) as collaborating_projects
        FROM collaborations c
        WHERE c.collaborator_id = $1::UUID AND c.status = 'active'
      )
      SELECT
        owned_projects,
        owned_active,
        owned_completed,
        collaborating_projects
      FROM owned_stats, collaborating_stats
    `

    const statsResult = await pool.query(statsQuery, [userId])
    const stats = statsResult.rows[0]

    // Extract client_link from settings for frontend compatibility
    const processProjects = (projects) => projects.map(project => {
      const settings = JSON.parse(project.settings || '{}')
      return {
        ...project,
        client_link: settings.client_link || null
      }
    })

    res.json({
      success: true,
      projects: {
        owned: processProjects(ownedResult.rows),
        collaborating: processProjects(collaboratingResult.rows)
      },
      stats: {
        owned_projects: parseInt(stats.owned_projects) || 0,
        collaborating_projects: parseInt(stats.collaborating_projects) || 0,
        active_projects: parseInt(stats.owned_active) || 0,
        completed_projects: parseInt(stats.owned_completed) || 0,
        total_projects: (parseInt(stats.owned_projects) || 0) + (parseInt(stats.collaborating_projects) || 0)
      }
    })

  } catch (error) {
    console.error('Get projects error:', error)
    res.status(500).json({
      error: 'Failed to fetch projects',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/projects - Create new project
// =====================================================
router.post('/', authenticateToken, projectLimiter, validateProjects.create, async (req, res) => {
  // SECURITY FIX: Removed hardcoded CORS headers - using centralized security middleware

  try {
    const userId = req.userId
    const {
      title,
      description,
      project_type = 'review',
      visibility = 'private',
      due_date,
      settings = {},
      workspace_type = 'review',
      workflow_template = 'standard',
      default_reviewers = [],
      auto_assign_reviewers = false,
      external_access_enabled = true,
      client_link
    } = req.body

    // Input validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Project title is required' })
    }

    if (!['review', 'collaboration', 'shared_folder'].includes(project_type)) {
      return res.status(400).json({ error: 'Invalid project type' })
    }

    if (!['private', 'team', 'public'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility setting' })
    }

    if (!['review', 'approval', 'creative', 'code', 'general'].includes(workspace_type)) {
      return res.status(400).json({ error: 'Invalid workspace type' })
    }

    if (!['standard', 'fast', 'thorough', 'custom'].includes(workflow_template)) {
      return res.status(400).json({ error: 'Invalid workflow template' })
    }

    // Check project limits based on user's plan (skip for admin)
    if (!req.isAdmin) {
      const userResult = await pool.query('SELECT plan FROM users WHERE id = $1', [userId])
      const userPlan = userResult.rows[0]?.plan || 'free'

      if (userPlan === 'free') {
        // More robust project counting with better filtering
        const projectCountResult = await pool.query(
          'SELECT COUNT(*) as count FROM projects WHERE user_id = $1 AND deleted_at IS NULL',
          [userId]
        )
        const currentProjectCount = parseInt(projectCountResult.rows[0]?.count || 0)

        if (process.env.NODE_ENV !== 'production') {
          console.log(`Project count check for user ${userId}: ${currentProjectCount} projects`)

          // Debug user info for troubleshooting (development only)
          console.log('🔍 USER DEBUG INFO:', {
            userId,
            userIdType: typeof userId,
            userEmail: req.userEmail,
            userPlan: userPlan,
            projectCount: currentProjectCount
          })
        }

        if (currentProjectCount >= 3) {
          return res.status(403).json({
            error: 'Free plan allows 3 projects. Upgrade to Pro ($15/mo) for unlimited projects.',
            limitReached: true,
            currentCount: currentProjectCount,
            maxCount: 3,
            upgradeUrl: '/pricing'
          })
        }
      }
    }

    // Create project - store all extra settings in the settings JSONB column
    const projectSettings = {
      ...settings,
      client_link: client_link || null,
      workspace_type: workspace_type || 'review',
      workflow_template: workflow_template || 'standard',
      default_reviewers: default_reviewers || [],
      auto_assign_reviewers: auto_assign_reviewers || false,
      external_access_enabled: external_access_enabled !== undefined ? external_access_enabled : true
    }

    const insertQuery = `
      INSERT INTO projects (user_id, title, description, project_type, visibility, due_date, settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const queryParams = [
      userId,
      title.trim(),
      description?.trim() || '',
      project_type,
      visibility,
      due_date || null,
      JSON.stringify(projectSettings)
    ]

    // Database insert debugging (development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🗄️ DATABASE INSERT DEBUG:', {
        query: insertQuery,
        params: queryParams,
        userId,
        userIdType: typeof userId,
        settingsString: JSON.stringify(projectSettings)
      })
    }

    const result = await pool.query(insertQuery, queryParams)

    const project = result.rows[0]

    // Log activity
    await logActivity(userId, 'project_created', 'project', project.id, {
      title,
      project_type,
      visibility
    })

    // Extract client_link from settings for frontend compatibility
    const responseProjectSettings = JSON.parse(project.settings || '{}')
    const projectResponse = {
      ...project,
      client_link: responseProjectSettings.client_link || null
    }

    res.json({
      success: true,
      project: projectResponse,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Create project error:', error)

    // EMERGENCY: Log detailed error information for debugging the 500 error
    console.error('🚨 DETAILED PROJECT CREATION ERROR:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      constraint: error.constraint,
      detail: error.detail,
      hint: error.hint,
      query: error.query,
      parameters: error.parameters,
      userId,
      title,
      description,
      project_type,
      visibility,
      due_date,
      settings: JSON.stringify(projectSettings),
      timestamp: new Date().toISOString()
    })

    // Return appropriate error response
    let statusCode = 500
    let errorMessage = 'Failed to create project'

    // Handle specific error types
    if (error.code === '23505') {
      statusCode = 409
      errorMessage = 'Project with this name already exists'
    } else if (error.code === '23503') {
      statusCode = 400
      errorMessage = 'Invalid reference data provided'
    } else if (error.code === '23514') {
      statusCode = 400
      errorMessage = 'Invalid data format'
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// GET /api/projects/:projectId - Get specific project details
// =====================================================
router.get('/:projectId', authenticateToken, projectLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const projectId = req.params.projectId

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID format' })
    }

    // Get project with access check
    const projectQuery = `
      SELECT
        p.*,
        CASE
          WHEN p.user_id = $2 THEN 'owner'
          WHEN c.collaborator_id = $2 THEN c.role
          ELSE NULL
        END as my_role,
        CASE
          WHEN p.user_id = $2 THEN '{"can_view": true, "can_edit": true, "can_manage": true}'::jsonb
          WHEN c.collaborator_id = $2 THEN c.permissions
          ELSE NULL
        END as my_permissions
      FROM projects p
      LEFT JOIN collaborations c ON p.id = c.project_id AND c.collaborator_id = $2 AND c.status = 'active'
      WHERE p.id = $1 AND (p.user_id = $2 OR c.collaborator_id = $2 OR p.visibility = 'public')
    `

    const projectResult = await pool.query(projectQuery, [projectId, userId])

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' })
    }

    const project = projectResult.rows[0]

    // Get collaborators
    const collaboratorsQuery = `
      SELECT
        c.collaborator_id,
        c.role,
        c.permissions,
        c.status,
        c.last_activity_at,
        u.name,
        u.email
      FROM collaborations c
      JOIN users u ON c.collaborator_id = u.id
      WHERE c.project_id = $1 AND c.status = 'active'
      ORDER BY c.last_activity_at DESC
    `

    // Get project files
    const filesQuery = `
      SELECT
        pf.*,
        u.name as uploaded_by_name
      FROM project_files pf
      LEFT JOIN users u ON pf.uploaded_by_id = u.id
      WHERE pf.project_id = $1 AND pf.is_current_version = true
      ORDER BY pf.id DESC
    `

    // Get recent activity
    const activityQuery = `
      SELECT
        a.*,
        u.name as user_name
      FROM activity_log a
      JOIN users u ON a.user_id = u.id
      WHERE a.resource_id = $1 AND a.resource_type = 'project'
      ORDER BY a.id DESC
      LIMIT 20
    `

    const [collaboratorsResult, filesResult, activityResult] = await Promise.all([
      pool.query(collaboratorsQuery, [projectId]),
      pool.query(filesQuery, [projectId]),
      pool.query(activityQuery, [projectId])
    ])

    res.json({
      success: true,
      project: {
        ...project,
        collaborators: collaboratorsResult.rows,
        files: filesResult.rows,
        recent_activity: activityResult.rows
      }
    })

  } catch (error) {
    console.error('Get project details error:', error)
    res.status(500).json({
      error: 'Failed to fetch project details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// PATCH /api/projects/:id - Update project details
// =====================================================
router.patch('/:id', authenticateToken, projectLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const projectId = req.params.id
    const {
      title,
      description,
      project_type,
      visibility,
      due_date,
      status,
      settings = {},
      client_link,
      workspace_type,
      workflow_template,
      default_reviewers,
      auto_assign_reviewers,
      external_access_enabled
    } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID format' })
    }

    // Verify project ownership or admin access
    const ownershipQuery = `
      SELECT p.*, c.role
      FROM projects p
      LEFT JOIN collaborations c ON p.id = c.project_id AND c.collaborator_id = $2 AND c.status = 'active'
      WHERE p.id = $1 AND (p.user_id = $2 OR c.role = 'admin')
    `
    const ownershipResult = await pool.query(ownershipQuery, [projectId, userId])

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' })
    }

    const existingProject = ownershipResult.rows[0]

    // Validate input data
    if (title && title.trim().length === 0) {
      return res.status(400).json({ error: 'Project title cannot be empty' })
    }

    if (project_type && !['review', 'collaboration', 'shared_folder'].includes(project_type)) {
      return res.status(400).json({ error: 'Invalid project type' })
    }

    if (visibility && !['private', 'team', 'public'].includes(visibility)) {
      return res.status(400).json({ error: 'Invalid visibility setting' })
    }

    if (status && !['draft', 'active', 'completed', 'archived', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE projects SET updated_at = NOW()'
    const queryParams = []
    let paramIndex = 1
    const changedFields = []

    if (title !== undefined) {
      updateQuery += `, title = $${paramIndex}`
      queryParams.push(title.trim())
      changedFields.push('title')
      paramIndex++
    }

    if (description !== undefined) {
      updateQuery += `, description = $${paramIndex}`
      queryParams.push(description?.trim() || '')
      changedFields.push('description')
      paramIndex++
    }

    if (project_type !== undefined) {
      updateQuery += `, project_type = $${paramIndex}`
      queryParams.push(project_type)
      changedFields.push('project_type')
      paramIndex++
    }

    if (visibility !== undefined) {
      updateQuery += `, visibility = $${paramIndex}`
      queryParams.push(visibility)
      changedFields.push('visibility')
      paramIndex++
    }

    if (due_date !== undefined) {
      updateQuery += `, due_date = $${paramIndex}`
      queryParams.push(due_date)
      changedFields.push('due_date')
      paramIndex++
    }

    if (status !== undefined) {
      updateQuery += `, status = $${paramIndex}`
      queryParams.push(status)
      changedFields.push('status')
      paramIndex++
    }

    // Update settings if provided
    const existingSettings = JSON.parse(existingProject.settings || '{}')
    const updatedSettings = {
      ...existingSettings,
      ...settings,
      client_link: client_link !== undefined ? client_link : existingSettings.client_link,
      workspace_type: workspace_type || existingSettings.workspace_type,
      workflow_template: workflow_template || existingSettings.workflow_template,
      default_reviewers: default_reviewers || existingSettings.default_reviewers,
      auto_assign_reviewers: auto_assign_reviewers !== undefined ? auto_assign_reviewers : existingSettings.auto_assign_reviewers,
      external_access_enabled: external_access_enabled !== undefined ? external_access_enabled : existingSettings.external_access_enabled
    }

    updateQuery += `, settings = $${paramIndex}`
    queryParams.push(JSON.stringify(updatedSettings))
    changedFields.push('settings')
    paramIndex++

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`
    queryParams.push(projectId)

    // Execute update
    const updateResult = await pool.query(updateQuery, queryParams)
    const updatedProject = updateResult.rows[0]

    // Log activity
    await logActivity(userId, 'project_updated', 'project', projectId, {
      changed_fields: changedFields,
      title: updatedProject.title
    })

    // Extract client_link from settings for frontend compatibility
    const responseSettings = JSON.parse(updatedProject.settings || '{}')
    const projectResponse = {
      ...updatedProject,
      client_link: responseSettings.client_link || null
    }

    res.json({
      success: true,
      project: projectResponse,
      message: 'Project updated successfully',
      changed_fields: changedFields
    })

  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({
      error: 'Failed to update project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/projects/invite - Send project invitation
// =====================================================
router.post('/invite', authenticateToken, projectLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      email,
      project_id,
      role = 'viewer',
      message,
      expiration_hours = 168 // 7 days default
    } = req.body

    // Input validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' })
    }

    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' })
    }

    if (!['viewer', 'editor', 'reviewer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' })
    }

    // Verify project ownership
    const projectQuery = await pool.query(
      'SELECT title, visibility FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, userId]
    )

    if (projectQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' })
    }

    const project = projectQuery.rows[0]

    // Get inviter information
    const inviterQuery = await pool.query('SELECT name, email FROM users WHERE id = $1', [userId])
    const inviter = inviterQuery.rows[0]

    // Check if there's already a pending invitation
    const existingInvitationQuery = `
      SELECT id FROM project_invitations
      WHERE project_id = $1 AND email = $2 AND status = 'pending' AND expires_at > NOW()
    `
    const existingInvitation = await pool.query(existingInvitationQuery, [project_id, email.toLowerCase()])

    if (existingInvitation.rows.length > 0) {
      return res.status(400).json({ error: 'Pending invitation already exists for this email' })
    }

    // Check if user is already a collaborator
    const existingCollaboratorQuery = `
      SELECT c.id FROM collaborations c
      JOIN users u ON c.collaborator_id = u.id
      WHERE c.project_id = $1 AND u.email = $2 AND c.status = 'active'
    `
    const existingCollaborator = await pool.query(existingCollaboratorQuery, [project_id, email.toLowerCase()])

    if (existingCollaborator.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a collaborator on this project' })
    }

    // Generate secure invitation token
    const crypto = require('crypto')
    const invitationToken = crypto.randomBytes(32).toString('hex')

    // Set permissions based on role
    const rolePermissions = {
      viewer: { can_view: true, can_edit: false, can_review: false, can_manage: false },
      editor: { can_view: true, can_edit: true, can_review: false, can_manage: false },
      reviewer: { can_view: true, can_edit: false, can_review: true, can_manage: false },
      admin: { can_view: true, can_edit: true, can_review: true, can_manage: true }
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expiration_hours * 60 * 60 * 1000))

    // Create invitation record
    const insertQuery = `
      INSERT INTO project_invitations
      (project_id, inviter_id, email, role, permissions, invitation_token, message, status, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
      RETURNING id, expires_at
    `

    const defaultMessage = message || `${inviter.name || inviter.email} invited you to collaborate on "${project.title}"`

    const insertResult = await pool.query(insertQuery, [
      project_id,
      userId,
      email.toLowerCase(),
      role,
      JSON.stringify(rolePermissions[role]),
      invitationToken,
      defaultMessage,
      expiresAt
    ])

    const invitation = insertResult.rows[0]

    // Log activity
    await logActivity(userId, 'project_invitation_sent', 'project', project_id, {
      invited_email: email,
      role: role,
      invitation_id: invitation.id
    })

    res.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: email,
        role: role,
        permissions: rolePermissions[role],
        project_title: project.title,
        expires_at: invitation.expires_at,
        invitation_url: `${req.get('origin') || 'https://swayfiles.com'}/invite/${invitationToken}`
      },
      message: 'Project invitation sent successfully'
    })

  } catch (error) {
    console.error('Send project invitation error:', error)
    res.status(500).json({
      error: 'Failed to send project invitation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/projects/:projectId/share - Share project with user
// =====================================================
router.post('/:projectId/share', authenticateToken, projectLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const projectId = req.params.projectId
    const { email, role = 'viewer', message } = req.body

    // Input validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' })
    }

    // Verify project ownership
    const projectQuery = await pool.query(
      'SELECT title FROM projects WHERE id = $1 AND user_id = $2',
      [projectId, userId]
    )

    if (projectQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' })
    }

    const project = projectQuery.rows[0]

    // Check if user exists
    const userQuery = await pool.query('SELECT id, name FROM users WHERE email = $1', [email.toLowerCase()])

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email not found' })
    }

    const collaboratorUser = userQuery.rows[0]

    // Check if already shared
    const existingQuery = await pool.query(
      'SELECT id FROM collaborations WHERE project_id = $1 AND collaborator_id = $2',
      [projectId, collaboratorUser.id]
    )

    if (existingQuery.rows.length > 0) {
      return res.status(400).json({ error: 'Project already shared with this user' })
    }

    // Create collaboration
    const permissions = {
      viewer: { can_view: true, can_edit: false, can_review: false },
      editor: { can_view: true, can_edit: true, can_review: false },
      reviewer: { can_view: true, can_edit: false, can_review: true }
    }

    const insertQuery = `
      INSERT INTO collaborations (project_id, owner_id, collaborator_id, role, permissions, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id
    `

    const result = await pool.query(insertQuery, [
      projectId,
      userId,
      collaboratorUser.id,
      role,
      JSON.stringify(permissions[role])
    ])

    // Log activity
    await logActivity(userId, 'project_shared', 'project', projectId, {
      shared_with: email,
      role,
      collaborator_id: collaboratorUser.id
    })

    res.json({
      success: true,
      collaboration_id: result.rows[0].id,
      message: `Project "${project.title}" shared with ${email} as ${role}`
    })

  } catch (error) {
    console.error('Share project error:', error)
    res.status(500).json({
      error: 'Failed to share project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router