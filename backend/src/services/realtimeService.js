/**
 * Real-time Collaboration Service
 * Handles WebSocket connections, presence, and live collaboration features
 */

const jwt = require('jsonwebtoken')
const pool = require('../db/pool')
const { createNotification } = require('../routes/notifications')

class RealtimeService {
  constructor(io) {
    this.io = io
    this.connectedUsers = new Map() // userId -> { socketId, workspaceId, presence }
    this.workspaceRooms = new Map() // workspaceId -> Set of userIds
    this.typingUsers = new Map() // workspaceId -> Set of userIds
    this.activeCursors = new Map() // workspaceId -> { userId: cursorPosition }

    this.setupAuthMiddleware()
    this.setupConnectionHandlers()
  }

  setupAuthMiddleware() {
    // Authenticate socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // Get user info from database
        const userResult = await pool.query(
          'SELECT id, email, name, created_at FROM users WHERE id = $1',
          [decoded.userId]
        )

        if (userResult.rows.length === 0) {
          return next(new Error('User not found'))
        }

        socket.userId = decoded.userId
        socket.userEmail = decoded.userEmail
        socket.user = userResult.rows[0]
        next()
      } catch (error) {
        console.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })
  }

  setupConnectionHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.email} connected with socket ${socket.id}`)

      // Store user connection
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        socket: socket,
        user: socket.user,
        workspaceId: null,
        presence: {
          status: 'online',
          lastSeen: new Date(),
          currentView: null
        }
      })

      // Handle workspace joining
      socket.on('join-workspace', (data) => {
        this.handleJoinWorkspace(socket, data)
      })

      // Handle workspace leaving
      socket.on('leave-workspace', (data) => {
        this.handleLeaveWorkspace(socket, data)
      })

      // Handle real-time block updates
      socket.on('block-update', (data) => {
        this.handleBlockUpdate(socket, data)
      })

      // Handle cursor position updates
      socket.on('cursor-update', (data) => {
        this.handleCursorUpdate(socket, data)
      })

      // Handle typing indicators
      socket.on('typing-start', (data) => {
        this.handleTypingStart(socket, data)
      })

      socket.on('typing-stop', (data) => {
        this.handleTypingStop(socket, data)
      })

      // Handle comments in real-time
      socket.on('new-comment', (data) => {
        this.handleNewComment(socket, data)
      })

      // Handle workflow state changes
      socket.on('workflow-state-change', (data) => {
        this.handleWorkflowStateChange(socket, data)
      })

      // Handle presence updates
      socket.on('presence-update', (data) => {
        this.handlePresenceUpdate(socket, data)
      })

      // Handle document joining for collaborative editing
      socket.on('document-join', (data) => {
        this.handleDocumentJoin(socket, data)
      })

      // Handle real-time text operations
      socket.on('operation', (data) => {
        this.handleOperation(socket, data)
      })

      // Handle selection updates for collaborative editing
      socket.on('selection-update', (data) => {
        this.handleSelectionUpdate(socket, data)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })
    })
  }

  async handleJoinWorkspace(socket, { workspaceId, projectId }) {
    try {
      // Verify user has access to workspace/project
      const accessCheck = await pool.query(`
        SELECT p.id, p.title, p.user_id
        FROM projects p
        WHERE p.id = $1 AND (
          p.user_id = $2 OR
          EXISTS(SELECT 1 FROM collaborations c
                 WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
        )
      `, [projectId, socket.userId])

      if (accessCheck.rows.length === 0) {
        socket.emit('error', { type: 'access_denied', message: 'Access denied to workspace' })
        return
      }

      const project = accessCheck.rows[0]
      const roomId = `workspace-${projectId}`

      // Leave previous workspace if any
      if (socket.currentWorkspace) {
        socket.leave(socket.currentWorkspace)
        this.removeFromWorkspaceRoom(socket.userId, socket.currentWorkspace)
      }

      // Join new workspace room
      socket.join(roomId)
      socket.currentWorkspace = roomId
      socket.projectId = projectId

      // Update user connection info
      const userConnection = this.connectedUsers.get(socket.userId)
      if (userConnection) {
        userConnection.workspaceId = projectId
        userConnection.presence.currentView = 'workspace'
        userConnection.presence.lastSeen = new Date()
      }

      // Add to workspace room tracking
      this.addToWorkspaceRoom(socket.userId, roomId)

      // Notify others in the workspace
      const presenceData = this.getWorkspacePresence(roomId)
      socket.to(roomId).emit('user-joined', {
        userId: socket.userId,
        user: socket.user,
        presence: userConnection.presence,
        timestamp: new Date()
      })

      // Send current workspace state to the joining user
      socket.emit('workspace-state', {
        project,
        presence: presenceData,
        activeCursors: this.activeCursors.get(roomId) || {},
        typingUsers: Array.from(this.typingUsers.get(roomId) || [])
      })

      // Log activity
      this.logActivity(socket.userId, 'workspace_joined', 'project', projectId, {
        project_title: project.title
      })

      console.log(`User ${socket.user.email} joined workspace ${roomId}`)
    } catch (error) {
      console.error('Join workspace error:', error)
      socket.emit('error', { type: 'join_failed', message: 'Failed to join workspace' })
    }
  }

  handleLeaveWorkspace(socket, { workspaceId }) {
    const roomId = `workspace-${workspaceId}`

    if (socket.currentWorkspace === roomId) {
      socket.leave(roomId)
      socket.currentWorkspace = null

      // Update user connection
      const userConnection = this.connectedUsers.get(socket.userId)
      if (userConnection) {
        userConnection.workspaceId = null
        userConnection.presence.currentView = null
      }

      // Remove from workspace room tracking
      this.removeFromWorkspaceRoom(socket.userId, roomId)

      // Notify others
      socket.to(roomId).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date()
      })

      console.log(`User ${socket.user.email} left workspace ${roomId}`)
    }
  }

  handleBlockUpdate(socket, { blockId, content, type, workspaceId }) {
    const roomId = `workspace-${workspaceId}`

    // Broadcast update to all other users in workspace
    socket.to(roomId).emit('block-updated', {
      blockId,
      content,
      type,
      updatedBy: {
        userId: socket.userId,
        name: socket.user.name,
        email: socket.user.email
      },
      timestamp: new Date()
    })

    console.log(`Block ${blockId} updated by ${socket.user.email} in ${roomId}`)
  }

  handleCursorUpdate(socket, { workspaceId, position, blockId }) {
    const roomId = `workspace-${workspaceId}`

    // Update cursor position in memory
    if (!this.activeCursors.has(roomId)) {
      this.activeCursors.set(roomId, {})
    }

    const workspaceCursors = this.activeCursors.get(roomId)
    workspaceCursors[socket.userId] = {
      userId: socket.userId,
      user: socket.user,
      position,
      blockId,
      timestamp: new Date()
    }

    // Broadcast cursor position to others
    socket.to(roomId).emit('cursor-moved', {
      userId: socket.userId,
      user: socket.user,
      position,
      blockId,
      timestamp: new Date()
    })
  }

  handleTypingStart(socket, { workspaceId, blockId }) {
    const roomId = `workspace-${workspaceId}`

    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set())
    }

    const typingInWorkspace = this.typingUsers.get(roomId)
    typingInWorkspace.add(socket.userId)

    socket.to(roomId).emit('user-typing', {
      userId: socket.userId,
      user: socket.user,
      blockId,
      typing: true
    })
  }

  handleTypingStop(socket, { workspaceId, blockId }) {
    const roomId = `workspace-${workspaceId}`

    const typingInWorkspace = this.typingUsers.get(roomId)
    if (typingInWorkspace) {
      typingInWorkspace.delete(socket.userId)
    }

    socket.to(roomId).emit('user-typing', {
      userId: socket.userId,
      user: socket.user,
      blockId,
      typing: false
    })
  }

  async handleNewComment(socket, { workspaceId, blockId, comment, parentCommentId }) {
    const roomId = `workspace-${workspaceId}`

    // Broadcast new comment to workspace
    socket.to(roomId).emit('comment-added', {
      blockId,
      comment: {
        id: `temp-${Date.now()}`, // Temporary ID until backend creates real one
        content: comment,
        author: socket.user,
        parentCommentId,
        timestamp: new Date()
      },
      addedBy: socket.user
    })

    // Send notification to project collaborators
    try {
      const collaborators = await this.getProjectCollaborators(socket.projectId)
      for (const collaborator of collaborators) {
        if (collaborator.id !== socket.userId) {
          await createNotification(
            collaborator.id,
            'comment_added',
            'New Comment',
            `${socket.user.name} commented on a block`,
            { blockId, projectId: socket.projectId }
          )

          // Send real-time notification if user is online
          const userConnection = this.connectedUsers.get(collaborator.id)
          if (userConnection) {
            userConnection.socket.emit('notification', {
              type: 'comment_added',
              title: 'New Comment',
              message: `${socket.user.name} commented on a block`,
              timestamp: new Date()
            })
          }
        }
      }
    } catch (error) {
      console.error('Error sending comment notifications:', error)
    }
  }

  async handleWorkflowStateChange(socket, { workspaceId, blockId, newState, previousState }) {
    const roomId = `workspace-${workspaceId}`

    // Broadcast workflow change to workspace
    socket.to(roomId).emit('workflow-state-changed', {
      blockId,
      newState,
      previousState,
      changedBy: socket.user,
      timestamp: new Date()
    })

    // Send notifications for important state changes
    if (newState === 'under_review' || newState === 'approved') {
      try {
        const collaborators = await this.getProjectCollaborators(socket.projectId)
        for (const collaborator of collaborators) {
          if (collaborator.id !== socket.userId) {
            await createNotification(
              collaborator.id,
              newState === 'under_review' ? 'review_assigned' : 'review_approved',
              newState === 'under_review' ? 'Review Requested' : 'Block Approved',
              `${socket.user.name} ${newState === 'under_review' ? 'requested review for' : 'approved'} a block`,
              { blockId, projectId: socket.projectId, newState }
            )

            // Real-time notification
            const userConnection = this.connectedUsers.get(collaborator.id)
            if (userConnection) {
              userConnection.socket.emit('notification', {
                type: newState === 'under_review' ? 'review_assigned' : 'review_approved',
                title: newState === 'under_review' ? 'Review Requested' : 'Block Approved',
                message: `${socket.user.name} ${newState === 'under_review' ? 'requested review for' : 'approved'} a block`,
                timestamp: new Date()
              })
            }
          }
        }
      } catch (error) {
        console.error('Error sending workflow notifications:', error)
      }
    }
  }

  handlePresenceUpdate(socket, { status, currentView }) {
    const userConnection = this.connectedUsers.get(socket.userId)
    if (userConnection) {
      userConnection.presence = {
        ...userConnection.presence,
        status,
        currentView,
        lastSeen: new Date()
      }

      // Broadcast presence update to current workspace
      if (socket.currentWorkspace) {
        socket.to(socket.currentWorkspace).emit('presence-updated', {
          userId: socket.userId,
          presence: userConnection.presence
        })
      }
    }
  }

  async handleDocumentJoin(socket, { blockId, workspaceId }) {
    try {
      // Verify user has access to the document
      const accessCheck = await pool.query(`
        SELECT p.id, p.title
        FROM projects p
        WHERE p.id = $1 AND (
          p.user_id = $2 OR
          EXISTS(SELECT 1 FROM collaborations c
                 WHERE c.project_id = p.id AND c.collaborator_id = $2 AND c.status = 'active')
        )
      `, [workspaceId, socket.userId])

      if (accessCheck.rows.length === 0) {
        socket.emit('error', { type: 'access_denied', message: 'Access denied to document' })
        return
      }

      // Join document-specific room
      const documentRoom = `document-${blockId}`
      socket.join(documentRoom)
      socket.currentDocument = documentRoom

      // Get document content from database (you may need to adjust this query based on your schema)
      const documentQuery = await pool.query(`
        SELECT content, updated_at
        FROM document_blocks
        WHERE id = $1
      `, [blockId])

      const documentContent = documentQuery.rows[0]?.content || ''

      // Get existing comments for this block
      const commentsQuery = await pool.query(`
        SELECT id, content, user_id, position, created_at
        FROM block_comments
        WHERE block_id = $1
        ORDER BY position, created_at
      `, [blockId])

      const comments = commentsQuery.rows.map(row => ({
        id: row.id,
        content: row.content,
        author: { id: row.user_id },
        position: row.position,
        timestamp: row.created_at
      }))

      // Send current document state
      socket.emit('document-state', {
        content: documentContent,
        comments: comments,
        activeUsers: this.getDocumentUsers(documentRoom)
      })

      console.log(`User ${socket.user.email} joined document ${blockId}`)
    } catch (error) {
      console.error('Document join error:', error)
      socket.emit('error', { type: 'join_failed', message: 'Failed to join document' })
    }
  }

  handleOperation(socket, { blockId, workspaceId, type, position, content, length, userId }) {
    const documentRoom = `document-${blockId}`

    // Broadcast operation to all other users in the document
    socket.to(documentRoom).emit('operation', {
      type,
      position,
      content,
      length,
      userId: socket.userId,
      blockId,
      timestamp: new Date()
    })

    // Log operation for potential conflict resolution
    console.log(`Operation ${type} by ${socket.user.email} in document ${blockId}`)
  }

  handleSelectionUpdate(socket, { blockId, workspaceId, selection }) {
    const documentRoom = `document-${blockId}`

    // Broadcast selection update to other users
    socket.to(documentRoom).emit('selection-update', {
      userId: socket.userId,
      user: socket.user,
      selection,
      blockId,
      timestamp: new Date()
    })
  }

  handleDisconnect(socket) {
    console.log(`User ${socket.user?.email} disconnected`)

    // Remove from connected users
    this.connectedUsers.delete(socket.userId)

    // Remove from workspace rooms
    if (socket.currentWorkspace) {
      this.removeFromWorkspaceRoom(socket.userId, socket.currentWorkspace)

      // Notify others of disconnection
      socket.to(socket.currentWorkspace).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date()
      })
    }

    // Remove from document rooms
    if (socket.currentDocument) {
      socket.to(socket.currentDocument).emit('user-left', {
        userId: socket.userId,
        timestamp: new Date()
      })
    }

    // Clean up cursor positions
    for (const [roomId, cursors] of this.activeCursors.entries()) {
      delete cursors[socket.userId]
    }

    // Clean up typing indicators
    for (const [roomId, typingSet] of this.typingUsers.entries()) {
      typingSet.delete(socket.userId)
    }
  }

  // Helper methods
  addToWorkspaceRoom(userId, roomId) {
    if (!this.workspaceRooms.has(roomId)) {
      this.workspaceRooms.set(roomId, new Set())
    }
    this.workspaceRooms.get(roomId).add(userId)
  }

  removeFromWorkspaceRoom(userId, roomId) {
    const room = this.workspaceRooms.get(roomId)
    if (room) {
      room.delete(userId)
      if (room.size === 0) {
        this.workspaceRooms.delete(roomId)
      }
    }
  }

  getWorkspacePresence(roomId) {
    const room = this.workspaceRooms.get(roomId)
    if (!room) return []

    return Array.from(room).map(userId => {
      const connection = this.connectedUsers.get(userId)
      return connection ? {
        userId,
        user: connection.user,
        presence: connection.presence
      } : null
    }).filter(Boolean)
  }

  async getProjectCollaborators(projectId) {
    try {
      const result = await pool.query(`
        SELECT DISTINCT u.id, u.name, u.email
        FROM users u
        WHERE u.id IN (
          SELECT p.user_id FROM projects p WHERE p.id = $1
          UNION
          SELECT c.collaborator_id FROM collaborations c WHERE c.project_id = $1 AND c.status = 'active'
        )
      `, [projectId])

      return result.rows
    } catch (error) {
      console.error('Error getting project collaborators:', error)
      return []
    }
  }

  async logActivity(userId, action, resourceType, resourceId, metadata = {}) {
    try {
      await pool.query(
        `INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata, actor_id)
         VALUES ($1, $2, $3, $4, $5, $1)`,
        [userId, action, resourceType, resourceId, JSON.stringify(metadata)]
      )
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  // Public API methods
  getConnectedUsers() {
    return Array.from(this.connectedUsers.values()).map(conn => ({
      userId: conn.user.id,
      user: conn.user,
      presence: conn.presence,
      workspaceId: conn.workspaceId
    }))
  }

  getWorkspaceUsers(workspaceId) {
    const roomId = `workspace-${workspaceId}`
    return this.getWorkspacePresence(roomId)
  }

  getDocumentUsers(documentRoom) {
    // Get users currently in the document room
    const room = this.io.sockets.adapter.rooms.get(documentRoom)
    if (!room) return []

    const users = []
    for (const socketId of room) {
      const socket = this.io.sockets.sockets.get(socketId)
      if (socket && socket.user) {
        const connection = this.connectedUsers.get(socket.userId)
        if (connection) {
          users.push({
            userId: socket.userId,
            user: socket.user,
            presence: connection.presence
          })
        }
      }
    }
    return users
  }

  sendToUser(userId, event, data) {
    const connection = this.connectedUsers.get(userId)
    if (connection) {
      connection.socket.emit(event, data)
      return true
    }
    return false
  }

  sendToWorkspace(workspaceId, event, data) {
    const roomId = `workspace-${workspaceId}`
    this.io.to(roomId).emit(event, data)
  }
}

module.exports = RealtimeService