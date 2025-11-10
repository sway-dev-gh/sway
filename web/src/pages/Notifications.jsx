import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Notifications() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchNotifications()
  }, [navigate])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch all uploads/files which represent notifications
      const uploadsResponse = await api.get('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const files = uploadsResponse.data.files || []

      // Transform files into notifications
      const notifs = files.map(file => ({
        id: file.id,
        type: 'upload',
        title: 'New file uploaded',
        message: `${file.uploaderName || 'Anonymous'} uploaded ${file.fileName}`,
        formName: file.requestTitle || 'Unknown Form',
        timestamp: file.uploadedAt,
        read: false
      }))

      // Sort by newest first
      notifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setNotifications(notifs)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.bg.page
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: `2px solid ${theme.colors.border.medium}`,
          borderTopColor: theme.colors.white,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '48px', maxWidth: '900px', margin: '0 auto 48px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Notifications
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Stay updated on all file uploads and activity
            </p>
          </div>

          {/* Notifications List */}
          <div style={{
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 32px',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <h3 style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  margin: '0 0 8px 0'
                }}>
                  No notifications
                </h3>
                <p style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary,
                  margin: '0'
                }}>
                  You'll see notifications here when files are uploaded
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '20px 24px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.radius.lg,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      cursor: 'pointer'
                    }}
}
}
                    onClick={() => navigate('/responses')}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: theme.radius.md,
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <div style={{
                        fontSize: '18px'
                      }}>
                        📁
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                        marginBottom: '4px'
                      }}>
                        {notif.title}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.secondary,
                        marginBottom: '8px',
                        lineHeight: '1.5'
                      }}>
                        {notif.message}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.text.tertiary,
                          padding: '2px 8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: theme.radius.sm,
                          border: `1px solid ${theme.colors.border.light}`
                        }}>
                          {notif.formName}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.text.tertiary
                        }}>
                          {getTimeAgo(notif.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notif.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        flexShrink: 0,
                        marginTop: '6px'
                      }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Notifications
