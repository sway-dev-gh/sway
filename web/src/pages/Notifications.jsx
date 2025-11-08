import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const { data } = await api.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      await api.delete(`/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
      alert('Failed to delete notification')
    }
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
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '60px 40px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '400',
              margin: 0,
              color: theme.colors.text.primary
            }}>
              Notifications
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Stay updated on all your request activity
            </p>
          </div>

          {/* Summary Stats */}
          {notifications.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '48px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '28px 24px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', fontWeight: theme.weight.medium }}>Total Notifications</div>
                <div style={{ fontSize: '40px', fontWeight: '300', color: theme.colors.white, lineHeight: '1' }}>{notifications.length}</div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '28px 24px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', fontWeight: theme.weight.medium }}>Today</div>
                <div style={{ fontSize: '40px', fontWeight: '300', color: theme.colors.white, lineHeight: '1' }}>
                  {notifications.filter(n => {
                    const diff = new Date() - new Date(n.createdAt)
                    return diff < 24 * 60 * 60 * 1000
                  }).length}
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '28px 24px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', fontWeight: theme.weight.medium }}>This Week</div>
                <div style={{ fontSize: '40px', fontWeight: '300', color: theme.colors.white, lineHeight: '1' }}>
                  {notifications.filter(n => {
                    const diff = new Date() - new Date(n.createdAt)
                    return diff < 7 * 24 * 60 * 60 * 1000
                  }).length}
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.muted,
                margin: 0,
                lineHeight: '1.6'
              }}>
                No notifications yet. You'll be notified when files are uploaded to your requests.
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              overflow: 'hidden'
            }}>
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '24px',
                    background: 'transparent',
                    borderBottom: index < notifications.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                    transition: `all ${theme.transition.fast}`,
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                      gap: '12px'
                    }}>
                      <div style={{
                        fontSize: '15px',
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        flex: 1
                      }}>
                        {notification.title}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: theme.colors.text.tertiary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: theme.weight.medium,
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        border: `1px solid ${theme.colors.border.light}`,
                        flexShrink: 0
                      }}>
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.muted,
                      marginBottom: '8px',
                      lineHeight: '1.6'
                    }}>
                      {notification.message}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.tertiary,
                      fontFamily: 'monospace'
                    }}>
                      {notification.requestTitle}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: `all ${theme.transition.fast}`,
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.borderColor = theme.colors.border.dark
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = theme.colors.border.medium
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Notifications
