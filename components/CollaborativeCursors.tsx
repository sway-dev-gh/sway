'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { io, Socket } from 'socket.io-client'

interface CursorPosition {
  x: number
  y: number
  blockId?: string
}

interface UserCursor {
  userId: string
  user: {
    id: string
    name: string
    email: string
  }
  position: CursorPosition
  timestamp: Date
  color: string
}

interface CollaborativeCursorsProps {
  workspaceId: string
  projectId: string
  className?: string
}

// Generate a consistent color for each user based on their ID
const generateUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#FF6348', '#2ED573', '#3742FA', '#F368E0', '#FFA502'
  ]

  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Individual cursor component
const UserCursor: React.FC<{ cursor: UserCursor; isVisible: boolean }> = ({ cursor, isVisible }) => {
  if (!isVisible) return null

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-150"
      style={{
        left: cursor.position.x,
        top: cursor.position.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-sm"
      >
        <path
          d="M0 0 L0 14 L5 11 L8 16 L11 14 L8 9 L14 9 Z"
          fill={cursor.color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* User name label */}
      <div
        className="absolute top-5 left-2 px-2 py-1 text-xs font-medium text-white rounded shadow-lg whitespace-nowrap"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.user.name || cursor.user.email.split('@')[0]}
      </div>
    </div>
  )
}

export default function CollaborativeCursors({
  workspaceId,
  projectId,
  className = ''
}: CollaborativeCursorsProps) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [cursors, setCursors] = useState<Map<string, UserCursor>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [showCursors, setShowCursors] = useState(true)
  const lastCursorUpdateRef = useRef<number>(0)
  const throttleDelayRef = useRef<number>(50) // 20fps max

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !workspaceId) return

    const backendUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.swayfiles.com'
      : 'http://localhost:5001'

    const newSocket = io(backendUrl, {
      withCredentials: true, // Include HttpOnly cookies
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('🔄 Connected to real-time collaboration')
      setIsConnected(true)

      // Join the workspace for real-time collaboration
      newSocket.emit('join-workspace', {
        workspaceId: workspaceId,
        projectId: projectId
      })
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from real-time collaboration')
      setIsConnected(false)
    })

    // Handle incoming cursor movements from other users
    newSocket.on('cursor-moved', (data: {
      userId: string
      user: { id: string; name: string; email: string }
      position: CursorPosition
      blockId?: string
      timestamp: string
    }) => {
      if (data.userId === user.id) return // Don't show our own cursor

      setCursors(prev => {
        const newCursors = new Map(prev)
        newCursors.set(data.userId, {
          ...data,
          timestamp: new Date(data.timestamp),
          color: generateUserColor(data.userId)
        })
        return newCursors
      })
    })

    // Handle users joining/leaving
    newSocket.on('user-joined', (data: {
      userId: string
      user: { id: string; name: string; email: string }
    }) => {
      console.log(`👋 ${data.user.name} joined the workspace`)
    })

    newSocket.on('user-left', (data: { userId: string }) => {
      setCursors(prev => {
        const newCursors = new Map(prev)
        newCursors.delete(data.userId)
        return newCursors
      })
    })

    // Handle workspace state (initial cursor positions)
    newSocket.on('workspace-state', (data: {
      activeCursors: { [userId: string]: {
        userId: string
        user: { id: string; name: string; email: string }
        position: CursorPosition
        blockId?: string
        timestamp: string
      }}
    }) => {
      const initialCursors = new Map<string, UserCursor>()

      Object.values(data.activeCursors || {}).forEach(cursor => {
        if (cursor.userId !== user.id) {
          initialCursors.set(cursor.userId, {
            ...cursor,
            timestamp: new Date(cursor.timestamp),
            color: generateUserColor(cursor.userId)
          })
        }
      })

      setCursors(initialCursors)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user, workspaceId, projectId])

  // Track mouse movements and send to backend
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!socket || !isConnected || !showCursors) return

    const now = Date.now()
    if (now - lastCursorUpdateRef.current < throttleDelayRef.current) {
      return // Throttle updates
    }

    lastCursorUpdateRef.current = now

    const position: CursorPosition = {
      x: e.clientX,
      y: e.clientY
    }

    // Find if cursor is over a specific element (for block-level tracking)
    const target = e.target as HTMLElement
    const blockElement = target.closest('[data-block-id]')
    if (blockElement) {
      position.blockId = blockElement.getAttribute('data-block-id') || undefined
    }

    socket.emit('cursor-update', {
      workspaceId: workspaceId,
      position: position,
      blockId: position.blockId
    })
  }, [socket, isConnected, showCursors, workspaceId])

  // Attach mouse move listener
  useEffect(() => {
    if (!showCursors) return

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove, showCursors])

  // Clean up old cursors (remove after 30 seconds of inactivity)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date()
      setCursors(prev => {
        const newCursors = new Map(prev)

        Array.from(newCursors.entries()).forEach(([userId, cursor]) => {
          if (now.getTime() - cursor.timestamp.getTime() > 30000) {
            newCursors.delete(userId)
          }
        })

        return newCursors
      })
    }, 5000)

    return () => clearInterval(cleanupInterval)
  }, [])

  // Keyboard shortcut to toggle cursor visibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') { // Ctrl+M to toggle
        e.preventDefault()
        setShowCursors(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className={`${className}`}>
      {/* Connection status indicator */}
      <div className="fixed top-4 right-4 z-40 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-terminal-muted">
          {isConnected ? 'Live' : 'Offline'}
        </span>

        {cursors.size > 0 && (
          <span className="text-xs text-terminal-muted">
            {cursors.size} collaborator{cursors.size !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Cursor visibility toggle */}
      <button
        onClick={() => setShowCursors(prev => !prev)}
        className="fixed bottom-4 right-4 z-40 bg-terminal-surface border border-terminal-border px-3 py-2 text-xs text-terminal-text hover:bg-terminal-hover transition-colors"
        title="Toggle cursor visibility (Ctrl+M)"
      >
        {showCursors ? '👁️ Hide Cursors' : '👁️‍🗨️ Show Cursors'}
      </button>

      {/* Render all user cursors */}
      {Array.from(cursors.values()).map(cursor => (
        <UserCursor
          key={cursor.userId}
          cursor={cursor}
          isVisible={showCursors && isConnected}
        />
      ))}

      {/* Collaboration panel */}
      {cursors.size > 0 && (
        <div className="fixed left-4 top-16 z-40 bg-terminal-surface border border-terminal-border p-3 max-w-xs">
          <h3 className="text-sm text-terminal-text font-medium mb-2">
            Active Collaborators
          </h3>
          <div className="space-y-1">
            {Array.from(cursors.values()).map(cursor => (
              <div key={cursor.userId} className="flex items-center space-x-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cursor.color }}
                />
                <span className="text-terminal-muted">
                  {cursor.user.name || cursor.user.email.split('@')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}