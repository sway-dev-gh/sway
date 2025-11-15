'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/auth'

interface Project {
  id: string
  title: string
  description: string
  project_type: string
  created_at: string
  status: string
  collaborator_count?: number
  recent_activity?: string
  owner_name?: string
}

interface Activity {
  id: string
  type: string
  description: string
  project_id?: string
  project_title?: string
  user_name?: string
  created_at: string
  metadata?: any
}

interface Collaboration {
  id: string
  project_id: string
  project_title: string
  role: string
  status: string
  created_at: string
  last_activity?: string
}

interface PendingRequest {
  id: string
  type: string
  project_title: string
  requester_name: string
  created_at: string
  status: string
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectType, setProjectType] = useState('document')

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDashboardData()
    }
  }, [authLoading, isAuthenticated])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load dashboard data in parallel
      const [projectsRes, activityRes, collaborationsRes, requestsRes] = await Promise.all([
        apiRequest('/api/projects'),
        apiRequest('/api/activity'),
        apiRequest('/api/collaborations'),
        apiRequest('/api/requests')
      ])

      if (projectsRes?.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.projects || [])
      }

      if (activityRes?.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData.activities || [])
      }

      if (collaborationsRes?.ok) {
        const collaborationsData = await collaborationsRes.json()
        setCollaborations(collaborationsData.collaborations || [])
      }

      if (requestsRes?.ok) {
        const requestsData = await requestsRes.json()
        setPendingRequests(requestsData.requests?.filter((req: any) => req.status === 'pending') || [])
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: projectTitle,
          description: projectDescription,
          project_type: projectType,
          visibility: 'private'
        })
      })

      if (response?.ok) {
        const data = await response.json()
        setProjects(prev => [data.project, ...prev])
        setShowCreateModal(false)
        setProjectTitle('')
        setProjectDescription('')
        setProjectType('document')
      } else {
        const errorData = await response?.json()
        setError(errorData?.error || 'Failed to create project')
      }
    } catch (error: any) {
      console.error('Project creation error:', error)
      setError(error.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created': return '📄'
      case 'collaboration_joined': return '👥'
      case 'edit_request': return '✏️'
      case 'edit_approved': return '✅'
      case 'comment_added': return '💬'
      case 'file_uploaded': return '📁'
      default: return '•'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <motion.div
          className="bg-terminal-surface border-b border-terminal-border p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <motion.h1
                className="text-xl text-terminal-text font-medium"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Collaborative Workspace
              </motion.h1>
              <motion.p
                className="text-terminal-muted text-sm mt-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                Real-time document editing and team collaboration
              </motion.p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
            >
              New Project
            </button>
          </div>
        </motion.div>

        <motion.div
          className="p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Error Display */}
          {error && (
            <div className="bg-terminal-bg border border-red-500 text-red-400 p-3 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-terminal-surface border border-terminal-border p-4">
              <div className="text-terminal-text text-lg font-medium">{projects.length}</div>
              <div className="text-terminal-muted text-xs">Active Projects</div>
            </div>
            <div className="bg-terminal-surface border border-terminal-border p-4">
              <div className="text-terminal-text text-lg font-medium">{collaborations.length}</div>
              <div className="text-terminal-muted text-xs">Collaborations</div>
            </div>
            <div className="bg-terminal-surface border border-terminal-border p-4">
              <div className="text-terminal-text text-lg font-medium">{pendingRequests.length}</div>
              <div className="text-terminal-muted text-xs">Pending Requests</div>
            </div>
            <div className="bg-terminal-surface border border-terminal-border p-4">
              <div className="text-terminal-text text-lg font-medium">{recentActivity.length}</div>
              <div className="text-terminal-muted text-xs">Recent Activities</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <div className="bg-terminal-surface border border-terminal-border">
              <div className="border-b border-terminal-border p-4">
                <h2 className="text-terminal-text font-medium">Recent Projects</h2>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="text-terminal-muted text-sm">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="text-terminal-muted text-sm text-center py-8">
                    No projects yet. Create your first project to start collaborating.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map(project => (
                      <div key={project.id} className="border border-terminal-border p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-terminal-text text-sm font-medium">{project.title}</h3>
                            <p className="text-terminal-muted text-xs mt-1">{project.description}</p>
                            <div className="flex items-center mt-2 text-xs text-terminal-muted">
                              <span className="bg-terminal-bg px-2 py-1 rounded">{project.project_type}</span>
                              <span className="ml-2">{formatTimeAgo(project.created_at)}</span>
                              {project.collaborator_count && (
                                <span className="ml-2">{project.collaborator_count} collaborators</span>
                              )}
                            </div>
                          </div>
                          <a
                            href={`/project/${project.id}`}
                            className="text-terminal-text text-xs hover:bg-terminal-bg px-2 py-1 transition-colors"
                          >
                            Open →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-terminal-surface border border-terminal-border">
              <div className="border-b border-terminal-border p-4">
                <h2 className="text-terminal-text font-medium">Recent Activity</h2>
              </div>
              <div className="p-4">
                {recentActivity.length === 0 ? (
                  <div className="text-terminal-muted text-sm text-center py-8">
                    No recent activity. Start collaborating to see updates here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 8).map(activity => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <span className="text-sm mt-0.5">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-terminal-text text-xs">
                            <span className="font-medium">{activity.user_name}</span> {activity.description}
                            {activity.project_title && (
                              <span className="text-terminal-muted"> in {activity.project_title}</span>
                            )}
                          </p>
                          <p className="text-terminal-muted text-xs mt-1">
                            {formatTimeAgo(activity.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Collaborations */}
            <div className="bg-terminal-surface border border-terminal-border">
              <div className="border-b border-terminal-border p-4">
                <h2 className="text-terminal-text font-medium">Active Collaborations</h2>
              </div>
              <div className="p-4">
                {collaborations.length === 0 ? (
                  <div className="text-terminal-muted text-sm text-center py-8">
                    No active collaborations. Join a project to start collaborating.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {collaborations.slice(0, 5).map(collab => (
                      <div key={collab.id} className="border border-terminal-border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-terminal-text text-sm">{collab.project_title}</h3>
                            <div className="flex items-center mt-1 text-xs text-terminal-muted">
                              <span className="bg-terminal-bg px-2 py-1 rounded">{collab.role}</span>
                              <span className="ml-2">{formatTimeAgo(collab.created_at)}</span>
                            </div>
                          </div>
                          <a
                            href={`/project/${collab.project_id}`}
                            className="text-terminal-text text-xs hover:bg-terminal-bg px-2 py-1 transition-colors"
                          >
                            Open →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-terminal-surface border border-terminal-border">
              <div className="border-b border-terminal-border p-4">
                <h2 className="text-terminal-text font-medium">Pending Requests</h2>
              </div>
              <div className="p-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-terminal-muted text-sm text-center py-8">
                    No pending requests. All caught up!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 5).map(request => (
                      <div key={request.id} className="border border-terminal-border p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-terminal-text text-sm">{request.project_title}</h3>
                            <p className="text-terminal-muted text-xs mt-1">
                              {request.type} from {request.requester_name}
                            </p>
                            <p className="text-terminal-muted text-xs mt-1">
                              {formatTimeAgo(request.created_at)}
                            </p>
                          </div>
                          <a
                            href={`/review`}
                            className="text-terminal-text text-xs hover:bg-terminal-bg px-2 py-1 transition-colors"
                          >
                            Review →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Create New Project</h2>

            {error && (
              <div className="bg-terminal-bg border border-terminal-border text-terminal-text p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Project Title *</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="Enter project title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Description</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text h-24 resize-none"
                  placeholder="Describe your project"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Project Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                >
                  <option value="document">Document</option>
                  <option value="code">Code Project</option>
                  <option value="design">Design</option>
                  <option value="research">Research</option>
                  <option value="notes">Notes</option>
                  <option value="wiki">Wiki</option>
                </select>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || !projectTitle.trim()}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}