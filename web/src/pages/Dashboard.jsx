import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Dashboard = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeReviews: 0,
    pendingApprovals: 0,
    completedProjects: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch projects
      const projectsRes = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        const projectsList = projectsData.projects || []
        setProjects(projectsList)

        // Calculate stats
        setStats({
          totalProjects: projectsList.length,
          activeReviews: projectsList.filter(p => p.status === 'under_review').length,
          pendingApprovals: projectsList.filter(p => p.pending_approvals > 0).length,
          completedProjects: projectsList.filter(p => p.status === 'approved' || p.status === 'delivered').length
        })
      }

      // Fetch recent activity
      const activityRes = await fetch('/api/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData.activity || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const statusMap = {
      'draft': '#666666',
      'under_review': '#ffffff',
      'changes_requested': '#ff6b6b',
      'approved': '#51cf66',
      'delivered': '#4c6ef5'
    }
    return statusMap[status] || '#666666'
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'draft': 'Draft',
      'under_review': 'Under Review',
      'changes_requested': 'Changes Requested',
      'approved': 'Approved',
      'delivered': 'Delivered'
    }
    return statusMap[status] || 'Draft'
  }

  const getActivityIcon = (type) => {
    const iconMap = {
      'project_created': '📁',
      'file_uploaded': '📄',
      'comment_added': '💬',
      'section_approved': '✅',
      'changes_requested': '❌',
      'project_completed': '🎉'
    }
    return iconMap[type] || '•'
  }

  if (loading) {
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
            padding: '48px 32px'
          }}>
            Loading dashboard...
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
        background: '#000000',
        color: '#ffffff',
        paddingTop: '68px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '48px'
          }}>
            <div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 8px 0'
              }}>
                Review Dashboard
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#a3a3a3',
                margin: '0'
              }}>
                Manage your creative and code review projects
              </p>
            </div>
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              View All Projects
            </button>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Total Projects
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {stats.totalProjects}
              </div>
            </div>

            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Active Reviews
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {stats.activeReviews}
              </div>
            </div>

            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Pending Approvals
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {stats.pendingApprovals}
              </div>
            </div>

            <div style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#a3a3a3',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Completed Projects
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {stats.completedProjects}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '32px'
          }}>

            {/* Recent Projects */}
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 24px 0'
              }}>
                Recent Projects
              </h2>

              {projects.length > 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {projects.slice(0, 5).map(project => (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      style={{
                        background: '#1a1a1a',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        padding: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#666666'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#333333'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#ffffff',
                            margin: '0 0 8px 0'
                          }}>
                            {project.title}
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            color: '#a3a3a3',
                            margin: '0 0 12px 0',
                            lineHeight: '1.4'
                          }}>
                            {project.description || 'No description'}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '12px',
                            color: '#a3a3a3'
                          }}>
                            <div>Files: {project.file_count || 0}</div>
                            <div>Type: {project.type}</div>
                          </div>
                        </div>
                        <div style={{
                          padding: '4px 8px',
                          background: getStatusColor(project.status),
                          color: '#000000',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          {getStatusLabel(project.status)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {projects.length > 5 && (
                    <button
                      onClick={() => navigate('/projects')}
                      style={{
                        background: 'transparent',
                        color: '#a3a3a3',
                        border: '1px solid #333333',
                        borderRadius: '8px',
                        padding: '16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      View All {projects.length} Projects →
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#ffffff',
                    margin: '0 0 8px 0'
                  }}>
                    No projects yet
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#a3a3a3',
                    margin: '0 0 20px 0'
                  }}>
                    Create your first review project to get started
                  </p>
                  <button
                    onClick={() => navigate('/projects')}
                    style={{
                      background: '#ffffff',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Create Project
                  </button>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 24px 0'
              }}>
                Recent Activity
              </h2>

              <div style={{
                background: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '20px'
              }}>
                {recentActivity.length > 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {recentActivity.slice(0, 8).map((activity, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '8px 0'
                        }}
                      >
                        <div style={{
                          fontSize: '14px',
                          minWidth: '20px'
                        }}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            color: '#ffffff',
                            lineHeight: '1.4',
                            marginBottom: '2px'
                          }}>
                            {activity.description}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#a3a3a3'
                          }}>
                            {new Date(activity.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#a3a3a3',
                    fontSize: '14px',
                    padding: '20px'
                  }}>
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            marginTop: '48px'
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <button
                onClick={() => navigate('/projects')}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '20px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#666666'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#333333'
                }}
              >
                <div style={{ marginBottom: '8px', fontSize: '16px' }}>📁</div>
                <div style={{ marginBottom: '4px', fontWeight: '600' }}>Create New Project</div>
                <div style={{ color: '#a3a3a3', fontSize: '12px' }}>Start a new review project</div>
              </button>

              <button
                onClick={() => navigate('/projects')}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '20px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#666666'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#333333'
                }}
              >
                <div style={{ marginBottom: '8px', fontSize: '16px' }}>👥</div>
                <div style={{ marginBottom: '4px', fontWeight: '600' }}>Manage Collaborators</div>
                <div style={{ color: '#a3a3a3', fontSize: '12px' }}>Invite reviewers to projects</div>
              </button>

              <button
                onClick={() => navigate('/settings')}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  padding: '20px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#666666'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#333333'
                }}
              >
                <div style={{ marginBottom: '8px', fontSize: '16px' }}>⚙️</div>
                <div style={{ marginBottom: '4px', fontWeight: '600' }}>Account Settings</div>
                <div style={{ color: '#a3a3a3', fontSize: '12px' }}>Manage your account</div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

export default Dashboard