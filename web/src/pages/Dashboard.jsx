import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

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

        // Check for admin plan override
        const adminPlanOverride = localStorage.getItem('adminPlanOverride')
        if (adminPlanOverride) {
          userData.plan = adminPlanOverride
        }

        // Set storage limit based on plan
        const plan = (userData.plan || 'free').toLowerCase()
        userData.storage_limit_gb = plan === 'pro' ? 50 : 2

        setUser(userData)
      }

      // Fetch analytics
      const analyticsResponse = await api.get('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const analytics = analyticsResponse.data

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
          {/* Welcome Header */}
          <div style={{ marginBottom: '60px', textAlign: 'center', maxWidth: '800px', margin: '0 auto 60px' }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Welcome back
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: '0 0 40px 0',
              lineHeight: '1.6'
            }}>
              Create and manage your file upload forms
            </p>
            <div style={{ display: 'flex', gap: theme.spacing[3], justifyContent: 'center' }}>
              <Link to="/requests" style={{
                padding: '14px 32px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.base,
                fontWeight: theme.weight.semibold,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                Create New Form
              </Link>
              <Link to="/tracking" style={{
                padding: '14px 32px',
                background: 'transparent',
                color: theme.colors.white,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.base,
                fontWeight: theme.weight.medium,
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                View All Forms
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: theme.spacing[4],
            marginBottom: theme.spacing[8],
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            {/* Total Forms Created */}
            <Link to="/tracking" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: theme.spacing[5],
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                background: theme.colors.bg.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = theme.colors.white
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
              }}>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  Total Forms
                </div>
                <div style={{
                  fontSize: theme.fontSize['3xl'],
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  lineHeight: '1'
                }}>
                  {stats.totalRequests}
                </div>
              </div>
            </Link>

            {/* Total Files Received */}
            <div style={{
              padding: theme.spacing[5],
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
                fontWeight: theme.weight.medium
              }}>
                Files Received
              </div>
              <div style={{
                fontSize: theme.fontSize['3xl'],
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                lineHeight: '1'
              }}>
                {stats.totalUploads}
              </div>
            </div>

            {/* Storage Used */}
            <Link to="/plan" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: theme.spacing[5],
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                background: theme.colors.bg.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = theme.colors.white
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
              }}>
                <div style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing[2],
                  fontWeight: theme.weight.medium
                }}>
                  Storage Used
                </div>
                <div style={{
                  fontSize: theme.fontSize['3xl'],
                  fontWeight: theme.weight.semibold,
                  color: theme.colors.text.primary,
                  lineHeight: '1',
                  marginBottom: theme.spacing[2]
                }}>
                  {formatStorageMB(stats.storageUsed)}
                </div>
                {/* Storage Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: theme.colors.bg.page,
                  borderRadius: theme.radius.sm,
                  overflow: 'hidden',
                  marginBottom: theme.spacing[1]
                }}>
                  <div style={{
                    width: `${getStoragePercentage()}%`,
                    height: '100%',
                    background: getStoragePercentage() > 80 ? '#ef4444' : theme.colors.white,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{
                  fontSize: '11px',
                  color: theme.colors.text.tertiary
                }}>
                  {getStoragePercentage().toFixed(1)}% of {user.storage_limit_gb} GB
                </div>
              </div>
            </Link>

            {/* Active Forms */}
            <div style={{
              padding: theme.spacing[5],
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing[2],
                fontWeight: theme.weight.medium
              }}>
                Active Forms
              </div>
              <div style={{
                fontSize: theme.fontSize['3xl'],
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                lineHeight: '1'
              }}>
                {stats.activeRequests}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: theme.spacing[4],
            maxWidth: '1100px',
            margin: '0 auto'
          }}>
            <Link to="/tracking" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: theme.spacing[6],
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                background: theme.colors.bg.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = theme.colors.white
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
              }}>
                <div style={{
                  fontSize: theme.fontSize.lg,
                  color: theme.colors.text.primary,
                  fontWeight: theme.weight.semibold,
                  marginBottom: theme.spacing[2]
                }}>
                  Manage Forms
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary
                }}>
                  View, edit, and track all your forms
                </div>
              </div>
            </Link>

            <Link to="/plan" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: theme.spacing[6],
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                background: theme.colors.bg.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = theme.colors.white
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
              }}>
                <div style={{
                  fontSize: theme.fontSize.lg,
                  color: theme.colors.text.primary,
                  fontWeight: theme.weight.semibold,
                  marginBottom: theme.spacing[2]
                }}>
                  {isPro ? 'Pro Plan' : 'Upgrade to Pro'}
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary
                }}>
                  {isPro ? 'Manage your subscription' : 'Unlock advanced features'}
                </div>
              </div>
            </Link>

            <Link to="/faq" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: theme.spacing[6],
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: theme.radius.lg,
                background: theme.colors.bg.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = theme.colors.white
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.bg.secondary
                e.currentTarget.style.borderColor = theme.colors.border.light
              }}>
                <div style={{
                  fontSize: theme.fontSize.lg,
                  color: theme.colors.text.primary,
                  fontWeight: theme.weight.semibold,
                  marginBottom: theme.spacing[2]
                }}>
                  Help & FAQs
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary
                }}>
                  Get answers to common questions
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
