'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspace } from '../../stores/WorkspaceStore'

// Left Navigation Sidebar
export const LeftSidebar = ({ onFileSelect, onWorkspaceSelect }: { onFileSelect: any; onWorkspaceSelect: any }) => {
  const { state, actions } = useWorkspace()
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(new Set([state.currentWorkspace?.id]))

  const toggleWorkspace = (workspaceId: any) => {
    const newExpanded = new Set(expandedWorkspaces)
    if (newExpanded.has(workspaceId)) {
      newExpanded.delete(workspaceId)
    } else {
      newExpanded.add(workspaceId)
    }
    setExpandedWorkspaces(newExpanded)
  }

  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        await actions.addFile(file)
      } catch (error) {
        console.error('Failed to upload file:', error)
      }
    }
  }

  return (
    <div className="w-80 bg-terminal-surface border-r border-terminal-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-terminal-border">
        <h2 className="text-terminal-text font-medium mb-3">Workspaces</h2>
        <button
          onClick={() => actions.createWorkspace('New Workspace', '', '')}
          className="w-full text-left text-sm text-terminal-muted hover:text-terminal-text hover:bg-terminal-accent p-2 rounded transition-colors"
        >
          + New Workspace
        </button>
      </div>

      {/* Workspace Tree */}
      <div className="flex-1 overflow-auto">
        {state.workspaces.map((workspace: any) => (
          <div key={workspace.id} className="border-b border-terminal-border/50">
            <button
              onClick={() => toggleWorkspace(workspace.id)}
              className={`
                w-full text-left p-3 hover:bg-terminal-accent transition-colors flex items-center justify-between
                ${state.currentWorkspace?.id === workspace.id ? 'bg-terminal-accent text-terminal-text' : 'text-terminal-muted hover:text-terminal-text'}
              `}
            >
              <div className="flex items-center space-x-2">
                <span className={`text-xs transition-transform ${expandedWorkspaces.has(workspace.id) ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <span className="text-sm font-medium">{workspace.name}</span>
              </div>
              {state.currentWorkspace?.id === workspace.id && (
                <div className="w-2 h-2 bg-terminal-text rounded-full" />
              )}
            </button>

            <AnimatePresence>
              {expandedWorkspaces.has(workspace.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pl-6 pb-2">
                    {/* Files in workspace */}
                    {state.currentWorkspace?.id === workspace.id && state.files.map((file: any) => (
                      <button
                        key={file.id}
                        onClick={() => onFileSelect(file)}
                        className={`
                          block w-full text-left p-2 text-xs rounded transition-colors
                          ${state.selectedFile?.id === file.id
                            ? 'bg-terminal-text text-terminal-bg'
                            : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-accent'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2">
                          <span>📄</span>
                          <span>{file.name}</span>
                        </div>
                      </button>
                    ))}

                    {/* Add file option */}
                    {state.currentWorkspace?.id === workspace.id && (
                      <label className="block w-full text-left p-2 text-xs text-terminal-muted hover:text-terminal-text cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <span>+</span>
                          <span>Add file</span>
                        </div>
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".md,.txt,.js,.jsx,.ts,.tsx,.py,.css,.html,.json"
                        />
                      </label>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-terminal-border">
        <div className="text-xs text-terminal-muted">
          <div>Press ⌘ + / for commands</div>
          <div className="mt-1">
            {state.files.length} file{state.files.length !== 1 ? 's' : ''} •
            {Object.keys(state.sections).length} block{Object.keys(state.sections).length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

// Right Inspector/Comments Sidebar
export const RightSidebar = ({ selectedSection }: { selectedSection: any }) => {
  const { state, actions } = useWorkspace()
  const [activeTab, setActiveTab] = useState('comments') // 'comments', 'activity', 'inspector'
  const [newComment, setNewComment] = useState('')

  const handleAddComment = async () => {
    if (newComment.trim() && selectedSection) {
      try {
        await actions.addComment(selectedSection.id, newComment.trim())
        setNewComment('')
      } catch (error) {
        console.error('Failed to add comment:', error)
      }
    }
  }

  const getComments = () => {
    if (!selectedSection) return []
    return selectedSection.comments
      ?.map((commentId: any) => state.comments[commentId])
      .filter(Boolean) || []
  }

  const getRecentActivity = () => {
    return state.activities.slice(0, 10)
  }

  return (
    <div className="w-80 bg-terminal-surface border-l border-terminal-border h-full flex flex-col">
      {/* Header with tabs */}
      <div className="border-b border-terminal-border">
        <div className="flex">
          {[
            { id: 'comments', label: 'Comments', icon: '💬' },
            { id: 'activity', label: 'Activity', icon: '📋' },
            { id: 'inspector', label: 'Inspector', icon: '🔍' }
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 p-3 text-sm border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-terminal-text text-terminal-text bg-terminal-accent/20'
                  : 'border-transparent text-terminal-muted hover:text-terminal-text'
                }
              `}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'comments' && (
          <div className="p-4">
            {selectedSection ? (
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-terminal-text mb-2">
                    Comments on: {selectedSection.title}
                  </h3>

                  {/* Comments list */}
                  <div className="space-y-3 mb-4">
                    {getComments().length > 0 ? (
                      getComments().map((comment: any) => (
                        <div key={comment.id} className="bg-terminal-accent rounded p-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-medium text-terminal-text">
                              {comment.author}
                            </span>
                            <span className="text-xs text-terminal-muted">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-terminal-text">{comment.content}</p>
                          {comment.resolved && (
                            <span className="inline-block mt-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              Resolved
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-terminal-muted text-sm">
                        No comments yet
                      </div>
                    )}
                  </div>

                  {/* Add comment */}
                  <div className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full h-20 bg-terminal-bg border border-terminal-border rounded p-2 text-sm text-terminal-text resize-none focus:outline-none focus:border-terminal-text"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="w-full bg-terminal-text text-terminal-bg py-2 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-terminal-text/90"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-terminal-muted text-sm">
                Select a block to view comments
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-terminal-text mb-3">Recent Activity</h3>
            <div className="space-y-3">
              {getRecentActivity().length > 0 ? (
                getRecentActivity().map((activity: any) => (
                  <div key={activity.id} className="border-l-2 border-terminal-border pl-3">
                    <div className="text-xs text-terminal-muted mb-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm text-terminal-text">
                      <span className="font-medium">{activity.user}</span> {activity.description}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-terminal-muted text-sm">
                  No activity yet
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inspector' && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-terminal-text mb-3">Inspector</h3>
            {selectedSection ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-terminal-muted">Block ID</label>
                  <div className="text-sm text-terminal-text font-mono bg-terminal-accent rounded p-2 mt-1">
                    {selectedSection.id}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-terminal-muted">Workflow State</label>
                  <div className="mt-1">
                    <select
                      value={selectedSection.workflowState}
                      onChange={(e) => actions.updateWorkflowState(selectedSection.id, e.target.value)}
                      className="w-full bg-terminal-bg border border-terminal-border rounded p-2 text-sm text-terminal-text focus:outline-none focus:border-terminal-text"
                    >
                      <option value="draft">Draft</option>
                      <option value="under_review">Under Review</option>
                      <option value="changes_requested">Changes Requested</option>
                      <option value="approved">Approved</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-terminal-muted">Created</label>
                  <div className="text-sm text-terminal-text mt-1">
                    {selectedSection.createdAt
                      ? new Date(selectedSection.createdAt).toLocaleString()
                      : 'Unknown'
                    }
                  </div>
                </div>

                <div>
                  <label className="text-xs text-terminal-muted">Last Updated</label>
                  <div className="text-sm text-terminal-text mt-1">
                    {selectedSection.updatedAt
                      ? new Date(selectedSection.updatedAt).toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>

                <div>
                  <label className="text-xs text-terminal-muted">Comments</label>
                  <div className="text-sm text-terminal-text mt-1">
                    {selectedSection.comments?.length || 0} comment{selectedSection.comments?.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-terminal-muted text-sm">
                Select a block to inspect
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}