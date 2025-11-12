const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')

// Rate limiting
const projectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many project requests. Please try again later.' }
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

    // Get projects owned by user
    let ownedProjectsQuery = `
      SELECT
        p.*,
        COUNT(DISTINCT c.collaborator_id) FILTER (WHERE c.status = 'active') as collaborator_count,
        COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'pending') as pending_reviews,
        COUNT(DISTINCT pf.id) as file_count,
        array_agg(DISTINCT u.email) FILTER (WHERE c.status = 'active') as collaborator_emails
      FROM projects p
      LEFT JOIN collaborations c ON p.id = c.project_id
      LEFT JOIN users u ON c.collaborator_id = u.id
      LEFT JOIN reviews r ON p.id = r.project_id
      LEFT JOIN project_files pf ON p.id = pf.project_id
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
      GROUP BY p.id, p.user_id, p.title, p.description, p.project_type, p.status, p.visibility, p.settings, p.due_date, p.completed_at
      ORDER BY p.id DESC
    `

    // Get projects where user is collaborator
    const collaboratingProjectsQuery = `
      SELECT
        p.*,
        c.role as my_role,
        c.permissions as my_permissions,
        c.last_activity_at as my_last_activity,
        owner.name as owner_name,
        owner.email as owner_email,
        COUNT(DISTINCT collab.collaborator_id) as total_collaborators,
        COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'pending') as pending_reviews
      FROM collaborations c
      JOIN projects p ON c.project_id = p.id
      JOIN users owner ON p.user_id = owner.id
      LEFT JOIN collaborations collab ON p.id = collab.project_id AND collab.status = 'active'
      LEFT JOIN reviews r ON p.id = r.project_id
      WHERE c.collaborator_id = $1 AND c.status = 'active'
      GROUP BY p.id, c.role, c.permissions, c.last_activity_at, owner.name, owner.email
      ORDER BY c.last_activity_at DESC
    `

    const [ownedResult, collaboratingResult] = await Promise.all([
      pool.query(ownedProjectsQuery, queryParams),
      pool.query(collaboratingProjectsQuery, [userId])
    ])

    // Calculate project stats
    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE p.user_id = $1) as owned_projects,
        COUNT(*) FILTER (WHERE c.collaborator_id = $1) as collaborating_projects,
        COUNT(*) FILTER (WHERE p.status = 'active' AND p.user_id = $1) as active_projects,
        COUNT(*) FILTER (WHERE p.status = 'completed' AND p.user_id = $1) as completed_projects
      FROM projects p
      FULL OUTER JOIN collaborations c ON (c.collaborator_id = $1 AND c.status = 'active')
      WHERE p.user_id = $1 OR c.collaborator_id = $1
    `

    const statsResult = await pool.query(statsQuery, [userId])
    const stats = statsResult.rows[0]

    res.json({
      success: true,
      projects: {
        owned: ownedResult.rows,
        collaborating: collaboratingResult.rows
      },
      stats: {
        owned_projects: parseInt(stats.owned_projects) || 0,
        collaborating_projects: parseInt(stats.collaborating_projects) || 0,
        active_projects: parseInt(stats.active_projects) || 0,
        completed_projects: parseInt(stats.completed_projects) || 0,
        total_projects: ownedResult.rows.length + collaboratingResult.rows.length
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
router.post('/', authenticateToken, projectLimiter, async (req, res) => {
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
      external_access_enabled = true
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

    // Create project
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
      JSON.stringify(settings),
      workspace_type,
      workflow_template,
      default_reviewers,
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

    res.json({
      success: true,
      project,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({
      error: 'Failed to create project',
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
      ORDER BY pf.created_at DESC
    `

    // Get recent activity
    const activityQuery = `
      SELECT
        a.*,
        u.name as user_name
      FROM activity_log a
      JOIN users u ON a.user_id = u.id
      WHERE a.resource_id = $1 AND a.resource_type = 'project'
      ORDER BY a.created_at DESC
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