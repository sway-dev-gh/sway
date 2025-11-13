'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkspace } from '../../stores/WorkspaceStore'
import useNotifications from '../../hooks/useNotifications'
import useRealtime from '../../hooks/useRealtime'

// Block/Section Component
const WorkspaceBlock = ({ section, onSelect, isSelected, onUpdate, onComment, onApprove, realtimeData }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(section.content || '')
  const [title, setTitle] = useState(section.title || '')
  const contentRef = useRef(null)
  const titleRef = useRef(null)

  // Get real-time data for this block
  const activeCursors = realtimeData?.activeCursors?.filter(cursor => cursor.blockId === section.id) || []
  const typingUsers = realtimeData?.typingUsers?.filter(userId =>
    realtimeData?.typingOnBlock?.[userId] === section.id
  ) || []
  const presenceData = realtimeData?.presenceData || []

  const handleSave = () => {
    onUpdate(section.id, { title, content })
    setIsEditing(false)
    // Send real-time update
    if (realtimeData?.updateBlock) {
      realtimeData.updateBlock(section.id, content, 'content')
    }
    if (realtimeData?.stopTyping) {
      realtimeData.stopTyping(section.id)
    }
  }

  const handleCancel = () => {
    setContent(section.content || '')
    setTitle(section.title || '')
    setIsEditing(false)
    if (realtimeData?.stopTyping) {
      realtimeData.stopTyping(section.id)
    }
  }

  // Handle cursor movement and typing indicators
  const handleContentChange = (e) => {
    setContent(e.target.value)
    if (realtimeData?.updateCursor) {
      const cursorPosition = e.target.selectionStart
      realtimeData.updateCursor(cursorPosition, section.id)
    }
  }

  const handleContentFocus = () => {
    if (realtimeData?.startTyping) {
      realtimeData.startTyping(section.id)
    }
  }

  const handleContentBlur = () => {
    if (realtimeData?.stopTyping) {
      realtimeData.stopTyping(section.id)
    }
  }

  const getWorkflowColor = (state) => {
    const colors = {
      draft: 'border-gray-500 bg-gray-900/50',
      under_review: 'border-yellow-500 bg-yellow-900/20',
      changes_requested: 'border-red-500 bg-red-900/20',
      approved: 'border-green-500 bg-green-900/20',
      delivered: 'border-blue-500 bg-blue-900/20'
    }
    return colors[state] || colors.draft
  }

  const getWorkflowLabel = (state) => {
    const labels = {
      draft: 'Draft',
      under_review: 'Under Review',
      changes_requested: 'Changes Requested',
      approved: 'Approved',
      delivered: 'Delivered'
    }
    return labels[state] || state
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={() => onSelect(section)}
      className={`
        relative border-2 rounded-lg p-4 mb-4 cursor-pointer transition-all
        hover:border-terminal-text/50
        ${isSelected ? 'border-terminal-text bg-terminal-accent/20' : getWorkflowColor(section.workflowState)}
      `}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${typingUsers.length > 0 ? 'bg-yellow-400 animate-pulse' : 'bg-terminal-text opacity-60'}`} />
          {isEditing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-terminal-text font-medium border-b border-terminal-border focus:outline-none focus:border-terminal-text"
              placeholder="Block title..."
            />
          ) : (
            <h3 className="text-terminal-text font-medium">{section.title}</h3>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-terminal-muted bg-terminal-surface px-2 py-1 rounded">
            {getWorkflowLabel(section.workflowState)}
          </span>

          {section.comments && section.comments.length > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
              {section.comments.length} comment{section.comments.length > 1 ? 's' : ''}
            </span>
          )}

          {/* Real-time presence indicators */}
          {typingUsers.length > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded flex items-center">
              <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse mr-1" />
              {typingUsers.length} typing...
            </span>
          )}

          {activeCursors.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              {activeCursors.length} active
            </span>
          )}
        </div>
      </div>

      {/* Block Content */}
      <div className="mb-3 relative">
        {isEditing ? (
          <div className="relative">
            <textarea
              ref={contentRef}
              value={content}
              onChange={handleContentChange}
              onFocus={handleContentFocus}
              onBlur={handleContentBlur}
              className="w-full h-32 bg-terminal-surface border border-terminal-border rounded p-3 text-terminal-text text-sm focus:outline-none focus:border-terminal-text resize-none"
              placeholder="Block content..."
            />
            {/* Live cursor indicators */}
            {activeCursors.map(cursor => (
              <div
                key={cursor.userId}
                className="absolute bg-blue-400 h-4 w-0.5 pointer-events-none z-10"
                style={{
                  left: `${Math.min(cursor.position * 8 + 12, 90)}%`,
                  top: '12px'
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-terminal-text text-sm whitespace-pre-wrap min-h-16">
            {section.content || (
              <span className="text-terminal-muted italic">Empty block - click to add content</span>
            )}
          </div>
        )}
      </div>

      {/* Block Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); handleSave() }}
                className="text-xs bg-terminal-text text-terminal-bg px-3 py-1 rounded hover:bg-terminal-text/90"
              >
                Save
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel() }}
                className="text-xs border border-terminal-border text-terminal-text px-3 py-1 rounded hover:bg-terminal-accent"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
                className="text-xs text-terminal-muted hover:text-terminal-text"
              >
                ✏️ Edit
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onComment(section.id) }}
                className="text-xs text-terminal-muted hover:text-terminal-text"
              >
                💬 Comment
              </button>
              {section.workflowState === 'draft' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove(section.id) }}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  ✓ Submit for Review
                </button>
              )}
              {section.workflowState === 'under_review' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove(section.id) }}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  ✓ Approve
                </button>
              )}
            </>
          )}
        </div>

        <div className="text-xs text-terminal-muted">
          {section.createdAt && new Date(section.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-terminal-muted hover:text-terminal-text cursor-grab">
        <div className="flex flex-col space-y-1">
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
          <div className="w-1 h-1 bg-current rounded-full" />
        </div>
      </div>
    </motion.div>
  )
}

// Main Workspace Canvas Component
const WorkspaceCanvas = ({ projectId, selectedSection, onSectionSelect }) => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const { showNotification } = useNotifications()
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandInput, setCommandInput] = useState('')

  // Real-time collaboration hook
  const realtime = useRealtime(true)

  // Join workspace when project loads
  useEffect(() => {
    if (projectId && realtime.isConnected) {
      realtime.joinWorkspace(projectId, projectId)
    }

    return () => {
      if (realtime.isConnected) {
        realtime.leaveWorkspace()
      }
    }
  }, [projectId, realtime.isConnected])

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribers = []

    // Listen for block updates from other users
    const blockUpdateUnsub = realtime.subscribe('block-updated', (data) => {
      if (data.updatedBy.userId !== realtime.currentUser?.id) {
        // Update the block content in the workspace
        actions.updateSection(data.blockId, { content: data.content })
        showNotification(
          'block_updated',
          'Block Updated',
          `${data.updatedBy.name} updated "${data.blockId}"`
        )
      }
    })
    unsubscribers.push(blockUpdateUnsub)

    // Listen for new comments
    const commentUnsub = realtime.subscribe('comment-added', (data) => {
      showNotification(
        'comment_added',
        'New Comment',
        `${data.addedBy.name} commented on a block`
      )
    })
    unsubscribers.push(commentUnsub)

    // Listen for workflow state changes
    const workflowUnsub = realtime.subscribe('workflow-state-changed', (data) => {
      actions.updateWorkflowState(data.blockId, data.newState)
      showNotification(
        'workflow_changed',
        'Workflow Updated',
        `${data.changedBy.name} changed block state to ${data.newState}`
      )
    })
    unsubscribers.push(workflowUnsub)

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [realtime, actions, showNotification])

  // Load workspace data when component mounts
  useEffect(() => {
    if (projectId && state.currentWorkspace?.id !== projectId) {
      // Find the workspace by ID
      const workspace = state.workspaces.find(w => w.id === projectId)
      if (workspace) {
        actions.selectWorkspace(workspace)
      }
    }
  }, [projectId, state.workspaces, state.currentWorkspace])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false)
        setCommandInput('')
        onSectionSelect?.(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCreateBlock = async () => {
    if (!state.currentWorkspace || !state.selectedFile) {
      // Create a default file if none exists
      if (!state.selectedFile && state.files.length === 0) {
        const newFile = new File([''], 'workspace.md', { type: 'text/markdown' })
        await actions.addFile(newFile)
      }
    }

    const fileId = state.selectedFile?.id || state.files[0]?.id
    if (fileId) {
      actions.addSection(fileId, 'New Block', '', Object.keys(state.sections).length)
    }
  }

  const handleUpdateSection = (sectionId, updates) => {
    actions.updateSection(sectionId, updates)
  }

  const handleCommentOnSection = async (sectionId) => {
    const comment = prompt('Add a comment:')
    if (comment && comment.trim()) {
      await actions.addComment(sectionId, comment.trim())
      showNotification(
        'review_comment_added',
        'Comment Added',
        `Added comment: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`
      )
    }
  }

  const handleApproveSection = (sectionId) => {
    const section = state.sections[sectionId]
    if (section) {
      if (section.workflowState === 'draft') {
        actions.updateWorkflowState(sectionId, WORKFLOW_STATES.UNDER_REVIEW)
        showNotification(
          'review_assigned',
          'Submitted for Review',
          `"${section.title}" has been submitted for review`
        )
      } else if (section.workflowState === 'under_review') {
        actions.updateWorkflowState(sectionId, WORKFLOW_STATES.APPROVED)
        showNotification(
          'review_approved',
          'Block Approved',
          `"${section.title}" has been approved!`
        )
      }
    }
  }

  const handleCommandExecute = () => {
    const command = commandInput.toLowerCase().trim()

    if (command.startsWith('/new') || command === '/block') {
      handleCreateBlock()
    } else if (command.startsWith('/comment')) {
      if (selectedSection) {
        handleCommentOnSection(selectedSection.id)
      }
    } else if (command.startsWith('/approve')) {
      if (selectedSection) {
        handleApproveSection(selectedSection.id)
      }
    }

    setShowCommandPalette(false)
    setCommandInput('')
  }

  // Prepare real-time data for blocks
  const realtimeData = {
    presenceData: realtime.presenceData,
    activeCursors: realtime.activeCursors,
    typingUsers: realtime.typingUsers,
    updateBlock: realtime.updateBlock,
    updateCursor: realtime.updateCursor,
    startTyping: realtime.startTyping,
    stopTyping: realtime.stopTyping,
    // Map typing users to blocks for easy lookup
    typingOnBlock: {}
  }

  // Get sections in order
  const orderedSections = Object.values(state.sections)
    .filter(section => state.selectedFile ? section.fileId === state.selectedFile.id : true)
    .sort((a, b) => (a.order || 0) - (b.order || 0))

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-terminal-muted">Loading workspace...</div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400">Error: {state.error}</div>
      </div>
    )
  }

  if (!state.currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-terminal-muted mb-4">No workspace selected</div>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-terminal-text border border-terminal-border px-4 py-2 rounded hover:bg-terminal-accent"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-terminal-bg relative">
      {/* Header */}
      <div className="border-b border-terminal-border bg-terminal-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl text-terminal-text font-medium">
              {state.currentWorkspace.name}
            </h1>
            {state.currentWorkspace.description && (
              <span className="text-terminal-muted text-sm">
                {state.currentWorkspace.description}
              </span>
            )}

            {/* Real-time connection status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${realtime.isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-terminal-muted">
                {realtime.isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>

            {/* Live presence indicators */}
            {realtime.presenceData.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {realtime.presenceData.slice(0, 3).map((user, index) => (
                    <div
                      key={user.userId}
                      className="w-6 h-6 bg-blue-500 rounded-full border-2 border-terminal-surface flex items-center justify-center text-xs text-white font-medium"
                      title={user.user?.name || user.user?.email}
                    >
                      {(user.user?.name || user.user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {realtime.presenceData.length > 3 && (
                    <div className="w-6 h-6 bg-terminal-muted rounded-full border-2 border-terminal-surface flex items-center justify-center text-xs text-terminal-bg">
                      +{realtime.presenceData.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-terminal-muted">
                  {realtime.presenceData.length} online
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreateBlock}
              className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm rounded hover:bg-terminal-text/90"
            >
              + New Block
            </button>
            <button
              onClick={() => setShowCommandPalette(true)}
              className="text-terminal-muted hover:text-terminal-text text-sm"
            >
              ⌘ /
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {orderedSections.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl text-terminal-muted mb-4">◇</div>
              <h2 className="text-terminal-text text-lg mb-2">Start building your workspace</h2>
              <p className="text-terminal-muted text-sm mb-6">
                Create blocks to organize your content, code, tasks, and ideas
              </p>
              <button
                onClick={handleCreateBlock}
                className="bg-terminal-text text-terminal-bg px-6 py-3 rounded hover:bg-terminal-text/90"
              >
                Create Your First Block
              </button>
              <div className="mt-4 text-xs text-terminal-muted">
                Press ⌘ + / to open command palette
              </div>
            </div>
          </div>
        ) : (
          /* Blocks Grid */
          <div className="max-w-4xl mx-auto">
            <AnimatePresence>
              {orderedSections.map((section) => (
                <WorkspaceBlock
                  key={section.id}
                  section={section}
                  isSelected={selectedSection?.id === section.id}
                  onSelect={onSectionSelect}
                  onUpdate={handleUpdateSection}
                  onComment={handleCommentOnSection}
                  onApprove={handleApproveSection}
                  realtimeData={realtimeData}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50"
            onClick={() => setShowCommandPalette(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-terminal-surface border border-terminal-border rounded-lg p-4 w-96 max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3">
                <input
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommandExecute()
                    if (e.key === 'Escape') setShowCommandPalette(false)
                  }}
                  className="w-full bg-terminal-bg border border-terminal-border rounded px-3 py-2 text-terminal-text focus:outline-none focus:border-terminal-text"
                  placeholder="Type a command..."
                  autoFocus
                />
              </div>

              <div className="text-xs text-terminal-muted space-y-1">
                <div><span className="text-terminal-text">/new</span> - Create new block</div>
                <div><span className="text-terminal-text">/comment</span> - Add comment to selected block</div>
                <div><span className="text-terminal-text">/approve</span> - Approve selected block</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WorkspaceCanvas