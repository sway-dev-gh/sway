import { useState, useEffect, useRef } from 'react'
import theme from '../theme'
import api from '../api/axios'

/**
 * Integrated Messaging System
 *
 * Real-time messaging component for project communication.
 * Used in both business dashboard and client workspace.
 */
function MessagingSystem({
  projectId,
  currentUser,
  isClientView = false,
  style = {}
}) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    // Set up real-time messaging (WebSocket connection would go here)
    // For now, we'll poll every 30 seconds
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const endpoint = isClientView
        ? `/api/client/workspace/${projectId}/messages`
        : `/api/projects/${projectId}/messages`

      const { data } = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const endpoint = isClientView
        ? `/api/client/workspace/${projectId}/messages`
        : `/api/projects/${projectId}/messages`

      const messageData = {
        content: newMessage,
        type: 'text',
        senderType: isClientView ? 'client' : 'business'
      }

      const { data } = await api.post(endpoint, messageData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      setMessages(prev => [...prev, data.message])
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      setUploadingFile(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'file')
      formData.append('senderType', isClientView ? 'client' : 'business')

      const endpoint = isClientView
        ? `/api/client/workspace/${projectId}/messages/file`
        : `/api/projects/${projectId}/messages/file`

      const { data } = await api.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setMessages(prev => [...prev, data.message])
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getFileIcon = (filename) => {
    return '□' // Simple minimal file icon
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      background: theme.colors.bg.hover,
      border: `1px solid ${theme.colors.border.light}`,
      borderRadius: theme.radius.lg,
      ...style
    }}>
      {/* Messages Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${theme.colors.border.light}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{
          color: theme.colors.text.primary,
          fontSize: theme.fontSize.base,
          fontWeight: theme.weight.semibold
        }}>
          Project Communication
        </h3>
        <div style={{
          color: theme.colors.text.tertiary,
          fontSize: theme.fontSize.xs
        }}>
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Messages List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.colors.text.tertiary,
            fontSize: theme.fontSize.sm
          }}>
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.colors.text.secondary,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>◯</div>
            <h4 style={{ marginBottom: '8px' }}>Start the conversation</h4>
            <p style={{ fontSize: theme.fontSize.sm }}>Send a message to get started</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.senderType === (isClientView ? 'client' : 'business')
            const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  paddingLeft: showAvatar ? '0' : '44px'
                }}
              >
                {showAvatar && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: theme.radius.full,
                    background: isCurrentUser ? theme.colors.white : theme.colors.border.medium,
                    color: isCurrentUser ? theme.colors.black : theme.colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.semibold,
                    flexShrink: 0
                  }}>
                    {message.senderName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  {showAvatar && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.medium
                      }}>
                        {message.senderName || 'Unknown User'}
                      </span>
                      <span style={{
                        color: theme.colors.text.tertiary,
                        fontSize: theme.fontSize.xs
                      }}>
                        {formatTimestamp(message.createdAt)}
                      </span>
                    </div>
                  )}

                  <div style={{
                    background: isCurrentUser ? 'rgba(255, 255, 255, 0.08)' : theme.colors.bg.secondary,
                    padding: '8px 12px',
                    borderRadius: theme.radius.md,
                    border: `1px solid ${theme.colors.border.light}`,
                    maxWidth: '80%'
                  }}>
                    {message.type === 'file' ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: theme.colors.text.primary
                      }}>
                        <span style={{ fontSize: theme.fontSize.lg }}>
                          {getFileIcon(message.fileName)}
                        </span>
                        <span style={{
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.weight.medium
                        }}>
                          {message.fileName}
                        </span>
                        <span style={{
                          color: theme.colors.text.tertiary,
                          fontSize: theme.fontSize.xs
                        }}>
                          ({(message.fileSize / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ) : (
                      <p style={{
                        color: theme.colors.text.secondary,
                        fontSize: theme.fontSize.sm,
                        lineHeight: 1.4,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {message.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: `1px solid ${theme.colors.border.light}`,
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile}
          style={{
            width: '36px',
            height: '36px',
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: uploadingFile ? 'not-allowed' : 'pointer',
            color: theme.colors.text.secondary,
            fontSize: theme.fontSize.base,
            opacity: uploadingFile ? 0.5 : 1
          }}
          title="Attach file"
        >
          {uploadingFile ? '•' : '+'}
        </button>

        {/* Text Input */}
        <div style={{ flex: 1 }}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            disabled={sending}
            style={{
              width: '100%',
              minHeight: '36px',
              maxHeight: '120px',
              padding: '8px 12px',
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.md,
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.sm,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          style={{
            width: '36px',
            height: '36px',
            background: newMessage.trim() && !sending ? theme.colors.white : theme.colors.bg.secondary,
            color: newMessage.trim() && !sending ? theme.colors.black : theme.colors.text.tertiary,
            border: 'none',
            borderRadius: theme.radius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
            fontSize: theme.fontSize.base,
            transition: 'all 200ms'
          }}
          title="Send message"
        >
          {sending ? '•' : '→'}
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          accept="*/*"
        />
      </div>
    </div>
  )
}

export default MessagingSystem