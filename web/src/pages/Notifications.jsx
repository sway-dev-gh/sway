import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { standardStyles } from '../components/StandardStyles'

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

      // Fetch reviews to create review-related notifications
      const reviewsResponse = await api.get('/api/reviews', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const reviews = reviewsResponse.data.reviews || []

      // Create review-related notifications
      const notifs = []

      reviews.forEach(review => {
        // Review created notification
        notifs.push({
          id: `review-created-${review.id}`,
          type: 'review_created',
          title: 'Review Workflow Started',
          message: `Review "${review.title}" sent to ${review.reviewers?.length || 0} reviewer${(review.reviewers?.length || 0) !== 1 ? 's' : ''}`,
          reviewId: review.id,
          timestamp: review.createdAt,
          priority: 'normal',
          read: false
        })

        // Status change notifications
        if (review.status === 'approved') {
          notifs.push({
            id: `review-approved-${review.id}`,
            type: 'review_approved',
            title: 'Review Approved ✓',
            message: `"${review.title}" has been approved and is ready to proceed`,
            reviewId: review.id,
            timestamp: review.updatedAt || review.createdAt,
            priority: 'high',
            read: false
          })
        } else if (review.status === 'changes_requested') {
          notifs.push({
            id: `review-changes-${review.id}`,
            type: 'review_changes',
            title: 'Changes Requested',
            message: `Reviewers have requested changes to "${review.title}"`,
            reviewId: review.id,
            timestamp: review.updatedAt || review.createdAt,
            priority: 'high',
            read: false
          })
        } else if (review.status === 'pending' && review.deadline) {
          const deadline = new Date(review.deadline)
          const now = new Date()
          const daysDiff = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

          if (daysDiff <= 1 && daysDiff >= 0) {
            notifs.push({
              id: `review-deadline-${review.id}`,
              type: 'review_deadline',
              title: 'Review Deadline Approaching',
              message: `"${review.title}" deadline is ${daysDiff === 0 ? 'today' : 'tomorrow'}`,
              reviewId: review.id,
              timestamp: new Date(),
              priority: 'urgent',
              read: false
            })
          }
        }
      })

      // Sort by priority and newest first
      notifs.sort((a, b) => {
        const priorityOrder = { urgent: 3, high: 2, normal: 1 }
        const aPriority = priorityOrder[a.priority] || 1
        const bPriority = priorityOrder[b.priority] || 1

        if (aPriority !== bPriority) return bPriority - aPriority
        return new Date(b.timestamp) - new Date(a.timestamp)
      })

      setNotifications(notifs)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setNotifications([])
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

  const getNotificationStyle = (type, priority) => {
    let icon, color

    switch (type) {
      case 'review_created':
        icon = '📝'
        color = '#a3a3a3'
        break
      case 'review_approved':
        icon = '✅'
        color = theme.colors.white
        break
      case 'review_changes':
        icon = '🔄'
        color = '#808080'
        break
      case 'review_deadline':
        icon = '⏰'
        color = '#525252'
        break
      default:
        icon = '📌'
        color = theme.colors.text.secondary
    }

    const borderColor = priority === 'urgent' ? '#525252' :
                       priority === 'high' ? '#808080' :
                       'rgba(255, 255, 255, 0.1)'

    return { icon, color, borderColor }
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
          <div style={{ marginBottom: '48px' }}>
            <h1 style={standardStyles.pageHeader}>
              Review Notifications
            </h1>
            <p style={standardStyles.pageDescription}>
              Stay updated on review progress, feedback, approvals, and deadlines
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
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '16px',
                background: theme.colors.bg.hover
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '24px'
                }}>
                  🔔
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  margin: '0 0 8px 0'
                }}>
                  No review notifications yet
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  margin: '0'
                }}>
                  You'll see updates when reviews are started, completed, or need attention
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
