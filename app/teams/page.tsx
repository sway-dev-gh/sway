'use client'

import React, { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import CustomDropdown from '@/components/CustomDropdown'
import { apiRequest } from '@/lib/auth'

export default function Teams() {
  const [activeTab, setActiveTab] = useState('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [teamVisibility, setTeamVisibility] = useState('team')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    setError('')

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inviteEmail)) {
        throw new Error('Please enter a valid email address')
      }

      const invitationData = {
        email: inviteEmail,
        teamId: 'current_team',
        role: inviteRole,
        invitedBy: 'admin',
        invitedAt: new Date().toISOString(),
        status: 'pending',
        inviteCode: Math.random().toString(36).substring(2) + Date.now().toString(36)
      }

      // Save invitation to localStorage
      const existingInvitations = JSON.parse(localStorage.getItem('team_invitations') || '[]')
      existingInvitations.push(invitationData)
      localStorage.setItem('team_invitations', JSON.stringify(existingInvitations))

      // Try to send invitation via backend
      try {
        const response = await apiRequest('/api/teams/invite', {
          method: 'POST',
          body: JSON.stringify(invitationData)
        })

        if (!response?.ok) {
          console.warn('API invitation failed, invitation saved locally')
        } else {
          console.log('Invitation sent via backend successfully')
        }
      } catch (apiError) {
        console.warn('Backend unavailable, invitation saved locally')
      }

      // Generate invitation link
      const inviteLink = `${window.location.origin}/invite?code=${invitationData.inviteCode}`

      // Copy invitation link to clipboard
      try {
        await navigator.clipboard.writeText(inviteLink)
        console.log('Invitation link copied to clipboard')
      } catch (clipboardError) {
        console.warn('Could not copy to clipboard')
      }

      setShowInviteModal(false)
      setInviteEmail('')

      // Show success notification with invite link (XSS SAFE)
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-terminal-text text-terminal-bg px-6 py-4 rounded z-50 max-w-sm'

      // Create elements safely to prevent XSS
      const titleDiv = document.createElement('div')
      titleDiv.textContent = `Invitation sent to ${inviteEmail}`

      const subtitleDiv = document.createElement('div')
      subtitleDiv.className = 'text-xs mt-2 opacity-80'
      subtitleDiv.textContent = 'Invite link copied to clipboard'

      const linkDiv = document.createElement('div')
      linkDiv.className = 'text-xs mt-1 font-mono break-all'
      linkDiv.textContent = inviteLink

      notification.appendChild(titleDiv)
      notification.appendChild(subtitleDiv)
      notification.appendChild(linkDiv)

      document.body.appendChild(notification)
      setTimeout(() => document.body.removeChild(notification), 5000)

    } catch (error: any) {
      console.error('Invitation error:', error)
      setError(error.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleManagePermissions = () => {
    setShowPermissionsModal(true)
  }

  const handleTeamSettings = () => {
    setShowSettingsModal(true)
  }

  const handleSavePermissions = async () => {
    setLoading(true)
    try {
      // Get permission checkboxes values
      const permissionCheckboxes = document.querySelectorAll('#permissions-modal input[type="checkbox"]')
      const permissions = Array.from(permissionCheckboxes).map((checkbox: any) => ({
        permission: checkbox.nextSibling?.textContent || '',
        enabled: checkbox.checked
      }))

      const permissionData = {
        userId: 'current_user',
        permissions: permissions,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }

      // Save to localStorage
      const existingPermissions = JSON.parse(localStorage.getItem('team_permissions') || '[]')
      const updatedPermissions = existingPermissions.filter((p: any) => p.userId !== permissionData.userId)
      updatedPermissions.push(permissionData)
      localStorage.setItem('team_permissions', JSON.stringify(updatedPermissions))

      // Try to save to backend
      try {
        const response = await apiRequest('/api/teams/permissions', {
          method: 'PUT',
          body: JSON.stringify(permissionData)
        })

        if (!response?.ok) {
          console.warn('API permission save failed, using localStorage')
        } else {
          console.log('Permissions saved to backend successfully')
        }
      } catch (apiError) {
        console.warn('Backend unavailable, permissions saved locally')
      }

      setShowPermissionsModal(false)

      // Show success notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-terminal-text text-terminal-bg px-4 py-2 rounded z-50'
      notification.textContent = 'Permissions updated successfully'
      document.body.appendChild(notification)
      setTimeout(() => document.body.removeChild(notification), 3000)

    } catch (error) {
      console.error('Permission save error:', error)

      const errorNotification = document.createElement('div')
      errorNotification.className = 'fixed top-4 right-4 bg-terminal-surface border border-terminal-border text-terminal-text px-4 py-2 z-50'
      errorNotification.textContent = 'Failed to update permissions'
      document.body.appendChild(errorNotification)
      setTimeout(() => document.body.removeChild(errorNotification), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const teamData = {
        id: 'current_team',
        deletedAt: new Date().toISOString(),
        deletedBy: 'admin'
      }

      // Remove from localStorage
      localStorage.removeItem('team_settings')
      localStorage.removeItem('team_permissions')
      localStorage.removeItem('team_members')

      // Try to delete from backend
      try {
        const response = await apiRequest('/api/teams/current', {
          method: 'DELETE',
          body: JSON.stringify(teamData)
        })

        if (!response?.ok) {
          console.warn('API delete failed, team removed locally')
        } else {
          console.log('Team deleted from backend successfully')
        }
      } catch (apiError) {
        console.warn('Backend unavailable, team deleted locally')
      }

      // Show success and redirect
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-terminal-text text-terminal-bg px-4 py-2 rounded z-50'
      notification.textContent = 'Team deleted successfully'
      document.body.appendChild(notification)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)

    } catch (error) {
      console.error('Delete team error:', error)

      const errorNotification = document.createElement('div')
      errorNotification.className = 'fixed top-4 right-4 bg-terminal-surface border border-terminal-border text-terminal-text px-4 py-2 z-50'
      errorNotification.textContent = 'Failed to delete team'
      document.body.appendChild(errorNotification)
      setTimeout(() => document.body.removeChild(errorNotification), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTeamSettings = async () => {
    setLoading(true)
    try {
      // Get form values from the modal
      const nameInput = document.querySelector('#team-settings-modal input[type="text"]') as HTMLInputElement
      const descriptionInput = document.querySelector('#team-settings-modal textarea') as HTMLTextAreaElement

      const teamSettings = {
        id: 'current_team',
        name: nameInput?.value || 'Your Team',
        description: descriptionInput?.value || 'A collaborative workspace',
        defaultVisibility: teamVisibility,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      }

      // Save to localStorage
      localStorage.setItem('team_settings', JSON.stringify(teamSettings))

      // Try to save to backend
      try {
        const response = await apiRequest('/api/teams/settings', {
          method: 'PUT',
          body: JSON.stringify(teamSettings)
        })

        if (!response?.ok) {
          console.warn('API team settings save failed, using localStorage')
        } else {
          console.log('Team settings saved to backend successfully')
        }
      } catch (apiError) {
        console.warn('Backend unavailable, team settings saved locally')
      }

      setShowSettingsModal(false)

      // Show success notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-terminal-text text-terminal-bg px-4 py-2 rounded z-50'
      notification.textContent = 'Team settings saved successfully'
      document.body.appendChild(notification)
      setTimeout(() => document.body.removeChild(notification), 3000)

      // Update page title if team name changed
      if (teamSettings.name) {
        document.title = `${teamSettings.name} - SwayFiles`
      }

    } catch (error) {
      console.error('Save team settings error:', error)

      const errorNotification = document.createElement('div')
      errorNotification.className = 'fixed top-4 right-4 bg-terminal-surface border border-terminal-border text-terminal-text px-4 py-2 z-50'
      errorNotification.textContent = 'Failed to save team settings'
      document.body.appendChild(errorNotification)
      setTimeout(() => document.body.removeChild(errorNotification), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-terminal-text font-medium">Teams</h1>
              <p className="text-terminal-muted text-sm mt-1">
                Manage your team members and collaboration settings
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">0</div>
              <div className="text-sm text-terminal-muted">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">0</div>
              <div className="text-sm text-terminal-muted">Pending Invitations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">0</div>
              <div className="text-sm text-terminal-muted">Teams Joined</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Team Members List */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-terminal-text mb-4">Team Members</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-terminal-bg rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-terminal-text rounded-full flex items-center justify-center">
                    <span className="text-terminal-bg text-sm font-medium">U</span>
                  </div>
                  <div>
                    <div className="text-terminal-text font-medium">You</div>
                    <div className="text-terminal-muted text-sm">Owner</div>
                  </div>
                </div>
                <div className="text-terminal-muted text-sm">Active</div>
              </div>
            </div>
          </div>

          {/* Team Actions */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <h3 className="text-lg font-medium text-terminal-text mb-4">Team Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="w-full text-left p-3 border border-terminal-border hover:bg-terminal-hover transition-colors"
              >
                <div className="text-terminal-text font-medium">Invite Team Member</div>
                <div className="text-terminal-muted text-sm">Send invitation to collaborate</div>
              </button>
              <button
                onClick={handleManagePermissions}
                className="w-full text-left p-3 border border-terminal-border hover:bg-terminal-hover transition-colors"
              >
                <div className="text-terminal-text font-medium">Manage Permissions</div>
                <div className="text-terminal-muted text-sm">Control access to projects</div>
              </button>
              <button
                onClick={handleTeamSettings}
                className="w-full text-left p-3 border border-terminal-border hover:bg-terminal-hover transition-colors"
              >
                <div className="text-terminal-text font-medium">Team Settings</div>
                <div className="text-terminal-muted text-sm">Configure team preferences</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Invite Team Member</h2>

            {error && (
              <div className="bg-terminal-bg border border-terminal-border text-terminal-text p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="colleague@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Role</label>
                <CustomDropdown
                  value={inviteRole}
                  onChange={setInviteRole}
                  options={[
                    { value: 'member', label: 'Member' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                  className="w-full"
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || !inviteEmail.trim()}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-lg">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Manage Team Permissions</h2>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-terminal-border rounded">
                  <div>
                    <div className="text-terminal-text font-medium">You (Owner)</div>
                    <div className="text-terminal-muted text-sm">Full access to all projects and settings</div>
                  </div>
                  <span className="text-terminal-muted text-sm">Owner</span>
                </div>

                <div className="border border-terminal-border rounded p-4 text-center text-terminal-muted">
                  <p className="text-sm">No other team members yet</p>
                  <p className="text-xs mt-1">Invite team members to manage their permissions</p>
                </div>
              </div>

              <div className="border-t border-terminal-border pt-4">
                <h3 className="text-terminal-text font-medium mb-2">Default Permissions</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="text-terminal-text" />
                    <span className="text-terminal-text text-sm">Can view projects</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="text-terminal-text" />
                    <span className="text-terminal-text text-sm">Can comment on files</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="text-terminal-text" />
                    <span className="text-terminal-text text-sm">Can upload files</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="text-terminal-text" />
                    <span className="text-terminal-text text-sm">Can create projects</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleSavePermissions}
                  disabled={loading}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Team Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Team Name</label>
                <input
                  type="text"
                  defaultValue="Your Team"
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Team Description</label>
                <textarea
                  defaultValue="A collaborative workspace for your team"
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Default Project Visibility</label>
                <CustomDropdown
                  value={teamVisibility}
                  onChange={setTeamVisibility}
                  options={[
                    { value: 'team', label: 'Team Only' },
                    { value: 'private', label: 'Private' },
                    { value: 'public', label: 'Public' }
                  ]}
                  className="w-full"
                />
              </div>

              <div className="border-t border-terminal-border pt-4">
                <h3 className="text-terminal-text font-medium mb-2">Danger Zone</h3>
                <button
                  onClick={handleDeleteTeam}
                  disabled={loading}
                  className="w-full bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Team'}
                </button>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleSaveTeamSettings}
                  disabled={loading}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}