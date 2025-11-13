/**
 * Comprehensive Role-Based Access Control (RBAC) Middleware
 * Enterprise-level authorization and permissions system
 */

const pool = require('../db/pool')

// Define role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  'user': 1,
  'pro_user': 2,
  'team_member': 3,
  'team_admin': 4,
  'moderator': 5,
  'admin': 6,
  'super_admin': 7
}

// Define permissions for different actions
const PERMISSIONS = {
  // User management
  'user:read': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'user:update_self': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'user:update_others': ['moderator', 'admin', 'super_admin'],
  'user:delete_self': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'user:delete_others': ['admin', 'super_admin'],
  'user:list': ['moderator', 'admin', 'super_admin'],

  // Project management
  'project:create': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'project:read_own': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'project:read_others': ['moderator', 'admin', 'super_admin'],
  'project:update_own': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'project:update_others': ['moderator', 'admin', 'super_admin'],
  'project:delete_own': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'project:delete_others': ['moderator', 'admin', 'super_admin'],
  'project:share': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],

  // Collaboration management
  'collaboration:create': ['pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'collaboration:read': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'collaboration:update': ['team_admin', 'moderator', 'admin', 'super_admin'],
  'collaboration:delete': ['team_admin', 'moderator', 'admin', 'super_admin'],

  // File management
  'file:upload': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'file:download_own': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'file:download_others': ['moderator', 'admin', 'super_admin'],
  'file:delete_own': ['user', 'pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'file:delete_others': ['moderator', 'admin', 'super_admin'],

  // Analytics and reports
  'analytics:view_own': ['pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'analytics:view_team': ['team_admin', 'moderator', 'admin', 'super_admin'],
  'analytics:view_all': ['admin', 'super_admin'],

  // Administrative functions
  'admin:user_management': ['admin', 'super_admin'],
  'admin:system_settings': ['super_admin'],
  'admin:security_logs': ['admin', 'super_admin'],
  'admin:billing': ['admin', 'super_admin'],

  // Rate limits based on plan
  'limits:projects_unlimited': ['pro_user', 'team_member', 'team_admin', 'moderator', 'admin', 'super_admin'],
  'limits:collaborators_unlimited': ['team_admin', 'moderator', 'admin', 'super_admin'],
  'limits:storage_unlimited': ['team_admin', 'moderator', 'admin', 'super_admin']
}

// Rate limits by user plan/role
const RATE_LIMITS = {
  'user': {
    projects: 3,
    collaborators_per_project: 2,
    storage_mb: 100,
    api_calls_per_hour: 100
  },
  'pro_user': {
    projects: -1, // unlimited
    collaborators_per_project: 10,
    storage_mb: 1000,
    api_calls_per_hour: 1000
  },
  'team_member': {
    projects: -1,
    collaborators_per_project: 25,
    storage_mb: 5000,
    api_calls_per_hour: 2000
  },
  'team_admin': {
    projects: -1,
    collaborators_per_project: -1,
    storage_mb: -1,
    api_calls_per_hour: 5000
  },
  'moderator': {
    projects: -1,
    collaborators_per_project: -1,
    storage_mb: -1,
    api_calls_per_hour: 10000
  },
  'admin': {
    projects: -1,
    collaborators_per_project: -1,
    storage_mb: -1,
    api_calls_per_hour: -1
  },
  'super_admin': {
    projects: -1,
    collaborators_per_project: -1,
    storage_mb: -1,
    api_calls_per_hour: -1
  }
}

// Helper function to get user role from database
const getUserRole = async (userId) => {
  try {
    const result = await pool.query('SELECT plan FROM users WHERE id = $1', [userId])
    if (result.rows.length === 0) return null

    // Map plan to role
    const plan = result.rows[0].plan
    const roleMapping = {
      'free': 'user',
      'pro': 'pro_user',
      'team': 'team_member',
      'enterprise': 'team_admin'
    }

    return roleMapping[plan] || 'user'
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

// Helper function to check if user has permission
const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false

  const allowedRoles = PERMISSIONS[permission]
  if (!allowedRoles) return false

  return allowedRoles.includes(userRole)
}

// Helper function to check if user has higher role than target
const hasHigherRole = (userRole, targetRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0
  return userLevel > targetLevel
}

// Main authorization middleware factory
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      // Check for admin override
      if (req.isAdmin) {
        req.userRole = 'super_admin'
        return next()
      }

      // Get user role from database
      const userRole = await getUserRole(userId)
      if (!userRole) {
        return res.status(403).json({ error: 'Unable to determine user permissions' })
      }

      req.userRole = userRole

      // Check permission
      if (!hasPermission(userRole, permission)) {
        await logAuthorizationFailure(userId, permission, userRole, req)
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: permission,
          userRole: userRole
        })
      }

      next()
    } catch (error) {
      console.error('Authorization error:', error)
      res.status(500).json({ error: 'Authorization check failed' })
    }
  }
}

