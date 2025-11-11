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
        navigate('/responses')
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
        background: '#000000'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #525252',
          borderTopColor: '#ffffff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
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
        background: '#000000',
        color: '#ffffff',
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px 120px'
        }}>
          {/* Header */}
          <div style={{
            marginBottom: '64px',
            maxWidth: '800px',
            margin: '0 auto 64px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              Stop Asking For Files
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#a3a3a3',
              margin: 0,
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              Build a page. Share the link. Get their files. Done.
            </p>
          </div>

          {/* Primary Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            maxWidth: '960px',
            margin: '0 auto'
          }}>
            <Link to="/requests" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '32px',
                border: '1px solid #525252',
                borderRadius: '8px',
                background: '#000000',
                cursor: 'pointer',
                height: '100%'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#a3a3a3',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  Start Here
                </div>
                <div style={{
                  fontSize: '24px',
                  color: '#ffffff',
                  fontWeight: '600',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}>
                  New Request
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#a3a3a3',
                  lineHeight: '1.5',
                  fontWeight: '400'
                }}>
                  Build your upload page in 30 seconds
                </div>
              </div>
            </Link>

            <Link to="/responses" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '32px',
                border: '1px solid #525252',
                borderRadius: '8px',
                background: '#000000',
                cursor: 'pointer',
                height: '100%'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#a3a3a3',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>
                  Your Work
                </div>
                <div style={{
                  fontSize: '24px',
                  color: '#ffffff',
                  fontWeight: '600',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}>
                  All Requests
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#a3a3a3',
                  lineHeight: '1.5',
                  fontWeight: '400'
                }}>
                  Track uploads and download everything
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
