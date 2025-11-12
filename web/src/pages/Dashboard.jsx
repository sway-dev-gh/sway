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
        paddingTop: '68px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px 120px'
        }}>
          {/* Welcome Header */}
          <div style={{
            marginBottom: '48px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '600',
                margin: '0 0 8px 0',
                color: '#ffffff',
                letterSpacing: '-0.01em'
              }}>
                Welcome back
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#a3a3a3',
                margin: 0,
                fontWeight: '400'
              }}>
                Here's what's happening with your file requests
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <Link to="/requests" style={{
                background: '#ffffff',
                color: '#000000',
                padding: '12px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}>
                + New Request
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '24px',
              position: 'relative'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#1f1f1f',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  📊
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0'
                }}>
                  Total Requests
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '8px'
              }}>
                {stats.totalRequests}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#a3a3a3'
              }}>
                {stats.activeRequests} currently active
              </div>
            </div>

            <div style={{
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#1f1f1f',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  📁
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0'
                }}>
                  Files Received
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '8px'
              }}>
                {stats.totalUploads}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#a3a3a3'
              }}>
                {formatStorageMB(stats.storageUsed)} used
              </div>
            </div>

            <div style={{
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#1f1f1f',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  💾
                </div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0'
                }}>
                  Storage Used
                </h3>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#ffffff',
                marginBottom: '8px'
              }}>
                {getStoragePercentage().toFixed(0)}%
              </div>
              <div style={{
                fontSize: '14px',
                color: '#a3a3a3',
                marginBottom: '12px'
              }}>
                {formatStorageMB(stats.storageUsed)} / {user.storage_limit_gb}GB
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#2a2a2a',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${getStoragePercentage()}%`,
                  height: '100%',
                  background: getStoragePercentage() > 80 ? '#dc2626' : '#10b981',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <Link to="/plan" style={{ textDecoration: 'none' }}>
              <div style={{
                background: isPro ? '#111111' : '#1a1a1a',
                border: isPro ? '1px solid #2a2a2a' : '1px solid #3a3a3a',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: isPro ? '#2d4f3f' : '#1f1f1f',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                  }}>
                    {isPro ? '⭐' : '📈'}
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#ffffff',
                    margin: '0'
                  }}>
                    {isPro ? 'Pro Plan' : 'Current Plan'}
                  </h3>
                </div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: isPro ? '#10b981' : '#ffffff',
                  marginBottom: '8px'
                }}>
                  {user.plan?.charAt(0).toUpperCase() + user.plan?.slice(1) || 'Free'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#a3a3a3'
                }}>
                  {isPro ? 'All features unlocked' : 'Upgrade for more storage →'}
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: '#111111',
            border: '1px solid #2a2a2a',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '48px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 24px 0'
            }}>
              Quick Actions
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              <Link to="/requests" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#a3a3a3',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    Most Popular
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    color: '#ffffff',
                    fontWeight: '600',
                    marginBottom: '8px',
                    margin: '0 0 8px 0'
                  }}>
                    Create New Request
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#a3a3a3',
                    lineHeight: '1.5',
                    margin: '0'
                  }}>
                    Set up a new file collection page in under 30 seconds
                  </p>
                </div>
              </Link>

              <Link to="/responses" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#a3a3a3',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    Your Data
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    color: '#ffffff',
                    fontWeight: '600',
                    marginBottom: '8px',
                    margin: '0 0 8px 0'
                  }}>
                    View All Requests
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#a3a3a3',
                    lineHeight: '1.5',
                    margin: '0'
                  }}>
                    Track submissions, download files, and manage your data
                  </p>
                </div>
              </Link>

              <Link to="/collaboration" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '8px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#a3a3a3',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    Team Features
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    color: '#ffffff',
                    fontWeight: '600',
                    marginBottom: '8px',
                    margin: '0 0 8px 0'
                  }}>
                    Collaboration Hub
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#a3a3a3',
                    lineHeight: '1.5',
                    margin: '0'
                  }}>
                    Manage approvals, edit requests, and team workflows
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          {stats.recentActivity && stats.recentActivity.length > 0 && (
            <div style={{
              background: '#111111',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '32px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0'
                }}>
                  Recent Activity
                </h2>
                <Link to="/responses" style={{
                  color: '#a3a3a3',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  View all →
                </Link>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {stats.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: '#1a1a1a',
                    borderRadius: '8px',
                    border: '1px solid #2a2a2a'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#2a2a2a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      📄
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#ffffff',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {activity.fileName}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#a3a3a3'
                      }}>
                        Uploaded to {activity.formName} • {getTimeAgo(activity.uploadedAt)}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#a3a3a3',
                      padding: '4px 8px',
                      background: '#2a2a2a',
                      borderRadius: '4px'
                    }}>
                      {formatBytes(activity.fileSize)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Dashboard
