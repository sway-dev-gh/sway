const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  requirePermission,
  requireAgentManagement,
  requirePromptApproval,
  requirePromptExecution,
  requireAnalyticsAccess,
  checkPromptingAccess,
  assignUserPermissions,
  revokeUserPermissions,
  getUserPermissions
} = require('../middleware/promptingPermissions')
const { config } = require('../config/promptingConfig')
const { getPromptingAIService } = require('../services/promptingAIService')

// Get realtime service instance for WebSocket broadcasts
let realtimeService = null
const setRealtimeService = (service) => {
  realtimeService = service
}

module.exports.setRealtimeService = setRealtimeService

// GET /api/prompting/agents - Get all prompting agents
router.get('/agents', authenticateToken, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const query = `
      SELECT
        pa.id,
        pa.agent_name,
        pa.expertise_areas,
        pa.status,
        pa.max_concurrent_workspaces,
        pa.response_time_avg,
        pa.created_at,
        u.name as user_name,
        u.email as user_email
      FROM prompting_agents pa
      LEFT JOIN users u ON pa.user_id = u.id
      WHERE pa.status != 'inactive'
      ORDER BY pa.created_at DESC
    `

    const result = await pool.query(query)

    res.json({
      success: true,
      agents: result.rows
    })
  } catch (error) {
    console.error('Failed to fetch prompting agents:', error)
    res.status(500).json({
      error: 'Failed to fetch prompting agents'
    })
  }
})

// GET /api/prompting/stats - Get dashboard statistics
router.get('/stats', authenticateToken, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { workspace_id } = req.query

    // Get total prompts count
    let totalPromptsQuery = `
      SELECT COUNT(*) as total_prompts
      FROM ai_prompts ap
      WHERE (ap.user_id = $1 OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ap.workspace_id
        AND (p.created_by = $1 OR EXISTS (
          SELECT 1 FROM collaborations c
          WHERE c.project_id = p.id AND c.collaborator_id = $1
        ))
      ))
    `

    // Get pending review count
    let pendingReviewQuery = `
      SELECT COUNT(*) as pending_review
      FROM ai_prompts ap
      WHERE ap.status IN ('pending', 'agent_review')
      AND (ap.user_id = $1 OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ap.workspace_id
        AND (p.created_by = $1 OR EXISTS (
          SELECT 1 FROM collaborations c
          WHERE c.project_id = p.id AND c.collaborator_id = $1
        ))
      ))
    `

    // Get active agents count
    let activeAgentsQuery = `
      SELECT COUNT(*) as active_agents
      FROM prompting_agents pa
      WHERE pa.status = 'active'
    `

    // Get available agents count (not assigned to this user's workspaces)
    let availableAgentsQuery = `
      SELECT COUNT(*) as available_agents
      FROM prompting_agents pa
      WHERE pa.status = 'active'
      AND pa.max_concurrent_workspaces > 0
    `

    const queryParams = [req.user.userId]

    // Add workspace filter if provided
    if (workspace_id) {
      totalPromptsQuery += ` AND ap.workspace_id = $2::UUID`
      pendingReviewQuery += ` AND ap.workspace_id = $2::UUID`
      queryParams.push(workspace_id)
    }

    const [totalPromptsResult, pendingReviewResult, activeAgentsResult, availableAgentsResult] = await Promise.all([
      pool.query(totalPromptsQuery, queryParams),
      pool.query(pendingReviewQuery, queryParams),
      pool.query(activeAgentsQuery),
      pool.query(availableAgentsQuery)
    ])

    const stats = {
      totalPrompts: parseInt(totalPromptsResult.rows[0].total_prompts) || 0,
      pendingReview: parseInt(pendingReviewResult.rows[0].pending_review) || 0,
      activeAgents: parseInt(activeAgentsResult.rows[0].active_agents) || 0,
      availableAgents: parseInt(availableAgentsResult.rows[0].available_agents) || 0
    }

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Failed to fetch prompting stats:', error)
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics'
    })
  }
})

