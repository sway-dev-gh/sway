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
          padding: '60px 40px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
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

          {/* Primary Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '28px 24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', fontWeight: theme.weight.medium }}>Total Requests</div>
              <div style={{ fontSize: '40px', fontWeight: '300', color: theme.colors.white, lineHeight: '1' }}>{stats.totalRequests}</div>
              <div style={{ fontSize: '12px', color: theme.colors.text.tertiary, marginTop: '8px' }}>{stats.activeRequests} active</div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '28px 24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', fontWeight: theme.weight.medium }}>Total Uploads</div>
              <div style={{ fontSize: '40px', fontWeight: '300', color: theme.colors.white, lineHeight: '1' }}>{stats.totalUploads}</div>
              <div style={{ fontSize: '12px', color: theme.colors.text.tertiary, marginTop: '8px' }}>
                {stats.uploadsByDay.length > 0 ? stats.uploadsByDay[stats.uploadsByDay.length - 1].count : 0} today
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '28px 24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              gridColumn: 'span 2'
            }}>
              <div style={{ fontSize: '11px', color: theme.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '12px', fontWeight: theme.weight.medium }}>Storage Used</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '40px', fontWeight: '300', color: theme.colors.white, lineHeight: '1' }}>
                  {formatStorageMB(stats.storageUsed)}
                </div>
                <div style={{ fontSize: '14px', color: theme.colors.text.tertiary }}>
                  of {user.storage_limit_gb} GB
                </div>
              </div>
              {/* Storage Bar */}
              <div style={{
                width: '100%',
                height: '6px',
                background: theme.colors.bg.secondary,
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${getStoragePercentage()}%`,
                  height: '100%',
                  background: getStoragePercentage() > 80 ? '#ef4444' : theme.colors.white,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {/* Upload Trend Chart */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '28px 24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: theme.weight.medium, marginBottom: '24px' }}>
                Upload Trend (Last 7 Days)
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                height: '160px'
              }}>
                {stats.uploadsByDay.map((day, index) => (
                  <div key={index} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
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
                        borderRadius: '4px 4px 0 0',
                        minHeight: day.count > 0 ? '4px' : '0',
                        transition: 'height 0.3s ease'
                      }} />
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: theme.colors.text.tertiary,
                      textAlign: 'center'
                    }}>
                      {day.date}
                    </div>
                    <div style={{
                      fontSize: '12px',
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
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '28px 24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`
            }}>
              <div style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: theme.weight.medium, marginBottom: '20px' }}>
                Request Types
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                          marginBottom: '6px'
                        }}>
                          <div style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                            {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </div>
                          <div style={{ fontSize: '12px', color: theme.colors.text.tertiary }}>{count}</div>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '4px',
                          background: theme.colors.bg.secondary,
                          borderRadius: '2px',
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
                  })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px'
          }}>
            {/* Recent Requests */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theme.colors.border.light}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: theme.weight.medium }}>
                  Recent Requests
                </div>
                <Link
                  to="/requests"
                  style={{
                    fontSize: '12px',
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
                    padding: '40px 24px',
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: '13px'
                  }}>
                    No requests yet
                  </div>
                ) : (
                  stats.recentRequests.map((req, index) => (
                    <div
                      key={req.id}
                      style={{
                        padding: '16px 24px',
                        borderBottom: index < stats.recentRequests.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none',
                        transition: `background ${theme.transition.fast}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate('/requests')}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        fontSize: '13px',
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        marginBottom: '4px'
                      }}>
                        {req.title}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.text.tertiary
                      }}>
                        {req.uploadCount || 0} uploads • {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Uploads */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.border.light}`,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${theme.colors.border.light}`
              }}>
                <div style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: theme.weight.medium }}>
                  Recent Uploads
                </div>
              </div>
              <div>
                {stats.recentUploads.length === 0 ? (
                  <div style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    color: theme.colors.text.muted,
                    fontSize: '13px'
                  }}>
                    No uploads yet
                  </div>
                ) : (
                  stats.recentUploads.map((file, index) => (
                    <div
                      key={file.id}
                      style={{
                        padding: '16px 24px',
                        borderBottom: index < stats.recentUploads.length - 1 ? `1px solid ${theme.colors.border.light}` : 'none'
                      }}
                    >
                      <div style={{
                        fontSize: '13px',
                        color: theme.colors.text.primary,
                        fontWeight: theme.weight.medium,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.fileName}
                      </div>
                      <div style={{
                        fontSize: '12px',
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
