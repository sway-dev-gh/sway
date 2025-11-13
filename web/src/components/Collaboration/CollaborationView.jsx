import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const CollaborationView = () => {
  const { fileId } = useParams()
  const [selectedTimepoint, setSelectedTimepoint] = useState(null)
  const [activeCollaborators, setActiveCollaborators] = useState([])
  const [timelineView, setTimelineView] = useState('expanded') // 'expanded' or 'compact'
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Mock data for demonstration
  const fileData = {
    id: fileId || '1',
    name: 'authentication.js',
    currentContent: `// Authentication service for SwayFiles
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

class AuthService {
  constructor() {
    this.secret = process.env.JWT_SECRET
    this.saltRounds = 12
  }

  async hashPassword(password) {
    return bcrypt.hash(password, this.saltRounds)
  }

  async validatePassword(password, hash) {
    return bcrypt.compare(password, hash)
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      this.secret,
      { expiresIn: '24h' }
    )
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret)
    } catch (error) {
      return null
    }
  }
}

export default AuthService`,
    timeline: [
      {
        id: 'tp1',
        timestamp: new Date(Date.now() - 3600000),
        author: 'Alice',
        description: 'Added JWT token verification',
        changes: [
          { line: 25, type: 'added', content: '  verifyToken(token) {' },
          { line: 26, type: 'added', content: '    try {' },
          { line: 27, type: 'added', content: '      return jwt.verify(token, this.secret)' },
          { line: 28, type: 'added', content: '    } catch (error) {' },
          { line: 29, type: 'added', content: '      return null' },
          { line: 30, type: 'added', content: '    }' },
          { line: 31, type: 'added', content: '  }' }
        ]
      },
      {
        id: 'tp2',
        timestamp: new Date(Date.now() - 7200000),
        author: 'Bob',
        description: 'Increased salt rounds for security',
        changes: [
          { line: 6, type: 'modified', old: 'this.saltRounds = 10', content: 'this.saltRounds = 12' }
        ]
      },
      {
        id: 'tp3',
        timestamp: new Date(Date.now() - 10800000),
        author: 'Alice',
        description: 'Initial authentication service',
        changes: [
          { line: 1, type: 'added', content: '// Authentication service for SwayFiles' },
          { line: 2, type: 'added', content: 'import bcrypt from \'bcrypt\'' },
          { line: 3, type: 'added', content: 'import jwt from \'jsonwebtoken\'' }
        ]
      }
    ]
  }

  // Mock active collaborators
  useEffect(() => {
    setActiveCollaborators([
      { name: 'Alice', cursor: { line: 15, column: 8 }, color: 'bg-blue-500' },
      { name: 'Bob', cursor: { line: 6, column: 25 }, color: 'bg-green-500' }
    ])
  }, [])

  const formatTime = (date) => {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const getChangeTypeIcon = (type) => {
    const icons = {
      added: '⊞',
      modified: '⊠',
      deleted: '⊟'
    }
    return icons[type] || '⊡'
  }

  const getChangeTypeColor = (type) => {
    const colors = {
      added: 'text-green-400',
      modified: 'text-yellow-400',
      deleted: 'text-red-400'
    }
    return colors[type] || 'text-terminal-muted'
  }

  return (
    <div className="h-full bg-terminal-bg flex">
      {/* Timeline Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-terminal-surface border-r border-terminal-border flex flex-col overflow-hidden"
          >
            {/* Timeline Header */}
            <div className="h-16 border-b border-terminal-border flex items-center justify-between px-4">
              <div>
                <h3 className="text-sm font-medium text-terminal-text">Timeline</h3>
                <p className="text-xs text-terminal-muted">Versionless history</p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setTimelineView(timelineView === 'expanded' ? 'compact' : 'expanded')}
                  className="text-xs text-terminal-muted hover:text-terminal-text transition-colors p-1"
                >
                  {timelineView === 'expanded' ? '⊟' : '⊞'}
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-xs text-terminal-muted hover:text-terminal-text transition-colors p-1"
                >
                  ◀
                </button>
              </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {fileData.timeline.map((timepoint, index) => (
                  <motion.div
                    key={timepoint.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedTimepoint(timepoint.id === selectedTimepoint ? null : timepoint.id)}
                    className={`
                      relative cursor-pointer p-3 rounded-lg border transition-all
                      ${selectedTimepoint === timepoint.id
                        ? 'bg-terminal-accent border-terminal-text'
                        : 'bg-terminal-bg border-terminal-border hover:border-terminal-text/40'
                      }
                    `}
                  >
                    {/* Timeline connector */}
                    {index < fileData.timeline.length - 1 && (
                      <div className="absolute left-4 top-12 w-px h-6 bg-terminal-border"></div>
                    )}

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-terminal-accent rounded-full border border-terminal-border flex items-center justify-center text-xs text-terminal-text flex-shrink-0">
                        {timepoint.author[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-terminal-text">
                            {timepoint.author}
                          </span>
                          <span className="text-xs text-terminal-muted">
                            {formatTime(timepoint.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs text-terminal-text mb-2">
                          {timepoint.description}
                        </p>

                        {timelineView === 'expanded' && (
                          <div className="space-y-1">
                            {timepoint.changes.slice(0, 3).map((change, idx) => (
                              <div key={idx} className="flex items-center space-x-2 text-xs">
                                <span className={getChangeTypeColor(change.type)}>
                                  {getChangeTypeIcon(change.type)}
                                </span>
                                <span className="text-terminal-muted">
                                  Line {change.line}
                                </span>
                                <span className="text-terminal-text truncate">
                                  {change.content.slice(0, 30)}...
                                </span>
                              </div>
                            ))}
                            {timepoint.changes.length > 3 && (
                              <div className="text-xs text-terminal-muted">
                                +{timepoint.changes.length - 3} more changes
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="h-16 bg-terminal-surface border-b border-terminal-border flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-terminal-muted hover:text-terminal-text transition-colors"
              >
                ▶
              </button>
            )}

            <div className="flex items-center space-x-3">
              <div className="text-lg text-terminal-text">◆</div>
              <div>
                <div className="text-sm font-medium text-terminal-text">
                  {fileData.name}
                </div>
                <div className="text-xs text-terminal-muted">
                  Live collaboration active
                </div>
              </div>
            </div>
          </div>

          {/* Active Collaborators */}
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-1">
              {activeCollaborators.map((collaborator, index) => (
                <motion.div
                  key={collaborator.name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-8 h-8 ${collaborator.color} rounded-full border-2 border-terminal-surface flex items-center justify-center text-xs text-white font-medium`}
                >
                  {collaborator.name[0]}
                </motion.div>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-xs text-terminal-muted">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{activeCollaborators.length} active</span>
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-terminal-bg">
            <div className="h-full overflow-auto">
              <div className="font-mono text-sm">
                {/* Line numbers and content */}
                <div className="flex">
                  {/* Line numbers */}
                  <div className="w-12 bg-terminal-surface border-r border-terminal-border text-right pr-2 py-4">
                    {fileData.currentContent.split('\n').map((_, index) => (
                      <div key={index} className="text-xs text-terminal-muted h-5 leading-5">
                        {index + 1}
                      </div>
                    ))}
                  </div>

                  {/* Code content */}
                  <div className="flex-1 p-4 relative">
                    {fileData.currentContent.split('\n').map((line, index) => (
                      <div key={index} className="h-5 leading-5 relative">
                        <span className="text-terminal-text whitespace-pre">
                          {line || ' '}
                        </span>

                        {/* Collaborator cursors */}
                        {activeCollaborators.map(collaborator =>
                          collaborator.cursor.line === index + 1 && (
                            <motion.div
                              key={collaborator.name}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className={`absolute top-0 w-0.5 h-5 ${collaborator.color}`}
                              style={{ left: `${collaborator.cursor.column * 0.6}em` }}
                            >
                              <div className={`absolute -top-6 left-0 px-2 py-0.5 ${collaborator.color} rounded text-xs text-white whitespace-nowrap`}>
                                {collaborator.name}
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change indicators for selected timepoint */}
          {selectedTimepoint && (
            <div className="absolute top-4 right-4 bg-terminal-surface border border-terminal-border rounded-lg p-3 max-w-sm">
              <div className="text-xs font-medium text-terminal-text mb-2">
                Changes in this timepoint:
              </div>
              <div className="space-y-1">
                {fileData.timeline
                  .find(tp => tp.id === selectedTimepoint)
                  ?.changes.map((change, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs">
                      <span className={getChangeTypeColor(change.type)}>
                        {getChangeTypeIcon(change.type)}
                      </span>
                      <span className="text-terminal-muted">L{change.line}</span>
                      <span className="text-terminal-text truncate">
                        {change.content}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="h-8 bg-terminal-surface border-t border-terminal-border flex items-center justify-between px-4 text-xs">
          <div className="flex items-center space-x-4 text-terminal-muted">
            <span>JavaScript</span>
            <span>UTF-8</span>
            <span>{fileData.currentContent.split('\n').length} lines</span>
          </div>

          <div className="flex items-center space-x-4 text-terminal-muted">
            <span>Versionless</span>
            <span>Auto-save: On</span>
            <span className="text-green-400">Connected</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CollaborationView