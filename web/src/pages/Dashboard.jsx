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
    recentRequests: []
  })

  useEffect(() => {
    // Check if returning from Stripe checkout
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session_id')

    if (sessionId) {
      // Clear the session_id from URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Fetch updated user data after successful payment
      fetchUpdatedUserData()
    }

    fetchDashboardData()
  }, [])

  const fetchUpdatedUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.swayfiles.com'

      const { data } = await api.get(`${API_URL}/api/stripe/plan-info`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Update localStorage with new plan info
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

      // Fetch stats and requests in parallel
      const [statsResponse, requestsResponse] = await Promise.all([
        api.get('/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/requests', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const stats = statsResponse.data
      const requests = requestsResponse.data.requests || []

      // Get recent requests (last 5)
      const recentRequests = requests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

      setStats({
        totalRequests: stats.totalRequests,
        totalUploads: stats.totalUploads,
        storageUsed: stats.storageMB,
        recentRequests
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
              Dashboard
            </h1>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.muted,
              margin: '8px 0 0 0'
            }}>
              Overview of your file requests and uploads
            </p>
          </div>

          {/* Stats Grid - Modern 2025 Style */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '60px'
          }}>
            {/* Total Requests */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '32px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              transition: `all ${theme.transition.normal}`,
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = theme.colors.border.medium
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              e.currentTarget.style.borderColor = theme.colors.border.light
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: theme.weight.medium
              }}>
                Total Requests
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.04em',
                lineHeight: '1',
                background: 'linear-gradient(to right, #ffffff, #a3a3a3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {stats.totalRequests}
              </div>
            </div>

            {/* Total Files */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '32px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              transition: `all ${theme.transition.normal}`,
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = theme.colors.border.medium
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              e.currentTarget.style.borderColor = theme.colors.border.light
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: theme.weight.medium
              }}>
                Total Files
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.04em',
                lineHeight: '1',
                background: 'linear-gradient(to right, #ffffff, #a3a3a3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {stats.totalUploads}
              </div>
            </div>

            {/* Storage Used */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '32px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              transition: `all ${theme.transition.normal}`,
              cursor: 'default'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.borderColor = theme.colors.border.medium
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
              e.currentTarget.style.borderColor = theme.colors.border.light
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                fontWeight: theme.weight.medium
              }}>
                Storage Used
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.04em',
                lineHeight: '1',
                background: 'linear-gradient(to right, #ffffff, #a3a3a3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {stats.storageUsed} MB
              </div>
            </div>
          </div>

          {/* Recent Requests - Modern Style */}
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '400',
              margin: '0 0 32px 0',
              letterSpacing: '-0.02em',
              color: theme.colors.text.primary
            }}>
              Recent Requests
            </h2>

            {stats.recentRequests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 40px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: `1px solid ${theme.colors.border.light}`
              }}>
                <p style={{
                  fontSize: '15px',
                  color: theme.colors.text.muted,
                  margin: 0,
                  lineHeight: '1.6'
                }}>
                  No requests yet. Create your first request to get started.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {stats.recentRequests.map((req, index) => (
                  <Link
                    key={req.id}
                    to={`/requests/${req.id}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '20px 24px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.colors.border.light}`,
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: '20px',
                      textDecoration: 'none',
                      transition: `all ${theme.transition.normal}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      e.currentTarget.style.borderColor = theme.colors.border.medium
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                      e.currentTarget.style.borderColor = theme.colors.border.light
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        marginBottom: '6px',
                        color: theme.colors.text.primary
                      }}>
                        {req.title}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.tertiary
                      }}>
                        {req.uploadCount || 0} {req.uploadCount === 1 ? 'file' : 'files'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.text.tertiary,
                      padding: '6px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '6px'
                    }}>
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
