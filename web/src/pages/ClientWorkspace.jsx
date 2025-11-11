import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import theme from '../theme'
import api from '../api/axios'

/**
 * Client Project Workspace
 *
 * Client-facing interface where clients can:
 * - View project details and progress
 * - Access shared files and deliverables
 * - Communicate with the business
 * - View and pay invoices
 * - Schedule appointments
 */
function ClientWorkspace() {
  const { projectId, clientToken } = useParams()
  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWorkspace()
  }, [projectId, clientToken])

  const fetchWorkspace = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/api/client/workspace/${projectId}`, {
        headers: { Authorization: `Bearer ${clientToken}` }
      })
      setWorkspace(data.workspace)
    } catch (error) {
      setError('Unable to load project workspace. Please check your link.')
      console.error('Failed to fetch workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await api.post(`/api/client/workspace/${projectId}/messages`, {
        content: newMessage,
        type: 'text'
      }, {
        headers: { Authorization: `Bearer ${clientToken}` }
      })

      setNewMessage('')
      fetchWorkspace() // Refresh to show new message
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const downloadFile = async (fileId, filename) => {
    try {
      const response = await api.get(`/api/client/workspace/${projectId}/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${clientToken}` },
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.secondary,
        fontSize: theme.fontSize.sm
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: theme.spacing[3] }}>Loading your workspace...</div>
          <div style={{ width: '200px', height: '2px', background: theme.colors.border.light, borderRadius: '1px', overflow: 'hidden' }}>
            <div style={{
              width: '50%',
              height: '100%',
              background: theme.colors.white,
              borderRadius: '1px',
              animation: 'slide 1.5s infinite'
            }} />
          </div>
        </div>
        <style>{`
          @keyframes slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: theme.colors.bg.page,
        padding: theme.spacing[6]
      }}>
        <div style={{
          textAlign: 'center',
          background: theme.colors.bg.hover,
          padding: '60px 40px',
          borderRadius: theme.radius.lg,
          border: `1px solid ${theme.colors.border.light}`,
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: theme.spacing[4],
            opacity: 0.3
          }}>🔒</div>
          <h3 style={{
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.lg,
            fontWeight: theme.weight.semibold,
            marginBottom: theme.spacing[2]
          }}>
            Workspace Access Required
          </h3>
          <p style={{
            color: theme.colors.text.secondary,
            fontSize: theme.fontSize.sm,
            marginBottom: theme.spacing[4]
          }}>
            {error || 'This workspace link may have expired or be invalid.'}
          </p>
          <p style={{
            color: theme.colors.text.tertiary,
            fontSize: theme.fontSize.xs
          }}>
            Please contact your service provider for a new access link.
          </p>
        </div>
      </div>
    )
  }

  const { project, client, messages, files, payments, progress } = workspace

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'files', label: 'Files', icon: '📁', count: files?.length || 0 },
    { id: 'messages', label: 'Messages', icon: '💬', count: messages?.filter(m => !m.isRead)?.length || 0 },
    { id: 'payments', label: 'Invoices', icon: '💳', count: payments?.filter(p => p.status === 'sent')?.length || 0 }
  ]

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.bg.page }}>
      {/* Header */}
      <header style={{
        background: theme.colors.bg.sidebar,
        borderBottom: `1px solid ${theme.colors.border.medium}`,
        padding: '20px 40px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h1 style={{
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.xl,
              fontWeight: theme.weight.bold,
              marginBottom: theme.spacing[1]
            }}>
              {project.title}
            </h1>
            <p style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm
            }}>
              Project workspace for {client.name}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
            <div style={{
              padding: '8px 16px',
              background: project.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
              color: project.status === 'active' ? '#22c55e' : theme.colors.text.secondary,
              borderRadius: theme.radius.full,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              border: `1px solid ${project.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : theme.colors.border.light}`
            }}>
              {project.status}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px'
      }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${theme.colors.border.light}`,
          marginBottom: '40px',
          gap: '24px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '16px 0',
                color: activeTab === tab.id ? theme.colors.text.primary : theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
                fontWeight: activeTab === tab.id ? theme.weight.semibold : theme.weight.medium,
                borderBottom: activeTab === tab.id ? `2px solid ${theme.colors.white}` : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                transition: 'all 200ms'
              }}
            >
              <span style={{ fontSize: theme.fontSize.base }}>{tab.icon}</span>
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: theme.colors.white,
                  color: theme.colors.black,
                  borderRadius: theme.radius.full,
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: theme.weight.bold,
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', grid: '1fr / 2fr 1fr', gap: '40px' }}>
              {/* Project Details */}
              <div>
                <h3 style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.weight.semibold,
                  marginBottom: theme.spacing[4]
                }}>
                  Project Details
                </h3>
                <div style={{
                  background: theme.colors.bg.hover,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.lg,
                  padding: '24px'
                }}>
                  <p style={{
                    color: theme.colors.text.secondary,
                    fontSize: theme.fontSize.sm,
                    lineHeight: 1.6,
                    marginBottom: theme.spacing[4]
                  }}>
                    {project.description}
                  </p>

                  <div style={{ display: 'grid', gap: theme.spacing[3] }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.colors.text.tertiary, fontSize: theme.fontSize.xs }}>Start Date:</span>
                      <span style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.xs }}>
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.colors.text.tertiary, fontSize: theme.fontSize.xs }}>Due Date:</span>
                      <span style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.xs }}>
                        {new Date(project.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.colors.text.tertiary, fontSize: theme.fontSize.xs }}>Project Type:</span>
                      <span style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.xs, textTransform: 'capitalize' }}>
                        {project.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress & Stats */}
              <div>
                <h3 style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.weight.semibold,
                  marginBottom: theme.spacing[4]
                }}>
                  Progress
                </h3>

                {/* Overall Progress */}
                <div style={{
                  background: theme.colors.bg.hover,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: theme.radius.lg,
                  padding: '24px',
                  marginBottom: theme.spacing[4]
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing[2] }}>
                    <span style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>Overall Progress</span>
                    <span style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: theme.weight.semibold }}>
                      {progress.overall}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: theme.colors.border.light,
                    borderRadius: theme.radius.sm,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress.overall}%`,
                      height: '100%',
                      background: theme.colors.white,
                      borderRadius: theme.radius.sm,
                      transition: 'width 300ms ease-out'
                    }} />
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{ display: 'grid', gap: theme.spacing[2] }}>
                  <div style={{
                    background: theme.colors.bg.hover,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing[3],
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.xs }}>Files Shared</span>
                    <span style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: theme.weight.semibold }}>
                      {files?.length || 0}
                    </span>
                  </div>
                  <div style={{
                    background: theme.colors.bg.hover,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing[3],
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.xs }}>Messages</span>
                    <span style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.sm, fontWeight: theme.weight.semibold }}>
                      {messages?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.weight.semibold
                }}>
                  Project Files
                </h3>
                <div style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.fontSize.xs
                }}>
                  {files?.length || 0} files available
                </div>
              </div>

              <div style={{ display: 'grid', gap: theme.spacing[2] }}>
                {files && files.length > 0 ? files.map(file => (
                  <div
                    key={file.id}
                    style={{
                      background: theme.colors.bg.hover,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radius.lg,
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 200ms'
                    }}
                    onClick={() => downloadFile(file.id, file.originalName)}
                    onMouseEnter={(e) => {
                      e.target.style.background = theme.colors.bg.secondary
                      e.target.style.borderColor = theme.colors.border.medium
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = theme.colors.bg.hover
                      e.target.style.borderColor = theme.colors.border.light
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: theme.colors.bg.secondary,
                        borderRadius: theme.radius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: theme.fontSize.lg
                      }}>
                        📄
                      </div>
                      <div>
                        <div style={{
                          color: theme.colors.text.primary,
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.weight.medium,
                          marginBottom: '2px'
                        }}>
                          {file.originalName}
                        </div>
                        <div style={{
                          color: theme.colors.text.secondary,
                          fontSize: theme.fontSize.xs
                        }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.category}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.fontSize.xs,
                      padding: '6px 12px',
                      background: theme.colors.bg.secondary,
                      borderRadius: theme.radius.sm,
                      border: `1px solid ${theme.colors.border.light}`
                    }}>
                      Download
                    </div>
                  </div>
                )) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: theme.colors.text.secondary
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: theme.spacing[3], opacity: 0.3 }}>📁</div>
                    <h4 style={{ marginBottom: theme.spacing[2] }}>No files shared yet</h4>
                    <p style={{ fontSize: theme.fontSize.sm }}>Files will appear here when they're shared with you</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.weight.semibold
                }}>
                  Project Communication
                </h3>
              </div>

              {/* Messages List */}
              <div style={{
                background: theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                padding: '24px',
                marginBottom: theme.spacing[4],
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {messages && messages.length > 0 ? messages.map(message => (
                  <div
                    key={message.id}
                    style={{
                      marginBottom: theme.spacing[4],
                      paddingBottom: theme.spacing[4],
                      borderBottom: `1px solid ${theme.colors.border.light}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[2] }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: theme.radius.full,
                        background: message.senderType === 'client' ? theme.colors.border.medium : theme.colors.white,
                        color: message.senderType === 'client' ? theme.colors.text.primary : theme.colors.black,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: theme.fontSize.sm,
                        fontWeight: theme.weight.semibold
                      }}>
                        {message.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{
                          color: theme.colors.text.primary,
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.weight.medium
                        }}>
                          {message.senderName}
                        </div>
                        <div style={{
                          color: theme.colors.text.tertiary,
                          fontSize: theme.fontSize.xs
                        }}>
                          {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      color: theme.colors.text.secondary,
                      fontSize: theme.fontSize.sm,
                      lineHeight: 1.6,
                      marginLeft: '44px'
                    }}>
                      {message.content}
                    </div>
                  </div>
                )) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: theme.colors.text.secondary
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: theme.spacing[3], opacity: 0.3 }}>💬</div>
                    <h4 style={{ marginBottom: theme.spacing[2] }}>Start the conversation</h4>
                    <p style={{ fontSize: theme.fontSize.sm }}>Send a message to get started</p>
                  </div>
                )}
              </div>

              {/* New Message Form */}
              <div style={{
                background: theme.colors.bg.hover,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                padding: '20px'
              }}>
                <div style={{ marginBottom: theme.spacing[3] }}>
                  <label style={{
                    display: 'block',
                    color: theme.colors.text.secondary,
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing[2]
                  }}>
                    Send a message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '12px',
                      background: theme.colors.bg.secondary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text.primary,
                      fontSize: theme.fontSize.sm,
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    background: newMessage.trim() ? theme.colors.white : theme.colors.bg.secondary,
                    color: newMessage.trim() ? theme.colors.black : theme.colors.text.tertiary,
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: theme.radius.md,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.medium,
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 200ms'
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.weight.semibold
                }}>
                  Invoices & Payments
                </h3>
              </div>

              <div style={{ display: 'grid', gap: theme.spacing[3] }}>
                {payments && payments.length > 0 ? payments.map(payment => (
                  <div
                    key={payment.id}
                    style={{
                      background: theme.colors.bg.hover,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radius.lg,
                      padding: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{
                        color: theme.colors.text.primary,
                        fontSize: theme.fontSize.base,
                        fontWeight: theme.weight.semibold,
                        marginBottom: '4px'
                      }}>
                        Invoice #{payment.invoiceNumber}
                      </div>
                      <div style={{
                        color: theme.colors.text.secondary,
                        fontSize: theme.fontSize.sm,
                        marginBottom: '8px'
                      }}>
                        {payment.description}
                      </div>
                      <div style={{
                        color: theme.colors.text.tertiary,
                        fontSize: theme.fontSize.xs
                      }}>
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          color: theme.colors.text.primary,
                          fontSize: theme.fontSize.lg,
                          fontWeight: theme.weight.bold
                        }}>
                          ${payment.total.toFixed(2)}
                        </div>
                        <div style={{
                          color: payment.status === 'paid' ? '#22c55e' : payment.status === 'overdue' ? '#ef4444' : theme.colors.text.secondary,
                          fontSize: theme.fontSize.xs,
                          fontWeight: theme.weight.semibold,
                          textTransform: 'uppercase'
                        }}>
                          {payment.status}
                        </div>
                      </div>
                      {payment.status === 'sent' && (
                        <button style={{
                          background: theme.colors.white,
                          color: theme.colors.black,
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: theme.radius.md,
                          fontSize: theme.fontSize.sm,
                          fontWeight: theme.weight.medium,
                          cursor: 'pointer'
                        }}>
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: theme.colors.text.secondary
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: theme.spacing[3], opacity: 0.3 }}>💳</div>
                    <h4 style={{ marginBottom: theme.spacing[2] }}>No invoices yet</h4>
                    <p style={{ fontSize: theme.fontSize.sm }}>Invoices will appear here when they're created</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientWorkspace