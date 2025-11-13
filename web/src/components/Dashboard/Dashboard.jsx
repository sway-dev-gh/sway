import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Mock data for demonstration
  const files = [
    {
      id: '1',
      name: 'authentication.js',
      type: 'javascript',
      lastActivity: '2 minutes ago',
      collaborators: ['Alice', 'Bob'],
      status: 'active',
      lines: 247,
      changes: 12
    },
    {
      id: '2',
      name: 'database.sql',
      type: 'sql',
      lastActivity: '15 minutes ago',
      collaborators: ['Charlie'],
      status: 'review',
      lines: 89,
      changes: 3
    },
    {
      id: '3',
      name: 'README.md',
      type: 'markdown',
      lastActivity: '1 hour ago',
      collaborators: ['Alice', 'David', 'Eve'],
      status: 'complete',
      lines: 156,
      changes: 8
    },
    {
      id: '4',
      name: 'styles.css',
      type: 'css',
      lastActivity: '3 hours ago',
      collaborators: ['Bob'],
      status: 'draft',
      lines: 432,
      changes: 24
    }
  ]

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

              {/* Add File Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-terminal-text text-terminal-bg text-sm rounded-md hover:bg-terminal-text/90 transition-colors"
              >
                New File
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 h-full overflow-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Files', value: '12', change: '+3' },
            { label: 'Collaborators', value: '8', change: '+2' },
            { label: 'Changes Today', value: '47', change: '+12' },
            { label: 'In Review', value: '5', change: '-1' }
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

        {/* Files Section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-terminal-text mb-4">
            Recent Files
          </h2>

          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="bg-terminal-surface border border-terminal-border rounded-lg p-4 hover:border-terminal-text/20 transition-all cursor-pointer"
                >
                  <Link to={`/collaborate/${file.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-lg text-terminal-text">
                          {getFileIcon(file.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-terminal-text truncate">
                            {file.name}
                          </div>
                          <div className="text-xs text-terminal-muted">
                            {file.lines} lines
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs ${getStatusColor(file.status)}`}>
                        {getStatusLabel(file.status)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-terminal-muted mb-1">
                        Last activity: {file.lastActivity}
                      </div>
                      <div className="text-xs text-terminal-muted">
                        {file.changes} recent changes
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1">
                        {file.collaborators.slice(0, 3).map((collaborator, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 bg-terminal-accent rounded-full border border-terminal-border flex items-center justify-center text-xs text-terminal-text"
                          >
                            {collaborator[0]}
                          </div>
                        ))}
                        {file.collaborators.length > 3 && (
                          <div className="w-6 h-6 bg-terminal-muted rounded-full border border-terminal-border flex items-center justify-center text-xs text-terminal-bg">
                            +{file.collaborators.length - 3}
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
          ) : (
            /* List View */
            <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden">
              <div className="border-b border-terminal-border px-4 py-3 bg-terminal-accent">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-terminal-text uppercase tracking-wide">
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Collaborators</div>
                  <div className="col-span-2">Changes</div>
                  <div className="col-span-2">Last Activity</div>
                </div>
              </div>

              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-terminal-border last:border-b-0"
                >
                  <Link to={`/collaborate/${file.id}`}>
                    <div className="px-4 py-3 hover:bg-terminal-accent transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center space-x-3">
                          <div className="text-base text-terminal-text">
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <div className="text-sm text-terminal-text">
                              {file.name}
                            </div>
                            <div className="text-xs text-terminal-muted">
                              {file.lines} lines
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className={`text-xs ${getStatusColor(file.status)}`}>
                            {getStatusLabel(file.status)}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <div className="flex -space-x-1">
                            {file.collaborators.slice(0, 3).map((collaborator, idx) => (
                              <div
                                key={idx}
                                className="w-5 h-5 bg-terminal-accent rounded-full border border-terminal-border flex items-center justify-center text-xs text-terminal-text"
                              >
                                {collaborator[0]}
                              </div>
                            ))}
                            {file.collaborators.length > 3 && (
                              <div className="text-xs text-terminal-muted ml-2">
                                +{file.collaborators.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2">
                          <span className="text-xs text-terminal-text">
                            {file.changes}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-xs text-terminal-muted">
                            {file.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-terminal-text mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Start New Project',
                description: 'Create a versionless workspace',
                icon: '◇',
                action: 'Create'
              },
              {
                title: 'Import Repository',
                description: 'Migrate from Git to versionless',
                icon: '◈',
                action: 'Import'
              },
              {
                title: 'Join Collaboration',
                description: 'Access shared workspace',
                icon: '◯',
                action: 'Join'
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
                <button className="text-xs text-terminal-text border border-terminal-border px-3 py-1 rounded hover:bg-terminal-accent transition-colors">
                  {action.action}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard