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

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '120px 40px',
              color: theme.colors.text.muted
            }}>
              <div style={{
                fontSize: '15px',
                marginBottom: '16px'
              }}>
                No notifications yet
              </div>
              <div style={{
                fontSize: '13px',
                color: theme.colors.text.tertiary
              }}>
                You'll be notified when files are uploaded to your requests
              </div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '1px',
              background: theme.colors.border.light
            }}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '20px',
                    background: theme.colors.bg.page,
                    transition: `all ${theme.transition.fast}`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.primary,
                      fontWeight: theme.weight.medium
                    }}>
                      {notification.title}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme.colors.text.tertiary
                    }}>
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                    lineHeight: '1.5'
                  }}>
                    {notification.message}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: theme.colors.text.muted
                  }}>
                    Request: <span style={{ color: theme.colors.text.secondary }}>{notification.requestTitle}</span>
                  </div>
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
