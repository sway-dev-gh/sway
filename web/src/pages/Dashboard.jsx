import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import theme from '../theme'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'

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
      <div style={{
        minHeight: '100vh',
        background: theme.colors.bg.page,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: theme.colors.text.secondary }}>
          Loading your review dashboard...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bg.page,
      color: theme.colors.text.primary
    }}>
      {/* Header */}
      <div style={{
        background: '#000000',
        borderBottom: `1px solid ${theme.colors.border.light}`,
        padding: '32px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: theme.weight.bold,
            color: theme.colors.text.primary,
            margin: '0 0 8px 0'
          }}>
            Review Dashboard
          </h1>
          <p style={{
            fontSize: '16px',
            color: theme.colors.text.secondary,
            margin: 0
          }}>
            Manage your review workflows, track progress, and collaborate with your team
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px'
      }}>
        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: theme.weight.bold,
              color: theme.colors.text.primary,
              marginBottom: '8px'
            }}>
              {quickStats.activeReviews}
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              marginBottom: '4px'
            }}>
              Active Reviews
            </div>
            <div style={{
              fontSize: '12px',
              color: '#10b981'
            }}>
              +3 since yesterday
            </div>
          </div>

          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: theme.weight.bold,
              color: theme.colors.text.primary,
              marginBottom: '8px'
            }}>
              {quickStats.pendingApprovals}
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              marginBottom: '4px'
            }}>
              Pending Approvals
            </div>
            <div style={{
              fontSize: '12px',
              color: '#f59e0b'
            }}>
              2 urgent
            </div>
          </div>

          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: theme.weight.bold,
              color: theme.colors.text.primary,
              marginBottom: '8px'
            }}>
              {quickStats.completedToday}
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              marginBottom: '4px'
            }}>
              Completed Today
            </div>
            <div style={{
              fontSize: '12px',
              color: '#10b981'
            }}>
              Great progress!
            </div>
          </div>

          <div style={{
            background: '#000000',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            padding: '24px'
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: theme.weight.bold,
              color: theme.colors.text.primary,
              marginBottom: '8px'
            }}>
              {quickStats.totalProjects}
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              marginBottom: '4px'
            }}>
              Total Projects
            </div>
            <div style={{
              fontSize: '12px',
              color: theme.colors.text.secondary
            }}>
              All workspaces
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
              fontWeight: theme.weight.semibold,
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
                style={{
                  background: '#1e40af',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#1e3a8a'}
                onMouseLeave={(e) => e.target.style.background = '#1e40af'}
              >
                <div style={{ fontSize: '18px', fontWeight: theme.weight.medium, marginBottom: '4px' }}>
                  Create Review Workspace
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Start a new project with section-based reviews
                </div>
              </button>

              <Link
                to="/projects"
                style={{
                  background: '#000000',
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '8px',
                  padding: '20px',
                  color: theme.colors.text.primary,
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = theme.colors.border.medium}
                onMouseLeave={(e) => e.target.style.borderColor = theme.colors.border.light}
              >
                <div style={{ fontSize: '18px', fontWeight: theme.weight.medium, marginBottom: '4px' }}>
                  View All Projects
                </div>
                <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
                  Manage your review workflows and track progress
                </div>
              </Link>
            </div>

            {/* Recent Projects */}
            <h2 style={{
              fontSize: '20px',
              fontWeight: theme.weight.semibold,
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
                      background: '#000000',
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
                          fontWeight: theme.weight.medium,
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
                        fontWeight: theme.weight.medium,
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
                background: '#000000',
                border: `1px solid ${theme.colors.border.light}`,
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px'
                }}>
                  📋
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: theme.weight.medium,
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
                  style={{
                    background: '#1e40af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#1e3a8a'}
                  onMouseLeave={(e) => e.target.style.background = '#1e40af'}
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
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '16px'
            }}>
              Recent Activity
            </h2>

            <div style={{
              background: '#000000',
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
                    fontWeight: theme.weight.medium
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
  )
}

export default Dashboard