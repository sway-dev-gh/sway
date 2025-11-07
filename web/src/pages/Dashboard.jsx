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
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const { data } = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const requests = data.requests || []
      const totalUploads = requests.reduce((sum, req) => sum + (req.uploadCount || 0), 0)

      // Get recent requests (last 5)
      const recentRequests = requests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

      setStats({
        totalRequests: requests.length,
        totalUploads,
        storageUsed: 0, // TODO: Calculate from backend
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

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1px',
            background: theme.colors.border.light,
            marginBottom: '60px'
          }}>
            {/* Total Requests */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Total Requests
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.03em',
                lineHeight: '1'
              }}>
                {stats.totalRequests}
              </div>
            </div>

            {/* Total Files */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Total Files
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.03em',
                lineHeight: '1'
              }}>
                {stats.totalUploads}
              </div>
            </div>

            {/* Storage Used */}
            <div style={{
              background: theme.colors.bg.page,
              padding: '40px'
            }}>
              <div style={{
                fontSize: '9px',
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing[3],
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Storage Used
              </div>
              <div style={{
                fontSize: '48px',
                fontWeight: '300',
                color: theme.colors.text.primary,
                letterSpacing: '-0.03em',
                lineHeight: '1'
              }}>
                {stats.storageUsed} MB
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '300',
              margin: '0 0 24px 0',
              letterSpacing: '-0.01em'
            }}>
              Recent Requests
            </h2>

            {stats.recentRequests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 40px',
                border: `1px solid ${theme.colors.border.medium}`
              }}>
                <p style={{
                  fontSize: '14px',
                  color: theme.colors.text.muted,
                  margin: 0
                }}>
                  No requests yet. Create your first request to get started.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1px',
                background: theme.colors.border.light
              }}>
                {stats.recentRequests.map((req, index) => (
                  <Link
                    key={req.id}
                    to={`/requests/${req.id}`}
                    style={{
                      background: theme.colors.bg.page,
                      padding: '24px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: '20px',
                      textDecoration: 'none',
                      transition: `all ${theme.transition.fast}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.bg.hover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.colors.bg.page
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '400',
                        marginBottom: '4px',
                        color: theme.colors.text.primary
                      }}>
                        {req.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: theme.colors.text.muted
                      }}>
                        {req.uploadCount || 0} {req.uploadCount === 1 ? 'file' : 'files'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.tertiary
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
