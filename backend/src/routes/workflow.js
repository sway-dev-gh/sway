const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')

// Rate limiting
const workflowLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many workflow requests. Please try again later.' }
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
// GET /api/workflow/projects/:id - Get project with workflow details
// =====================================================
router.get('/projects/:id', authenticateToken, workflowLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const projectId = req.params.id

    // Get project with workflow details
    const projectQuery = `
      SELECT
        p.*,
        COUNT(DISTINCT fs.id) as section_count,
        COUNT(DISTINCT fs.id) FILTER (WHERE fs.section_status = 'approved') as approved_sections,
        COUNT(DISTINCT sr.id) as total_reviews,
        COUNT(DISTINCT sr.id) FILTER (WHERE sr.review_status = 'pending') as pending_reviews,
        COUNT(DISTINCT sc.id) as total_comments,
        COUNT(DISTINCT sc.id) FILTER (WHERE sc.is_resolved = false) as unresolved_comments,
        COUNT(DISTINCT fws.id) as files_with_workflow
      FROM projects p
      LEFT JOIN file_sections fs ON p.id = fs.project_file_id
      LEFT JOIN section_reviews sr ON fs.id = sr.section_id
      LEFT JOIN section_comments sc ON fs.id = sc.section_id
      LEFT JOIN file_workflow_states fws ON p.id = fws.project_id
      WHERE p.id = $1 AND (p.user_id = $2 OR EXISTS(
        SELECT 1 FROM collaborations c
        WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active'
      ))
      GROUP BY p.id
    `

    const projectResult = await pool.query(projectQuery, [projectId, userId])
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const project = projectResult.rows[0]

    // Get project files with sections and workflow states
    const filesQuery = `
      SELECT
        pf.*,
        fws.current_state,
        fws.completion_percentage,
        fws.priority_level,
        fws.estimated_completion_date,
        array_agg(DISTINCT jsonb_build_object(
          'id', fs.id,
          'section_name', fs.section_name,
          'section_type', fs.section_type,
          'section_status', fs.section_status,
          'is_required_for_approval', fs.is_required_for_approval,
          'assigned_reviewers', fs.assigned_reviewers
        )) FILTER (WHERE fs.id IS NOT NULL) as sections
      FROM project_files pf
      LEFT JOIN file_workflow_states fws ON pf.id = fws.file_id AND pf.project_id = fws.project_id
      LEFT JOIN file_sections fs ON pf.id = fs.project_file_id
      WHERE pf.project_id = $1
      GROUP BY pf.id, fws.current_state, fws.completion_percentage, fws.priority_level, fws.estimated_completion_date
      ORDER BY pf.created_at DESC
    `

    const filesResult = await pool.query(filesQuery, [projectId])

    // Get workflow rules for this project
    const rulesQuery = `
      SELECT * FROM workflow_rules
      WHERE project_id = $1 OR project_id IS NULL
      ORDER BY execution_order
    `

    const rulesResult = await pool.query(rulesQuery, [projectId])

    res.json({
      success: true,
      project: {
        ...project,
        files: filesResult.rows,
        workflow_rules: rulesResult.rows
      }
    })

  } catch (error) {
    console.error('Get workflow project error:', error)
    res.status(500).json({
      error: 'Failed to fetch project workflow details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/workflow/projects/:id/files - Upload file with workflow initialization
// =====================================================
router.post('/projects/:id/files', authenticateToken, workflowLimiter, async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const userId = req.userId
    const projectId = req.params.id
    const { filename, filepath, file_size, sections = [], initial_state = 'draft' } = req.body

    // Verify project access
    const projectCheck = await client.query(
      `SELECT id FROM projects WHERE id = $1 AND (user_id = $2 OR EXISTS(
        SELECT 1 FROM collaborations c
        WHERE c.project_id = $1 AND c.collaborator_id = $2 AND c.status = 'active'
      ))`,
      [projectId, userId]
    )

    if (projectCheck.rows.length === 0) {
      throw new Error('Project not found or access denied')
    }

    // Create project file record
    const fileResult = await client.query(
      `INSERT INTO project_files (project_id, filename, filepath, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [projectId, filename, filepath, file_size, userId]
    )

    const projectFile = fileResult.rows[0]

    // Initialize workflow state
    const workflowResult = await client.query(
      `INSERT INTO file_workflow_states
       (file_id, project_id, current_state, state_changed_by, priority_level)
       VALUES ($1, $2, $3, $4, 'normal') RETURNING *`,
      [projectFile.id, projectId, initial_state, userId]
    )

    // Create file sections if provided
    const createdSections = []
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const sectionResult = await client.query(
        `INSERT INTO file_sections
         (project_file_id, section_name, section_type, section_data, description, created_by_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          projectFile.id,
          section.name,
          section.type || 'content',
          JSON.stringify(section.data || {}),
          section.description || '',
          userId
        ]
      )
      createdSections.push(sectionResult.rows[0])
    }

    // Auto-assign reviewers if enabled
    const projectSettings = await client.query(
      `SELECT auto_assign_reviewers, default_reviewers FROM projects WHERE id = $1`,
      [projectId]
    )

    if (projectSettings.rows[0]?.auto_assign_reviewers && projectSettings.rows[0]?.default_reviewers?.length > 0) {
      const defaultReviewers = projectSettings.rows[0].default_reviewers

      // Assign reviewers to each section
      for (const section of createdSections) {
        await client.query(
          `UPDATE file_sections SET assigned_reviewers = $1 WHERE id = $2`,
          [defaultReviewers, section.id]
        )
      }

      // Update workflow state
      await client.query(
        `UPDATE file_workflow_states
         SET current_state = 'under_review', reviewer_assignments = $1
         WHERE file_id = $2`,
        [defaultReviewers, projectFile.id]
      )
    }

    await client.query('COMMIT')

    // Log activity
    await logActivity(userId, 'file_uploaded', 'project_file', projectFile.id, {
      filename,
      sections_count: sections.length,
      project_id: projectId
    })

    res.json({
      success: true,
      file: {
        ...projectFile,
        workflow_state: workflowResult.rows[0],
        sections: createdSections
      },
      message: 'File uploaded and workflow initialized'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('File upload workflow error:', error)
    res.status(500).json({
      error: 'Failed to upload file and initialize workflow',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  } finally {
    client.release()
  }
})

// =====================================================
// POST /api/workflow/sections/:id/review - Submit section review
// =====================================================
router.post('/sections/:id/review', authenticateToken, workflowLimiter, async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const userId = req.userId
    const sectionId = req.params.id
    const {
      review_status,
      review_notes = '',
      review_score,
      is_final_approval = false
    } = req.body

    // Validate review status
    if (!['pending', 'reviewing', 'changes_requested', 'approved', 'rejected'].includes(review_status)) {
      throw new Error('Invalid review status')
    }

    // Check if user has permission to review this section
    const permissionCheck = await client.query(`
      SELECT fs.id, fs.project_file_id, fs.assigned_reviewers, p.user_id as project_owner
      FROM file_sections fs
      JOIN project_files pf ON fs.project_file_id = pf.id
      JOIN projects p ON pf.project_id = p.id
      WHERE fs.id = $1 AND (
        p.user_id = $2 OR
        $2 = ANY(fs.assigned_reviewers) OR
        EXISTS(SELECT 1 FROM collaborations c WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
      )
    `, [sectionId, userId])

    if (permissionCheck.rows.length === 0) {
      throw new Error('Section not found or you do not have permission to review it')
    }

    // Insert or update review
    const reviewResult = await client.query(`
      INSERT INTO section_reviews
      (section_id, reviewer_id, review_status, review_notes, review_score, is_final_approval)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (section_id, reviewer_id)
      DO UPDATE SET
        review_status = EXCLUDED.review_status,
        review_notes = EXCLUDED.review_notes,
        review_score = EXCLUDED.review_score,
        is_final_approval = EXCLUDED.is_final_approval,
        reviewed_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [sectionId, userId, review_status, review_notes, review_score, is_final_approval])

    // Update section status based on reviews
    const allReviewsQuery = `
      SELECT review_status, COUNT(*) as count
      FROM section_reviews
      WHERE section_id = $1
      GROUP BY review_status
    `
    const allReviews = await client.query(allReviewsQuery, [sectionId])

    let newSectionStatus = 'under_review'
    const reviewCounts = {}
    allReviews.rows.forEach(row => {
      reviewCounts[row.review_status] = parseInt(row.count)
    })

    if (reviewCounts['rejected'] > 0 || reviewCounts['changes_requested'] > 0) {
      newSectionStatus = 'changes_requested'
    } else if (reviewCounts['approved'] > 0 && !reviewCounts['pending'] && !reviewCounts['reviewing']) {
      newSectionStatus = 'approved'
    }

    // Update section status
    await client.query(
      `UPDATE file_sections SET section_status = $1 WHERE id = $2`,
      [newSectionStatus, sectionId]
    )

    await client.query('COMMIT')

    // Log activity
    await logActivity(userId, 'section_reviewed', 'file_section', sectionId, {
      review_status,
      new_section_status: newSectionStatus
    })

    res.json({
      success: true,
      review: reviewResult.rows[0],
      section_status: newSectionStatus,
      message: 'Review submitted successfully'
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Section review error:', error)
    res.status(500).json({
      error: 'Failed to submit review',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  } finally {
    client.release()
  }
})

// =====================================================
// POST /api/workflow/sections/:id/comments - Add comment to section
// =====================================================
router.post('/sections/:id/comments', authenticateToken, workflowLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const sectionId = req.params.id
    const {
      comment_text,
      comment_type = 'general',
      line_number,
      highlighted_text,
      parent_comment_id = null
    } = req.body

    if (!comment_text || comment_text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' })
    }

    // Check permissions
    const permissionCheck = await pool.query(`
      SELECT fs.id
      FROM file_sections fs
      JOIN project_files pf ON fs.project_file_id = pf.project_id
      JOIN projects p ON pf.project_id = p.id
      WHERE fs.id = $1 AND (
        p.user_id = $2 OR
        $2 = ANY(fs.assigned_reviewers) OR
        EXISTS(SELECT 1 FROM collaborations c WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
      )
    `, [sectionId, userId])

    if (permissionCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to comment on this section' })
    }

    const commentResult = await pool.query(`
      INSERT INTO section_comments
      (section_id, commenter_id, comment_text, comment_type, line_number, highlighted_text, parent_comment_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [sectionId, userId, comment_text.trim(), comment_type, line_number, highlighted_text, parent_comment_id])

    // Get commenter details
    const commenterResult = await pool.query(
      `SELECT name, email FROM users WHERE id = $1`,
      [userId]
    )

    const comment = {
      ...commentResult.rows[0],
      commenter_name: commenterResult.rows[0]?.name,
      commenter_email: commenterResult.rows[0]?.email
    }

    // Log activity
    await logActivity(userId, 'comment_added', 'file_section', sectionId, {
      comment_type,
      has_parent: !!parent_comment_id
    })

    res.json({
      success: true,
      comment,
      message: 'Comment added successfully'
    })

  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({
      error: 'Failed to add comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// GET /api/workflow/sections/:id - Get section with reviews and comments
// =====================================================
router.get('/sections/:id', authenticateToken, workflowLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const sectionId = req.params.id

    // Get section details
    const sectionQuery = `
      SELECT
        fs.*,
        pf.filename,
        p.title as project_title
      FROM file_sections fs
      JOIN project_files pf ON fs.project_file_id = pf.id
      JOIN projects p ON pf.project_id = p.id
      WHERE fs.id = $1 AND (
        p.user_id = $2 OR
        $2 = ANY(fs.assigned_reviewers) OR
        EXISTS(SELECT 1 FROM collaborations c WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
      )
    `

    const sectionResult = await pool.query(sectionQuery, [sectionId, userId])
    if (sectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' })
    }

    // Get reviews
    const reviewsQuery = `
      SELECT
        sr.*,
        u.name as reviewer_name,
        u.email as reviewer_email
      FROM section_reviews sr
      JOIN users u ON sr.reviewer_id = u.id
      WHERE sr.section_id = $1
      ORDER BY sr.reviewed_at DESC
    `

    const reviewsResult = await pool.query(reviewsQuery, [sectionId])

    // Get comments (with nested replies)
    const commentsQuery = `
      SELECT
        sc.*,
        u.name as commenter_name,
        u.email as commenter_email
      FROM section_comments sc
      LEFT JOIN users u ON sc.commenter_id = u.id
      WHERE sc.section_id = $1
      ORDER BY sc.created_at ASC
    `

    const commentsResult = await pool.query(commentsQuery, [sectionId])

    // Organize comments into threads
    const comments = commentsResult.rows
    const commentMap = new Map()
    const rootComments = []

    // First pass: create map of all comments
    comments.forEach(comment => {
      comment.replies = []
      commentMap.set(comment.id, comment)
    })

    // Second pass: organize into threads
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    })

    res.json({
      success: true,
      section: sectionResult.rows[0],
      reviews: reviewsResult.rows,
      comments: rootComments
    })

  } catch (error) {
    console.error('Get section details error:', error)
    res.status(500).json({
      error: 'Failed to fetch section details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/workflow/files/:id/version - Create new file version
// =====================================================
router.post('/files/:id/version', authenticateToken, workflowLimiter, async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const userId = req.userId
    const fileId = req.params.id
    const { version_notes, file_changes = [], section_changes = [] } = req.body

    // Verify file access
    const fileCheck = await client.query(`
      SELECT pf.*, p.user_id, p.title
      FROM project_files pf
      JOIN projects p ON pf.project_id = p.id
      WHERE pf.id = $1 AND (
        p.user_id = $2 OR
        EXISTS(SELECT 1 FROM collaborations c WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
      )
    `, [fileId, userId])

    if (fileCheck.rows.length === 0) {
      throw new Error('File not found or access denied')
    }

    const projectFile = fileCheck.rows[0]

    // Get current version number
    const versionResult = await client.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM file_versions WHERE file_id = $1`,
      [fileId]
    )
    const nextVersion = versionResult.rows[0].next_version

    // Create new version
    const newVersionResult = await client.query(`
      INSERT INTO file_versions
      (file_id, version_number, created_by, version_notes, file_changes, section_changes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [fileId, nextVersion, userId, version_notes || '', JSON.stringify(file_changes), JSON.stringify(section_changes)])

    const newVersion = newVersionResult.rows[0]

    // Update workflow state history
    await client.query(`
      INSERT INTO workflow_state_history (file_id, previous_state, new_state, changed_by, change_reason, version_id)
      SELECT fws.current_state, fws.current_state, fws.current_state, $2, 'Version created', $3
      FROM file_workflow_states fws WHERE fws.file_id = $1
    `, [fileId, userId, newVersion.id])

    await client.query('COMMIT')

    // Log activity
    await logActivity(userId, 'version_created', 'project_file', fileId, {
      version_number: nextVersion,
      has_notes: !!version_notes
    })

    res.json({
      success: true,
      version: newVersion,
      message: `Version ${nextVersion} created successfully`
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Create version error:', error)
    res.status(500).json({
      error: 'Failed to create file version',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  } finally {
    client.release()
  }
})

// =====================================================
// GET /api/workflow/files/:id/versions - Get file version history
// =====================================================
router.get('/files/:id/versions', authenticateToken, workflowLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const fileId = req.params.id

    // Verify file access
    const fileCheck = await pool.query(`
      SELECT pf.id
      FROM project_files pf
      JOIN projects p ON pf.project_id = p.id
      WHERE pf.id = $1 AND (
        p.user_id = $2 OR
        EXISTS(SELECT 1 FROM collaborations c WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
      )
    `, [fileId, userId])

    if (fileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or access denied' })
    }

    // Get version history with creator details
    const versionsResult = await pool.query(`
      SELECT
        fv.*,
        u.name as created_by_name,
        u.email as created_by_email
      FROM file_versions fv
      LEFT JOIN users u ON fv.created_by = u.id
      WHERE fv.file_id = $1
      ORDER BY fv.version_number DESC
    `, [fileId])

    res.json({
      success: true,
      versions: versionsResult.rows
    })

  } catch (error) {
    console.error('Get versions error:', error)
    res.status(500).json({
      error: 'Failed to fetch version history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/workflow/files/:id/state - Transition workflow state
// =====================================================
router.post('/files/:id/state', authenticateToken, workflowLimiter, async (req, res) => {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const userId = req.userId
    const fileId = req.params.id
    const { new_state, change_reason, priority_level } = req.body

    // Validate state
    const validStates = ['draft', 'under_review', 'changes_requested', 'approved', 'delivered']
    if (!validStates.includes(new_state)) {
      throw new Error(`Invalid state. Must be one of: ${validStates.join(', ')}`)
    }

    // Verify file access and get current state
    const fileCheck = await client.query(`
      SELECT pf.*, fws.current_state, p.user_id, p.title
      FROM project_files pf
      JOIN file_workflow_states fws ON pf.id = fws.file_id
      JOIN projects p ON pf.project_id = p.id
      WHERE pf.id = $1 AND (
        p.user_id = $2 OR
        EXISTS(SELECT 1 FROM collaborations c WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
      )
    `, [fileId, userId])

    if (fileCheck.rows.length === 0) {
      throw new Error('File not found or access denied')
    }

    const currentState = fileCheck.rows[0].current_state
    const projectFile = fileCheck.rows[0]

    // Check if state transition is valid (basic validation)
    const stateTransitions = {
      'draft': ['under_review', 'delivered'],
      'under_review': ['changes_requested', 'approved', 'draft'],
      'changes_requested': ['under_review', 'draft'],
      'approved': ['delivered', 'under_review'],
      'delivered': ['under_review'] // Can reopen for revisions
    }

    if (!stateTransitions[currentState]?.includes(new_state)) {
      throw new Error(`Invalid state transition from ${currentState} to ${new_state}`)
    }

    // Update workflow state
    const updateResult = await client.query(`
      UPDATE file_workflow_states
      SET
        current_state = $1,
        state_changed_by = $2,
        state_changed_at = NOW(),
        priority_level = COALESCE($3, priority_level)
      WHERE file_id = $4
      RETURNING *
    `, [new_state, userId, priority_level, fileId])

    // Record state history
    await client.query(`
      INSERT INTO workflow_state_history
      (file_id, previous_state, new_state, changed_by, change_reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [fileId, currentState, new_state, userId, change_reason || `State changed to ${new_state}`])

    await client.query('COMMIT')

    // Log activity
    await logActivity(userId, 'state_changed', 'project_file', fileId, {
      previous_state: currentState,
      new_state,
      change_reason
    })

    res.json({
      success: true,
      workflow_state: updateResult.rows[0],
      message: `File state changed from ${currentState} to ${new_state}`
    })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Change state error:', error)
    res.status(500).json({
      error: 'Failed to change workflow state',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  } finally {
    client.release()
  }
})

// =====================================================
// GET /api/workflow/files/:id/state-history - Get workflow state transition history
// =====================================================
router.get('/files/:id/state-history', authenticateToken, workflowLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const fileId = req.params.id

    // Verify file access
    const fileCheck = await pool.query(`
      SELECT pf.id
      FROM project_files pf
      JOIN projects p ON pf.project_id = p.id
      WHERE pf.id = $1 AND (
        p.user_id = $2 OR
        EXISTS(SELECT 1 FROM collaborations c WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
      )
    `, [fileId, userId])

    if (fileCheck.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or access denied' })
    }

    // Get state history with user details
    const historyResult = await pool.query(`
      SELECT
        wsh.*,
        u.name as changed_by_name,
        u.email as changed_by_email,
        fv.version_number
      FROM workflow_state_history wsh
      LEFT JOIN users u ON wsh.changed_by = u.id
      LEFT JOIN file_versions fv ON wsh.version_id = fv.id
      WHERE wsh.file_id = $1
      ORDER BY wsh.changed_at DESC
    `, [fileId])

    res.json({
      success: true,
      state_history: historyResult.rows
    })

  } catch (error) {
    console.error('Get state history error:', error)
    res.status(500).json({
      error: 'Failed to fetch workflow state history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/workflow/external-access - Generate external access token
// =====================================================
router.post('/external-access', authenticateToken, workflowLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      project_id,
      file_id,
      section_id,
      collaborator_email,
      collaborator_name,
      access_level = 'view_comment',
      expires_in_days = 7
    } = req.body

    // Verify project ownership
    const projectCheck = await pool.query(
      `SELECT id FROM projects WHERE id = $1 AND user_id = $2`,
      [project_id, userId]
    )

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only project owners can generate external access tokens' })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    const tokenResult = await pool.query(`
      INSERT INTO external_access_tokens
      (token_hash, project_id, file_id, section_id, access_level, collaborator_email, collaborator_name, invited_by, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, expires_at, created_at
    `, [tokenHash, project_id, file_id, section_id, access_level, collaborator_email, collaborator_name, userId, expiresAt])

    // Log activity
    await logActivity(userId, 'external_access_generated', 'project', project_id, {
      collaborator_email,
      access_level,
      expires_at: expiresAt
    })

    res.json({
      success: true,
      token,
      access_info: tokenResult.rows[0],
      access_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/external/${token}`,
      message: 'External access token generated successfully'
    })

  } catch (error) {
    console.error('Generate external access error:', error)
    res.status(500).json({
      error: 'Failed to generate external access token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router