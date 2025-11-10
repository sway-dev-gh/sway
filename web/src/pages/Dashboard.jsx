import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'

function Dashboard() {
  const navigate = useNavigate()
  // FORCE REBUILD - Version 2
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalUploads: 0,
    storageUsed: 0,
    activeRequests: 0,
    recentRequests: [],
    recentUploads: [],
    uploadsByDay: [],
    requestsByType: {},
    storageByRequest: [],
    recentActivity: [],
    topRequests: [],
    fileTypeBreakdown: [],
    avgUploadsPerRequest: 0
  })
  const [user, setUser] = useState({ plan: 'free', storage_limit_gb: 1 })

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

      // Fetch analytics (basic for free, advanced for pro)
      const analyticsResponse = await api.get('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const analytics = analyticsResponse.data

      // Fetch recent requests for activity list
      const requestsResponse = await api.get('/api/requests', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const requests = requestsResponse.data.requests || []
      const recentRequests = requests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

      setStats({
        totalRequests: analytics.totalRequests || 0,
        totalUploads: analytics.totalUploads || 0,
        storageUsed: (analytics.totalStorageGB || 0) * 1024, // Convert GB to MB for consistency
        activeRequests: analytics.activeRequests || 0,
        uploadsByDay: analytics.uploadsByDay || [],
        requestsByType: analytics.requestsByType || {},
        recentRequests,
        // Pro-only analytics
        recentActivity: analytics.advanced?.recentActivity || [],
        topRequests: analytics.advanced?.topRequests || [],
        fileTypeBreakdown: analytics.advanced?.fileTypeBreakdown || [],
        avgUploadsPerRequest: analytics.advanced?.avgUploadsPerRequest || 0,
        plan: analytics.plan
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      } else {
        // Set default empty stats on error so UI still renders
        setStats({
          totalRequests: 0,
          totalUploads: 0,
          storageUsed: 0,
          activeRequests: 0,
          uploadsByDay: [],
          requestsByType: {},
          recentRequests: [],
          recentActivity: [],
          topRequests: [],
          fileTypeBreakdown: [],
          avgUploadsPerRequest: 0,
          plan: 'free'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes) => {
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

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        marginTop: '72px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: theme.spacing[12]
        }}>
          {/* Header */}
          <div style={{ marginBottom: theme.spacing[12] }}>
            <h1 style={{
              fontSize: theme.fontSize['3xl'],
              fontWeight: '500',
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em'
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: theme.fontSize.lg,
              color: theme.colors.text.secondary,
              margin: '12px 0 0 0',
              lineHeight: '1.6'
            }}>
              Overview of your file requests and uploads
            </p>
          </div>

          {/* Primary Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: theme.spacing[6],
            marginBottom: theme.spacing[10]
          }}>
            <div style={{
              background: theme.colors.bg.secondary,
              padding: '32px',
              borderRadius: '16px',
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md,
                          }}>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: theme.spacing[4], fontWeight: theme.weight.medium }}>Active Requests</div>
              <div style={{ fontSize: theme.fontSize['3xl'], fontWeight: theme.weight.semibold, color: theme.colors.white, lineHeight: '1', marginBottom: theme.spacing[2] }}>{stats.activeRequests}</div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.muted }}>
                of {(user.plan || 'free').toLowerCase() === 'pro' ? '200' : '20'} available
              </div>
            </div>

            <div style={{
              background: theme.colors.bg.secondary,
              padding: '32px',
              borderRadius: '16px',
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md,
                          }}>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: theme.spacing[4], fontWeight: theme.weight.medium }}>Total Uploads</div>
              <div style={{ fontSize: theme.fontSize['3xl'], fontWeight: theme.weight.semibold, color: theme.colors.white, lineHeight: '1', marginBottom: theme.spacing[2] }}>{stats.totalUploads}</div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.muted }}>
                {stats.uploadsByDay && stats.uploadsByDay.length > 0 ? stats.uploadsByDay[stats.uploadsByDay.length - 1].count : 0} today
              </div>
            </div>

            <div style={{
              background: theme.colors.bg.secondary,
              padding: '32px',
              borderRadius: '16px',
              border: `1px solid ${theme.colors.border.light}`,
              gridColumn: 'span 2',
              boxShadow: theme.shadows.md,
                          }}>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: theme.spacing[4], fontWeight: theme.weight.medium }}>Storage Used</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[3], marginBottom: theme.spacing[5] }}>
                <div style={{ fontSize: theme.fontSize['3xl'], fontWeight: theme.weight.semibold, color: theme.colors.white, lineHeight: '1' }}>
                  {formatStorageMB(stats.storageUsed)}
                </div>
                <div style={{ fontSize: theme.fontSize.lg, color: theme.colors.text.muted }}>
                  of {user.storage_limit_gb} GB
                </div>
              </div>
              {/* Storage Bar */}
              <div style={{
                width: '100%',
                height: '12px',
                background: theme.colors.bg.page,
                borderRadius: theme.radius.full,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${getStoragePercentage()}%`,
                  height: '100%',
                  background: theme.colors.white,
                  transition: `width ${theme.transition.slow}`
                }} />
              </div>
            </div>
          </div>

          {/* Charts Section - PRO ONLY */}
          {(user.plan || 'free').toLowerCase() === 'pro' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: theme.spacing[6],
              marginBottom: theme.spacing[10]
            }}>
            {/* Upload Trend Chart */}
            <div style={{
              background: theme.colors.bg.secondary,
              padding: theme.spacing[12],
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md
            }}>
              <div style={{ fontSize: theme.fontSize.base, color: theme.colors.text.primary, fontWeight: theme.weight.medium, marginBottom: theme.spacing[8] }}>
                Upload Trend (Last 7 Days)
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: theme.spacing[3],
                height: '200px'
              }}>
                {(stats.uploadsByDay || []).map((day, index) => (
                  <div key={index} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: theme.spacing[2]
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
                        minHeight: day.count > 0 ? '6px' : '0',
                        transition: `height ${theme.transition.slow}`
                      }} />
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.text.tertiary,
                      textAlign: 'center'
                    }}>
                      {day.date}
                    </div>
                    <div style={{
                      fontSize: theme.fontSize.sm,
                      color: theme.colors.text.secondary,
                      fontWeight: theme.weight.medium
                    }}>
                      {day.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Types Breakdown */}
            <div style={{
              background: theme.colors.bg.secondary,
              padding: theme.spacing[12],
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md
            }}>
              <div style={{ fontSize: theme.fontSize.base, color: theme.colors.text.primary, fontWeight: theme.weight.medium, marginBottom: theme.spacing[6] }}>
                Request Types
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                {Object.entries(stats.requestsByType || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, count], index) => {
                    const percentage = (count / stats.totalRequests) * 100
                    return (
                      <div key={type}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: theme.spacing[2]
                        }}>
                          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary }}>
                            {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </div>
                          <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.tertiary, fontWeight: theme.weight.medium }}>{count}</div>
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
                            opacity: 1 - (index * 0.12),
                            transition: `width ${theme.transition.slow}`
                          }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
            </div>
          )}

          {/* Advanced Insights Grid - Blurred for Free, Full for Pro */}
          <div style={{
            position: 'relative',
            marginBottom: theme.spacing[10]
          }}>
            {/* Blur overlay for Free users */}
            {(user.plan || 'free').toLowerCase() === 'free' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: theme.radius['2xl'],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <Link
                  to="/plan"
                  style={{
                    padding: '12px 32px',
                    background: theme.colors.white,
                    color: theme.colors.black,
                    borderRadius: theme.radius.lg,
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.weight.semibold,
                    textDecoration: 'none',
                    boxShadow: theme.shadows.xl
                  }}
                >
                  Upgrade to Pro for Advanced Insights
                </Link>
              </div>
            )}

            {/* Advanced Insights Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: theme.spacing[6],
              filter: (user.plan || 'free').toLowerCase() === 'free' ? 'blur(4px)' : 'none',
              pointerEvents: (user.plan || 'free').toLowerCase() === 'free' ? 'none' : 'auto'
            }}>
              {/* Average Uploads Per Request */}
              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[8],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md
              }}>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[3],
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: theme.weight.medium
                }}>
                  Avg Uploads/Request
                </div>
                <div style={{
                  fontSize: theme.fontSize['2xl'],
                  fontWeight: theme.weight.bold,
                  color: theme.colors.accent.green,
                  marginBottom: theme.spacing[2]
                }}>
                  {stats.totalRequests > 0 ? (stats.totalUploads / stats.totalRequests).toFixed(1) : '0.0'}
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.muted
                }}>
                  Engagement metric
                </div>
              </div>

              {/* Most Active Day */}
              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[8],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md
              }}>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[3],
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: theme.weight.medium
                }}>
                  Most Active Day
                </div>
                <div style={{
                  fontSize: theme.fontSize['2xl'],
                  fontWeight: theme.weight.bold,
                  color: theme.colors.accent.blue,
                  marginBottom: theme.spacing[2]
                }}>
                  {stats.uploadsByDay && stats.uploadsByDay.length > 0
                    ? stats.uploadsByDay.reduce((max, day) => day.count > max.count ? day : max, stats.uploadsByDay[0]).date
                    : 'N/A'}
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.muted
                }}>
                  {stats.uploadsByDay && stats.uploadsByDay.length > 0
                    ? `${stats.uploadsByDay.reduce((max, day) => day.count > max.count ? day : max, stats.uploadsByDay[0]).count} uploads`
                    : 'No data yet'}
                </div>
              </div>

              {/* Storage Efficiency */}
              <div style={{
                background: theme.colors.bg.secondary,
                padding: theme.spacing[8],
                borderRadius: theme.radius['2xl'],
                border: `1px solid ${theme.colors.border.light}`,
                boxShadow: theme.shadows.md
              }}>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.tertiary,
                  marginBottom: theme.spacing[3],
                  textTransform: 'uppercase',
                  letterSpacing: '1.2px',
                  fontWeight: theme.weight.medium
                }}>
                  Avg File Size
                </div>
                <div style={{
                  fontSize: theme.fontSize['2xl'],
                  fontWeight: theme.weight.bold,
                  color: theme.colors.accent.purple,
                  marginBottom: theme.spacing[2]
                }}>
                  {stats.totalUploads > 0
                    ? formatFileSize((stats.storageUsed * 1024 * 1024) / stats.totalUploads)
                    : '0 B'}
                </div>
                <div style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.muted
                }}>
                  Per uploaded file
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing[6]
          }}>
            {/* Recent Requests */}
            <div style={{
              background: theme.colors.bg.secondary,
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: theme.spacing[8],
                borderBottom: `1px solid ${theme.colors.border.light}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: theme.fontSize.base, color: theme.colors.text.primary, fontWeight: theme.weight.medium }}>
                  Recent Requests
                </div>
                <Link
                  to="/requests"
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.secondary,
                    textDecoration: 'none',
                    transition: `color ${theme.transition.fast}`
                  }}


                                  >
                  View all →
                </Link>
              </div>
              <div>
                {(!stats.recentRequests || stats.recentRequests.length === 0) ? (
                  <div style={{
                    padding: theme.spacing[16],
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: theme.fontSize.base
                  }}>
                    No requests yet
                  </div>
                ) : (
                  (stats.recentRequests || []).map((req, index) => (
                    <div
                      key={req.id}
                      style={{
                        padding: theme.spacing[6],
                        borderBottom: index < stats.recentRequests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                        transition: `background ${theme.transition.fast}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate('/requests')}


                                      >
                      <div style={{
                        fontSize: theme.fontSize.base,
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        marginBottom: theme.spacing[1]
                      }}>
                        {req.title}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.tertiary
                      }}>
                        {req.uploadCount || 0} uploads • {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Responses */}
            <div style={{
              background: theme.colors.bg.secondary,
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              boxShadow: theme.shadows.md,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: theme.spacing[8],
                borderBottom: `1px solid ${theme.colors.border.light}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: theme.fontSize.base, color: theme.colors.text.primary, fontWeight: theme.weight.medium }}>
                  Recent Responses
                </div>
                <Link
                  to="/responses"
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.secondary,
                    textDecoration: 'none',
                    transition: `color ${theme.transition.fast}`
                  }}


                                  >
                  View all →
                </Link>
              </div>
              <div>
                {(!stats.recentUploads || stats.recentUploads.length === 0) ? (
                  <div style={{
                    padding: theme.spacing[16],
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: theme.fontSize.base
                  }}>
                    No uploads yet
                  </div>
                ) : (
                  (stats.recentUploads || []).map((file, index) => (
                    <div
                      key={file.id}
                      style={{
                        padding: theme.spacing[6],
                        borderBottom: index < stats.recentUploads.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: theme.fontSize.base,
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        marginBottom: theme.spacing[1],
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.fileName}
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.tertiary
                      }}>
                        {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pro-Only Advanced Analytics */}
          {(user.plan || 'free').toLowerCase() === 'pro' && (
            <>
              {/* Section Header */}
              <div style={{
                marginTop: theme.spacing[10],
                marginBottom: theme.spacing[6],
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: theme.fontSize['3xl'],
                  fontWeight: theme.weight.bold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing[2],
                  background: `linear-gradient(135deg, ${theme.colors.accent.blue}, ${theme.colors.accent.purple})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Pro Analytics Suite
                </div>
                <div style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.tertiary
                }}>
                  Advanced insights and performance metrics
                </div>
              </div>

              {/* Request Performance Leaderboard */}
              {stats.topRequests && stats.topRequests.length > 0 && (
                <div style={{
                  background: `linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05))`,
                  borderRadius: theme.radius['2xl'],
                  border: `1px solid ${theme.colors.border.light}`,
                  boxShadow: theme.shadows.lg,
                  overflow: 'hidden',
                  marginBottom: theme.spacing[6]
                }}>
                  <div style={{
                    padding: theme.spacing[8],
                    borderBottom: `1px solid ${theme.colors.border.light}`,
                    background: theme.colors.bg.secondary
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{
                          fontSize: theme.fontSize.xl,
                          color: theme.colors.text.primary,
                          fontWeight: theme.weight.bold,
                          marginBottom: theme.spacing[1]
                        }}>
                          Request Performance Leaderboard
                        </div>
                        <div style={{
                          fontSize: theme.fontSize.sm,
                          color: theme.colors.text.tertiary
                        }}>
                          Your top-performing requests ranked by engagement
                        </div>
                      </div>
                      <div style={{
                        padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                        background: `linear-gradient(135deg, ${theme.colors.accent.blue}, ${theme.colors.accent.purple})`,
                        borderRadius: theme.radius.lg,
                        color: 'white',
                        fontSize: theme.fontSize.xs,
                        fontWeight: theme.weight.semibold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Top {stats.topRequests.length}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: theme.spacing[8], background: theme.colors.bg.secondary }}>
                    {stats.topRequests.map((req, index) => {
                      const maxUploads = Math.max(...stats.topRequests.map(r => parseInt(r.upload_count)), 1)
                      const percentage = (parseInt(req.upload_count) / maxUploads) * 100
                      const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']
                      const medalEmojis = ['🥇', '🥈', '🥉']

                      return (
                        <div key={index} style={{
                          marginBottom: index < stats.topRequests.length - 1 ? theme.spacing[6] : 0,
                          padding: theme.spacing[6],
                          background: theme.colors.bg.primary,
                          borderRadius: theme.radius.xl,
                          border: index < 3 ? `2px solid ${medalColors[index]}` : `1px solid ${theme.colors.border.light}`,
                          transition: `all ${theme.transition.normal}`,
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = theme.shadows.lg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: theme.spacing[3]
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                              <div style={{
                                fontSize: theme.fontSize['2xl'],
                                fontWeight: theme.weight.bold,
                                color: index < 3 ? medalColors[index] : theme.colors.text.tertiary,
                                minWidth: '32px',
                                textAlign: 'center'
                              }}>
                                {index < 3 ? medalEmojis[index] : `#${index + 1}`}
                              </div>
                              <div>
                                <div style={{
                                  fontSize: theme.fontSize.base,
                                  color: theme.colors.text.primary,
                                  fontWeight: theme.weight.semibold
                                }}>
                                  {req.title}
                                </div>
                                <div style={{
                                  fontSize: theme.fontSize.xs,
                                  color: theme.colors.text.tertiary,
                                  marginTop: theme.spacing[1]
                                }}>
                                  Created {new Date(req.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{
                                fontSize: theme.fontSize['2xl'],
                                fontWeight: theme.weight.bold,
                                color: theme.colors.accent.blue
                              }}>
                                {req.upload_count}
                              </div>
                              <div style={{
                                fontSize: theme.fontSize.xs,
                                color: theme.colors.text.tertiary
                              }}>
                                uploads
                              </div>
                            </div>
                          </div>
                          <div style={{
                            width: '100%',
                            height: '12px',
                            background: theme.colors.bg.tertiary,
                            borderRadius: theme.radius.full,
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              background: index < 3
                                ? `linear-gradient(90deg, ${medalColors[index]}, ${medalColors[index]}dd)`
                                : `linear-gradient(90deg, ${theme.colors.accent.blue}, ${theme.colors.accent.purple})`,
                              transition: `width ${theme.transition.slow}`,
                              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* File Type Intelligence & Activity Heatmap */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: theme.spacing[6],
                marginBottom: theme.spacing[6]
              }}>
                {/* File Type Intelligence */}
                {stats.fileTypeBreakdown && stats.fileTypeBreakdown.length > 0 && (
                  <div style={{
                    background: theme.colors.bg.secondary,
                    borderRadius: theme.radius['2xl'],
                    border: `1px solid ${theme.colors.border.light}`,
                    boxShadow: theme.shadows.lg,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: theme.spacing[8],
                      borderBottom: `1px solid ${theme.colors.border.light}`
                    }}>
                      <div style={{
                        fontSize: theme.fontSize.xl,
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.bold,
                        marginBottom: theme.spacing[1]
                      }}>
                        File Type Intelligence
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.tertiary
                      }}>
                        Distribution and trends across file types
                      </div>
                    </div>
                    <div style={{ padding: theme.spacing[8] }}>
                      {stats.fileTypeBreakdown.map((type, index) => {
                        const totalFiles = stats.fileTypeBreakdown.reduce((sum, t) => sum + parseInt(t.count), 0)
                        const percentage = ((parseInt(type.count) / totalFiles) * 100).toFixed(1)

                        const fileTypeData = {
                          'PDF': { color: theme.colors.accent.red, icon: '📄', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)' },
                          'Image': { color: theme.colors.accent.blue, icon: '🖼️', gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
                          'Document': { color: theme.colors.accent.green, icon: '📝', gradient: 'linear-gradient(135deg, #10B981, #059669)' },
                          'Spreadsheet': { color: theme.colors.accent.yellow, icon: '📊', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
                          'Video': { color: theme.colors.accent.purple, icon: '🎥', gradient: 'linear-gradient(135deg, #9333EA, #7C3AED)' },
                          'Other': { color: theme.colors.text.tertiary, icon: '📦', gradient: 'linear-gradient(135deg, #6B7280, #4B5563)' }
                        }

                        const typeInfo = fileTypeData[type.file_type] || fileTypeData['Other']

                        return (
                          <div key={index} style={{
                            marginBottom: index < stats.fileTypeBreakdown.length - 1 ? theme.spacing[6] : 0
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: theme.spacing[2]
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                                <div style={{
                                  fontSize: theme.fontSize.xl
                                }}>
                                  {typeInfo.icon}
                                </div>
                                <div>
                                  <div style={{
                                    fontSize: theme.fontSize.sm,
                                    color: theme.colors.text.primary,
                                    fontWeight: theme.weight.semibold
                                  }}>
                                    {type.file_type}
                                  </div>
                                  <div style={{
                                    fontSize: theme.fontSize.xs,
                                    color: theme.colors.text.tertiary
                                  }}>
                                    {type.count} files
                                  </div>
                                </div>
                              </div>
                              <div style={{
                                fontSize: theme.fontSize.lg,
                                fontWeight: theme.weight.bold,
                                color: typeInfo.color
                              }}>
                                {percentage}%
                              </div>
                            </div>
                            <div style={{
                              width: '100%',
                              height: '10px',
                              background: theme.colors.bg.tertiary,
                              borderRadius: theme.radius.full,
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: typeInfo.gradient,
                                transition: `width ${theme.transition.slow}`,
                                boxShadow: `0 0 8px ${typeInfo.color}40`
                              }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Activity Pulse */}
                {stats.uploadsByDay && stats.uploadsByDay.length > 0 && (
                  <div style={{
                    background: theme.colors.bg.secondary,
                    borderRadius: theme.radius['2xl'],
                    border: `1px solid ${theme.colors.border.light}`,
                    boxShadow: theme.shadows.lg,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: theme.spacing[8],
                      borderBottom: `1px solid ${theme.colors.border.light}`
                    }}>
                      <div style={{
                        fontSize: theme.fontSize.xl,
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.bold,
                        marginBottom: theme.spacing[1]
                      }}>
                        Activity Pulse
                      </div>
                      <div style={{
                        fontSize: theme.fontSize.sm,
                        color: theme.colors.text.tertiary
                      }}>
                        Upload activity over the past week
                      </div>
                    </div>
                    <div style={{ padding: theme.spacing[8] }}>
                      {/* Activity Heatmap */}
                      <div style={{
                        display: 'flex',
                        gap: theme.spacing[2],
                        marginBottom: theme.spacing[6]
                      }}>
                        {stats.uploadsByDay.slice(-7).map((day, index) => {
                          const maxCount = Math.max(...stats.uploadsByDay.slice(-7).map(d => d.count), 1)
                          const intensity = (day.count / maxCount) * 100
                          const height = Math.max((intensity / 100) * 120, 20)

                          return (
                            <div key={index} style={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: theme.spacing[2]
                            }}>
                              <div
                                style={{
                                  width: '100%',
                                  height: `${height}px`,
                                  background: intensity > 0
                                    ? `linear-gradient(180deg, ${theme.colors.accent.blue}, ${theme.colors.accent.purple})`
                                    : theme.colors.bg.tertiary,
                                  borderRadius: theme.radius.lg,
                                  position: 'relative',
                                  transition: `all ${theme.transition.normal}`,
                                  cursor: 'pointer',
                                  boxShadow: intensity > 50 ? `0 0 12px ${theme.colors.accent.blue}60` : 'none'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-4px)'
                                  e.currentTarget.style.filter = 'brightness(1.2)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)'
                                  e.currentTarget.style.filter = 'brightness(1)'
                                }}
                                title={`${day.count} uploads on ${new Date(day.date).toLocaleDateString()}`}
                              >
                                <div style={{
                                  position: 'absolute',
                                  top: '-24px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  fontSize: theme.fontSize.xs,
                                  fontWeight: theme.weight.bold,
                                  color: theme.colors.text.primary
                                }}>
                                  {day.count}
                                </div>
                              </div>
                              <div style={{
                                fontSize: theme.fontSize.xs,
                                color: theme.colors.text.tertiary,
                                fontWeight: theme.weight.medium
                              }}>
                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Summary Stats */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: theme.spacing[4],
                        marginTop: theme.spacing[6],
                        padding: theme.spacing[6],
                        background: theme.colors.bg.primary,
                        borderRadius: theme.radius.xl
                      }}>
                        <div>
                          <div style={{
                            fontSize: theme.fontSize.xs,
                            color: theme.colors.text.tertiary,
                            marginBottom: theme.spacing[1],
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Peak Day
                          </div>
                          <div style={{
                            fontSize: theme.fontSize.xl,
                            fontWeight: theme.weight.bold,
                            color: theme.colors.accent.blue
                          }}>
                            {stats.uploadsByDay.reduce((max, day) => day.count > max.count ? day : max, stats.uploadsByDay[0]).count}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: theme.fontSize.xs,
                            color: theme.colors.text.tertiary,
                            marginBottom: theme.spacing[1],
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            Avg/Day
                          </div>
                          <div style={{
                            fontSize: theme.fontSize.xl,
                            fontWeight: theme.weight.bold,
                            color: theme.colors.accent.purple
                          }}>
                            {(stats.uploadsByDay.reduce((sum, day) => sum + day.count, 0) / stats.uploadsByDay.length).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Storage Intelligence & Engagement Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: theme.spacing[6],
                marginBottom: theme.spacing[6]
              }}>
                {/* Storage Efficiency */}
                <div style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent.green}10, ${theme.colors.accent.blue}10)`,
                  borderRadius: theme.radius['2xl'],
                  border: `1px solid ${theme.colors.border.light}`,
                  boxShadow: theme.shadows.md,
                  padding: theme.spacing[8]
                }}>
                  <div style={{
                    fontSize: theme.fontSize['4xl'],
                    marginBottom: theme.spacing[2]
                  }}>
                    💾
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: theme.spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: theme.weight.semibold
                  }}>
                    Storage Efficiency
                  </div>
                  <div style={{
                    fontSize: theme.fontSize['3xl'],
                    fontWeight: theme.weight.bold,
                    color: theme.colors.accent.green,
                    marginBottom: theme.spacing[2]
                  }}>
                    {((stats.storageUsed / user.storage_limit_gb) * 100).toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.tertiary
                  }}>
                    {stats.storageUsed.toFixed(2)} GB of {user.storage_limit_gb} GB used
                  </div>
                </div>

                {/* Engagement Rate */}
                <div style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent.blue}10, ${theme.colors.accent.purple}10)`,
                  borderRadius: theme.radius['2xl'],
                  border: `1px solid ${theme.colors.border.light}`,
                  boxShadow: theme.shadows.md,
                  padding: theme.spacing[8]
                }}>
                  <div style={{
                    fontSize: theme.fontSize['4xl'],
                    marginBottom: theme.spacing[2]
                  }}>
                    📈
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: theme.spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: theme.weight.semibold
                  }}>
                    Engagement Rate
                  </div>
                  <div style={{
                    fontSize: theme.fontSize['3xl'],
                    fontWeight: theme.weight.bold,
                    color: theme.colors.accent.blue,
                    marginBottom: theme.spacing[2]
                  }}>
                    {stats.avgUploadsPerRequest || 0}
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.tertiary
                  }}>
                    Avg uploads per request
                  </div>
                </div>

                {/* Response Rate */}
                <div style={{
                  background: `linear-gradient(135deg, ${theme.colors.accent.purple}10, ${theme.colors.accent.red}10)`,
                  borderRadius: theme.radius['2xl'],
                  border: `1px solid ${theme.colors.border.light}`,
                  boxShadow: theme.shadows.md,
                  padding: theme.spacing[8]
                }}>
                  <div style={{
                    fontSize: theme.fontSize['4xl'],
                    marginBottom: theme.spacing[2]
                  }}>
                    ⚡
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.text.tertiary,
                    marginBottom: theme.spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: theme.weight.semibold
                  }}>
                    Response Rate
                  </div>
                  <div style={{
                    fontSize: theme.fontSize['3xl'],
                    fontWeight: theme.weight.bold,
                    color: theme.colors.accent.purple,
                    marginBottom: theme.spacing[2]
                  }}>
                    {stats.totalRequests > 0 ? ((stats.totalRequests - (stats.recentRequests || []).filter(r => (r.upload_count || 0) === 0).length) / stats.totalRequests * 100).toFixed(0) : 0}%
                  </div>
                  <div style={{
                    fontSize: theme.fontSize.sm,
                    color: theme.colors.text.tertiary
                  }}>
                    Requests with responses
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default Dashboard