// POST /api/prompting/agents - Create a new prompting agent
router.post('/agents', authenticateToken, requireAgentManagement, async (req, res) => {
  try {
    const { agent_name, expertise_areas, max_concurrent_workspaces = 5 } = req.body

    if (!agent_name || !expertise_areas || !Array.isArray(expertise_areas)) {
      return res.status(400).json({
        error: 'Agent name and expertise areas are required'
      })
    }

    const query = `
      INSERT INTO prompting_agents (
        user_id, agent_name, expertise_areas, status, max_concurrent_workspaces
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const values = [
      req.user.userId,
      agent_name,
      expertise_areas,
      'active',
      max_concurrent_workspaces
    ]

    const result = await pool.query(query, values)

    res.json({
      success: true,
      agent: result.rows[0]
    })
  } catch (error) {
    console.error('Failed to create prompting agent:', error)
    res.status(500).json({
      error: 'Failed to create prompting agent'
    })
  }
})

// GET /api/prompting/prompts - Get prompts for current user/workspace
router.get('/prompts', authenticateToken, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { workspace_id, status, limit = 50 } = req.query

    let query = `
      SELECT
        ap.id,
        ap.workspace_id,
        ap.user_id,
        ap.agent_id,
        ap.original_prompt,
        ap.optimized_prompt,
        ap.prompt_type,
        ap.context_metadata,
        ap.status,
        ap.priority,
        ap.submitted_at,
        ap.agent_reviewed_at,
        ap.executed_at,
        ap.completed_at,
        ap.ai_response,
        ap.execution_time_ms,
        ap.tokens_used,
        ap.created_at,
        pa.agent_name,
        u.name as user_name
      FROM ai_prompts ap
      LEFT JOIN prompting_agents pa ON ap.agent_id = pa.id
      LEFT JOIN users u ON ap.user_id = u.id
      WHERE (ap.user_id = $1 OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ap.workspace_id
        AND (p.created_by = $1 OR EXISTS (
          SELECT 1 FROM collaborations c
          WHERE c.project_id = p.id AND c.collaborator_id = $1
        ))
      ))
    `

    const queryParams = [req.user.userId]
    let paramIndex = 2

    if (workspace_id) {
      query += ` AND ap.workspace_id = $${paramIndex}::UUID`
      queryParams.push(workspace_id)
      paramIndex++
    }

    if (status) {
      query += ` AND ap.status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    query += ` ORDER BY ap.submitted_at DESC LIMIT $${paramIndex}`
    queryParams.push(limit)

    const result = await pool.query(query, queryParams)

    res.json({
      success: true,
      prompts: result.rows
    })
  } catch (error) {
    console.error('Failed to fetch prompts:', error)
    res.status(500).json({
      error: 'Failed to fetch prompts'
    })
  }
})

// POST /api/prompting/prompts - Submit a new prompt
router.post('/prompts', authenticateToken, requirePermission(PERMISSIONS.EDIT_PROMPTS), async (req, res) => {
  try {
    const {
      workspace_id,
      original_prompt,
      prompt_type = 'general',
      priority = 'medium',
      context_metadata = {}
    } = req.body

    if (!original_prompt || original_prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Prompt text is required'
      })
    }

    if (original_prompt.length > 4000) {
      return res.status(400).json({
        error: 'Prompt text cannot exceed 4000 characters'
      })
    }

    // If no workspace_id provided, try to get user's default workspace
    let finalWorkspaceId = workspace_id
    if (!finalWorkspaceId) {
      const workspaceQuery = `
        SELECT id FROM projects
        WHERE created_by = $1
        ORDER BY created_at DESC
        LIMIT 1
      `
      const workspaceResult = await pool.query(workspaceQuery, [req.user.userId])
      if (workspaceResult.rows.length > 0) {
        finalWorkspaceId = workspaceResult.rows[0].id
      } else {
        return res.status(400).json({
          error: 'No workspace found. Please create a workspace first.'
        })
      }
    }

    const insertQuery = `
      INSERT INTO ai_prompts (
        workspace_id, user_id, original_prompt, prompt_type,
        context_metadata, status, priority, submitted_at
      ) VALUES ($1::UUID, $2::UUID, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `

    const values = [
      finalWorkspaceId,
      req.user.userId,
      original_prompt.trim(),
      prompt_type,
      JSON.stringify(context_metadata),
      'pending',
      priority
    ]

    const result = await pool.query(insertQuery, values)
    const newPrompt = result.rows[0]

    // Log the activity
    const logQuery = `
      INSERT INTO prompting_logs (
        workspace_id, prompt_id, user_id, action, description,
        workflow_context, activity_pattern, metadata
      ) VALUES ($1::UUID, $2::UUID, $3::UUID, $4, $5, $6, $7, $8)
    `

    const logValues = [
      finalWorkspaceId,
      newPrompt.id,
      req.user.userId,
      'prompt_submitted',
      `User submitted a new ${prompt_type} prompt`,
      'prompt_submission',
      'user_workflow',
      JSON.stringify({
        prompt_type,
        priority,
        prompt_length: original_prompt.length
      })
    ]

    await pool.query(logQuery, logValues)

    // Broadcast real-time update to workspace
    if (realtimeService) {
      realtimeService.io.emit('prompt-submitted', {
        promptData: newPrompt,
        workspaceId: finalWorkspaceId
      })
    }

    res.json({
      success: true,
      prompt: newPrompt
    })
  } catch (error) {
    console.error('Failed to submit prompt:', error)
    res.status(500).json({
      error: 'Failed to submit prompt'
    })
  }
})

