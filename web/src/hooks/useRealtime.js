/**
 * React Hook for Real-time Collaboration
 * Provides easy access to real-time features and manages connection lifecycle
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import realtimeService from '../services/realtimeService'

export const useRealtime = (autoConnect = true) => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [presenceData, setPresenceData] = useState([])
  const [activeCursors, setActiveCursors] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [error, setError] = useState(null)
  const [currentWorkspace, setCurrentWorkspace] = useState(null)
  const reconnectTimeoutRef = useRef(null)

  // Connect to real-time service
  const connect = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      await realtimeService.connect(token)
      setIsConnected(true)
      setConnectionStatus('connected')
      setError(null)
    } catch (err) {
      setError(err.message)
      setIsConnected(false)
      setConnectionStatus('error')
    }
  }, [])

  // Disconnect from real-time service
  const disconnect = useCallback(() => {
    realtimeService.disconnect()
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setCurrentWorkspace(null)
    setPresenceData([])
    setActiveCursors([])
    setTypingUsers([])
  }, [])

  // Join a workspace
  const joinWorkspace = useCallback((workspaceId, projectId) => {
    if (!isConnected) {
      console.warn('Cannot join workspace: not connected')
      return
    }

    realtimeService.joinWorkspace(workspaceId, projectId)
    setCurrentWorkspace(workspaceId)
  }, [isConnected])

  // Leave current workspace
  const leaveWorkspace = useCallback(() => {
    realtimeService.leaveWorkspace()
    setCurrentWorkspace(null)
    setPresenceData([])
    setActiveCursors([])
    setTypingUsers([])
  }, [])

  // Setup event listeners
  useEffect(() => {
    const unsubscribers = []

    // Connection status listener
    const connectionUnsubscribe = realtimeService.onConnectionChange((status, data) => {
      setConnectionStatus(status)
      setIsConnected(status === 'connected')

      if (status === 'error') {
        setError(data?.message || 'Connection error')
      } else if (status === 'connected') {
        setError(null)
      }

      if (status === 'disconnected') {
        // Attempt reconnection after delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (autoConnect) {
            connect()
          }
        }, 3000)
      }
    })
    unsubscribers.push(connectionUnsubscribe)

    // Workspace state listener
    const workspaceStateUnsubscribe = realtimeService.on('workspace-state', (data) => {
      setPresenceData(realtimeService.getPresenceData())
      setActiveCursors(realtimeService.getActiveCursors())
      setTypingUsers(realtimeService.getTypingUsers())
    })
    unsubscribers.push(workspaceStateUnsubscribe)

    // User presence listeners
    const userJoinedUnsubscribe = realtimeService.on('user-joined', () => {
      setPresenceData(realtimeService.getPresenceData())
    })
    unsubscribers.push(userJoinedUnsubscribe)

    const userLeftUnsubscribe = realtimeService.on('user-left', () => {
      setPresenceData(realtimeService.getPresenceData())
      setActiveCursors(realtimeService.getActiveCursors())
      setTypingUsers(realtimeService.getTypingUsers())
    })
    unsubscribers.push(userLeftUnsubscribe)

    const presenceUpdatedUnsubscribe = realtimeService.on('presence-updated', () => {
      setPresenceData(realtimeService.getPresenceData())
    })
    unsubscribers.push(presenceUpdatedUnsubscribe)

    // Cursor movement listener
    const cursorMovedUnsubscribe = realtimeService.on('cursor-moved', () => {
      setActiveCursors(realtimeService.getActiveCursors())
    })
    unsubscribers.push(cursorMovedUnsubscribe)

    // Typing indicator listener
    const userTypingUnsubscribe = realtimeService.on('user-typing', () => {
      setTypingUsers(realtimeService.getTypingUsers())
    })
    unsubscribers.push(userTypingUnsubscribe)

    // Auto-connect on mount if enabled
    if (autoConnect) {
      connect()
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect, autoConnect])

  // Real-time action methods
  const updateBlock = useCallback((blockId, content, type) => {
    realtimeService.updateBlock(blockId, content, type)
  }, [])

  const updateCursor = useCallback((position, blockId) => {
    realtimeService.updateCursor(position, blockId)
  }, [])

  const startTyping = useCallback((blockId) => {
    realtimeService.startTyping(blockId)
  }, [])

  const stopTyping = useCallback((blockId) => {
    realtimeService.stopTyping(blockId)
  }, [])

  const addComment = useCallback((blockId, comment, parentCommentId) => {
    realtimeService.addComment(blockId, comment, parentCommentId)
  }, [])

  const changeWorkflowState = useCallback((blockId, newState, previousState) => {
    realtimeService.changeWorkflowState(blockId, newState, previousState)
  }, [])

  const updatePresence = useCallback((status, currentView) => {
    realtimeService.updatePresence(status, currentView)
  }, [])

  // Event subscription helper
  const subscribe = useCallback((event, callback) => {
    return realtimeService.on(event, callback)
  }, [])

  return {
    // Connection state
    isConnected,
    connectionStatus,
    error,
    currentWorkspace,

    // Connection controls
    connect,
    disconnect,
    joinWorkspace,
    leaveWorkspace,

    // Collaboration data
    presenceData,
    activeCursors,
    typingUsers,

    // Real-time actions
    updateBlock,
    updateCursor,
    startTyping,
    stopTyping,
    addComment,
    changeWorkflowState,
    updatePresence,

    // Event subscription
    subscribe,

    // Service reference
    service: realtimeService
  }
}

export default useRealtime