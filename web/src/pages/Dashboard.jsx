import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Dashboard = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeReviews: 0,
    pendingApprovals: 0,
    completedProjects: 0
  })

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
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          color: '#ffffff',
          paddingTop: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '500'
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
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 24px'
        }}>

          {/* Header Section */}
          <div style={{
            marginBottom: '60px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 16px 0',
              letterSpacing: '-0.02em'
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: '20px',
              color: '#ffffff',
              margin: '0',
              fontWeight: '400'
            }}>
              Manage your review projects and track progress
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            marginBottom: '80px'
          }}>
            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Total Projects
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {stats.totalProjects}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Active Reviews
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {stats.activeReviews}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Pending Approvals
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {stats.pendingApprovals}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#ffffff',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.1em',
                marginBottom: '16px'
              }}>
                Completed Projects
              </div>
              <div style={{
                fontSize: '56px',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1'
              }}>
                {stats.completedProjects}
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '60px'
          }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '40px 32px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                Manage Projects
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.8 }}>
                View all projects and create new ones
              </div>
            </button>

            <button
              onClick={() => navigate('/uploads')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '40px 32px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                File Management
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.8 }}>
                Review and organize uploaded files
              </div>
            </button>

            <button
              onClick={() => navigate('/settings')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '40px 32px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '800' }}>
                Account Settings
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', opacity: 0.8 }}>
                Manage your account preferences
              </div>
            </button>
          </div>

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div style={{
              marginBottom: '40px'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff',
                margin: '0 0 32px 0',
                textAlign: 'center'
              }}>
                Recent Projects
              </h2>

              <div style={{
                display: 'grid',
                gap: '16px'
              }}>
                {projects.slice(0, 3).map(project => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{
                      background: '#000000',
                      border: '1px solid #ffffff',
                      borderRadius: '8px',
                      padding: '24px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: '#ffffff',
                          margin: '0 0 8px 0'
                        }}>
                          {project.title}
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#ffffff',
                          margin: '0',
                          opacity: 0.8
                        }}>
                          {project.description || 'No description'}
                        </p>
                      </div>
                      <div style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        color: '#000000',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {project.status?.replace('_', ' ') || 'Draft'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {projects.length > 3 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '24px'
                }}>
                  <button
                    onClick={() => navigate('/projects')}
                    style={{
                      background: 'transparent',
                      color: '#ffffff',
                      border: '1px solid #ffffff',
                      borderRadius: '4px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    View All {projects.length} Projects
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Dashboard