// PUT /api/prompting/prompts/:id - Update a prompt (for agent optimization, approval, etc.)
router.put('/prompts/:id', authenticateToken, checkPromptingAccess(), async (req, res) => {
  try {
    const { id } = req.params
    const {
      optimized_prompt,
      status,
      agent_id,
      ai_response,
      execution_time_ms,
      tokens_used
    } = req.body

    // First check if user has permission to update this prompt
    const permissionQuery = `
      SELECT ap.*, pa.user_id as agent_user_id
      FROM ai_prompts ap
      LEFT JOIN prompting_agents pa ON ap.agent_id = pa.id
      WHERE ap.id = $1::UUID
      AND (ap.user_id = $2::UUID OR pa.user_id = $2::UUID OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ap.workspace_id
        AND p.created_by = $2::UUID
      ))
    `

    const permissionResult = await pool.query(permissionQuery, [id, req.user.userId])

    if (permissionResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Permission denied: Cannot update this prompt'
      })
    }

    const currentPrompt = permissionResult.rows[0]

    // Check specific permissions based on action
    if (status === 'approved' || status === 'rejected') {
      if (!req.userPermissions.includes(PERMISSIONS.APPROVE_PROMPTS)) {
        return res.status(403).json({
          error: 'Access denied: Cannot approve/reject prompts',
          code: 'APPROVAL_PERMISSION_DENIED'
        })
      }
    }

    if (ai_response || execution_time_ms || tokens_used) {
      if (!req.userPermissions.includes(PERMISSIONS.EXECUTE_PROMPTS)) {
        return res.status(403).json({
          error: 'Access denied: Cannot execute prompts',
          code: 'EXECUTION_PERMISSION_DENIED'
        })
      }
    }

    // Build update query dynamically
    let updateFields = []
    let updateValues = []
    let paramIndex = 1

    if (optimized_prompt !== undefined) {
      updateFields.push(`optimized_prompt = $${paramIndex}`)
      updateValues.push(optimized_prompt)
      paramIndex++
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      updateValues.push(status)
      paramIndex++

      // Update timestamp based on status
      if (status === 'agent_review') {
        updateFields.push(`agent_reviewed_at = NOW()`)
      } else if (status === 'executed') {
        updateFields.push(`executed_at = NOW()`)
      } else if (status === 'approved' || status === 'rejected') {
        updateFields.push(`completed_at = NOW()`)
      }
    }

    if (agent_id !== undefined) {
      updateFields.push(`agent_id = $${paramIndex}::UUID`)
      updateValues.push(agent_id)
      paramIndex++
    }

    if (ai_response !== undefined) {
      updateFields.push(`ai_response = $${paramIndex}`)
      updateValues.push(ai_response)
      paramIndex++
    }

    if (execution_time_ms !== undefined) {
      updateFields.push(`execution_time_ms = $${paramIndex}`)
      updateValues.push(execution_time_ms)
      paramIndex++
    }

    if (tokens_used !== undefined) {
      updateFields.push(`tokens_used = $${paramIndex}`)
      updateValues.push(tokens_used)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      })
    }

    // Handle AI execution when prompt is approved
    if (status === 'approved') {
      try {
        const promptingAI = getPromptingAIService()

        // Check if AI service is configured
        const aiStatus = promptingAI.getStatus()
        if (!aiStatus.isConfigured) {
          return res.status(503).json({
            error: 'AI service not configured. Please set OPENAI_API_KEY.',
            code: 'AI_SERVICE_NOT_CONFIGURED'
          })
        }

        // Prepare prompt data for execution
        const promptData = {
          id: currentPrompt.id,
          workspace_id: currentPrompt.workspace_id,
          user_id: currentPrompt.user_id,
          optimized_prompt: optimized_prompt || currentPrompt.optimized_prompt,
          original_prompt: currentPrompt.original_prompt,
          prompt_type: currentPrompt.prompt_type || 'general',
          priority: currentPrompt.priority || 'medium',
          context_metadata: currentPrompt.context_metadata
        }

        console.log(`[Prompting] Executing AI prompt for ${promptData.id}`)

        // Execute the prompt through AI service
        const executionResult = await promptingAI.executePrompt(promptData)

        // Update fields with execution results
        updateFields.push(`ai_response = $${paramIndex}`)
        updateValues.push(executionResult.response)
        paramIndex++

        updateFields.push(`execution_time_ms = $${paramIndex}`)
        updateValues.push(executionResult.executionTime)
        paramIndex++

        updateFields.push(`tokens_used = $${paramIndex}`)
        updateValues.push(executionResult.tokensUsed)
        paramIndex++

        // Change status to executed since we successfully ran the AI
        const statusIndex = updateFields.findIndex(field => field.includes('status ='))
        if (statusIndex !== -1) {
          updateFields[statusIndex] = `status = $${updateValues[statusIndex]}`
          updateValues[updateValues.findIndex(val => val === 'approved')] = 'executed'
        }

        updateFields.push(`executed_at = NOW()`)

        console.log(`[Prompting] AI execution completed for ${promptData.id}: ${executionResult.tokensUsed} tokens, ${executionResult.executionTime}ms`)

      } catch (aiError) {
        console.error(`[Prompting] AI execution failed for prompt ${id}:`, aiError)

        // Update status to reflect execution failure
        const statusIndex = updateFields.findIndex(field => field.includes('status ='))
        if (statusIndex !== -1) {
          updateValues[updateValues.findIndex(val => val === 'approved')] = 'rejected'
        }

        // Add error information
        updateFields.push(`ai_response = $${paramIndex}`)
        updateValues.push(`Error: ${aiError.message}`)
        paramIndex++

        // Log the failure but don't return error - we'll still update the prompt with error info
      }
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(id)

    const updateQuery = `
      UPDATE ai_prompts
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}::UUID
      RETURNING *
    `

    const result = await pool.query(updateQuery, updateValues)
    const updatedPrompt = result.rows[0]

    // Log the activity
    let action = 'prompt_updated'
    let description = 'Prompt was updated'

    if (status === 'agent_review') {
      action = 'agent_assigned'
      description = 'Agent assigned to review prompt'
    } else if (status === 'optimized') {
      action = 'prompt_optimized'
      description = 'Prompt was optimized by agent'
    } else if (status === 'approved') {
      // Check if we actually executed (status might have changed to 'executed')
      const finalStatus = updateValues[updateValues.length - 2] // Last value before ID
      if (finalStatus === 'executed') {
        action = 'ai_executed'
        description = 'AI prompt was executed successfully'
      } else if (finalStatus === 'rejected') {
        action = 'ai_execution_failed'
        description = 'AI prompt execution failed'
      } else {
        action = 'prompt_approved'
        description = 'Prompt was approved for execution'
      }
    } else if (status === 'executed') {
      action = 'ai_executed'
      description = 'AI prompt was executed'
    } else if (status === 'rejected') {
      action = 'prompt_rejected'
      description = 'Prompt was rejected'
    }

    const logQuery = `
      INSERT INTO prompting_logs (
        workspace_id, prompt_id, agent_id, user_id, action, description,
        workflow_context, activity_pattern, metadata
      ) VALUES ($1::UUID, $2::UUID, $3::UUID, $4::UUID, $5, $6, $7, $8, $9)
    `

    const logValues = [
      currentPrompt.workspace_id,
      updatedPrompt.id,
      agent_id || currentPrompt.agent_id,
      req.user.userId,
      action,
      description,
      'prompt_lifecycle',
      'agent_workflow',
      JSON.stringify({
        previous_status: currentPrompt.status,
        new_status: status,
        execution_time_ms,
        tokens_used
      })
    ]

    await pool.query(logQuery, logValues)

    // Broadcast real-time update to workspace
    if (realtimeService) {
      realtimeService.io.emit('prompt-status-update', {
        promptId: updatedPrompt.id,
        oldStatus: currentPrompt.status,
        newStatus: status,
        workspaceId: currentPrompt.workspace_id,
        promptData: updatedPrompt
      })
    }

    res.json({
      success: true,
      prompt: updatedPrompt
    })
  } catch (error) {
    console.error('Failed to update prompt:', error)
    res.status(500).json({
      error: 'Failed to update prompt'
    })
  }
})

