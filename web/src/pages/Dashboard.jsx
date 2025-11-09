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
    recentRequests: [],
    recentUploads: [],
    uploadsByDay: [],
    requestsByType: {},
    storageByRequest: []
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
      const API_URL = import.meta.env.VITE_API_URL || 'https://api.swayfiles.com'

      const { data } = await api.get(`${API_URL}/api/stripe/plan-info`, {
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

      const [statsResponse, requestsResponse, filesResponse] = await Promise.all([
        api.get('/api/stats', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/requests', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/files', { headers: { Authorization: `Bearer ${token}` } })
      ])

      const statsData = statsResponse.data
      const requests = requestsResponse.data.requests || []
      const files = filesResponse.data.files || []

      // Calculate active requests
      const activeRequests = requests.filter(r => r.isActive).length

      // Get recent requests (last 5)
      const recentRequests = requests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

      // Get recent uploads (last 5)
      const recentUploads = files
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .slice(0, 5)

      // Calculate uploads by day (last 7 days)
      const uploadsByDay = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const count = files.filter(f => {
          const uploadDate = new Date(f.uploadedAt)
          return uploadDate >= date && uploadDate < nextDate
        }).length

        uploadsByDay.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count
        })
      }

      // Calculate requests by type
      const requestsByType = requests.reduce((acc, req) => {
        const type = req.requestType || 'general-upload'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})

      // Calculate storage by request (top 5)
      const storageByRequest = requests
        .map(req => ({
          title: req.title,
          storage: files.filter(f => f.requestId === req.id)
            .reduce((sum, f) => sum + (f.fileSize || 0), 0)
        }))
        .sort((a, b) => b.storage - a.storage)
        .slice(0, 5)

      setStats({
        totalRequests: statsData.totalRequests,
        totalUploads: statsData.totalUploads,
        storageUsed: statsData.storageMB,
        activeRequests,
        recentRequests,
        recentUploads,
        uploadsByDay,
        requestsByType,
        storageByRequest
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

  const maxUploadsInWeek = Math.max(...stats.uploadsByDay.map(d => d.count), 1)

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
          padding: theme.spacing[20]
        }}>
          {/* Header */}
          <div style={{ marginBottom: theme.spacing[12] }}>
            <h1 style={{
              fontSize: theme.fontSize['4xl'],
              fontWeight: theme.weight.semibold,
              margin: 0,
              color: theme.colors.text.primary,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #a3a3a3 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: '15px',
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
              padding: theme.spacing[12],
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              borderLeft: `4px solid ${theme.colors.accent}`,
              boxShadow: theme.shadows.md,
              transition: `all ${theme.transition.normal}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.hover
              e.currentTarget.style.borderColor = theme.colors.border.medium
              e.currentTarget.style.boxShadow = theme.shadows.glowStrong
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.bg.secondary
              e.currentTarget.style.borderColor = theme.colors.border.light
              e.currentTarget.style.boxShadow = theme.shadows.md
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ fontSize: '12px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: theme.spacing[4], fontWeight: theme.weight.medium }}>Active Requests</div>
              <div style={{ fontSize: theme.fontSize['5xl'], fontWeight: theme.weight.semibold, color: theme.colors.white, lineHeight: '1', marginBottom: theme.spacing[2] }}>{stats.activeRequests}</div>
              <div style={{ fontSize: '13px', color: theme.colors.text.muted }}>
                of {(user.plan || 'free').toLowerCase() === 'pro' ? '200' : '20'} available
              </div>
            </div>

            <div style={{
              background: theme.colors.bg.secondary,
              padding: theme.spacing[12],
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              borderLeft: `4px solid ${theme.colors.success}`,
              boxShadow: theme.shadows.md,
              transition: `all ${theme.transition.normal}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.hover
              e.currentTarget.style.borderColor = theme.colors.border.medium
              e.currentTarget.style.boxShadow = theme.shadows.glowStrong
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.bg.secondary
              e.currentTarget.style.borderColor = theme.colors.border.light
              e.currentTarget.style.boxShadow = theme.shadows.md
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ fontSize: '12px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: theme.spacing[4], fontWeight: theme.weight.medium }}>Total Uploads</div>
              <div style={{ fontSize: theme.fontSize['5xl'], fontWeight: theme.weight.semibold, color: theme.colors.white, lineHeight: '1', marginBottom: theme.spacing[2] }}>{stats.totalUploads}</div>
              <div style={{ fontSize: '13px', color: theme.colors.text.muted }}>
                {stats.uploadsByDay.length > 0 ? stats.uploadsByDay[stats.uploadsByDay.length - 1].count : 0} today
              </div>
            </div>

            <div style={{
              background: theme.colors.bg.secondary,
              padding: theme.spacing[12],
              borderRadius: theme.radius['2xl'],
              border: `1px solid ${theme.colors.border.light}`,
              borderLeft: `4px solid ${getStoragePercentage() > 80 ? theme.colors.error : theme.colors.warning}`,
              gridColumn: 'span 2',
              boxShadow: theme.shadows.md,
              transition: `all ${theme.transition.normal}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.bg.hover
              e.currentTarget.style.borderColor = theme.colors.border.medium
              e.currentTarget.style.boxShadow = theme.shadows.glowStrong
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.bg.secondary
              e.currentTarget.style.borderColor = theme.colors.border.light
              e.currentTarget.style.boxShadow = theme.shadows.md
              e.currentTarget.style.transform = 'translateY(0)'
            }}>
              <div style={{ fontSize: '12px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: theme.spacing[4], fontWeight: theme.weight.medium }}>Storage Used</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[3], marginBottom: theme.spacing[5] }}>
                <div style={{ fontSize: theme.fontSize['5xl'], fontWeight: theme.weight.semibold, color: theme.colors.white, lineHeight: '1' }}>
                  {formatStorageMB(stats.storageUsed)}
                </div>
                <div style={{ fontSize: '15px', color: theme.colors.text.muted }}>
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
                  background: getStoragePercentage() > 80 ? `linear-gradient(90deg, ${theme.colors.error} 0%, ${theme.colors.warning} 100%)` : `linear-gradient(90deg, ${theme.colors.accent} 0%, ${theme.colors.success} 100%)`,
                  transition: `width ${theme.transition.slow}`
                }} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
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
              <div style={{ fontSize: '16px', color: theme.colors.text.primary, fontWeight: theme.weight.medium, marginBottom: theme.spacing[8] }}>
                Upload Trend (Last 7 Days)
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: theme.spacing[3],
                height: '200px'
              }}>
                {stats.uploadsByDay.map((day, index) => (
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
                        background: `linear-gradient(180deg, ${theme.colors.accent} 0%, ${theme.colors.white} 100%)`,
                        borderRadius: `${theme.radius.sm} ${theme.radius.sm} 0 0`,
                        minHeight: day.count > 0 ? '6px' : '0',
                        transition: `height ${theme.transition.slow}`
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
                      fontSize: '13px',
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
              <div style={{ fontSize: '16px', color: theme.colors.text.primary, fontWeight: theme.weight.medium, marginBottom: theme.spacing[6] }}>
                Request Types
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                {Object.entries(stats.requestsByType)
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
                          <div style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
                            {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </div>
                          <div style={{ fontSize: '13px', color: theme.colors.text.tertiary, fontWeight: theme.weight.medium }}>{count}</div>
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
                <div style={{ fontSize: '16px', color: theme.colors.text.primary, fontWeight: theme.weight.medium }}>
                  Recent Requests
                </div>
                <Link
                  to="/requests"
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    textDecoration: 'none',
                    transition: `color ${theme.transition.fast}`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.secondary}
                >
                  View all →
                </Link>
              </div>
              <div>
                {stats.recentRequests.length === 0 ? (
                  <div style={{
                    padding: theme.spacing[16],
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: '14px'
                  }}>
                    No requests yet
                  </div>
                ) : (
                  stats.recentRequests.map((req, index) => (
                    <div
                      key={req.id}
                      style={{
                        padding: theme.spacing[6],
                        borderBottom: index < stats.recentRequests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                        transition: `background ${theme.transition.fast}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate('/requests')}
                      onMouseEnter={(e) => e.currentTarget.style.background = theme.colors.bg.hover}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        marginBottom: theme.spacing[1]
                      }}>
                        {req.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
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
                <div style={{ fontSize: '16px', color: theme.colors.text.primary, fontWeight: theme.weight.medium }}>
                  Recent Responses
                </div>
                <Link
                  to="/responses"
                  style={{
                    fontSize: '13px',
                    color: theme.colors.text.secondary,
                    textDecoration: 'none',
                    transition: `color ${theme.transition.fast}`
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = theme.colors.text.primary}
                  onMouseLeave={(e) => e.currentTarget.style.color = theme.colors.text.secondary}
                >
                  View all →
                </Link>
              </div>
              <div>
                {stats.recentUploads.length === 0 ? (
                  <div style={{
                    padding: theme.spacing[16],
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: '14px'
                  }}>
                    No uploads yet
                  </div>
                ) : (
                  stats.recentUploads.map((file, index) => (
                    <div
                      key={file.id}
                      style={{
                        padding: theme.spacing[6],
                        borderBottom: index < stats.recentUploads.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: '14px',
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
                        fontSize: '13px',
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
        </div>
      </div>
    </>
  )
}

export default Dashboard
