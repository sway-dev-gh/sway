import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import MessagingSystem from '../components/MessagingSystem'
import theme from '../theme'
import api from '../api/axios'

/**
 * Messages Page
 *
 * Central hub for all project communication and messaging.
 * Provides overview of all conversations across projects.
 */
function Messages() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/conversations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: theme.colors.text.secondary
        }}>
          Loading messages...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '48px 60px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            color: theme.colors.text.primary,
            letterSpacing: '-2px',
            marginBottom: '8px'
          }}>
            Messages
          </h1>
          <p style={{
            fontSize: '16px',
            color: theme.colors.text.secondary,
            fontWeight: '500'
          }}>
            All project communications in one place
          </p>
        </div>

        {conversations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '120px 40px',
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '24px'
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
              opacity: 0.3
            }}>
              💬
            </div>
            <h3 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: theme.colors.text.primary,
              marginBottom: '12px',
              letterSpacing: '-0.5px'
            }}>
              No conversations yet
            </h3>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              marginBottom: '40px'
            }}>
              Messages will appear here when clients start communicating
            </p>
            <Link
              to="/projects"
              style={{
                background: theme.colors.white,
                color: theme.colors.black,
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              View Projects
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: selectedConversation ? '320px 1fr' : '1fr',
            gap: '24px',
            height: 'calc(100vh - 200px)',
            minHeight: '600px'
          }}>
            {/* Conversations List */}
            <div style={{
              background: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theme.colors.border.light}`,
                background: theme.colors.bg.secondary
              }}>
                <h3 style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.weight.semibold
                }}>
                  Conversations
                </h3>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {conversations.map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    style={{
                      padding: '16px 24px',
                      borderBottom: `1px solid ${theme.colors.border.light}`,
                      cursor: 'pointer',
                      background: selectedConversation?.id === conversation.id
                        ? theme.colors.bg.secondary
                        : 'transparent',
                      transition: 'all 200ms'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedConversation?.id !== conversation.id) {
                        e.target.style.background = theme.colors.bg.secondary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedConversation?.id !== conversation.id) {
                        e.target.style.background = 'transparent'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: theme.radius.full,
                        background: theme.colors.border.medium,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.semibold,
                        color: theme.colors.text.primary,
                        flexShrink: 0
                      }}>
                        {conversation.clientName?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <h4 style={{
                            color: theme.colors.text.primary,
                            fontSize: theme.fontSize.sm,
                            fontWeight: theme.weight.semibold,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {conversation.projectTitle || 'Untitled Project'}
                          </h4>
                          {conversation.unreadCount > 0 && (
                            <div style={{
                              background: theme.colors.white,
                              color: theme.colors.black,
                              borderRadius: theme.radius.full,
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: theme.weight.bold,
                              minWidth: '20px',
                              textAlign: 'center'
                            }}>
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>
                        <p style={{
                          color: theme.colors.text.secondary,
                          fontSize: theme.fontSize.xs,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conversation.clientName}
                        </p>
                        <p style={{
                          color: theme.colors.text.tertiary,
                          fontSize: theme.fontSize.xs,
                          margin: 0,
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conversation.lastMessage?.substring(0, 50)}...
                        </p>
                      </div>
                      <div style={{
                        color: theme.colors.text.tertiary,
                        fontSize: theme.fontSize.xs,
                        flexShrink: 0
                      }}>
                        {formatTimestamp(conversation.lastMessageDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Thread */}
            {selectedConversation && (
              <div style={{
                background: theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Thread Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: `1px solid ${theme.colors.border.light}`,
                  background: theme.colors.bg.secondary
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.colors.text.secondary,
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      ←
                    </button>
                    <div>
                      <h3 style={{
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.base,
                        fontWeight: theme.weight.semibold,
                        margin: 0
                      }}>
                        {selectedConversation.projectTitle}
                      </h3>
                      <p style={{
                        color: theme.colors.text.secondary,
                        fontSize: theme.fontSize.sm,
                        margin: 0,
                        marginTop: '2px'
                      }}>
                        with {selectedConversation.clientName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1 }}>
                  <MessagingSystem
                    projectId={selectedConversation.projectId}
                    currentUser={{ type: 'business' }}
                    style={{
                      height: '100%',
                      border: 'none',
                      borderRadius: 0
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Messages