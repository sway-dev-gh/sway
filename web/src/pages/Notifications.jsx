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
          <div style={{ marginBottom: '48px', maxWidth: '900px', margin: '0 auto 48px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.03em'
            }}>
              Activity
            </h1>
            <p style={{
              fontSize: '20px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.5'
            }}>
              Real-time updates for uploads, form views, and more
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
                padding: '120px 32px',
                border: '1px solid #000000',
                borderRadius: '8px',
                background: '#000000'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#a3a3a3',
                  margin: '0 0 6px 0',
                  letterSpacing: '-0.01em'
                }}>
                  No activity yet
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#525252',
                  margin: '0'
                }}>
                  Files uploaded to your requests will show up here
                </p>
              </div>
            ) : (
              <div style={{
                border: '1px solid #000000',
                borderRadius: '8px',
                background: '#000000',
                overflow: 'hidden'
              }}>
                {notifications.map((notif, index) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: index < notifications.length - 1 ? '1px solid #000000' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => navigate('/responses')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#000000'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '4px',
                      background: '#000000',
                      border: '1px solid #525252',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '14px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#ffffff',
                        marginBottom: '4px',
                        letterSpacing: '-0.01em'
                      }}>
                        {notif.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#a3a3a3',
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
                          fontSize: '11px',
                          color: '#a3a3a3',
                          padding: '3px 8px',
                          background: '#000000',
                          borderRadius: '4px',
                          border: '1px solid #525252',
                          fontWeight: '500',
                          letterSpacing: '0.3px'
                        }}>
                          {notif.formName}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#a3a3a3'
                        }}>
                          {getTimeAgo(notif.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notif.read && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#ffffff',
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
