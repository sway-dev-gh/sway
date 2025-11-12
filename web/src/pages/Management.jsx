import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'
import { standardStyles, getFilterButtonStyle } from '../components/StandardStyles'

function Management() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    projects,
    reviews,
    comments,
    isLoading,
    error,
    fetchProjects,
    fetchReviewsByProject,
    updateProjectStatus,
    deleteProject,
    getProjectStats
  } = useReviewStore()

  // Computed analytics
  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalReviews: 0,
    avgReviewTime: 0,
    reviewerActivity: [],
    projectProgress: []
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    loadData()
  }, [navigate])

  const loadData = async () => {
    try {
      setLoading(true)

      await fetchProjects()

      // Calculate analytics
      const stats = getProjectStats()
      const projectReviews = []

      // Gather all reviews across projects
      for (const project of projects) {
        try {
          const projectReviewData = await fetchReviewsByProject(project.id)
          projectReviews.push(...projectReviewData)
        } catch (error) {
          console.error(`Failed to fetch reviews for project ${project.id}:`, error)
        }
      }

      // Calculate analytics
      const totalProjects = projects.length
      const activeProjects = projects.filter(p => p.status === 'active').length
      const completedProjects = projects.filter(p => p.status === 'completed').length
      const totalReviews = projectReviews.length

      // Calculate average review time (mock for now)
      const avgReviewTime = projectReviews.length > 0 ? 2.5 : 0

      // Get reviewer activity (top reviewers)
      const reviewerStats = {}
      projectReviews.forEach(review => {
        const reviewer = review.reviewer_name || 'Unknown'
        reviewerStats[reviewer] = (reviewerStats[reviewer] || 0) + 1
      })

      const reviewerActivity = Object.entries(reviewerStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get project progress
      const projectProgress = projects.map(project => {
        const projectReviewCount = projectReviews.filter(r => r.project_id === project.id).length
        const approvedCount = projectReviews.filter(r =>
          r.project_id === project.id && r.status === 'approved'
        ).length

        return {
          id: project.id,
          title: project.title,
          progress: projectReviewCount > 0 ? (approvedCount / projectReviewCount) * 100 : 0,
          reviews: projectReviewCount,
          status: project.status
        }
      }).slice(0, 10)

      setAnalytics({
        totalProjects,
        activeProjects,
        completedProjects,
        totalReviews,
        avgReviewTime,
        reviewerActivity,
        projectProgress
      })

    } catch (error) {
      console.error('Failed to load review data:', error)
      toast.error('Failed to load review analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectStatusChange = async (projectId, newStatus) => {
    try {
      await updateProjectStatus(projectId, newStatus)
      toast.success(`Project status updated to ${newStatus}`)
      loadData() // Refresh data
    } catch (error) {
      console.error('Failed to update project status:', error)
      toast.error('Failed to update project status')
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all reviews and comments.')) {
      return
    }

    try {
      await deleteProject(projectId)
      toast.success('Project deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast.error('Failed to delete project')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 30) return `${diffInDays} days ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'completed': return '#3b82f6'
      case 'on_hold': return '#f59e0b'
      case 'cancelled': return '#ef4444'
      default: return theme.colors.text.secondary
    }
  }

  // Filter projects
  const filteredProjects = projects
    .filter(project => {
      if (searchQuery && !project.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterStatus !== 'all' && project.status !== filterStatus) {
        return false
      }
      return true
    })

  if (loading || isLoading) {
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
        paddingTop: '54px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '80px 32px'
        }}>

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={standardStyles.pageHeader}>
              Review Management
            </h1>
            <p style={standardStyles.pageDescription}>
              Monitor review workflows, track project progress, and analyze team performance
            </p>
          </div>

          {/* Analytics Dashboard */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Total Projects</div>
              <div style={standardStyles.statsNumber}>{analytics.totalProjects}</div>
              <div style={standardStyles.statsDescription}>All review projects</div>
            </div>

            <div style={{
              padding: '28px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: `1px solid #10b981`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Active Projects</div>
              <div style={{...standardStyles.statsNumber, color: '#10b981'}}>{analytics.activeProjects}</div>
              <div style={standardStyles.statsDescription}>Currently in review</div>
            </div>

            <div style={{
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Total Reviews</div>
              <div style={standardStyles.statsNumber}>{analytics.totalReviews}</div>
              <div style={standardStyles.statsDescription}>Submitted reviews</div>
            </div>

            <div style={{
              padding: '28px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.radius.lg,
              transition: 'all 0.2s ease'
            }}>
              <div style={standardStyles.statsLabel}>Avg Review Time</div>
              <div style={standardStyles.statsNumber}>{analytics.avgReviewTime}</div>
              <div style={standardStyles.statsDescription}>Days to complete</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px 12px 0 0',
            padding: '0 32px',
            display: 'flex',
            gap: '0'
          }}>
            {['overview', 'projects', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === tab ? theme.colors.text.primary : theme.colors.text.secondary,
                  padding: '20px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab ? `2px solid ${theme.colors.text.primary}` : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'projects' && `Projects (${projects.length})`}
                {tab === 'analytics' && 'Analytics'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            minHeight: '500px'
          }}>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div style={{ padding: '32px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 400px',
                  gap: '32px'
                }}>
                  {/* Project Progress */}
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      marginBottom: '24px'
                    }}>
                      Project Progress
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {analytics.projectProgress.slice(0, 5).map(project => (
                        <div
                          key={project.id}
                          style={{
                            padding: '20px',
                            border: `1px solid ${theme.colors.border.light}`,
                            borderRadius: '8px',
                            background: theme.colors.bg.page
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <h4 style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: theme.colors.text.primary,
                              margin: 0
                            }}>
                              {project.title}
                            </h4>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              color: getStatusColor(project.status),
                              textTransform: 'uppercase'
                            }}>
                              {project.status}
                            </span>
                          </div>

                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            marginBottom: '8px'
                          }}>
                            <div style={{
                              width: `${project.progress}%`,
                              height: '100%',
                              background: getStatusColor(project.status),
                              transition: 'width 0.3s ease'
                            }} />
                          </div>

                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.secondary
                          }}>
                            {project.reviews} reviews • {Math.round(project.progress)}% complete
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Reviewers */}
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      marginBottom: '24px'
                    }}>
                      Top Reviewers
                    </h3>

                    <div style={{
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      {analytics.reviewerActivity.length > 0 ? analytics.reviewerActivity.map((reviewer, index) => (
                        <div
                          key={reviewer.name}
                          style={{
                            padding: '16px 20px',
                            borderBottom: index < analytics.reviewerActivity.length - 1 ?
                              `1px solid ${theme.colors.border.light}` : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: theme.colors.text.primary,
                              marginBottom: '2px'
                            }}>
                              {reviewer.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: theme.colors.text.secondary
                            }}>
                              #{index + 1} reviewer
                            </div>
                          </div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: theme.colors.text.primary
                          }}>
                            {reviewer.count}
                          </div>
                        </div>
                      )) : (
                        <div style={{
                          padding: '32px',
                          textAlign: 'center',
                          color: theme.colors.text.secondary
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                          <p>No reviewer activity yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div style={{ padding: '32px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        background: theme.colors.bg.page,
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '6px',
                        color: theme.colors.text.primary,
                        fontSize: '14px',
                        width: '250px'
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['all', 'active', 'completed', 'on_hold'].map(status => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          style={getFilterButtonStyle(filterStatus === status)}
                        >
                          {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Link
                    to="/projects"
                    style={{
                      padding: '8px 16px',
                      background: theme.colors.text.primary,
                      color: theme.colors.bg.page,
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    + New Project
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredProjects.length > 0 ? filteredProjects.map(project => (
                    <div
                      key={project.id}
                      style={{
                        padding: '24px',
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '8px',
                        background: theme.colors.bg.page
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <Link
                            to={`/projects/${project.id}`}
                            style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: theme.colors.text.primary,
                              textDecoration: 'none',
                              marginBottom: '8px',
                              display: 'block'
                            }}
                          >
                            {project.title}
                          </Link>

                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.secondary,
                            marginBottom: '12px'
                          }}>
                            {project.description || 'No description provided'}
                          </div>

                          <div style={{
                            display: 'flex',
                            gap: '24px',
                            fontSize: '12px',
                            color: theme.colors.text.secondary
                          }}>
                            <span>Created {getTimeAgo(project.created_at)}</span>
                            <span>Updated {getTimeAgo(project.updated_at)}</span>
                            <span>{project.collaborator_count || 0} collaborators</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            color: 'white',
                            background: getStatusColor(project.status),
                            textTransform: 'uppercase'
                          }}>
                            {project.status}
                          </span>

                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              color: theme.colors.text.secondary,
                              border: `1px solid ${theme.colors.border.light}`,
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{
                      padding: '48px',
                      textAlign: 'center',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      background: theme.colors.bg.page
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No projects found</h3>
                      <p style={{ color: theme.colors.text.secondary, marginBottom: '24px' }}>
                        {filterStatus === 'all'
                          ? 'Create your first review project to get started'
                          : `No ${filterStatus} projects found`}
                      </p>
                      <Link
                        to="/projects"
                        style={{
                          padding: '12px 24px',
                          background: theme.colors.text.primary,
                          color: theme.colors.bg.page,
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        Create Project
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div style={{ padding: '32px' }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: '24px'
                }}>
                  Review Workflow Analytics
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '32px'
                }}>
                  {/* Workflow Performance */}
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      marginBottom: '16px'
                    }}>
                      Workflow Performance
                    </h3>

                    <div style={{
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      padding: '24px'
                    }}>
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
                            Projects Completed
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>
                            {analytics.completedProjects}/{analytics.totalProjects}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${analytics.totalProjects > 0 ? (analytics.completedProjects / analytics.totalProjects) * 100 : 0}%`,
                            height: '100%',
                            background: '#10b981',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <span style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
                            Active Projects
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>
                            {analytics.activeProjects}/{analytics.totalProjects}
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${analytics.totalProjects > 0 ? (analytics.activeProjects / analytics.totalProjects) * 100 : 0}%`,
                            height: '100%',
                            background: '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.text.secondary,
                        textAlign: 'center',
                        marginTop: '16px'
                      }}>
                        Average review completion: {analytics.avgReviewTime} days
                      </div>
                    </div>
                  </div>

                  {/* Team Activity */}
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      marginBottom: '16px'
                    }}>
                      Team Activity Summary
                    </h3>

                    <div style={{
                      background: theme.colors.bg.page,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      padding: '24px',
                      textAlign: 'center'
                    }}>
                      {analytics.reviewerActivity.length > 0 ? (
                        <>
                          <div style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            color: theme.colors.text.primary,
                            marginBottom: '8px'
                          }}>
                            {analytics.reviewerActivity.length}
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.secondary,
                            marginBottom: '16px'
                          }}>
                            Active reviewers
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.secondary
                          }}>
                            Top contributor: {analytics.reviewerActivity[0]?.name || 'N/A'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            marginBottom: '8px'
                          }}>
                            Analytics Coming Soon
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: theme.colors.text.secondary
                          }}>
                            Start creating reviews to see team activity
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </>
  )
}

export default Management