// GET /api/prompting/workspace-config - Get workspace prompting configuration
router.get('/workspace-config', authenticateToken, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { workspace_id } = req.query

    let query = `
      SELECT
        wpc.*,
        pa.agent_name,
        p.title as workspace_name
      FROM workspace_prompting_config wpc
      LEFT JOIN prompting_agents pa ON wpc.assigned_agent_id = pa.id
      LEFT JOIN projects p ON wpc.workspace_id = p.id
      WHERE EXISTS (
        SELECT 1 FROM projects pr
        WHERE pr.id = wpc.workspace_id
        AND (pr.created_by = $1::UUID OR EXISTS (
          SELECT 1 FROM collaborations c
          WHERE c.project_id = pr.id AND c.collaborator_id = $1::UUID
        ))
      )
    `

    const queryParams = [req.user.userId]

    if (workspace_id) {
      query += ` AND wpc.workspace_id = $2::UUID`
      queryParams.push(workspace_id)
    }

    query += ` ORDER BY wpc.created_at DESC`

    const result = await pool.query(query, queryParams)

    res.json({
      success: true,
      configs: result.rows,
      config: result.rows[0] || null // Return first config for single workspace
    })
  } catch (error) {
    console.error('Failed to fetch workspace config:', error)
    res.status(500).json({
      error: 'Failed to fetch workspace configuration'
    })
  }
})

