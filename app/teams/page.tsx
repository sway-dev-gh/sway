'use client'

import React, { useState } from 'react'
import AppLayout from '@/components/AppLayout'

export default function Teams() {
  const [activeTab, setActiveTab] = useState('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setLoading(true)
    setError('')

    try {
      // TODO: Connect to actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      setShowInviteModal(false)
      setInviteEmail('')
      alert(`Invitation sent to ${inviteEmail}`)
    } catch (error) {
      setError('Failed to send invitation')
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
      // TODO: Connect to actual API endpoint to save permissions
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setShowPermissionsModal(false)
      alert('Permissions updated successfully!')
    } catch (error) {
      alert('Failed to update permissions')
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
      // TODO: Connect to actual API endpoint to delete team
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      alert('Team deleted successfully!')
      // TODO: Redirect to dashboard or team list
    } catch (error) {
      alert('Failed to delete team')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTeamSettings = async () => {
    setLoading(true)
    try {
      // TODO: Connect to actual API endpoint to save team settings
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setShowSettingsModal(false)
      alert('Team settings saved successfully!')
    } catch (error) {
      alert('Failed to save team settings')
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
                <select className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm">
                  <option value="member">Member</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
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
                <select className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm">
                  <option value="team">Team Only</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
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