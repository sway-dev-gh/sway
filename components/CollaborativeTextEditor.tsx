'use client'

import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { io, Socket } from 'socket.io-client'
import { Bold, Italic, Underline, Code, List, ListOrdered, Quote, Link, Type, Palette, Save, Users, MessageCircle } from 'lucide-react'

interface CollaborativeTextEditorProps {
  blockId: string
  workspaceId: string
  initialContent?: string
  placeholder?: string
  onSave?: (content: string) => void
  className?: string
  showToolbar?: boolean
  allowComments?: boolean
}

interface TextSelection {
  start: number
  end: number
  text: string
}

interface RemoteUser {
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  selection: TextSelection
  color: string
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    email: string
  }
  timestamp: Date
  position: number
  replies?: Comment[]
}

interface Operation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  attributes?: { [key: string]: any }
}

export interface CollaborativeTextEditorRef {
  getContent: () => string
  setContent: (content: string) => void
  focus: () => void
  insertText: (text: string) => void
}

// Generate consistent colors for users
const generateUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
  ]

  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

const CollaborativeTextEditor = forwardRef<CollaborativeTextEditorRef, CollaborativeTextEditorProps>(({
  blockId,
  workspaceId,
  initialContent = '',
  placeholder = 'Start typing...',
  onSave,
  className = '',
  showToolbar = true,
  allowComments = true
}, ref) => {
  // Core state
  const [content, setContent] = useState(initialContent)
  const [selection, setSelection] = useState<TextSelection>({ start: 0, end: 0, text: '' })
  const [remoteUsers, setRemoteUsers] = useState<Map<string, RemoteUser>>(new Map())
  const [comments, setComments] = useState<Comment[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState<Set<string>>(new Set())

  // Editor state
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentPosition, setCommentPosition] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const operationQueueRef = useRef<Operation[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { user, token } = useAuth()

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getContent: () => content,
    setContent: (newContent: string) => {
      setContent(newContent)
      if (editorRef.current) {
        editorRef.current.value = newContent
      }
    },
    focus: () => editorRef.current?.focus(),
    insertText: (text: string) => {
      if (editorRef.current) {
        const start = editorRef.current.selectionStart
        const end = editorRef.current.selectionEnd
        const newContent = content.slice(0, start) + text + content.slice(end)
        setContent(newContent)
        editorRef.current.value = newContent

        // Move cursor to after inserted text
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.selectionStart = start + text.length
            editorRef.current.selectionEnd = start + text.length
          }
        }, 0)
      }
    }
  }))

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token || !workspaceId || !blockId) return

    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.swayfiles.com'
      : 'http://localhost:5001'

    const socket = io(backendUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('📝 Connected to collaborative editor')
      setIsConnected(true)

      // Join the workspace
      socket.emit('join-workspace', { workspaceId, projectId: workspaceId })

      // Request current document state
      socket.emit('document-join', { blockId, workspaceId })
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from collaborative editor')
      setIsConnected(false)
    })

    // Handle incoming operations from other users
    socket.on('operation', (operation: Operation & { userId: string }) => {
      if (operation.userId !== user.id) {
        applyOperation(operation)
      }
    })

    // Handle remote cursor/selection updates
    socket.on('selection-update', (data: {
      userId: string
      user: { id: string; name: string; email: string }
      selection: TextSelection
    }) => {
      if (data.userId !== user.id) {
        setRemoteUsers(prev => {
          const newRemoteUsers = new Map(prev)
          newRemoteUsers.set(data.userId, {
            ...data,
            color: generateUserColor(data.userId)
          })
          return newRemoteUsers
        })
      }
    })

    // Handle typing indicators
    socket.on('user-typing', (data: {
      userId: string
      user: { id: string; name: string; email: string }
      typing: boolean
      blockId: string
    }) => {
      if (data.blockId === blockId && data.userId !== user.id) {
        setIsTyping(prev => {
          const newTyping = new Set(prev)
          if (data.typing) {
            newTyping.add(data.userId)
          } else {
            newTyping.delete(data.userId)
          }
          return newTyping
        })
      }
    })

    // Handle document state sync
    socket.on('document-state', (data: {
      content: string
      comments: Comment[]
      activeUsers: any[]
    }) => {
      setContent(data.content)
      setComments(data.comments || [])
      if (editorRef.current) {
        editorRef.current.value = data.content
      }
    })

    // Handle new comments
    socket.on('comment-added', (comment: Comment) => {
      if (comment.id) { // Avoid duplicate temporary comments
        setComments(prev => [...prev, comment])
      }
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, token, workspaceId, blockId])

  // Apply remote operations to local content
  const applyOperation = useCallback((operation: Operation) => {
    setContent(prevContent => {
      let newContent = prevContent

      switch (operation.type) {
        case 'insert':
          if (operation.content) {
            newContent =
              prevContent.slice(0, operation.position) +
              operation.content +
              prevContent.slice(operation.position)
          }
          break
        case 'delete':
          if (operation.length) {
            newContent =
              prevContent.slice(0, operation.position) +
              prevContent.slice(operation.position + operation.length)
          }
          break
        case 'retain':
          // No change to content, just move position
          break
      }

      // Update editor value if it exists
      if (editorRef.current) {
        editorRef.current.value = newContent
      }

      return newContent
    })
  }, [])

  // Send operation to other users
  const sendOperation = useCallback((operation: Operation) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('operation', {
        ...operation,
        blockId,
        workspaceId,
        userId: user.id
      })
    }
  }, [isConnected, blockId, workspaceId, user])

  // Handle text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    const oldContent = content

    // Generate operations based on content diff
    if (newContent.length > oldContent.length) {
      // Text was inserted
      const insertPosition = findInsertPosition(oldContent, newContent)
      const insertedText = newContent.slice(insertPosition, insertPosition + (newContent.length - oldContent.length))

      sendOperation({
        type: 'insert',
        position: insertPosition,
        content: insertedText
      })
    } else if (newContent.length < oldContent.length) {
      // Text was deleted
      const deletePosition = findDeletePosition(oldContent, newContent)
      const deleteLength = oldContent.length - newContent.length

      sendOperation({
        type: 'delete',
        position: deletePosition,
        length: deleteLength
      })
    }

    setContent(newContent)

    // Handle auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 1000) // Auto-save after 1 second of inactivity
  }, [content, sendOperation])

  // Find insertion position by comparing strings
  const findInsertPosition = (oldStr: string, newStr: string): number => {
    for (let i = 0; i < Math.min(oldStr.length, newStr.length); i++) {
      if (oldStr[i] !== newStr[i]) {
        return i
      }
    }
    return oldStr.length
  }

  // Find deletion position by comparing strings
  const findDeletePosition = (oldStr: string, newStr: string): number => {
    for (let i = 0; i < Math.min(oldStr.length, newStr.length); i++) {
      if (oldStr[i] !== newStr[i]) {
        return i
      }
    }
    return newStr.length
  }

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || !socketRef.current || !isConnected) return

    const start = editorRef.current.selectionStart
    const end = editorRef.current.selectionEnd
    const selectedText = content.slice(start, end)

    const newSelection = { start, end, text: selectedText }
    setSelection(newSelection)

    // Broadcast selection to other users
    socketRef.current.emit('selection-update', {
      blockId,
      workspaceId,
      selection: newSelection
    })
  }, [content, isConnected, blockId, workspaceId])

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing-start', { workspaceId, blockId })

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && isConnected) {
          socketRef.current.emit('typing-stop', { workspaceId, blockId })
        }
      }, 3000)
    }
  }, [isConnected, workspaceId, blockId])

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(content)
      setSavedAt(new Date())
    }
  }, [content, onSave])

  // Add comment at current cursor position
  const handleAddComment = useCallback(() => {
    if (!editorRef.current || !newComment.trim()) return

    const position = editorRef.current.selectionStart
    const comment: Comment = {
      id: `temp-${Date.now()}`,
      content: newComment,
      author: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email
      },
      timestamp: new Date(),
      position
    }

    // Add comment locally
    setComments(prev => [...prev, comment])

    // Send comment to backend
    if (socketRef.current && isConnected) {
      socketRef.current.emit('new-comment', {
        workspaceId,
        blockId,
        comment: newComment,
        position
      })
    }

    setNewComment('')
    setShowCommentForm(false)
  }, [newComment, user, isConnected, workspaceId, blockId])

  // Format text functions
  const formatText = (format: string) => {
    if (!editorRef.current) return

    const start = editorRef.current.selectionStart
    const end = editorRef.current.selectionEnd
    const selectedText = content.slice(start, end)

    if (!selectedText) return

    let formattedText = selectedText
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `__${selectedText}__`
        break
      case 'code':
        formattedText = `\`${selectedText}\``
        break
      default:
        return
    }

    const newContent = content.slice(0, start) + formattedText + content.slice(end)
    setContent(newContent)
    editorRef.current.value = newContent

    // Send operation
    sendOperation({
      type: 'delete',
      position: start,
      length: selectedText.length
    })
    sendOperation({
      type: 'insert',
      position: start,
      content: formattedText
    })
  }

  return (
    <div className={`collaborative-text-editor ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Offline'}</span>
          {remoteUsers.size > 0 && (
            <span>{remoteUsers.size} collaborator{remoteUsers.size !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {savedAt && (
            <span>Saved {savedAt.toLocaleTimeString()}</span>
          )}
          {isTyping.size > 0 && (
            <span className="text-blue-500">
              {isTyping.size} user{isTyping.size !== 1 ? 's' : ''} typing...
            </span>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="border border-gray-300 p-2 mb-2 flex items-center space-x-2 bg-gray-50">
          <button
            onClick={() => formatText('bold')}
            className="p-1 hover:bg-gray-200 rounded"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => formatText('italic')}
            className="p-1 hover:bg-gray-200 rounded"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => formatText('underline')}
            className="p-1 hover:bg-gray-200 rounded"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            onClick={() => formatText('code')}
            className="p-1 hover:bg-gray-200 rounded"
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-300 mx-2" />

          {allowComments && (
            <button
              onClick={() => {
                if (editorRef.current) {
                  setCommentPosition(editorRef.current.selectionStart)
                  setShowCommentForm(true)
                }
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Add Comment"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSave}
            className="p-1 hover:bg-gray-200 rounded"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleTypingStart}
          onSelect={handleSelectionChange}
          onClick={handleSelectionChange}
          placeholder={placeholder}
          className="w-full min-h-[300px] p-4 border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-vertical"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        />

        {/* Remote User Selections */}
        {Array.from(remoteUsers.values()).map(remoteUser => (
          <div
            key={remoteUser.userId}
            className="absolute pointer-events-none"
            style={{
              top: '16px', // Adjust based on textarea padding
              left: '16px',
              right: '16px',
              zIndex: 10
            }}
          >
            {/* Selection highlight would be complex to implement with textarea */}
            {/* For a full implementation, consider using a div with contentEditable */}
          </div>
        ))}
      </div>

      {/* Active Collaborators */}
      {remoteUsers.size > 0 && (
        <div className="mt-2 flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-1">
            {Array.from(remoteUsers.values()).map(remoteUser => (
              <div
                key={remoteUser.userId}
                className="flex items-center space-x-1 text-xs px-2 py-1 rounded-full border"
                style={{ borderColor: remoteUser.color }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: remoteUser.color }}
                />
                <span>{remoteUser.user.name || remoteUser.user.email.split('@')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment Form Modal */}
      {showCommentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Add Comment</h3>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Enter your comment..."
              className="w-full h-24 p-3 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowCommentForm(false)
                  setNewComment('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={!newComment.trim()}
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {allowComments && comments.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Comments</h4>
          <div className="space-y-2">
            {comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 p-3 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{comment.author.name}</span>
                  <span className="text-xs text-gray-500">
                    {comment.timestamp.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

CollaborativeTextEditor.displayName = 'CollaborativeTextEditor'

export default CollaborativeTextEditor