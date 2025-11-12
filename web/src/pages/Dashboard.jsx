import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'
import { standardStyles } from '../components/StandardStyles'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    getProjectStats
  } = useReviewStore()

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'review_submitted', project: 'Brand Guidelines', user: 'Sarah Chen', time: '2 minutes ago' },
    { id: 2, type: 'file_uploaded', project: 'Website Redesign', user: 'Mike Johnson', time: '15 minutes ago' },
    { id: 3, type: 'approval_granted', project: 'Marketing Campaign', user: 'Lisa Wang', time: '1 hour ago' },
    { id: 4, type: 'comment_added', project: 'Product Photos', user: 'John Smith', time: '2 hours ago' }
  ])

  const [quickStats, setQuickStats] = useState({
    activeReviews: 12,
    pendingApprovals: 8,
    completedToday: 15,
    totalProjects: projects.length || 0
  })

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        await fetchProjects()

        // Update stats based on actual projects
        const stats = getProjectStats()
        setQuickStats(prev => ({
          ...prev,
          totalProjects: stats.total,
          activeReviews: stats.active,
          completedToday: stats.completed
        }))
      } catch (error) {
        console.error('Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [fetchProjects, getProjectStats])

  const handleCreateWorkspace = async () => {
    navigate('/projects')
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'review_submitted':
        return '📝'
      case 'file_uploaded':
        return '📄'
      case 'approval_granted':
        return '✅'
      case 'comment_added':
        return '💬'
      default:
        return '📋'
    }
  }

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'review_submitted':
        return `${activity.user} submitted a review for ${activity.project}`
      case 'file_uploaded':
        return `${activity.user} uploaded a file to ${activity.project}`
      case 'approval_granted':
        return `${activity.user} approved sections in ${activity.project}`
      case 'comment_added':
        return `${activity.user} commented on ${activity.project}`
      default:
        return `${activity.user} updated ${activity.project}`
    }
  }

  if (loading || isLoading) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: theme.colors.bg.page,
          color: theme.colors.text.primary,
          paddingTop: '68px'
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '48px 32px'
          }}>
            <div style={{ color: theme.colors.text.secondary }}>
              Loading your review dashboard...
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        color: theme.colors.text.primary,
        paddingTop: '68px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{
            marginBottom: '48px',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto 48px'
          }}>
            <h1 style={standardStyles.pageHeader}>
              Review Dashboard
            </h1>
            <p style={standardStyles.pageDescription}>
              Manage your review workflows, track progress, and collaborate with your team
            </p>
          </div>

          {/* Quick Stats Overview */}
          <div style={{
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '40px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              margin: '0 0 24px 0'
            }}>
              Review Overview
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              <div style={{
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Active Reviews
                </div>
                <div style={standardStyles.statsNumber}>
                  {quickStats.activeReviews}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#10b981'
                }}>
                  +3 since yesterday
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Pending Approvals
                </div>
                <div style={{
                  ...standardStyles.statsNumber,
                  color: '#f59e0b'
                }}>
                  {quickStats.pendingApprovals}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  2 urgent
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Completed Today
                </div>
                <div style={{
                  ...standardStyles.statsNumber,
                  color: '#10b981'
                }}>
                  {quickStats.completedToday}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  Great progress!
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Total Projects
                </div>
                <div style={standardStyles.statsNumber}>
                  {quickStats.totalProjects}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  All workspaces
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '32px'
          }}>
            {/* Quick Actions */}
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '16px'
              }}>
                Quick Actions
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <button
                  onClick={handleCreateWorkspace}
                  style={standardStyles.primaryButton}
                >
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                    Create Review Workspace
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.9 }}>
                    Start a new project with section-based reviews
                  </div>
                </button>

                <Link
                  to="/projects"
                  style={{
                    ...standardStyles.secondaryButton,
                    textDecoration: 'none',
                    display: 'block',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
                    View All Projects
                  </div>
                  <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    Manage your review workflows and track progress
                  </div>
                </Link>
              </div>

              {/* Recent Projects */}
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '16px'
              }}>
                Recent Projects
              </h2>

              {projects.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {projects.slice(0, 3).map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      style={{
                        background: theme.colors.bg.secondary,
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '8px',
                        padding: '16px 20px',
                        color: theme.colors.text.primary,
                        textDecoration: 'none',
                        display: 'block',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.borderColor = theme.colors.border.medium}
                      onMouseLeave={(e) => e.target.style.borderColor = theme.colors.border.light}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '4px'
                          }}>
                            {project.title}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.secondary
                          }}>
                            {project.description || 'No description'}
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: project.status === 'active' ? '#065f46' : '#374151',
                          color: 'white'
                        }}>
                          {project.status || 'Active'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{
                  background: theme.colors.bg.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.3
                  }}>
                    📋
                  </div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    No projects yet
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '24px'
                  }}>
                    Create your first review workspace to get started
                  </div>
                  <button
                    onClick={handleCreateWorkspace}
                    style={standardStyles.primaryButton}
                  >
                    Create First Project
                  </button>
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '16px'
              }}>
                Recent Activity
              </h2>

              <div style={{
                background: theme.colors.bg.secondary,
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                {recentActivity.map((activity, index) => (
                  <div
                    key={activity.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: index < recentActivity.length - 1 ?
                        `1px solid ${theme.colors.border.light}` : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ fontSize: '20px', marginTop: '2px' }}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.primary,
                        marginBottom: '4px'
                      }}>
                        {getActivityText(activity)}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.text.secondary
                      }}>
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{
                  padding: '16px 20px',
                  textAlign: 'center'
                }}>
                  <Link
                    to="/collaboration"
                    style={{
                      color: theme.colors.text.secondary,
                      fontSize: '14px',
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    View all activity →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard