/**
 * Real-time Collaboration Hook
 * Manages WebSocket connections, living blocks, and edit permissions
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { io, Socket } from 'socket.io-client'

export interface CollaborativeUser {
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  color: string
  isEditing?: boolean
  cursor_position?: number
}

export interface EditRequest {
  requestId: string
  requester: CollaborativeUser['user']
  documentId: string
  blockId: string
  message?: string
  timestamp: Date
}

export interface DocumentBlock {
  id: string
  content: string
  block_type: string
  position: number
  version: number
  activeUsers: CollaborativeUser[]
  isLocked?: boolean
  lockedBy?: CollaborativeUser['user']
}

interface UseCollaborationProps {
  workspaceId?: string
  documentId?: string
  onContentUpdate?: (blockId: string, content: string, version: number) => void
  onUserJoin?: (user: CollaborativeUser) => void
  onUserLeave?: (userId: string) => void
  onEditRequest?: (request: EditRequest) => void
}

export function useCollaboration({
  workspaceId,
  documentId,
  onContentUpdate,
  onUserJoin,
  onUserLeave,
  onEditRequest
}: UseCollaborationProps) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<CollaborativeUser[]>([])
  const [focusedBlocks, setFocusedBlocks] = useState<Map<string, CollaborativeUser[]>>(new Map())
  const [editPermissions, setEditPermissions] = useState<Set<string>>(new Set())
  const [pendingRequests, setPendingRequests] = useState<EditRequest[]>([])

  // Ref to track the current socket instance
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (!user || socketRef.current?.connected) return

    console.log('🔌 Connecting to collaboration server...')

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001', {
      auth: {
        userId: user.id,
        userEmail: user.email
      },
      transports: ['polling', 'websocket'],
      upgrade: true,
      autoConnect: true,
      withCredentials: true // Use cookies for auth
    })

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to collaboration server')
      setIsConnected(true)

      if (workspaceId) {
        newSocket.emit('join-workspace', { workspaceId, projectId: workspaceId })
      }

      if (documentId) {
        newSocket.emit('document-join', {
          blockId: documentId,
          workspaceId: workspaceId
        })
      }
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from collaboration server')
      setIsConnected(false)

      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!socketRef.current?.connected) {
          connect()
        }
      }, 3000)
    })

    // Workspace events
    newSocket.on('user-joined', (data) => {
      console.log('👋 User joined:', data.user.email)
      const collaborativeUser: CollaborativeUser = {
        userId: data.userId,
        user: data.user,
        color: getUserColor(data.userId)
      }

      setActiveUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId)
        return [...filtered, collaborativeUser]
      })

      onUserJoin?.(collaborativeUser)
    })

    newSocket.on('user-left', (data) => {
      console.log('👋 User left:', data.userId)
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId))
      setFocusedBlocks(prev => {
        const updated = new Map(prev)
        updated.forEach((users, blockId) => {
          updated.set(blockId, users.filter((u: CollaborativeUser) => u.userId !== data.userId))
        })
        return updated
      })

      onUserLeave?.(data.userId)
    })

    // Document collaboration events
    newSocket.on('document-state', (data) => {
      console.log('📄 Document state received:', data)
      if (data.activeUsers) {
        const collaborativeUsers = data.activeUsers.map((u: any): CollaborativeUser => ({
          userId: u.userId,
          user: u.user,
          color: getUserColor(u.userId)
        }))
        setActiveUsers(collaborativeUsers)
      }
    })

    newSocket.on('content-updated', (data) => {
      console.log('✏️ Content updated:', data.blockId)
      onContentUpdate?.(data.blockId, data.content, data.version)
    })

    // Living blocks events
    newSocket.on('block-focus-changed', (data) => {
      console.log('👁️ Block focus changed:', data.blockId, data.focusType)
      setFocusedBlocks(prev => {
        const updated = new Map(prev)
        const blockUsers = updated.get(data.blockId) || []

        if (data.focusType === 'focus') {
          const user: CollaborativeUser = {
            userId: data.userId,
            user: data.user,
            color: getUserColor(data.userId)
          }
          updated.set(data.blockId, [...blockUsers.filter(u => u.userId !== data.userId), user])
        } else {
          updated.set(data.blockId, blockUsers.filter(u => u.userId !== data.userId))
        }

        return updated
      })
    })

    // Request-to-edit workflow events
    newSocket.on('edit-request', (data) => {
      console.log('🙋 Edit request received:', data)
      const request: EditRequest = {
        requestId: data.requestId,
        requester: data.requester,
        documentId: data.documentId,
        blockId: data.blockId,
        message: data.message,
        timestamp: new Date(data.timestamp)
      }

      setPendingRequests(prev => [...prev, request])
      onEditRequest?.(request)
    })

    newSocket.on('edit-permission-response', (data) => {
      console.log('✅ Edit permission response:', data.approved)

      if (data.approved) {
        setEditPermissions(prev => new Set([...Array.from(prev), data.blockId]))

        // Remove from pending requests
        setPendingRequests(prev =>
          prev.filter(req => req.requestId !== data.requestId)
        )
      }
    })

    newSocket.on('editor-granted', (data) => {
      console.log('🔓 Editor access granted:', data)
      setEditPermissions(prev => new Set([...Array.from(prev), data.blockId]))
    })

    // Error handling
    newSocket.on('error', (error) => {
      console.error('❌ Collaboration error:', error)
    })

    socketRef.current = newSocket
    setSocket(newSocket)
  }, [user, workspaceId, documentId, onContentUpdate, onUserJoin, onUserLeave, onEditRequest])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setSocket(null)
    setIsConnected(false)
    setActiveUsers([])
    setFocusedBlocks(new Map())
  }, [])

  // Collaborative editing actions
  const sendContentUpdate = useCallback((blockId: string, operations: any[], version: number) => {
    if (!socketRef.current || !documentId || !workspaceId) return

    socketRef.current.emit('content-update', {
      documentId,
      blockId,
      operations,
      version,
      workspaceId
    })
  }, [documentId, workspaceId])

  const sendBlockFocus = useCallback((blockId: string, focused: boolean) => {
    if (!socketRef.current || !documentId || !workspaceId) return

    socketRef.current.emit('block-focus', {
      documentId,
      blockId,
      workspaceId,
      focusType: focused ? 'focus' : 'blur'
    })
  }, [documentId, workspaceId])

  const requestEditPermission = useCallback((blockId: string, message?: string) => {
    if (!socketRef.current || !documentId || !workspaceId) return

    socketRef.current.emit('request-edit', {
      documentId,
      blockId,
      workspaceId,
      message: message || 'Requesting permission to edit this block'
    })
  }, [documentId, workspaceId])

  const respondToEditRequest = useCallback((requestId: string, requesterId: string, blockId: string, approved: boolean) => {
    if (!socketRef.current || !documentId || !workspaceId) return

    socketRef.current.emit('edit-permission-response', {
      requestId,
      requesterId,
      documentId,
      blockId,
      approved,
      workspaceId
    })
  }, [documentId, workspaceId])

  const sendCursorUpdate = useCallback((blockId: string, position: number) => {
    if (!socketRef.current || !workspaceId) return

    socketRef.current.emit('cursor-update', {
      workspaceId,
      position,
      blockId
    })
  }, [workspaceId])

  // Generate consistent colors for users
  const getUserColor = (userId: string): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
    const hash = userId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  // Check if user can edit a specific block
  const canEdit = useCallback((blockId: string): boolean => {
    if (!user) return false

    // Always allow project owner to edit
    if (user.id === workspaceId) return true

    // Check if user has temporary permission for this block
    return editPermissions.has(blockId)
  }, [user, workspaceId, editPermissions])

  // Auto-connect when hook is used
  useEffect(() => {
    if (user) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [user, connect, disconnect])

  // Update workspace/document when props change
  useEffect(() => {
    if (socketRef.current?.connected && workspaceId) {
      socketRef.current.emit('join-workspace', { workspaceId, projectId: workspaceId })
    }
  }, [workspaceId])

  useEffect(() => {
    if (socketRef.current?.connected && documentId) {
      socketRef.current.emit('document-join', {
        blockId: documentId,
        workspaceId: workspaceId
      })
    }
  }, [documentId, workspaceId])

  return {
    // Connection state
    isConnected,
    socket,

    // Users and presence
    activeUsers,
    focusedBlocks,

    // Permissions
    editPermissions,
    canEdit,

    // Pending requests
    pendingRequests,
    setPendingRequests,

    // Actions
    sendContentUpdate,
    sendBlockFocus,
    sendCursorUpdate,
    requestEditPermission,
    respondToEditRequest,

    // Connection management
    connect,
    disconnect
  }
}