// GET /api/prompting/activity - Get prompting activity logs
router.get('/activity', authenticateToken, requirePermission(PERMISSIONS.VIEW_LOGS), async (req, res) => {
  try {
    const {
      workspace_id,
      prompt_id,
      agent_id,
      action,
      limit = 50,
      since
    } = req.query

    let query = `
      SELECT
        pl.*,
        pa.agent_name,
        u.name as user_name,
        p.title as workspace_name
      FROM prompting_logs pl
      LEFT JOIN prompting_agents pa ON pl.agent_id = pa.id
      LEFT JOIN users u ON pl.user_id = u.id
      LEFT JOIN projects p ON pl.workspace_id = p.id
      WHERE EXISTS (
        SELECT 1 FROM projects pr
        WHERE pr.id = pl.workspace_id
        AND (pr.created_by = $1::UUID OR EXISTS (
          SELECT 1 FROM collaborations c
          WHERE c.project_id = pr.id AND c.collaborator_id = $1::UUID
        ))
      )
    `

    const queryParams = [req.user.userId]
    let paramIndex = 2

    if (workspace_id) {
      query += ` AND pl.workspace_id = $${paramIndex}::UUID`
      queryParams.push(workspace_id)
      paramIndex++
    }

    if (prompt_id) {
      query += ` AND pl.prompt_id = $${paramIndex}::UUID`
      queryParams.push(prompt_id)
      paramIndex++
    }

    if (agent_id) {
      query += ` AND pl.agent_id = $${paramIndex}::UUID`
      queryParams.push(agent_id)
      paramIndex++
    }

    if (action) {
      query += ` AND pl.action = $${paramIndex}`
      queryParams.push(action)
      paramIndex++
    }

    if (since) {
      query += ` AND pl.created_at > $${paramIndex}`
      queryParams.push(since)
      paramIndex++
    }

    query += ` ORDER BY pl.created_at DESC LIMIT $${paramIndex}`
    queryParams.push(limit)

    const result = await pool.query(query, queryParams)

    res.json({
      success: true,
      activities: result.rows
    })
  } catch (error) {
    console.error('Failed to fetch activity logs:', error)
    res.status(500).json({
      error: 'Failed to fetch activity logs'
    })
  }
})

// Permission Management Routes

// GET /api/prompting/permissions - Get user permissions in workspace
router.get('/permissions', authenticateToken, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const { workspace_id } = req.query
    const permissions = await getUserPermissions(req.user.userId, workspace_id)

    res.json({
      success: true,
      permissions,
      userPermissions: req.userPermissions,
      availablePermissions: PERMISSIONS,
      rolePermissions: ROLE_PERMISSIONS
    })
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
    res.status(500).json({
      error: 'Failed to fetch permissions'
    })
  }
})

// POST /api/prompting/permissions - Assign permissions to user
router.post('/permissions', authenticateToken, requirePermission(PERMISSIONS.WORKSPACE_ADMIN), async (req, res) => {
  try {
    const { user_id, workspace_id, permissions, agent_id } = req.body

    if (!user_id || !workspace_id || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        error: 'User ID, workspace ID, and permissions array are required'
      })
    }

    // Validate permissions
    const validPermissions = Object.values(PERMISSIONS)
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        error: `Invalid permissions: ${invalidPermissions.join(', ')}`
      })
    }

    const assignedPermissions = await assignUserPermissions(user_id, workspace_id, permissions, agent_id)

    // Log the activity
    const logQuery = `
      INSERT INTO prompting_logs (
        workspace_id, user_id, action, description,
        workflow_context, activity_pattern, metadata
      ) VALUES ($1::UUID, $2::UUID, $3, $4, $5, $6, $7)
    `

    const logValues = [
      workspace_id,
      req.user.userId,
      'permissions_assigned',
      `Permissions assigned to user`,
      'permission_management',
      'admin_workflow',
      JSON.stringify({
        target_user_id: user_id,
        permissions,
        agent_id
      })
    ]

    await pool.query(logQuery, logValues)

    // Broadcast real-time update
    if (realtimeService) {
      realtimeService.io.emit('permissions-updated', {
        workspaceId: workspace_id,
        targetUserId: user_id,
        permissions,
        action: 'assigned'
      })
    }

    res.json({
      success: true,
      permissions: assignedPermissions
    })
  } catch (error) {
    console.error('Failed to assign permissions:', error)
    res.status(500).json({
      error: 'Failed to assign permissions'
    })
  }
})

