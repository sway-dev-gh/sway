import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import theme from '../theme'
import api from '../api/axios'
import { getStorageLimit, getEffectivePlan } from '../utils/planUtils'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)
  const [workspaces, setWorkspaces] = useState([
    { id: 1, name: 'Design Team', members: 8, files: 24, active: true, color: '#3b82f6' },
    { id: 2, name: 'Marketing', members: 5, files: 12, active: true, color: '#10b981' },
    { id: 3, name: 'Client Projects', members: 3, files: 8, active: false, color: '#f59e0b' }
  ])
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
        background: '#ffffff'
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

  // If no workspace is selected, show workspace selector
  if (!selectedWorkspace) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        color: '#334155',
        padding: '0'
      }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '80px 40px 120px'
          }}>
            {/* Workspace Gateway Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '64px'
            }}>
              <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                margin: '0 0 16px 0',
                color: '#334155',
                letterSpacing: '-0.02em'
              }}>
                Choose your workspace
              </h1>
              <p style={{
                fontSize: '18px',
                color: '#a3a3a3',
                margin: '0 0 48px 0',
                maxWidth: '600px',
                marginLeft: 'auto',
                marginRight: 'auto',
                lineHeight: '1.6'
              }}>
                Select a workspace to collaborate with your team, share files, and manage projects together
              </p>
            </div>

            {/* Workspace Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '48px'
            }}>
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  onClick={() => setSelectedWorkspace(workspace)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '32px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.borderColor = workspace.color
                    e.currentTarget.style.boxShadow = `0 8px 32px ${workspace.color}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)'
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Status Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: workspace.active ? '#10b981' : '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: workspace.active ? '#10b981' : '#6b7280'
                    }} />
                    {workspace.active ? 'Active' : 'Inactive'}
                  </div>

                  {/* Workspace Icon */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: `${workspace.color}20`,
                    border: `1px solid ${workspace.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    fontSize: '24px'
                  }}>
                    🏢
                  </div>

                  {/* Workspace Info */}
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: '#334155',
                    margin: '0 0 8px 0'
                  }}>
                    {workspace.name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#a3a3a3',
                    margin: '0 0 24px 0',
                    lineHeight: '1.5'
                  }}>
                    Collaborate with your team on shared projects and file reviews
                  </p>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    marginBottom: '24px'
                  }}>
                    <div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#334155',
                        marginBottom: '4px'
                      }}>
                        {workspace.members}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#a3a3a3',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Members
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#334155',
                        marginBottom: '4px'
                      }}>
                        {workspace.files}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#a3a3a3',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Files
                      </div>
                    </div>
                  </div>

                  {/* Enter Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: workspace.color
                    }}>
                      Enter workspace →
                    </span>
                  </div>
                </div>
              ))}

              {/* Create New Workspace Card */}
              <div style={{
                background: '#ffffff',
                border: '2px dashed #e2e8f0',
                borderRadius: '16px',
                padding: '32px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                minHeight: '300px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.background = '#3b82f610'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.background = '#ffffff'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  fontSize: '24px'
                }}>
                  ➕
                </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0 0 8px 0'
                }}>
                  Create New Workspace
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#a3a3a3',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  Start fresh with a new collaborative workspace
                </p>
              </div>
            </div>

            {/* Recent Activity Preview */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#334155',
                margin: '0 0 16px 0'
              }}>
                Quick Overview
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '24px',
                marginTop: '24px'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    {workspaces.reduce((sum, w) => sum + w.members, 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Members
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    {workspaces.filter(w => w.active).length}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Active Workspaces
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    {workspaces.reduce((sum, w) => sum + w.files, 0)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Shared Files
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    )
  }

  // Workspace-specific dashboard
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      color: '#1e293b',
      padding: '0'
    }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 40px 120px'
        }}>
          {/* Workspace Header */}
          <div style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setSelectedWorkspace(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  color: '#a3a3a3',
                  padding: '8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ←
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: `${selectedWorkspace.color}20`,
                    border: `1px solid ${selectedWorkspace.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    🏢
                  </div>
                  <h1 style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    margin: '0',
                    color: '#334155',
                    letterSpacing: '-0.01em'
                  }}>
                    {selectedWorkspace.name}
                  </h1>
                </div>
                <p style={{
                  fontSize: '16px',
                  color: '#a3a3a3',
                  margin: 0,
                  fontWeight: '400'
                }}>
                  {selectedWorkspace.members} members • {selectedWorkspace.files} shared files
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button style={{
                background: 'transparent',
                border: '1px solid #e2e8f0',
                color: '#334155',
                padding: '12px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                + Invite Member
              </button>
              <Link to="/requests" style={{
                background: selectedWorkspace.color,
                color: '#334155',
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
                + New Project
              </Link>
            </div>
          </div>

          {/* Integrated Navigation Within Workspace */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '8px',
            marginBottom: '32px',
            display: 'flex',
            gap: '4px',
            overflowX: 'auto'
          }}>
            <Link to="/projects" style={{
              padding: '12px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#334155',
              background: selectedWorkspace.color,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}>
              🚀 Projects
            </Link>
            <Link to="/collaboration" style={{
              padding: '12px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#334155',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              ✅ Reviews
            </Link>
            <Link to="/uploads" style={{
              padding: '12px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#334155',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              📁 Files
            </Link>
            <Link to="/clients" style={{
              padding: '12px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#334155',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              👥 Team
            </Link>
            <Link to="/notifications" style={{
              padding: '12px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#334155',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              🔔 Activity
            </Link>
            <Link to="/settings" style={{
              padding: '12px 20px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              color: '#334155',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              ⚙️ Settings
            </Link>
          </div>

          {/* Workspace Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '48px'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
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
                  background: `${selectedWorkspace.color}20`,
                  border: `1px solid ${selectedWorkspace.color}40`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  👥
                </div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0'
                }}>
                  Team Members
                </h3>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#334155',
                marginBottom: '4px'
              }}>
                {selectedWorkspace.members}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3'
              }}>
                All active
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
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
                  background: `${selectedWorkspace.color}20`,
                  border: `1px solid ${selectedWorkspace.color}40`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  📁
                </div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0'
                }}>
                  Shared Files
                </h3>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#334155',
                marginBottom: '4px'
              }}>
                {selectedWorkspace.files}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3'
              }}>
                12 this week
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
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
                  background: `${selectedWorkspace.color}20`,
                  border: `1px solid ${selectedWorkspace.color}40`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  ✅
                </div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0'
                }}>
                  Reviews
                </h3>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#334155',
                marginBottom: '4px'
              }}>
                8
              </div>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3'
              }}>
                3 pending
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
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
                  background: `${selectedWorkspace.color}20`,
                  border: `1px solid ${selectedWorkspace.color}40`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  🚀
                </div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0'
                }}>
                  Projects
                </h3>
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#334155',
                marginBottom: '4px'
              }}>
                5
              </div>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3'
              }}>
                2 in progress
              </div>
            </div>
          </div>

          {/* Workspace Hub */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px',
            marginBottom: '48px'
          }}>
            {/* Main Workspace Content */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '32px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#334155',
                margin: '0 0 24px 0'
              }}>
                Workspace Activity
              </h2>

              {/* Quick Actions Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <button style={{
                  background: selectedWorkspace.color,
                  color: '#334155',
                  border: 'none',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  📄 New Project
                </button>
                <button style={{
                  background: 'transparent',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  📁 Share Files
                </button>
                <button style={{
                  background: 'transparent',
                  color: '#334155',
                  border: '1px solid #e2e8f0',
                  padding: '16px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  ✅ Review
                </button>
              </div>

              {/* Recent Files */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0 0 16px 0'
                }}>
                  Recent Files
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {[
                    { name: 'Brand Guidelines v2.pdf', user: 'Sarah Chen', time: '2h ago', type: 'pdf' },
                    { name: 'Marketing Assets.zip', user: 'Mike Torres', time: '4h ago', type: 'zip' },
                    { name: 'Logo Concept 3.ai', user: 'Alex Kim', time: '1d ago', type: 'ai' },
                    { name: 'Project Timeline.xlsx', user: 'Emma Wilson', time: '2d ago', type: 'excel' }
                  ].map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        📄
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          color: '#334155',
                          fontWeight: '500',
                          marginBottom: '2px'
                        }}>
                          {file.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#a3a3a3'
                        }}>
                          {file.user} • {file.time}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#a3a3a3',
                        padding: '2px 6px',
                        background: '#e2e8f0',
                        borderRadius: '3px'
                      }}>
                        {file.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Sidebar */}
            <div>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#334155',
                    margin: '0'
                  }}>
                    Team Members
                  </h3>
                  <span style={{
                    fontSize: '12px',
                    color: '#a3a3a3',
                    padding: '2px 6px',
                    background: '#e2e8f0',
                    borderRadius: '3px'
                  }}>
                    {selectedWorkspace.members}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {[
                    { name: 'Sarah Chen', role: 'Design Lead', avatar: 'S', online: true },
                    { name: 'Mike Torres', role: 'Developer', avatar: 'M', online: true },
                    { name: 'Alex Kim', role: 'Designer', avatar: 'A', online: false },
                    { name: 'Emma Wilson', role: 'PM', avatar: 'E', online: true },
                    { name: 'Tom Davis', role: 'Developer', avatar: 'T', online: false }
                  ].map((member, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        position: 'relative',
                        width: '32px',
                        height: '32px',
                        background: selectedWorkspace.color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#334155'
                      }}>
                        {member.avatar}
                        {member.online && (
                          <div style={{
                            position: 'absolute',
                            bottom: '-1px',
                            right: '-1px',
                            width: '10px',
                            height: '10px',
                            background: '#10b981',
                            border: '2px solid #ffffff',
                            borderRadius: '50%'
                          }} />
                        )}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          color: '#334155',
                          fontWeight: '500'
                        }}>
                          {member.name}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#a3a3a3'
                        }}>
                          {member.role}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workspace Notifications */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#334155',
                  margin: '0 0 16px 0'
                }}>
                  Updates
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {[
                    { text: 'New review submitted by Sarah', time: '5m ago', type: 'review' },
                    { text: '3 files shared by Mike', time: '1h ago', type: 'files' },
                    { text: 'Project deadline tomorrow', time: '2h ago', type: 'alert' }
                  ].map((notification, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '8px',
                      background: '#f8fafc',
                      borderRadius: '4px'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: notification.type === 'alert' ? '#f59e0b' :
                                   notification.type === 'review' ? '#10b981' : selectedWorkspace.color,
                        marginTop: '6px',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{
                          fontSize: '12px',
                          color: '#334155',
                          lineHeight: '1.4'
                        }}>
                          {notification.text}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: '#a3a3a3',
                          marginTop: '2px'
                        }}>
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
  )
}

export default Dashboard
