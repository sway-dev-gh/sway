const pool = require('../db/pool')

/**
 * Permission levels for Prompting Agents
 */
const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_PROMPTS: 'edit_prompts',
  APPROVE_PROMPTS: 'approve_prompts',
  MANAGE_AGENTS: 'manage_agents',
  ACCESS_ANALYTICS: 'access_analytics',
  VIEW_LOGS: 'view_logs',
  EXECUTE_PROMPTS: 'execute_prompts',
  WORKSPACE_ADMIN: 'workspace_admin'
}

/**
 * Role-based permission sets
 */
const ROLE_PERMISSIONS = {
  viewer: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS],
  reviewer: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS, PERMISSIONS.EDIT_PROMPTS, PERMISSIONS.ACCESS_ANALYTICS],
  approver: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS, PERMISSIONS.EDIT_PROMPTS, PERMISSIONS.APPROVE_PROMPTS, PERMISSIONS.ACCESS_ANALYTICS],
  agent: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS, PERMISSIONS.EDIT_PROMPTS, PERMISSIONS.APPROVE_PROMPTS, PERMISSIONS.EXECUTE_PROMPTS, PERMISSIONS.ACCESS_ANALYTICS],
  admin: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS, PERMISSIONS.EDIT_PROMPTS, PERMISSIONS.APPROVE_PROMPTS, PERMISSIONS.EXECUTE_PROMPTS, PERMISSIONS.MANAGE_AGENTS, PERMISSIONS.ACCESS_ANALYTICS, PERMISSIONS.WORKSPACE_ADMIN]
}

/**
 * Check if user has permission to access prompting features in workspace
 */
const checkPromptingAccess = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId
      const workspaceId = req.query.workspace_id || req.body.workspace_id || req.params.workspace_id

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        })
      }

      // Check if user is workspace owner/creator (full access)
      if (workspaceId) {
        const ownerQuery = `
          SELECT 1 FROM projects
          WHERE id = $1::UUID AND created_by = $2::UUID
        `
        const ownerResult = await pool.query(ownerQuery, [workspaceId, userId])

        if (ownerResult.rows.length > 0) {
          req.userPermissions = Object.values(PERMISSIONS) // Full access for owners
          return next()
        }

        // Check if user is workspace collaborator
        const collaboratorQuery = `
          SELECT c.role, c.permissions
          FROM collaborations c
          WHERE c.project_id = $1::UUID AND c.collaborator_id = $2::UUID AND c.status = 'active'
        `
        const collaboratorResult = await pool.query(collaboratorQuery, [workspaceId, userId])

        if (collaboratorResult.rows.length === 0) {
          return res.status(403).json({
            error: 'Access denied: Not a workspace member',
            code: 'WORKSPACE_ACCESS_DENIED'
          })
        }
      }

      // Get user's prompting permissions
      const permissionQuery = `
        SELECT
          pap.permissions,
          pa.status as agent_status,
          wpc.agent_permissions,
          wpc.workflow_settings
        FROM prompting_agent_permissions pap
        LEFT JOIN prompting_agents pa ON pap.agent_id = pa.id
        LEFT JOIN workspace_prompting_config wpc ON pap.workspace_id = wpc.workspace_id
        WHERE pap.user_id = $1::UUID
        ${workspaceId ? 'AND pap.workspace_id = $2::UUID' : ''}
        AND pap.is_active = true
      `

      const queryParams = workspaceId ? [userId, workspaceId] : [userId]
      const result = await pool.query(permissionQuery, queryParams)

      // Collect all permissions from different sources
      let userPermissions = []

      if (result.rows.length > 0) {
        // Aggregate permissions from all sources
        result.rows.forEach(row => {
          if (row.permissions && Array.isArray(row.permissions)) {
            userPermissions = [...userPermissions, ...row.permissions]
          }
          if (row.agent_permissions && Array.isArray(row.agent_permissions)) {
            userPermissions = [...userPermissions, ...row.agent_permissions]
          }
        })

        // Remove duplicates
        userPermissions = [...new Set(userPermissions)]
      } else {
        // Default permissions for workspace members (if no specific prompting permissions set)
        userPermissions = ROLE_PERMISSIONS.viewer
      }

      // Check if user has the required permission
      if (requiredPermission && !userPermissions.includes(requiredPermission)) {
        return res.status(403).json({
          error: `Access denied: Missing permission '${requiredPermission}'`,
          code: 'PERMISSION_DENIED',
          requiredPermission,
          userPermissions
        })
      }

      // Attach permissions to request for use in route handlers
      req.userPermissions = userPermissions
      next()

    } catch (error) {
      console.error('Permission check error:', error)
      res.status(500).json({
        error: 'Failed to check permissions',
        code: 'PERMISSION_CHECK_ERROR'
      })
    }
  }
}