// DELETE /api/prompting/permissions - Revoke permissions from user
router.delete('/permissions', authenticateToken, requirePermission(PERMISSIONS.WORKSPACE_ADMIN), async (req, res) => {
  try {
    const { user_id, workspace_id, agent_id } = req.body

    if (!user_id || !workspace_id) {
      return res.status(400).json({
        error: 'User ID and workspace ID are required'
      })
    }

    const revokedPermissions = await revokeUserPermissions(user_id, workspace_id, agent_id)

    // Log the activity
    const logQuery = `
      INSERT INTO prompting_logs (
        workspace_id, user_id, action, description,
        workflow_context, activity_pattern, metadata
      ) VALUES ($1::UUID, $2::UUID, $3, $4, $5, $6, $7)
    `

    const logValues = [
      workspace_id,
      req.user.userId,
      'permissions_revoked',
      `Permissions revoked from user`,
      'permission_management',
      'admin_workflow',
      JSON.stringify({
        target_user_id: user_id,
        agent_id
      })
    ]

    await pool.query(logQuery, logValues)

    // Broadcast real-time update
    if (realtimeService) {
      realtimeService.io.emit('permissions-updated', {
        workspaceId: workspace_id,
        targetUserId: user_id,
        action: 'revoked'
      })
    }

    res.json({
      success: true,
      revokedPermissions
    })
  } catch (error) {
    console.error('Failed to revoke permissions:', error)
    res.status(500).json({
      error: 'Failed to revoke permissions'
    })
  }
})

// POST /api/prompting/permissions/role - Assign role-based permissions
router.post('/permissions/role', authenticateToken, requirePermission(PERMISSIONS.WORKSPACE_ADMIN), async (req, res) => {
  try {
    const { user_id, workspace_id, role, agent_id } = req.body

    if (!user_id || !workspace_id || !role) {
      return res.status(400).json({
        error: 'User ID, workspace ID, and role are required'
      })
    }

    if (!ROLE_PERMISSIONS[role]) {
      return res.status(400).json({
        error: `Invalid role: ${role}. Valid roles: ${Object.keys(ROLE_PERMISSIONS).join(', ')}`
      })
    }

    const permissions = ROLE_PERMISSIONS[role]
    const assignedPermissions = await assignUserPermissions(user_id, workspace_id, permissions, agent_id)

    // Log the activity
    const logQuery = `
      INSERT INTO prompting_logs (
        workspace_id, user_id, action, description,
        workflow_context, activity_pattern, metadata
      ) VALUES ($1::UUID, $2::UUID, $3, $4, $5, $6, $7)
    `

    const logValues = [
      workspace_id,
      req.user.userId,
      'role_assigned',
      `Role '${role}' assigned to user`,
      'permission_management',
      'admin_workflow',
      JSON.stringify({
        target_user_id: user_id,
        role,
        permissions,
        agent_id
      })
    ]

    await pool.query(logQuery, logValues)

    // Broadcast real-time update
    if (realtimeService) {
      realtimeService.io.emit('role-assigned', {
        workspaceId: workspace_id,
        targetUserId: user_id,
        role,
        permissions
      })
    }

    res.json({
      success: true,
      role,
      permissions: assignedPermissions
    })
  } catch (error) {
    console.error('Failed to assign role:', error)
    res.status(500).json({
      error: 'Failed to assign role'
    })
  }
})

// AI Service Management Routes

// GET /api/prompting/ai/status - Get AI service status
router.get('/ai/status', authenticateToken, requirePermission(PERMISSIONS.VIEW_DASHBOARD), async (req, res) => {
  try {
    const promptingAI = getPromptingAIService()
    const status = promptingAI.getStatus()

    res.json({
      success: true,
      status
    })
  } catch (error) {
    console.error('Failed to get AI service status:', error)
    res.status(500).json({
      error: 'Failed to get AI service status',
      details: error.message
    })
  }
})

// POST /api/prompting/ai/test - Test AI service connection
router.post('/ai/test', authenticateToken, requirePermission(PERMISSIONS.EXECUTE_PROMPTS), async (req, res) => {
  try {
    const promptingAI = getPromptingAIService()
    const testResult = await promptingAI.testConnection()

    if (testResult.success) {
      // Log successful test
      const logQuery = `
        INSERT INTO prompting_logs (
          user_id, action, description, workflow_context, activity_pattern, metadata
        ) VALUES ($1::UUID, $2, $3, $4, $5, $6)
      `

      const logValues = [
        req.user.userId,
        'ai_test_success',
        'AI service connection test successful',
        'ai_testing',
        'admin_workflow',
        JSON.stringify({
          model: testResult.model,
          responseTime: testResult.responseTime,
          tokensUsed: testResult.tokensUsed
        })
      ]

      await pool.query(logQuery, logValues)
    }

    res.json({
      success: true,
      testResult
    })
  } catch (error) {
    console.error('AI service test failed:', error)

    // Log failed test
    try {
      const logQuery = `
        INSERT INTO prompting_logs (
          user_id, action, description, workflow_context, activity_pattern, metadata
        ) VALUES ($1::UUID, $2, $3, $4, $5, $6)
      `

      const logValues = [
        req.user.userId,
        'ai_test_failed',
        'AI service connection test failed',
        'ai_testing',
        'admin_workflow',
        JSON.stringify({
          error: error.message
        })
      ]

      await pool.query(logQuery, logValues)
    } catch (logError) {
      console.error('Failed to log AI test failure:', logError)
    }

    res.status(503).json({
      success: false,
      error: 'AI service test failed',
      details: error.message
    })
  }
})

