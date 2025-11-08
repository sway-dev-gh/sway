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
              Your file requests and uploads at a glance
            </p>
          </div>

          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px',
            background: theme.colors.border.light,
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '40px',
            border: `1px solid ${theme.colors.border.light}`
          }}>
            <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
              <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Total Requests</div>
              <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>{stats.totalRequests}</div>
            </div>
            <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
              <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Total Files</div>
              <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>{stats.totalUploads}</div>
            </div>
            <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
              <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Storage Used</div>
              <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>{(stats.storageUsed / 1024).toFixed(2)} GB</div>
            </div>
            <div style={{ background: theme.colors.bg.page, padding: '24px' }}>
              <div style={{ fontSize: '10px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Avg Files/Request</div>
              <div style={{ fontSize: '32px', fontWeight: '200', color: theme.colors.white }}>{stats.totalRequests > 0 ? (stats.totalUploads / stats.totalRequests).toFixed(1) : '—'}</div>
            </div>
          </div>

          {/* Recent Activity - Enhanced */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px'
          }}>
            {/* Recent Requests */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '500',
                  margin: 0,
                  letterSpacing: '-0.01em',
                  color: theme.colors.text.primary
                }}>
                  Recent Requests
                </h2>
                <Link to="/requests" style={{
                  fontSize: '13px',
                  color: theme.colors.text.secondary,
                  textDecoration: 'none',
                  padding: '6px 12px',
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '6px',
                  transition: `all ${theme.transition.fast}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  e.currentTarget.style.color = theme.colors.white
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = theme.colors.text.secondary
                }}>
                  View all
                </Link>
              </div>

              {stats.recentRequests.length === 0 ? (
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
                    No requests yet. Create your first request to get started.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: `1px solid ${theme.colors.border.light}`,
                  overflow: 'hidden'
                }}>
                  {stats.recentRequests.map((req, index) => (
                    <Link
                      key={req.id}
                      to={`/requests/${req.id}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        alignItems: 'center',
                        padding: '20px 24px',
                        gap: '16px',
                        textDecoration: 'none',
                        borderBottom: index < stats.recentRequests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                        transition: `all ${theme.transition.fast}`,
                        background: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: '15px',
                          fontWeight: '500',
                          marginBottom: '4px',
                          color: theme.colors.text.primary
                        }}>
                          {req.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.text.tertiary
                        }}>
                          {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: theme.colors.text.secondary,
                        padding: '4px 10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {req.uploadCount || 0} {req.uploadCount === 1 ? 'file' : 'files'}
                      </div>
                      <div style={{
                        fontSize: '18px',
                        color: theme.colors.text.tertiary
                      }}>
                        →
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '500',
                margin: '0 0 24px 0',
                letterSpacing: '-0.01em',
                color: theme.colors.text.primary
              }}>
                Quick Actions
              </h2>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <Link to="/requests/new" style={{
                  padding: '20px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  borderRadius: '12px',
                  textDecoration: 'none',
                  transition: `all ${theme.transition.fast}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>New Request</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Create a file upload request</div>
                </Link>

                <Link to="/files" style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: theme.colors.text.primary,
                  borderRadius: '12px',
                  border: `1px solid ${theme.colors.border.light}`,
                  textDecoration: 'none',
                  transition: `all ${theme.transition.fast}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  e.currentTarget.style.borderColor = theme.colors.border.light
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>View Files</div>
                  <div style={{ fontSize: '12px', color: theme.colors.text.muted }}>Browse all uploaded files</div>
                </Link>

                <Link to="/templates" style={{
                  padding: '20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: theme.colors.text.primary,
                  borderRadius: '12px',
                  border: `1px solid ${theme.colors.border.light}`,
                  textDecoration: 'none',
                  transition: `all ${theme.transition.fast}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                  e.currentTarget.style.borderColor = theme.colors.border.light
                }}>
                  <div style={{ fontSize: '15px', fontWeight: '500' }}>Templates</div>
                  <div style={{ fontSize: '12px', color: theme.colors.text.muted }}>Manage request templates</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
