/**
 * Living Block Component
 * Shows real-time user presence, collaborative editing indicators, and permission management
 */
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Users, Lock, Unlock, Eye, MessageSquare } from 'lucide-react'
import { useCollaboration, CollaborativeUser, EditRequest } from '@/lib/hooks/useCollaboration'

interface LivingBlockProps {
  blockId: string
  content: string
  blockType?: string
  workspaceId: string
  documentId: string
  canEdit?: boolean
  onContentChange?: (content: string) => void
  onEditRequest?: () => void
  className?: string
  children?: React.ReactNode
}

export function LivingBlock({
  blockId,
  content,
  blockType = 'text',
  workspaceId,
  documentId,
  canEdit = false,
  onContentChange,
  onEditRequest,
  className = '',
  children
}: LivingBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [localContent, setLocalContent] = useState(content)
  const [showUserTooltip, setShowUserTooltip] = useState(false)

  const blockRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const {
    focusedBlocks,
    canEdit: hasEditPermission,
    sendBlockFocus,
    sendContentUpdate,
    requestEditPermission,
    sendCursorUpdate
  } = useCollaboration({
    workspaceId,
    documentId,
    onContentUpdate: (updatedBlockId, newContent) => {
      if (updatedBlockId === blockId && newContent !== localContent) {
        setLocalContent(newContent)
        onContentChange?.(newContent)
      }
    }
  })

  // Get users currently focused on this block
  const focusedUsers = focusedBlocks.get(blockId) || []
  const hasActiveUsers = focusedUsers.length > 0

  // Handle block focus
  const handleFocus = useCallback(() => {
    setIsFocused(true)
    sendBlockFocus(blockId, true)
  }, [blockId, sendBlockFocus])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    sendBlockFocus(blockId, false)

    // If we were editing and user has permission, save changes
    if (isEditing && hasEditPermission(blockId)) {
      setIsEditing(false)
      if (localContent !== content) {
        sendContentUpdate(blockId, [{
          type: 'replace',
          position: 0,
          content: localContent,
          length: content.length
        }], Date.now())
        onContentChange?.(localContent)
      }
    }
  }, [blockId, sendBlockFocus, isEditing, hasEditPermission, localContent, content, sendContentUpdate, onContentChange])

  // Handle edit attempt
  const handleEditAttempt = useCallback(() => {
    if (hasEditPermission(blockId)) {
      setIsEditing(true)
      setTimeout(() => {
        editorRef.current?.focus()
      }, 100)
    } else {
      requestEditPermission(blockId)
      onEditRequest?.()
    }
  }, [hasEditPermission, blockId, requestEditPermission, onEditRequest])

  // Handle content change during editing
  const handleContentEdit = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setLocalContent(newContent)

    // Send real-time updates
    if (hasEditPermission(blockId)) {
      const cursorPosition = e.target.selectionStart
      sendCursorUpdate(blockId, cursorPosition)

      // Debounced content sync could be implemented here
    }
  }, [hasEditPermission, blockId, sendCursorUpdate])

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false)
      setLocalContent(content) // Reset to original content
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleBlur() // Save and exit edit mode
    }
  }, [content, handleBlur])

  // Update local content when prop changes
  useEffect(() => {
    if (!isEditing) {
      setLocalContent(content)
    }
  }, [content, isEditing])

  // Determine block state and styling
  const isLocked = !hasEditPermission(blockId) && !canEdit
  const hasCollaborators = hasActiveUsers && focusedUsers.some(u => u.userId !== workspaceId)

  return (
    <motion.div
      ref={blockRef}
      className={`
        relative group
        border-l-4 transition-all duration-300 ease-in-out
        ${isFocused ? 'border-l-terminal-accent bg-terminal-card/50' : 'border-l-transparent'}
        ${hasActiveUsers ? 'bg-terminal-card/30' : ''}
        ${isLocked ? 'opacity-75' : ''}
        p-3 rounded-r-md
        ${className}
      `}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Living Block Header - Shows when users are active */}
      <AnimatePresence>
        {hasActiveUsers && (
          <motion.div
            className="absolute -top-8 left-0 right-0 flex items-center justify-between text-xs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Active Users Indicator */}
            <div
              className="flex items-center space-x-1 cursor-pointer"
              onMouseEnter={() => setShowUserTooltip(true)}
              onMouseLeave={() => setShowUserTooltip(false)}
            >
              <Eye className="w-3 h-3 text-terminal-accent" />
              <span className="text-terminal-muted">
                {focusedUsers.length} viewing
              </span>

              {/* User Avatars */}
              <div className="flex -space-x-1 ml-2">
                {focusedUsers.slice(0, 3).map((user) => (
                  <div
                    key={user.userId}
                    className="w-4 h-4 rounded-full border border-terminal-border flex items-center justify-center text-xs font-mono"
                    style={{ backgroundColor: user.color }}
                    title={user.user.name}
                  >
                    {user.user.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                ))}
                {focusedUsers.length > 3 && (
                  <div className="w-4 h-4 rounded-full bg-terminal-muted text-terminal-bg border border-terminal-border flex items-center justify-center text-xs">
                    +{focusedUsers.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Block Actions */}
            <div className="flex items-center space-x-2">
              {isLocked ? (
                <button
                  onClick={handleEditAttempt}
                  className="flex items-center space-x-1 text-terminal-muted hover:text-terminal-accent transition-colors"
                  title="Request edit permission"
                >
                  <Lock className="w-3 h-3" />
                  <span>Request Edit</span>
                </button>
              ) : (
                <button
                  onClick={handleEditAttempt}
                  className="flex items-center space-x-1 text-terminal-accent hover:text-white transition-colors"
                  title="Edit block"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Tooltip */}
      <AnimatePresence>
        {showUserTooltip && hasActiveUsers && (
          <motion.div
            className="absolute -top-16 left-0 bg-terminal-card border border-terminal-border rounded-md p-2 z-50 min-w-48"
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-xs text-terminal-muted mb-1">Currently viewing:</div>
            <div className="space-y-1">
              {focusedUsers.map((user) => (
                <div key={user.userId} className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                  <span className="text-xs text-terminal-text">{user.user.name}</span>
                  {user.isEditing && (
                    <Edit3 className="w-3 h-3 text-terminal-accent" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Content */}
      <div className="relative">
        {isEditing && hasEditPermission(blockId) ? (
          /* Edit Mode */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative"
          >
            <textarea
              ref={editorRef}
              value={localContent}
              onChange={handleContentEdit}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full min-h-24 bg-terminal-bg border border-terminal-accent rounded-md p-3 text-terminal-text font-mono text-sm resize-y focus:outline-none focus:ring-1 focus:ring-terminal-accent"
              placeholder="Start typing..."
              autoFocus
            />

            {/* Edit Mode Indicator */}
            <div className="absolute bottom-2 right-2 flex items-center space-x-2 text-xs text-terminal-muted">
              <Edit3 className="w-3 h-3" />
              <span>Editing • Esc to cancel • ⌘Enter to save</span>
            </div>

            {/* Collaborative Cursors (simplified) */}
            {focusedUsers.map((user) => (
              user.userId !== workspaceId && user.isEditing && (
                <motion.div
                  key={user.userId}
                  className="absolute top-0 w-px h-full pointer-events-none"
                  style={{
                    backgroundColor: user.color,
                    left: `${user.cursor_position || 0}%`
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className="absolute -top-5 -left-1 px-1 py-0.5 rounded text-xs text-white text-nowrap"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.user.name}
                  </div>
                </motion.div>
              )
            ))}
          </motion.div>
        ) : (
          /* View Mode */
          <div
            className="cursor-pointer p-2 rounded border border-transparent hover:border-terminal-border transition-colors"
            onClick={handleEditAttempt}
          >
            {children || (
              <div className="text-terminal-text font-mono whitespace-pre-wrap">
                {localContent || <span className="text-terminal-muted italic">Click to edit...</span>}
              </div>
            )}

            {/* Presence Indicators */}
            {hasCollaborators && (
              <div className="absolute top-1 right-1 flex space-x-1">
                {focusedUsers.slice(0, 2).map((user) => (
                  <motion.div
                    key={user.userId}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: user.color }}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Block Status Indicator */}
      <div className="absolute bottom-1 left-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLocked ? (
          <Lock className="w-3 h-3 text-terminal-muted" />
        ) : (
          <Unlock className="w-3 h-3 text-terminal-accent" />
        )}
        <span className="text-xs text-terminal-muted">
          Block {blockId.slice(-6)}
        </span>
      </div>

      {/* Collaborative Border Effect */}
      <AnimatePresence>
        {hasActiveUsers && (
          <motion.div
            className="absolute inset-0 rounded-r-md pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 1px ${focusedUsers[0]?.color || '#4ECDC4'}40`
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}