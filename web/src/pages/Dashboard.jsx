import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({ email: '', plan: 'free' })
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRequests: 0,
    storageUsed: 0,
    storageLimit: 1
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        setUser(userData)
      }

      const response = await fetch('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const requestsList = data.requests || []
        setRequests(requestsList.slice(0, 5)) // Only show 5 most recent

        const totalFiles = requestsList.reduce((sum, req) => sum + (req.uploadCount || 0), 0)

        setStats({
          totalFiles,
          totalRequests: requestsList.length,
          storageUsed: totalFiles > 0 ? 0.24 : 0,
          storageLimit: user.plan === 'business' ? 200 : user.plan === 'pro' ? 50 : 1
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const getPlanColor = (plan) => {
    if (plan === 'business') return '#fff'
    if (plan === 'pro') return '#ccc'
    return '#666'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #333',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const storagePercentage = (stats.storageUsed / stats.storageLimit) * 100

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginLeft: '220px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '40px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '400',
              margin: 0,
              marginBottom: '6px',
              color: theme.colors.text.primary
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: '13px',
              color: theme.colors.text.muted,
              margin: 0
            }}>
              Welcome back, {user.email?.split('@')[0] || 'User'}
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '36px'
          }}>
            {/* Total Files Collected */}
            <div style={{
              padding: '24px',
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.muted,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Files Collected
              </div>
              <div style={{
                fontSize: '42px',
                fontWeight: '300',
                color: stats.totalFiles > 0 ? theme.colors.white : theme.colors.text.muted,
                letterSpacing: '-0.02em',
                marginBottom: '6px'
              }}>
                {stats.totalFiles}
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.tertiary
              }}>
                across {stats.totalRequests} {stats.totalRequests === 1 ? 'request' : 'requests'}
              </div>
            </div>

            {/* Storage Used */}
            <div style={{
              padding: '24px',
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.muted,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Storage Used
              </div>
              <div style={{
                fontSize: '42px',
                fontWeight: '300',
                color: stats.storageUsed > 0 ? theme.colors.white : theme.colors.text.muted,
                letterSpacing: '-0.02em',
                marginBottom: '6px'
              }}>
                {stats.storageUsed.toFixed(2)} <span style={{ fontSize: '22px', color: theme.colors.text.muted }}>GB</span>
              </div>
              <div style={{
                marginTop: '16px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: theme.colors.border.medium,
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(storagePercentage, 100)}%`,
                    height: '100%',
                    background: storagePercentage > 80 ? '#ff5555' : theme.colors.white,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.tertiary
              }}>
                {stats.storageLimit - stats.storageUsed > 0 ? `${(stats.storageLimit - stats.storageUsed).toFixed(2)} GB remaining` : 'Storage full'}
              </div>
            </div>

            {/* Current Plan */}
            <div style={{
              padding: '24px',
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: theme.radius.md
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors.text.muted,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                fontWeight: theme.weight.semibold
              }}>
                Current Plan
              </div>
              <div style={{
                fontSize: '42px',
                fontWeight: '300',
                color: getPlanColor(user.plan),
                letterSpacing: '-0.02em',
                marginBottom: '6px',
                textTransform: 'capitalize'
              }}>
                {user.plan || 'Free'}
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.tertiary,
                marginBottom: '16px'
              }}>
                {user.plan === 'business' ? '200 GB storage' : user.plan === 'pro' ? '50 GB storage' : '1 GB storage'}
              </div>
              {user.plan === 'free' && (
                <button
                  onClick={() => navigate('/plan')}
                  style={{
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    borderRadius: theme.radius.md,
                    transition: `all ${theme.transition.fast}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colors.text.secondary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.white
                  }}
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>

          {/* Recent Requests */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '400',
                margin: 0,
                color: theme.colors.text.primary
              }}>
                Recent Requests
              </h2>
              <button
                onClick={() => navigate('/requests')}
                style={{
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  padding: '8px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  borderRadius: theme.radius.md,
                  transition: `all ${theme.transition.fast}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.bg.hover
                  e.currentTarget.style.color = theme.colors.text.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = theme.colors.text.secondary
                }}
              >
                View All
              </button>
            </div>

            {requests.length === 0 ? (
              <div style={{
                padding: '60px 32px',
                textAlign: 'center',
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md
              }}>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.muted,
                  marginBottom: '16px'
                }}>
                  No requests yet
                </div>
                <button
                  onClick={() => navigate('/requests')}
                  style={{
                    background: theme.colors.white,
                    color: theme.colors.black,
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    borderRadius: theme.radius.md
                  }}
                >
                  Create Your First Request
                </button>
              </div>
            ) : (
              <div style={{
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md,
                overflow: 'hidden'
              }}>
                {requests.map((req, index) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: index < requests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      cursor: 'pointer',
                      transition: `all ${theme.transition.fast}`
                    }}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.bg.hover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.medium}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '300',
                      color: theme.colors.text.secondary,
                      flexShrink: 0
                    }}>
                      {req.uploadCount || 0}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '400',
                        marginBottom: '4px',
                        color: theme.colors.text.primary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {req.title}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.text.muted
                      }}>
                        {req.uploadCount || 0} {req.uploadCount === 1 ? 'file' : 'files'}
                      </div>
                    </div>

                    {/* Date */}
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.tertiary,
                      flexShrink: 0
                    }}>
                      {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
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

export default Dashboard
