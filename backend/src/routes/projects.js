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
  try {
    const userId = req.userId
    const { status, visibility } = req.query

    // Simplified query - only query projects table to avoid schema issues
    let ownedProjectsQuery = `
      SELECT
        p.*,
        0 as collaborator_count,
        0 as pending_reviews,
        0 as file_count,
        '{}' as collaborator_emails
      FROM projects p
      WHERE p.user_id = $1
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

    // Simplified collaborating projects query - return empty array for now
    const ownedResult = await pool.query(ownedProjectsQuery, queryParams)
    const collaboratingResult = { rows: [] }

    // Simple stats calculation
    const statsQuery = `
      SELECT
        COUNT(*) as owned_projects,
        COUNT(*) FILTER (WHERE p.status = 'active') as active_projects,
        COUNT(*) FILTER (WHERE p.status = 'completed') as completed_projects
      FROM projects p
      WHERE p.user_id = $1
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
        collaborating_projects: 0,
        active_projects: parseInt(stats.active_projects) || 0,
        completed_projects: parseInt(stats.completed_projects) || 0,
        total_projects: ownedResult.rows.length
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
        const projectCountResult = await pool.query('SELECT COUNT(*) as count FROM projects WHERE user_id = $1', [userId])
        const currentProjectCount = parseInt(projectCountResult.rows[0].count)

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

    // Create project - store client_link in settings
    const projectSettings = {
      ...settings,
      client_link: client_link || null
    }

    const insertQuery = `
      INSERT INTO projects (user_id, title, description, project_type, visibility, due_date, settings, workspace_type, workflow_template, default_reviewers, auto_assign_reviewers, external_access_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const result = await pool.query(insertQuery, [
      userId,
      title.trim(),
      description?.trim() || '',
      project_type,
      visibility,
      due_date || null,
      JSON.stringify(projectSettings),
      workspace_type,
      workflow_template,
      default_reviewers || [],  // Ensure it's always an array
      auto_assign_reviewers,
      external_access_enabled
    ])

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

    // Log detailed error information for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        userId,
        title,
        description,
        client_link
      })
    }

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