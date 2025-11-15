'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Permission {
  id: string
  user_id: string
  workspace_id: string
  agent_id?: string
  permissions: string[]
  granted_by: string
  granted_at: string
  is_active: boolean
  agent_name?: string
  workspace_name?: string
  granted_by_name?: string
}

interface PermissionManagerProps {
  workspaceId: string
  onPermissionUpdate?: (action: string, data: any) => void
}

interface User {
  id: string
  name: string
  email: string
}

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

const ROLE_PERMISSIONS = {
  viewer: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS],
  reviewer: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS, PERMISSIONS.EDIT_PROMPTS, PERMISSIONS.ACCESS_ANALYTICS],
  approver: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS, PERMISSIONS.EDIT_PROMPTS, PERMISSIONS.APPROVE_PROMPTS, PERMISSIONS.ACCESS_ANALYTICS],
  agent: [PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_LOGS, PERMISSIONS.EDIT_PROMPTS, PERMISSIONS.APPROVE_PROMPTS, PERMISSIONS.EXECUTE_PROMPTS, PERMISSIONS.ACCESS_ANALYTICS],
  admin: Object.values(PERMISSIONS)
}

export default function PermissionManager({ workspaceId, onPermissionUpdate }: PermissionManagerProps) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)

  // Assignment form state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('viewer')
  const [customPermissions, setCustomPermissions] = useState<string[]>([])
  const [assignmentMode, setAssignmentMode] = useState<'role' | 'custom'>('role')

  useEffect(() => {
    loadPermissions()
    loadUsers()
  }, [workspaceId])

  const loadPermissions = async () => {
    setLoading(true)
    try {
      // Mock API call - replace with actual implementation
      const mockPermissions: Permission[] = [
        {
          id: '1',
          user_id: 'user-1',
          workspace_id: workspaceId,
          permissions: ['view_dashboard', 'view_logs', 'edit_prompts'],
          granted_by: 'admin-user',
          granted_at: new Date().toISOString(),
          is_active: true,
          workspace_name: 'Main Workspace',
          granted_by_name: 'Admin User'
        }
      ]
      setPermissions(mockPermissions)
    } catch (error) {
      setError('Failed to load permissions')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      // Mock API call - replace with actual implementation
      const mockUsers: User[] = [
        { id: 'user-1', name: 'Alice Johnson', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob Smith', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie Brown', email: 'charlie@example.com' }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleAssignPermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (assignmentMode === 'role') {
        // Assign role-based permissions
        const permissionsToAssign = ROLE_PERMISSIONS[selectedRole as keyof typeof ROLE_PERMISSIONS]

        // Mock API call
        const newPermission: Permission = {
          id: Date.now().toString(),
          user_id: selectedUserId,
          workspace_id: workspaceId,
          permissions: permissionsToAssign,
          granted_by: 'current-user',
          granted_at: new Date().toISOString(),
          is_active: true,
          workspace_name: 'Main Workspace',
          granted_by_name: 'Current User'
        }

        setPermissions(prev => [newPermission, ...prev])

        if (onPermissionUpdate) {
          onPermissionUpdate('role_assigned', { role: selectedRole, user: selectedUserId })
        }
      } else {
        // Assign custom permissions
        const newPermission: Permission = {
          id: Date.now().toString(),
          user_id: selectedUserId,
          workspace_id: workspaceId,
          permissions: customPermissions,
          granted_by: 'current-user',
          granted_at: new Date().toISOString(),
          is_active: true,
          workspace_name: 'Main Workspace',
          granted_by_name: 'Current User'
        }

        setPermissions(prev => [newPermission, ...prev])

        if (onPermissionUpdate) {
          onPermissionUpdate('permissions_assigned', { permissions: customPermissions, user: selectedUserId })
        }
      }

      // Reset form
      setSelectedUserId('')
      setSelectedRole('viewer')
      setCustomPermissions([])
      setShowAssignModal(false)

    } catch (error) {
      setError('Failed to assign permissions')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokePermissions = async (permissionId: string) => {
    try {
      setPermissions(prev => prev.filter(p => p.id !== permissionId))

      if (onPermissionUpdate) {
        onPermissionUpdate('permissions_revoked', { permissionId })
      }
    } catch (error) {
      setError('Failed to revoke permissions')
    }
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case PERMISSIONS.VIEW_DASHBOARD: return ''
      case PERMISSIONS.EDIT_PROMPTS: return ''
      case PERMISSIONS.APPROVE_PROMPTS: return ''
      case PERMISSIONS.MANAGE_AGENTS: return ''
      case PERMISSIONS.ACCESS_ANALYTICS: return ''
      case PERMISSIONS.VIEW_LOGS: return ''
      case PERMISSIONS.EXECUTE_PROMPTS: return ''
      case PERMISSIONS.WORKSPACE_ADMIN: return ''
      default: return ''
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : `User ${userId}`
  }

  const handleCustomPermissionToggle = (permission: string) => {
    setCustomPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  const getRoleForPermissions = (permissions: string[]) => {
    for (const [role, rolePermissions] of Object.entries(ROLE_PERMISSIONS)) {
      if (JSON.stringify(permissions.sort()) === JSON.stringify(rolePermissions.sort())) {
        return role
      }
    }
    return 'custom'
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border">
      {/* Header */}
      <div className="border-b border-terminal-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-terminal-text font-medium">Permission Management</h2>
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-terminal-text text-terminal-bg px-3 py-1 text-xs hover:bg-terminal-muted transition-colors"
          >
            Assign Permissions
          </button>
        </div>
      </div>

      {/* Permissions List */}
      <div className="p-4">
        {error && (
          <div className="bg-terminal-bg border border-red-500 text-red-400 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-terminal-muted text-sm text-center py-8">
            Loading permissions...
          </div>
        ) : permissions.length === 0 ? (
          <div className="text-terminal-muted text-sm text-center py-8">
            No permissions assigned yet. Assign permissions to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {permissions.map(permission => (
              <motion.div
                key={permission.id}
                layout
                className="border border-terminal-border p-4 bg-terminal-bg/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-terminal-text font-medium">
                        {getUserName(permission.user_id)}
                      </span>
                      <span className="bg-terminal-bg border border-terminal-border px-2 py-1 text-xs text-terminal-muted">
                        {getRoleForPermissions(permission.permissions)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {permission.permissions.map(perm => (
                        <span
                          key={perm}
                          className="flex items-center space-x-1 bg-terminal-surface border border-terminal-border px-2 py-1 text-xs"
                        >
                          <span>{getPermissionIcon(perm)}</span>
                          <span className="text-terminal-text">{perm.replace('_', ' ')}</span>
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-terminal-muted">
                      Granted by {permission.granted_by_name} • {new Date(permission.granted_at).toLocaleDateString()}
                      {permission.agent_name && (
                        <> • Agent: {permission.agent_name}</>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokePermissions(permission.id)}
                    className="text-red-400 hover:text-red-300 text-xs transition-colors ml-4"
                  >
                    Revoke
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Permissions Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-terminal-text font-medium mb-4">Assign Permissions</h3>

            <form onSubmit={handleAssignPermissions} className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">User *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border text-terminal-text text-sm px-3 py-2 focus:outline-none focus:border-terminal-text"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Assignment Mode</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="assignmentMode"
                      value="role"
                      checked={assignmentMode === 'role'}
                      onChange={(e) => setAssignmentMode(e.target.value as 'role')}
                      className="w-3 h-3"
                    />
                    <span className="text-terminal-text text-sm">Assign Role</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="assignmentMode"
                      value="custom"
                      checked={assignmentMode === 'custom'}
                      onChange={(e) => setAssignmentMode(e.target.value as 'custom')}
                      className="w-3 h-3"
                    />
                    <span className="text-terminal-text text-sm">Custom Permissions</span>
                  </label>
                </div>
              </div>

              {assignmentMode === 'role' ? (
                <div>
                  <label className="block text-sm text-terminal-text mb-2">Role *</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-terminal-bg border border-terminal-border text-terminal-text text-sm px-3 py-2 focus:outline-none focus:border-terminal-text"
                    required
                  >
                    {Object.keys(ROLE_PERMISSIONS).map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>

                  <div className="mt-2 text-xs text-terminal-muted">
                    <div className="font-medium mb-1">Role includes:</div>
                    <div className="flex flex-wrap gap-1">
                      {ROLE_PERMISSIONS[selectedRole as keyof typeof ROLE_PERMISSIONS].map(perm => (
                        <span key={perm} className="bg-terminal-bg border border-terminal-border px-1 py-0.5 text-xs">
                          {getPermissionIcon(perm)} {perm.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-terminal-text mb-2">Custom Permissions</label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {Object.values(PERMISSIONS).map(permission => (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={customPermissions.includes(permission)}
                          onChange={() => handleCustomPermissionToggle(permission)}
                          className="w-3 h-3"
                        />
                        <span className="flex items-center space-x-1 text-xs text-terminal-text">
                          <span>{getPermissionIcon(permission)}</span>
                          <span>{permission.replace('_', ' ')}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={loading || !selectedUserId || (assignmentMode === 'custom' && customPermissions.length === 0)}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign Permissions'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}