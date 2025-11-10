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
        marginTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[6]
        }}>
          {/* Header */}
          <div style={{ marginBottom: theme.spacing[6] }}>
            <h1 style={{
              fontSize: theme.fontSize.xl,
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              margin: '6px 0 0 0',
              lineHeight: '1.6'
            }}>
              Analytics and insights for your forms
            </p>
          </div>

          {/* Top Stats Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: theme.spacing[4],
            marginBottom: theme.spacing[6]
          }}>
            {/* Total Forms Created */}
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

          {/* Charts Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: theme.spacing[4],
            marginBottom: theme.spacing[6]
          }}>
            {/* Upload Activity Chart */}
            <div style={{
              padding: theme.spacing[5],
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.primary,
                fontWeight: theme.weight.medium,
                marginBottom: theme.spacing[4]
              }}>
                Upload Activity (Last 7 Days)
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: theme.spacing[2],
                height: '160px'
              }}>
                {(stats.uploadsByDay || []).length === 0 ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.colors.text.tertiary,
                    fontSize: theme.fontSize.sm
                  }}>
                    No upload data yet
                  </div>
                ) : (
                  (stats.uploadsByDay || []).map((day, index) => (
                    <div key={index} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: theme.spacing[2],
                      height: '100%'
                    }}>
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{
                          width: '100%',
                          height: `${(day.count / maxUploadsInWeek) * 100}%`,
                          background: theme.colors.white,
                          borderRadius: `${theme.radius.sm} ${theme.radius.sm} 0 0`,
                          minHeight: day.count > 0 ? '8px' : '0',
                          transition: 'height 0.3s ease'
                        }} />
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: theme.colors.text.tertiary,
                        textAlign: 'center'
                      }}>
                        {day.date}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium
                      }}>
                        {day.count}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Most Active Forms */}
            <div style={{
              padding: theme.spacing[5],
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.primary,
                fontWeight: theme.weight.medium,
                marginBottom: theme.spacing[4]
              }}>
                Most Active Forms
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing[3]
              }}>
                {(!stats.topRequests || stats.topRequests.length === 0) ? (
                  <div style={{
                    textAlign: 'center',
                    color: theme.colors.text.tertiary,
                    fontSize: theme.fontSize.sm,
                    padding: theme.spacing[4]
                  }}>
                    No forms yet
                  </div>
                ) : (
                  stats.topRequests.slice(0, 5).map((req, index) => (
                    <div key={req.id || index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.primary
                      }}>
                        {req.title || 'Untitled Form'}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.tertiary,
                        fontWeight: theme.weight.medium,
                        marginLeft: theme.spacing[2]
                      }}>
                        {req.uploadCount || 0}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* File Type Breakdown & Recent Activity */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: theme.spacing[4],
            marginBottom: theme.spacing[6]
          }}>
            {/* File Type Breakdown */}
            <div style={{
              padding: theme.spacing[5],
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.primary,
                fontWeight: theme.weight.medium,
                marginBottom: theme.spacing[4]
              }}>
                File Types
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing[3]
              }}>
                {(!stats.fileTypeBreakdown || stats.fileTypeBreakdown.length === 0) ? (
                  <div style={{
                    textAlign: 'center',
                    color: theme.colors.text.tertiary,
                    fontSize: theme.fontSize.sm,
                    padding: theme.spacing[4]
                  }}>
                    No files yet
                  </div>
                ) : (
                  stats.fileTypeBreakdown.slice(0, 5).map((type, index) => {
                    const total = stats.fileTypeBreakdown.reduce((sum, t) => sum + t.count, 0)
                    const percentage = total > 0 ? (type.count / total) * 100 : 0
                    return (
                      <div key={type.type || index}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px'
                        }}>
                          <div style={{
                            fontSize: theme.fontSize.sm,
                            color: theme.colors.text.primary
                          }}>
                            {type.type || 'Unknown'}
                          </div>
                          <div style={{
                            fontSize: theme.fontSize.xs,
                            color: theme.colors.text.tertiary,
                            fontWeight: theme.weight.medium
                          }}>
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: theme.colors.bg.page,
                          borderRadius: theme.radius.sm,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: theme.colors.white,
                            opacity: 1 - (index * 0.15),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              padding: theme.spacing[5],
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              background: theme.colors.bg.secondary
            }}>
              <div style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.primary,
                fontWeight: theme.weight.medium,
                marginBottom: theme.spacing[4]
              }}>
                Recent Activity
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing[3]
              }}>
                {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
                  <div style={{
                    textAlign: 'center',
                    color: theme.colors.text.tertiary,
                    fontSize: theme.fontSize.sm,
                    padding: theme.spacing[4]
                  }}>
                    No recent activity
                  </div>
                ) : (
                  stats.recentActivity.slice(0, 8).map((activity, index) => (
                    <div key={activity.id || index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      paddingBottom: theme.spacing[3],
                      borderBottom: index < Math.min(stats.recentActivity.length - 1, 7) ? `1px solid ${theme.colors.border.light}` : 'none'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.text.primary,
                          fontWeight: theme.weight.medium,
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {activity.fileName}
                        </div>
                        <div style={{
                          fontSize: theme.fontSize.xs,
                          color: theme.colors.text.tertiary
                        }}>
                          {activity.formName} • {activity.uploaderName}
                        </div>
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.xs,
                        color: theme.colors.text.tertiary,
                        whiteSpace: 'nowrap',
                        marginLeft: theme.spacing[2]
                      }}>
                        {getTimeAgo(activity.uploadedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'flex',
            gap: theme.spacing[3],
            justifyContent: 'center'
          }}>
            <Link
              to="/requests"
              style={{
                padding: '12px 24px',
                background: theme.colors.white,
                color: theme.colors.black,
                border: 'none',
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              Create New Form
            </Link>
            <Link
              to="/requests"
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: theme.colors.text.primary,
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              View All Forms
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