/**
 * Middleware for checking specific prompting permissions
 */
const requirePermission = (permission) => checkPromptingAccess(permission)

/**
 * Check if user can manage agents
 */
const requireAgentManagement = requirePermission(PERMISSIONS.MANAGE_AGENTS)

/**
 * Check if user can approve prompts
 */
const requirePromptApproval = requirePermission(PERMISSIONS.APPROVE_PROMPTS)

/**
 * Check if user can execute prompts
 */
const requirePromptExecution = requirePermission(PERMISSIONS.EXECUTE_PROMPTS)

/**
 * Check if user can access analytics
 */
const requireAnalyticsAccess = requirePermission(PERMISSIONS.ACCESS_ANALYTICS)

/**
 * Assign permissions to a user for a workspace
 */
const assignUserPermissions = async (userId, workspaceId, permissions, agentId = null) => {
  try {
    const insertQuery = `
      INSERT INTO prompting_agent_permissions (
        user_id, workspace_id, agent_id, permissions, granted_by, is_active
      ) VALUES ($1::UUID, $2::UUID, $3::UUID, $4, $1::UUID, true)
      ON CONFLICT (user_id, workspace_id, agent_id)
      DO UPDATE SET
        permissions = EXCLUDED.permissions,
        granted_at = NOW(),
        is_active = true
      RETURNING *
    `

    const values = [userId, workspaceId, agentId, JSON.stringify(permissions)]
    const result = await pool.query(insertQuery, values)
    return result.rows[0]
  } catch (error) {
    console.error('Error assigning permissions:', error)
    throw error
  }
}

/**
 * Revoke permissions from a user
 */
const revokeUserPermissions = async (userId, workspaceId, agentId = null) => {
  try {
    const query = `
      UPDATE prompting_agent_permissions
      SET is_active = false, revoked_at = NOW()
      WHERE user_id = $1::UUID AND workspace_id = $2::UUID
      ${agentId ? 'AND agent_id = $3::UUID' : 'AND agent_id IS NULL'}
      RETURNING *
    `

    const params = agentId ? [userId, workspaceId, agentId] : [userId, workspaceId]
    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error('Error revoking permissions:', error)
    throw error
  }
}

/**
 * Get user's effective permissions in a workspace
 */
const getUserPermissions = async (userId, workspaceId = null) => {
  try {
    const query = `
      SELECT
        pap.*,
        pa.agent_name,
        p.title as workspace_name,
        u_granted.name as granted_by_name
      FROM prompting_agent_permissions pap
      LEFT JOIN prompting_agents pa ON pap.agent_id = pa.id
      LEFT JOIN projects p ON pap.workspace_id = p.id
      LEFT JOIN users u_granted ON pap.granted_by = u_granted.id
      WHERE pap.user_id = $1::UUID AND pap.is_active = true
      ${workspaceId ? 'AND pap.workspace_id = $2::UUID' : ''}
      ORDER BY pap.granted_at DESC
    `

    const params = workspaceId ? [userId, workspaceId] : [userId]
    const result = await pool.query(query, params)
    return result.rows
  } catch (error) {
    console.error('Error getting user permissions:', error)
    throw error
  }
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  checkPromptingAccess,
  requirePermission,
  requireAgentManagement,
  requirePromptApproval,
  requirePromptExecution,
  requireAnalyticsAccess,
  assignUserPermissions,
  revokeUserPermissions,
  getUserPermissions
}