'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import teamService from '../../src/services/teamService'
import useNotifications from '../../src/hooks/useNotifications'

// Team Member Card Component
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  active_projects?: number;
  last_active?: string;
  last_activity_at?: string;
  status?: string;
  permissions?: string;
}

const TeamMemberCard = ({ member, onRemove }: { member: TeamMember; onRemove: (id: string) => Promise<void> }) => {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleRemove = async () => {
    try {
      await onRemove(member.id)
      setShowConfirm(false)
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-terminal-surface border border-terminal-border rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-terminal-accent rounded-full flex items-center justify-center">
            <span className="text-terminal-text font-medium">
              {(member.name || member.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-terminal-text font-medium">{member.name || 'Unknown'}</div>
            <div className="text-terminal-muted text-sm">{member.email}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${teamService.getRoleColor(member.role)}`}>
            {teamService.getRoleDisplayName(member.role)}
          </span>
          <button
            onClick={() => setShowConfirm(true)}
            className="text-terminal-muted hover:text-red-400 text-sm"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-terminal-muted">Active Projects:</span>
          <span className="text-terminal-text ml-1">{member.active_projects || 0}</span>
        </div>
        <div>
          <span className="text-terminal-muted">Last Active:</span>
          <span className="text-terminal-text ml-1">
            {teamService.formatRelativeTime(member.last_activity_at)}
          </span>
        </div>
      </div>

      {/* Permissions */}
      {member.permissions && (
        <div className="mt-3">
          <div className="text-xs text-terminal-muted mb-2">Permissions:</div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(JSON.parse(member.permissions) as Record<string, boolean>).map(([permission, enabled]) => (
              enabled && (
                <span
                  key={permission}
                  className="text-xs bg-terminal-accent text-terminal-text px-2 py-1 rounded"
                >
                  {teamService.getPermissionDisplayName(permission)}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Confirm Removal Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-terminal-surface border border-terminal-border rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-terminal-text font-medium mb-2">Remove Team Member</h3>
              <p className="text-terminal-muted text-sm mb-4">
                Are you sure you want to remove {member.name || member.email} from your team?
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleRemove}
                  className="bg-red-600 text-white px-4 py-2 text-sm rounded hover:bg-red-700"
                >
                  Remove
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="border border-terminal-border text-terminal-text px-4 py-2 text-sm rounded hover:bg-terminal-accent"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Invite Member Form Component
interface Project {
  id: string;
  name: string;
}

const InviteMemberForm = ({ onInvite, onCancel, projects }: {
  onInvite: (data: { email: string; role: string; projectId: string | null; message: string }) => Promise<void>;
  onCancel: () => void;
  projects: Project[]
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [projectId, setProjectId] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onInvite({
        email,
        role,
        projectId: projectId || null,
        message
      })
      setEmail('')
      setRole('viewer')
      setProjectId('')
      setMessage('')
      onCancel()
    } catch (error) {
      console.error('Failed to invite member:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-terminal-surface border border-terminal-border rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-terminal-text font-medium mb-4">Invite Team Member</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-terminal-text text-sm mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text focus:outline-none focus:border-terminal-text"
              placeholder="colleague@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-terminal-text text-sm mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text focus:outline-none focus:border-terminal-text"
            >
              <option value="viewer">Viewer - Can view projects</option>
              <option value="editor">Editor - Can view and edit</option>
              <option value="reviewer">Reviewer - Can view and review</option>
            </select>
          </div>

          <div>
            <label className="block text-terminal-text text-sm mb-2">Project (Optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text focus:outline-none focus:border-terminal-text"
            >
              <option value="">All projects</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-terminal-text text-sm mb-2">Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text focus:outline-none focus:border-terminal-text resize-none"
              rows={3}
              placeholder="Personal message to include with the invitation..."
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm rounded hover:bg-terminal-text/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="border border-terminal-border text-terminal-text px-4 py-2 text-sm rounded hover:bg-terminal-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Pending Invitation Card Component
interface Invitation {
  id: string;
  email: string;
  role: string;
  project_name?: string;
  message?: string;
  expires_at: string;
  created_at: string;
}

const PendingInvitationCard = ({ invitation }: { invitation: Invitation }) => {
  return (
    <div className="bg-terminal-surface border border-yellow-500/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-terminal-text font-medium">{invitation.email}</div>
          <div className="text-terminal-muted text-sm">
            Invited {teamService.formatRelativeTime(invitation.created_at)}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${teamService.getRoleColor(invitation.role)}`}>
            {teamService.getRoleDisplayName(invitation.role)}
          </span>
          <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
            Pending
          </span>
        </div>
      </div>

      <div className="text-xs text-terminal-muted">
        Expires: {teamService.formatExpirationTime(invitation.expires_at)}
      </div>
    </div>
  )
}

// Main Teams Component
export default function Teams() {
  const [teamData, setTeamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [activeTab, setActiveTab] = useState('members') // 'members', 'invitations', 'teams'
  const { showNotification } = useNotifications()

  // Load team data
  const loadTeamData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await teamService.getTeamOverview()
      setTeamData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeamData()
  }, [])

  // Handle invite member
  const handleInviteMember = async (inviteData: { email: string; role: string; projectId: string | null; message: string }) => {
    try {
      await teamService.inviteTeamMember({
        ...inviteData,
        permissions: {}
      })
      await loadTeamData() // Reload data
      showNotification(
        'team_invitation_sent',
        'Team Invitation Sent',
        `Invitation sent to ${inviteData.email} as ${teamService.getRoleDisplayName(inviteData.role)}`
      )
    } catch (error) {
      showNotification(
        'error',
        'Invitation Failed',
        `Failed to send invitation to ${inviteData.email}`
      )
      throw error
    }
  }

  // Handle remove member
  const handleRemoveMember = async (memberId: string) => {
    try {
      await teamService.removeTeamMember(memberId)
      await loadTeamData() // Reload data
      showNotification(
        'team_member_removed',
        'Member Removed',
        'Team member has been removed successfully'
      )
    } catch (error) {
      showNotification(
        'error',
        'Remove Failed',
        'Failed to remove team member'
      )
      throw error
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-terminal-muted">Loading teams...</div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-400 mb-4">Error: {error}</div>
            <button
              onClick={loadTeamData}
              className="text-terminal-text border border-terminal-border px-4 py-2 rounded hover:bg-terminal-accent"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    )
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
                Manage team members and collaborate on projects
              </p>
            </div>
            <button
              onClick={() => setShowInviteForm(true)}
              className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm rounded hover:bg-terminal-text/90"
            >
              Invite Members
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">
                {teamData?.stats?.total_team_members || 0}
              </div>
              <div className="text-sm text-terminal-muted">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">
                {teamData?.stats?.pending_invitations || 0}
              </div>
              <div className="text-sm text-terminal-muted">Pending Invitations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">
                {teamData?.stats?.teams_member_of || 0}
              </div>
              <div className="text-sm text-terminal-muted">Teams Joined</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-terminal-border">
          <div className="flex px-6">
            {[
              { id: 'members', label: 'My Team', count: teamData?.team?.length },
              { id: 'invitations', label: 'Pending Invitations', count: teamData?.pending_invitations?.length },
              { id: 'teams', label: 'Teams I\'m In', count: teamData?.member_of_teams?.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 text-sm border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-terminal-text text-terminal-text'
                    : 'border-transparent text-terminal-muted hover:text-terminal-text'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 bg-terminal-accent text-terminal-text text-xs px-2 py-1 rounded">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'members' && (
            <div>
              <h2 className="text-lg font-medium text-terminal-text mb-4">Team Members</h2>
              {teamData?.team?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence>
                    {teamData.team.map((member: TeamMember) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        onRemove={handleRemoveMember}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-12 bg-terminal-surface border border-terminal-border rounded-lg">
                  <div className="text-terminal-muted mb-4">No team members yet</div>
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm rounded hover:bg-terminal-text/90"
                  >
                    Invite Your First Member
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invitations' && (
            <div>
              <h2 className="text-lg font-medium text-terminal-text mb-4">Pending Invitations</h2>
              {teamData?.pending_invitations?.length > 0 ? (
                <div className="space-y-3">
                  {teamData.pending_invitations.map((invitation: Invitation) => (
                    <PendingInvitationCard
                      key={invitation.id}
                      invitation={invitation}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-terminal-surface border border-terminal-border rounded-lg">
                  <div className="text-terminal-muted">No pending invitations</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div>
              <h2 className="text-lg font-medium text-terminal-text mb-4">Teams I'm Part Of</h2>
              {teamData?.member_of_teams?.length > 0 ? (
                <div className="space-y-3">
                  {teamData.member_of_teams.map((team: any) => (
                    <div key={team.team_owner_id} className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-terminal-text font-medium">
                            {team.team_owner_name || team.team_owner_email}
                          </div>
                          <div className="text-terminal-muted text-sm">
                            {team.team_projects} project{team.team_projects !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${teamService.getRoleColor(team.my_role)}`}>
                          {teamService.getRoleDisplayName(team.my_role)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-terminal-surface border border-terminal-border rounded-lg">
                  <div className="text-terminal-muted">You haven't joined any teams yet</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invite Form Modal */}
        <AnimatePresence>
          {showInviteForm && (
            <InviteMemberForm
              onInvite={handleInviteMember}
              onCancel={() => setShowInviteForm(false)}
              projects={teamData?.projects || []}
            />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  )
}