import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

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

      // TODO: Fetch notifications from backend
      // For now, show empty state
      setNotifications([])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
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
              border: `1px solid ${theme.colors.border.medium}`
            }}>
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '20px',
                    borderBottom: index < notifications.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                    background: notification.read ? 'transparent' : theme.colors.bg.secondary
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.primary,
                    marginBottom: '4px'
                  }}>
                    {notification.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.text.muted
                  }}>
                    {notification.message} • {notification.time}
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