// POST /api/prompting/prompts/:id/execute - Manually execute a specific prompt
router.post('/prompts/:id/execute', authenticateToken, requirePromptExecution, async (req, res) => {
  try {
    const { id } = req.params

    // Get the prompt data
    const promptQuery = `
      SELECT ap.*, pa.user_id as agent_user_id
      FROM ai_prompts ap
      LEFT JOIN prompting_agents pa ON ap.agent_id = pa.id
      WHERE ap.id = $1::UUID
      AND (ap.user_id = $2::UUID OR pa.user_id = $2::UUID OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = ap.workspace_id
        AND p.created_by = $2::UUID
      ))
    `

    const promptResult = await pool.query(promptQuery, [id, req.user.userId])

    if (promptResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Prompt not found or access denied'
      })
    }

    const promptData = promptResult.rows[0]

    // Check if prompt is in a valid state for execution
    if (promptData.status !== 'approved' && promptData.status !== 'rejected') {
      return res.status(400).json({
        error: `Cannot execute prompt in '${promptData.status}' status. Prompt must be approved.`,
        code: 'INVALID_PROMPT_STATUS'
      })
    }

    const promptingAI = getPromptingAIService()

    // Check if AI service is configured
    const aiStatus = promptingAI.getStatus()
    if (!aiStatus.isConfigured) {
      return res.status(503).json({
        error: 'AI service not configured. Please set OPENAI_API_KEY.',
        code: 'AI_SERVICE_NOT_CONFIGURED'
      })
    }

    console.log(`[Prompting] Manual execution requested for prompt ${id}`)

    // Execute the prompt
    const executionResult = await promptingAI.executePrompt({
      id: promptData.id,
      workspace_id: promptData.workspace_id,
      user_id: promptData.user_id,
      optimized_prompt: promptData.optimized_prompt,
      original_prompt: promptData.original_prompt,
      prompt_type: promptData.prompt_type || 'general',
      priority: promptData.priority || 'medium',
      context_metadata: promptData.context_metadata
    })

    // Update the prompt with execution results
    const updateQuery = `
      UPDATE ai_prompts
      SET status = $1, ai_response = $2, execution_time_ms = $3, tokens_used = $4,
          executed_at = NOW(), updated_at = NOW()
      WHERE id = $5::UUID
      RETURNING *
    `

    const updateValues = [
      'executed',
      executionResult.response,
      executionResult.executionTime,
      executionResult.tokensUsed,
      id
    ]

    const updateResult = await pool.query(updateQuery, updateValues)
    const updatedPrompt = updateResult.rows[0]

    // Log the manual execution
    const logQuery = `
      INSERT INTO prompting_logs (
        workspace_id, prompt_id, user_id, action, description,
        workflow_context, activity_pattern, metadata
      ) VALUES ($1::UUID, $2::UUID, $3::UUID, $4, $5, $6, $7, $8)
    `

    const logValues = [
      promptData.workspace_id,
      id,
      req.user.userId,
      'ai_manual_execution',
      'Prompt manually executed via API',
      'manual_execution',
      'admin_workflow',
      JSON.stringify({
        executionTime: executionResult.executionTime,
        tokensUsed: executionResult.tokensUsed,
        previousStatus: promptData.status
      })
    ]

    await pool.query(logQuery, logValues)

    // Broadcast real-time update
    if (realtimeService) {
      realtimeService.io.emit('prompt-executed', {
        promptId: id,
        workspaceId: promptData.workspace_id,
        promptData: updatedPrompt,
        executionResult
      })
    }

    console.log(`[Prompting] Manual execution completed for ${id}: ${executionResult.tokensUsed} tokens, ${executionResult.executionTime}ms`)

    res.json({
      success: true,
      prompt: updatedPrompt,
      executionResult
    })

  } catch (error) {
    console.error(`[Prompting] Manual execution failed for prompt ${id}:`, error)

    res.status(500).json({
      error: 'Failed to execute prompt',
      details: error.message
    })
  }
})

// Configuration Management Routes

