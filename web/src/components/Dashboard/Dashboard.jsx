import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import dashboardService from '../../services/dashboardService'

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    activeFiles: 0,
    collaborators: 0,
    changesToday: 0,
    inReview: 0
  })
  const [projects, setProjects] = useState([])
  const [activityFeed, setActivityFeed] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsData, projectsData, activityData] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentProjects(),
        dashboardService.getActivityFeed()
      ])

      setStats(statsData)
      setProjects(projectsData)
      setActivityFeed(activityData)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    try {
      const projectName = prompt('Enter project name:')
      if (!projectName) return

      const newProject = {
        name: projectName,
        description: '',
        visibility: 'private',
        status: 'active'
      }

      await dashboardService.createProject(newProject)
      await loadDashboardData() // Refresh data
    } catch (err) {
      console.error('Error creating project:', err)
      alert('Failed to create project. Please try again.')
    }
  }

  const getFileIcon = (type) => {
    const icons = {
      javascript: '◆',
      sql: '◇',
      markdown: '◈',
      css: '◯',
      default: '▣'
    }
    return icons[type] || icons.default
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-400',
      review: 'text-yellow-400',
      complete: 'text-blue-400',
      draft: 'text-gray-400'
    }
    return colors[status] || 'text-terminal-muted'
  }

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Active',
      review: 'In Review',
      complete: 'Complete',
      draft: 'Draft'
    }
    return labels[status] || status
  }

  return (
    <div className="h-full bg-terminal-bg overflow-hidden">
      {/* Header */}
      <div className="border-b border-terminal-border bg-terminal-surface">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium text-terminal-text mb-2">
                Versionless Workspace
              </h1>
              <p className="text-sm text-terminal-muted">
                Collaborate without the chaos of file versions. Track changes through time.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-terminal-accent rounded-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-terminal-text text-terminal-bg'
                      : 'text-terminal-muted hover:text-terminal-text'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-terminal-text text-terminal-bg'
                      : 'text-terminal-muted hover:text-terminal-text'
                  }`}
                >
                  List
                </button>
              </div>

              {/* Add Project Button */}
              <motion.button
                onClick={handleCreateProject}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-terminal-text text-terminal-bg text-sm rounded-md hover:bg-terminal-text/90 transition-colors"
              >
                New Project
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 h-full overflow-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-terminal-muted">Loading dashboard...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8">
            <div className="text-red-400 text-sm">{error}</div>
            <button
              onClick={loadDashboardData}
              className="mt-2 text-xs text-terminal-text border border-terminal-border px-3 py-1 rounded hover:bg-terminal-accent transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Overview */}
        {!loading && !error && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Active Projects', value: stats.activeFiles.toString(), change: '+' + Math.floor(stats.activeFiles * 0.1) },
              { label: 'Collaborators', value: stats.collaborators.toString(), change: '+' + Math.floor(stats.collaborators * 0.2) },
              { label: 'Changes Today', value: stats.changesToday.toString(), change: '+' + Math.floor(stats.changesToday * 0.3) },
              { label: 'In Review', value: stats.inReview.toString(), change: (stats.inReview > 0 ? '-1' : '0') }
            ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-terminal-surface border border-terminal-border rounded-lg p-4"
            >
              <div className="text-terminal-muted text-xs mb-1">{stat.label}</div>
              <div className="flex items-baseline space-x-2">
                <div className="text-xl font-medium text-terminal-text">
                  {stat.value}
                </div>
                <div className="text-xs text-green-400">{stat.change}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Projects Section */}
        {!loading && !error && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-terminal-text">
                Recent Projects
              </h2>
              {projects.length === 0 && (
                <span className="text-sm text-terminal-muted">
                  No projects yet. Create your first project to get started!
                </span>
              )}
            </div>

            {projects.length > 0 && viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="bg-terminal-surface border border-terminal-border rounded-lg p-4 hover:border-terminal-text/20 transition-all cursor-pointer"
                >
                  <Link to={`/workspace/${project.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg text-terminal-text">
                          {getFileIcon(project.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-terminal-text truncate">
                            {project.name}
                          </div>
                          <div className="text-xs text-terminal-muted">
                            {project.lines} lines estimated
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs ${getStatusColor(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-terminal-muted mb-1">
                        Last activity: {project.lastActivity}
                      </div>
                      <div className="text-xs text-terminal-muted">
                        {project.changes} recent changes
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1">
                        {project.collaborators.slice(0, 3).map((collaborator, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 bg-terminal-accent rounded-full border border-terminal-border flex items-center justify-center text-xs text-terminal-text"
                          >
                            {collaborator[0]}
                          </div>
                        ))}
                        {project.collaborators.length > 3 && (
                          <div className="w-6 h-6 bg-terminal-muted rounded-full border border-terminal-border flex items-center justify-center text-xs text-terminal-bg">
                            +{project.collaborators.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-terminal-muted">
                        →
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            /* List View */
            <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden">
              <div className="border-b border-terminal-border px-4 py-3 bg-terminal-accent">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-terminal-text uppercase tracking-wide">
                  <div className="col-span-4">Project Name</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Collaborators</div>
                  <div className="col-span-2">Changes</div>
                  <div className="col-span-2">Last Activity</div>
                </div>
              </div>

              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-terminal-border last:border-b-0"
                >
                  <Link to={`/workspace/${project.id}`}>
                    <div className="px-4 py-3 hover:bg-terminal-accent transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center space-x-3">
                          <div className="text-base text-terminal-text">
                            {getFileIcon(project.type)}
                          </div>
                          <div>
                            <div className="text-sm text-terminal-text">
                              {project.name}
                            </div>
                            <div className="text-xs text-terminal-muted">
                              {project.lines} lines estimated
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className={`text-xs ${getStatusColor(project.status)}`}>
                            {getStatusLabel(project.status)}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <div className="flex -space-x-1">
                            {project.collaborators.slice(0, 3).map((collaborator, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 bg-terminal-accent rounded-full border border-terminal-border flex items-center justify-center text-xs text-terminal-text"
                              >
                                {collaborator[0]}
                              </div>
                            ))}
                            {project.collaborators.length > 3 && (
                              <div className="text-xs text-terminal-muted ml-2">
                                +{project.collaborators.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="text-xs text-terminal-text">
                            {project.changes}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-xs text-terminal-muted">
                            {project.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-8 text-center">
              <div className="text-terminal-muted mb-4">
                <div className="text-4xl mb-2">◇</div>
                <p className="text-sm">No projects found</p>
              </div>
              <motion.button
                onClick={handleCreateProject}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-terminal-text text-terminal-bg text-sm rounded-md hover:bg-terminal-text/90 transition-colors"
              >
                Create Your First Project
              </motion.button>
            </div>
          )}
          </div>
        )}

        {/* Quick Actions */}
        {!loading && !error && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-terminal-text mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Start New Project',
                  description: 'Create a collaborative workspace',
                  icon: '◇',
                  action: 'Create',
                  onClick: handleCreateProject
                },
                {
                  title: 'View Teams',
                  description: 'Manage team members and roles',
                  icon: '◈',
                  action: 'View Teams',
                  onClick: () => window.location.href = '/teams'
                },
                {
                  title: 'Settings',
                  description: 'Configure workspace preferences',
                  icon: '◯',
                  action: 'Settings',
                  onClick: () => window.location.href = '/settings'
                }
              ].map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="bg-terminal-surface border border-terminal-border rounded-lg p-4 hover:border-terminal-text/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-lg text-terminal-text">{action.icon}</div>
                    <div className="text-sm font-medium text-terminal-text">
                      {action.title}
                    </div>
                  </div>
                  <p className="text-xs text-terminal-muted mb-3">
                    {action.description}
                  </p>
                  <button
                    onClick={action.onClick}
                    className="text-xs text-terminal-text border border-terminal-border px-3 py-1 rounded hover:bg-terminal-accent transition-colors"
                  >
                    {action.action}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {!loading && !error && activityFeed.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-terminal-text mb-4">
              Recent Activity
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4">
              <div className="space-y-3">
                {activityFeed.slice(0, 5).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 text-sm"
                  >
                    <div className="w-2 h-2 bg-terminal-text rounded-full"></div>
                    <div className="text-terminal-text">{activity.description}</div>
                    <div className="text-terminal-muted text-xs ml-auto">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard