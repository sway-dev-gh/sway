import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { getStorageLimit, getEffectivePlan } from '../utils/planUtils'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalUploads: 0,
    storageUsed: 0,
    activeRequests: 0,
    uploadsByDay: [],
    topRequests: [],
    fileTypeBreakdown: [],
    recentActivity: []
  })
  const [user, setUser] = useState({ plan: 'free', storage_limit_gb: 2 })

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')

    if (sessionId) {
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchUpdatedUserData()
    }

    fetchDashboardData()
  }, [])

  const fetchUpdatedUserData = async () => {
    try {
      const token = localStorage.getItem('token')

      const { data } = await api.get('/api/stripe/plan-info', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        user.plan = data.plan
        user.storage_limit_gb = data.storage_limit_gb
        localStorage.setItem('user', JSON.stringify(user))
      }
    } catch (error) {
      console.error('Failed to fetch updated user data:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)

        // Use centralized plan utility
        userData.plan = getEffectivePlan()
        userData.storage_limit_gb = getStorageLimit()

        setUser(userData)
      }

      // Fetch analytics
      const analyticsResponse = await api.get('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const analytics = analyticsResponse.data

      // If user has created forms, redirect them to Tracking (their real dashboard)
      if (analytics.totalRequests > 0) {
        navigate('/tracking')
        return
      }

      // Fetch files for recent activity
      const filesResponse = await api.get('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const files = filesResponse.data.files || []

      // Get recent activity (last 10 uploads)
      const recentActivity = files
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 10)
        .map(file => ({
          id: file.id,
          fileName: file.fileName,
          formName: file.requestTitle || 'Unknown Form',
          uploaderName: file.uploaderName || 'Anonymous',
          uploaderEmail: file.uploaderEmail || '',
          uploadedAt: file.uploadedAt,
          fileSize: file.fileSize
        }))

      setStats({
        totalRequests: analytics.totalRequests || 0,
        totalUploads: analytics.totalUploads || 0,
        storageUsed: (analytics.totalStorageGB || 0) * 1024, // Convert GB to MB
        activeRequests: analytics.activeRequests || 0,
        uploadsByDay: analytics.uploadsByDay || [],
        topRequests: analytics.advanced?.topRequests || [],
        fileTypeBreakdown: analytics.advanced?.fileTypeBreakdown || [],
        recentActivity
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatStorageMB = (mb) => {
    if (!mb || mb === 0) return '0 MB'
    if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB'
    return mb.toFixed(2) + ' MB'
  }

  const getStoragePercentage = () => {
    const limitMB = user.storage_limit_gb * 1024
    return Math.min((stats.storageUsed / limitMB) * 100, 100)
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  const maxUploadsInWeek = stats.uploadsByDay && stats.uploadsByDay.length > 0
    ? Math.max(...stats.uploadsByDay.map(d => d.count), 1)
    : 1

  const isPro = (user.plan || 'free').toLowerCase() === 'pro'

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
              Get Started
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: 0,
              lineHeight: '1.6'
            }}>
              Create your first form to start collecting files
            </p>
          </div>

          {/* Quick Actions */}
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gap: theme.spacing[5]
          }}>
            <div style={{
              padding: '32px',
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.border.light}`,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Create a Form
              </h2>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Use the visual builder to create a custom upload form
              </p>
              <Link to="/requests" style={{
                ...theme.buttons.primary.base,
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, theme.buttons.primary.hover)
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.buttons.primary.base.background
              }}>
                Go to Builder
              </Link>
            </div>

            <div style={{
              padding: '32px',
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.border.light}`,
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                View Your Forms
              </h2>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Track all your forms and uploaded files
              </p>
              <Link to="/tracking" style={{
                ...theme.buttons.secondary.base,
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, theme.buttons.secondary.hover)
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, theme.buttons.secondary.base)
              }}>
                Go to Tracking
              </Link>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: theme.spacing[5],
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <Link to="/requests" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: theme.spacing[8],
                border: `2px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.xl,
                background: theme.colors.bg.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.borderColor = theme.colors.white
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  Start Here
                </div>
                <div style={{
                  fontSize: '28px',
                  color: theme.colors.text.primary,
                  fontWeight: '600',
                  marginBottom: '12px',
                  letterSpacing: '-0.02em'
                }}>
                  Create New Form
                </div>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  Launch the Builder to create your first upload form in minutes
                </div>
              </div>
            </Link>

            <Link to="/tracking" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: theme.spacing[8],
                border: `2px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.xl,
                background: theme.colors.bg.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.borderColor = theme.colors.white
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  Your Work
                </div>
                <div style={{
                  fontSize: '28px',
                  color: theme.colors.text.primary,
                  fontWeight: '600',
                  marginBottom: '12px',
                  letterSpacing: '-0.02em'
                }}>
                  View All Forms
                </div>
                <div style={{
                  fontSize: '15px',
                  color: theme.colors.text.secondary,
                  lineHeight: '1.6'
                }}>
                  Manage existing forms and see all uploaded files in one place
                </div>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </>
  )
}

export default Dashboard