// GET /api/prompting/config - Get frontend-safe configuration
router.get('/config', authenticateToken, async (req, res) => {
  try {
    // Return only safe configuration values for frontend
    const safeConfig = {
      enabled: config.isEnabled(),
      maxPromptLength: config.get('maxPromptLength'),
      requireAgentReview: config.get('requireAgentReview'),
      autoApproveSimple: config.get('autoApproveSimple'),

      prompts: {
        maxLength: config.get('maxPromptLength'),
        allowedTypes: ['general', 'code_review', 'documentation', 'bug_fix', 'optimization', 'testing', 'architecture', 'security'],
        allowedPriorities: ['low', 'medium', 'high', 'urgent'],
        defaultType: 'general',
        defaultPriority: 'medium'
      },

      agents: {
        maxWorkspaces: config.get('agents.maxWorkspaces'),
        responseTimeout: config.get('agents.responseTimeout'),
        loadBalancing: config.get('agents.loadBalancing'),
        autoAssignment: config.get('agents.autoAssignment')
      },

      workflow: {
        stages: config.get('workflow.stages'),
        notifications: {
          enabled: config.get('workflow.notifications.enabled'),
          channels: config.get('workflow.notifications.channels')
        }
      },

      ui: {
        realTimeEnabled: true,
        autoRefreshInterval: 30000,
        itemsPerPage: 10
      },

      permissions: {
        available: PERMISSIONS,
        roles: ROLE_PERMISSIONS
      },

      api: {
        timeout: 30000,
        rateLimitEnabled: config.get('security.rateLimiting.enabled')
      },

      development: {
        debug: config.isDevelopment(),
        mockData: config.get('development.mockAgents') || config.get('development.mockAI')
      }
    }

    res.json({
      success: true,
      config: safeConfig,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch configuration:', error)
    res.status(500).json({
      error: 'Failed to fetch configuration'
    })
  }
})

// PUT /api/prompting/config - Update configuration (admin only)
router.put('/config', authenticateToken, requirePermission(PERMISSIONS.WORKSPACE_ADMIN), async (req, res) => {
  try {
    const { updates } = req.body

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        error: 'Updates object is required'
      })
    }

    // Only allow safe configuration updates
    const allowedUpdates = {
      'workflow.notifications.enabled': 'boolean',
      'workflow.notifications.urgentOnly': 'boolean',
      'agents.autoAssignment': 'boolean',
      'agents.loadBalancing': 'string',
      'autoApproveSimple': 'boolean'
    }

    const validUpdates = {}
    const errors = []

    Object.keys(updates).forEach(key => {
      if (allowedUpdates[key]) {
        const expectedType = allowedUpdates[key]
        const value = updates[key]

        if (typeof value === expectedType) {
          validUpdates[key] = value
        } else {
          errors.push(`Invalid type for ${key}: expected ${expectedType}, got ${typeof value}`)
        }
      } else {
        errors.push(`Configuration key '${key}' is not allowed to be updated`)
      }
    })

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Invalid configuration updates',
        details: errors
      })
    }

    // Apply updates
    Object.keys(validUpdates).forEach(key => {
      config.set(key, validUpdates[key])
    })

    // Log the configuration change
    const logQuery = `
      INSERT INTO prompting_logs (
        user_id, action, description, workflow_context, activity_pattern, metadata
      ) VALUES ($1::UUID, $2, $3, $4, $5, $6)
    `

    const logValues = [
      req.user.userId,
      'config_updated',
      'System configuration updated',
      'configuration_management',
      'admin_workflow',
      JSON.stringify({
        updates: validUpdates,
        updatedBy: req.user.userId,
        timestamp: new Date().toISOString()
      })
    ]

    await pool.query(logQuery, logValues)

    // Broadcast configuration update to all connected clients
    if (realtimeService) {
      realtimeService.io.emit('config-updated', {
        updates: validUpdates,
        timestamp: new Date().toISOString()
      })
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      updates: validUpdates
    })
  } catch (error) {
    console.error('Failed to update configuration:', error)
    res.status(500).json({
      error: 'Failed to update configuration'
    })
  }
})

// GET /api/prompting/config/debug - Get full configuration for debugging (admin only)
router.get('/config/debug', authenticateToken, requirePermission(PERMISSIONS.WORKSPACE_ADMIN), async (req, res) => {
  try {
    if (!config.isDevelopment()) {
      return res.status(403).json({
        error: 'Debug configuration is only available in development mode'
      })
    }

    res.json({
      success: true,
      config: config.export(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        isProduction: config.isProduction(),
        isDevelopment: config.isDevelopment(),
        isTest: config.isTest()
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch debug configuration:', error)
    res.status(500).json({
      error: 'Failed to fetch debug configuration'
    })
  }
})

// POST /api/prompting/config/validate - Validate configuration
router.post('/config/validate', authenticateToken, requirePermission(PERMISSIONS.WORKSPACE_ADMIN), async (req, res) => {
  try {
    const { configToValidate } = req.body

    if (!configToValidate) {
      return res.status(400).json({
        error: 'Configuration to validate is required'
      })
    }

    // Create temporary config instance for validation
    const { PromptingConfig } = require('../config/promptingConfig')
    try {
      const tempConfig = new PromptingConfig()
      tempConfig.updateConfig(configToValidate)

      res.json({
        success: true,
        valid: true,
        message: 'Configuration is valid'
      })
    } catch (validationError) {
      res.json({
        success: true,
        valid: false,
        errors: [validationError.message]
      })
    }
  } catch (error) {
    console.error('Failed to validate configuration:', error)
    res.status(500).json({
      error: 'Failed to validate configuration'
    })
  }
})

module.exports = router
module.exports.setRealtimeService = setRealtimeService