// Resource ownership validation
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId
      const resourceId = req.params.id || req.params.projectId || req.params.fileId

      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID required' })
      }

      // Admin bypass
      if (req.isAdmin || (req.userRole && hasPermission(req.userRole, `${resourceType}:read_others`))) {
        return next()
      }

      let ownershipQuery
      let ownerField = 'user_id'

      switch (resourceType) {
        case 'project':
          ownershipQuery = 'SELECT user_id FROM projects WHERE id = $1'
          break
        case 'file':
          ownershipQuery = 'SELECT uploaded_by_id as user_id FROM project_files WHERE id = $1'
          break
        case 'collaboration':
          ownershipQuery = 'SELECT owner_id as user_id FROM collaborations WHERE id = $1'
          break
        default:
          return res.status(400).json({ error: 'Invalid resource type' })
      }

      const result = await pool.query(ownershipQuery, [resourceId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `${resourceType} not found` })
      }

      const resourceOwnerId = result.rows[0].user_id

      if (resourceOwnerId !== userId) {
        await logAuthorizationFailure(userId, `${resourceType}:ownership`, req.userRole, req, {
          resourceType,
          resourceId,
          resourceOwnerId
        })
        return res.status(403).json({ error: `Access denied to ${resourceType}` })
      }

      next()
    } catch (error) {
      console.error('Ownership check error:', error)
      res.status(500).json({ error: 'Ownership verification failed' })
    }
  }
}

// Rate limit enforcement based on user plan
const enforceRateLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId
      const userRole = req.userRole || await getUserRole(userId)

      if (!userRole) {
        return res.status(403).json({ error: 'Unable to determine rate limits' })
      }

      // Admin bypass
      if (req.isAdmin || userRole === 'super_admin' || userRole === 'admin') {
        return next()
      }

      const limits = RATE_LIMITS[userRole]
      if (!limits) {
        return res.status(403).json({ error: 'Invalid user role for rate limiting' })
      }

      const limit = limits[limitType]
      if (limit === -1) {
        return next() // Unlimited
      }

      // Check current usage
      let currentUsage = 0

      switch (limitType) {
        case 'projects':
          const projectResult = await pool.query('SELECT COUNT(*) FROM projects WHERE user_id = $1', [userId])
          currentUsage = parseInt(projectResult.rows[0].count)
          break
        case 'storage_mb':
          // This would require calculating actual storage usage
          currentUsage = 0 // Placeholder
          break
        case 'api_calls_per_hour':
          // This would require tracking API calls in Redis or database
          currentUsage = 0 // Placeholder
          break
      }

      if (currentUsage >= limit) {
        return res.status(429).json({
          error: `Rate limit exceeded for ${limitType}`,
          limit: limit,
          current: currentUsage,
          userPlan: userRole,
          upgradeUrl: '/pricing'
        })
      }

      next()
    } catch (error) {
      console.error('Rate limit check error:', error)
      res.status(500).json({ error: 'Rate limit check failed' })
    }
  }
}

// Log authorization failures
const logAuthorizationFailure = async (userId, permission, userRole, req, additional = {}) => {
  try {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'authorization_failure',
        'security',
        userId,
        JSON.stringify({
          permission,
          userRole,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          ...additional
        })
      ]
    )
  } catch (error) {
    console.error('Failed to log authorization failure:', error)
  }
}

// Collaborative access check (for shared projects)
const requireCollaborativeAccess = (action = 'view') => {
  return async (req, res, next) => {
    try {
      const userId = req.userId
      const projectId = req.params.projectId || req.params.id

      if (!projectId) {
        return res.status(400).json({ error: 'Project ID required' })
      }

      // Admin bypass
      if (req.isAdmin) {
        return next()
      }

      // Check if user owns the project
      const ownerResult = await pool.query('SELECT user_id FROM projects WHERE id = $1', [projectId])
      if (ownerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' })
      }

      if (ownerResult.rows[0].user_id === userId) {
        return next() // Owner has full access
      }

      // Check collaboration permissions
      const collabResult = await pool.query(`
        SELECT role, permissions, status
        FROM collaborations
        WHERE project_id = $1 AND collaborator_id = $2 AND status = 'active'
      `, [projectId, userId])

      if (collabResult.rows.length === 0) {
        return res.status(403).json({ error: 'No access to this project' })
      }

      const collaboration = collabResult.rows[0]
      const permissions = JSON.parse(collaboration.permissions || '{}')

      // Check specific action permission
      const permissionKey = `can_${action}`
      if (!permissions[permissionKey]) {
        await logAuthorizationFailure(userId, `collaborative_${action}`, req.userRole, req, {
          projectId,
          collaboration: collaboration.role,
          requiredPermission: permissionKey
        })
        return res.status(403).json({
          error: `Insufficient permissions to ${action} in this project`,
          role: collaboration.role,
          permissions: permissions
        })
      }

      req.collaborationRole = collaboration.role
      req.collaborationPermissions = permissions
      next()

    } catch (error) {
      console.error('Collaborative access check error:', error)
      res.status(500).json({ error: 'Access verification failed' })
    }
  }
}

module.exports = {
  requirePermission,
  requireOwnership,
  enforceRateLimit,
  requireCollaborativeAccess,
  hasPermission,
  hasHigherRole,
  getUserRole,
  ROLE_HIERARCHY,
  PERMISSIONS,
  RATE_LIMITS
}