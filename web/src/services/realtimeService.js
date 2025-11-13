/**
 * Frontend Real-time Collaboration Service
 * Handles Socket.IO client connection and real-time features
 */

import { io } from 'socket.io-client'

class RealtimeCollaborationService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.currentWorkspace = null
    this.listeners = new Map()
    this.presenceData = new Map() // userId -> presence info
    this.activeCursors = new Map() // userId -> cursor position
    this.typingUsers = new Set()
    this.connectionListeners = new Set()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  // Initialize connection
  connect(token) {
    if (this.socket?.connected) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['polling', 'websocket'],
        timeout: 10000,
        autoConnect: true
      })

      // Connection established
      this.socket.on('connect', () => {
        console.log('✅ Real-time collaboration connected')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyConnectionListeners('connected')
        resolve()
      })

      // Connection failed
      this.socket.on('connect_error', (error) => {
        console.error('❌ Real-time connection failed:', error.message)
        this.isConnected = false
        this.notifyConnectionListeners('error', error)

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          setTimeout(() => {
            if (!this.isConnected) {
              this.socket.connect()
            }
          }, 2000 * this.reconnectAttempts)
        } else {
          reject(error)
        }
      })

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Real-time collaboration disconnected:', reason)
        this.isConnected = false
        this.notifyConnectionListeners('disconnected', reason)
      })

      // Setup event listeners
      this.setupEventListeners()
    })
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.currentWorkspace = null
      this.presenceData.clear()
      this.activeCursors.clear()
      this.typingUsers.clear()
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    if (!this.socket) return

    // Workspace events
    this.socket.on('workspace-state', (data) => {
      this.handleWorkspaceState(data)
    })

    // User presence events
    this.socket.on('user-joined', (data) => {
      this.handleUserJoined(data)
    })

    this.socket.on('user-left', (data) => {
      this.handleUserLeft(data)
    })

    this.socket.on('presence-updated', (data) => {
      this.handlePresenceUpdated(data)
    })

    // Block collaboration events
    this.socket.on('block-updated', (data) => {
      this.handleBlockUpdated(data)
    })

    // Cursor tracking events
    this.socket.on('cursor-moved', (data) => {
      this.handleCursorMoved(data)
    })

    // Typing indicators
    this.socket.on('user-typing', (data) => {
      this.handleUserTyping(data)
    })

    // Comments
    this.socket.on('comment-added', (data) => {
      this.handleCommentAdded(data)
    })

    // Workflow changes
    this.socket.on('workflow-state-changed', (data) => {
      this.handleWorkflowStateChanged(data)
    })

    // Real-time notifications
    this.socket.on('notification', (data) => {
      this.handleRealtimeNotification(data)
    })

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
      this.emit('error', error)
    })
  }

  // Join a workspace for collaboration
  joinWorkspace(workspaceId, projectId) {
    if (!this.socket?.connected) {
      console.warn('Cannot join workspace: not connected')
      return
    }

    this.currentWorkspace = workspaceId
    this.socket.emit('join-workspace', { workspaceId, projectId })
  }

  // Leave current workspace
  leaveWorkspace() {
    if (!this.socket?.connected || !this.currentWorkspace) return

    this.socket.emit('leave-workspace', { workspaceId: this.currentWorkspace })
    this.currentWorkspace = null
    this.presenceData.clear()
    this.activeCursors.clear()
    this.typingUsers.clear()
  }

  // Send block updates
  updateBlock(blockId, content, type) {
    if (!this.socket?.connected || !this.currentWorkspace) return

    this.socket.emit('block-update', {
      blockId,
      content,
      type,
      workspaceId: this.currentWorkspace
    })
  }

  // Send cursor position
  updateCursor(position, blockId) {
    if (!this.socket?.connected || !this.currentWorkspace) return

    // Throttle cursor updates to avoid spam
    clearTimeout(this.cursorThrottle)
    this.cursorThrottle = setTimeout(() => {
      this.socket.emit('cursor-update', {
        workspaceId: this.currentWorkspace,
        position,
        blockId
      })
    }, 100)
  }

  // Send typing indicators
  startTyping(blockId) {
    if (!this.socket?.connected || !this.currentWorkspace) return

    this.socket.emit('typing-start', {
      workspaceId: this.currentWorkspace,
      blockId
    })
  }

  stopTyping(blockId) {
    if (!this.socket?.connected || !this.currentWorkspace) return

    this.socket.emit('typing-stop', {
      workspaceId: this.currentWorkspace,
      blockId
    })
  }

  // Send new comment
  addComment(blockId, comment, parentCommentId = null) {
    if (!this.socket?.connected || !this.currentWorkspace) return

    this.socket.emit('new-comment', {
      workspaceId: this.currentWorkspace,
      blockId,
      comment,
      parentCommentId
    })
  }

  // Send workflow state change
  changeWorkflowState(blockId, newState, previousState) {
    if (!this.socket?.connected || !this.currentWorkspace) return

    this.socket.emit('workflow-state-change', {
      workspaceId: this.currentWorkspace,
      blockId,
      newState,
      previousState
    })
  }

  // Update presence
  updatePresence(status, currentView) {
    if (!this.socket?.connected) return

    this.socket.emit('presence-update', {
      status,
      currentView
    })
  }

  // Event handlers
  handleWorkspaceState(data) {
    console.log('📊 Workspace state received:', data)

    // Update presence data
    this.presenceData.clear()
    if (data.presence) {
      data.presence.forEach(user => {
        this.presenceData.set(user.userId, user)
      })
    }

    // Update cursors
    this.activeCursors.clear()
    if (data.activeCursors) {
      Object.entries(data.activeCursors).forEach(([userId, cursor]) => {
        this.activeCursors.set(userId, cursor)
      })
    }

    // Update typing users
    this.typingUsers.clear()
    if (data.typingUsers) {
      data.typingUsers.forEach(userId => {
        this.typingUsers.add(userId)
      })
    }

    this.emit('workspace-state', data)
  }

  handleUserJoined(data) {
    console.log('👋 User joined workspace:', data.user.email)
    this.presenceData.set(data.userId, {
      userId: data.userId,
      user: data.user,
      presence: data.presence
    })
    this.emit('user-joined', data)
  }

  handleUserLeft(data) {
    console.log('👋 User left workspace:', data.userId)
    this.presenceData.delete(data.userId)
    this.activeCursors.delete(data.userId)
    this.typingUsers.delete(data.userId)
    this.emit('user-left', data)
  }

  handlePresenceUpdated(data) {
    const existingPresence = this.presenceData.get(data.userId)
    if (existingPresence) {
      existingPresence.presence = data.presence
    }
    this.emit('presence-updated', data)
  }

  handleBlockUpdated(data) {
    console.log(`📝 Block ${data.blockId} updated by ${data.updatedBy.email}`)
    this.emit('block-updated', data)
  }

  handleCursorMoved(data) {
    this.activeCursors.set(data.userId, data)
    this.emit('cursor-moved', data)
  }

  handleUserTyping(data) {
    if (data.typing) {
      this.typingUsers.add(data.userId)
    } else {
      this.typingUsers.delete(data.userId)
    }
    this.emit('user-typing', data)
  }

  handleCommentAdded(data) {
    console.log(`💬 New comment on block ${data.blockId} by ${data.addedBy.email}`)
    this.emit('comment-added', data)
  }

  handleWorkflowStateChanged(data) {
    console.log(`🔄 Workflow state changed for block ${data.blockId}: ${data.previousState} → ${data.newState}`)
    this.emit('workflow-state-changed', data)
  }

  handleRealtimeNotification(data) {
    console.log('🔔 Real-time notification:', data)
    this.emit('notification', data)
  }

  // Event emitter functionality
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
      }
    }
  }

  off(event, callback) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${event} listener:`, error)
        }
      })
    }
  }

  // Connection status listeners
  onConnectionChange(callback) {
    this.connectionListeners.add(callback)
    return () => this.connectionListeners.delete(callback)
  }

  notifyConnectionListeners(status, data = null) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(status, data)
      } catch (error) {
        console.error('Error in connection listener:', error)
      }
    })
  }

  // Getters for current state
  getPresenceData() {
    return Array.from(this.presenceData.values())
  }

  getActiveCursors() {
    return Array.from(this.activeCursors.values())
  }

  getTypingUsers() {
    return Array.from(this.typingUsers)
  }

  isUserTyping(userId) {
    return this.typingUsers.has(userId)
  }

  getUserPresence(userId) {
    return this.presenceData.get(userId)
  }

  getUserCursor(userId) {
    return this.activeCursors.get(userId)
  }

  // Connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      workspace: this.currentWorkspace,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Create and export singleton
const realtimeService = new RealtimeCollaborationService()
export default realtimeService