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

          {/* Clean Header */}
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 8px 0',
              fontFamily: 'Monaco, Menlo, monospace'
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#ffffff',
              margin: '0',
              opacity: 0.8,
              fontFamily: 'Monaco, Menlo, monospace'
            }}>
              Code review and collaboration workspace
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '48px'
          }}>
            <div style={{
              background: '#000000',
              border: '1px solid #ffffff',
              padding: '24px',
              borderRadius: '0'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontFamily: 'Monaco, Menlo, monospace',
                letterSpacing: '1px'
              }}>
                Projects
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: 'Monaco, Menlo, monospace'
              }}>
                {stats.totalProjects}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #ffffff',
              padding: '24px',
              borderRadius: '0'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontFamily: 'Monaco, Menlo, monospace',
                letterSpacing: '1px'
              }}>
                Active Reviews
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: 'Monaco, Menlo, monospace'
              }}>
                {stats.activeReviews}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #ffffff',
              padding: '24px',
              borderRadius: '0'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontFamily: 'Monaco, Menlo, monospace',
                letterSpacing: '1px'
              }}>
                Pending
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: 'Monaco, Menlo, monospace'
              }}>
                {stats.pendingApprovals}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #ffffff',
              padding: '24px',
              borderRadius: '0'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontFamily: 'Monaco, Menlo, monospace',
                letterSpacing: '1px'
              }}>
                Completed
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#ffffff',
                fontFamily: 'Monaco, Menlo, monospace'
              }}>
                {stats.completedProjects}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '48px'
          }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: '#000000',
                border: '1px solid #ffffff',
                borderRadius: '0',
                padding: '32px 24px',
                textAlign: 'left',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'Monaco, Menlo, monospace'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Projects
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.7
              }}>
                View and manage code projects
              </div>
            </button>

            <button
              onClick={() => navigate('/collaboration')}
              style={{
                background: '#000000',
                border: '1px solid #ffffff',
                borderRadius: '0',
                padding: '32px 24px',
                textAlign: 'left',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'Monaco, Menlo, monospace'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Collaboration
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.7
              }}>
                Code reviews and team workspace
              </div>
            </button>

            <button
              onClick={() => navigate('/uploads')}
              style={{
                background: '#000000',
                border: '1px solid #ffffff',
                borderRadius: '0',
                padding: '32px 24px',
                textAlign: 'left',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'Monaco, Menlo, monospace'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Files
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.7
              }}>
                Upload and manage files
              </div>
            </button>

            <button
              onClick={() => navigate('/settings')}
              style={{
                background: '#000000',
                border: '1px solid #ffffff',
                borderRadius: '0',
                padding: '32px 24px',
                textAlign: 'left',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: 'Monaco, Menlo, monospace'
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Settings
              </div>
              <div style={{
                fontSize: '14px',
                opacity: 0.7
              }}>
                Account and preferences
              </div>
            </button>
          </div>

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '16px',
                fontFamily: 'Monaco, Menlo, monospace'
              }}>
                Recent Projects
              </h2>
              <div style={{
                background: '#000000',
                border: '1px solid #ffffff',
                borderRadius: '0'
              }}>
                {projects.slice(0, 3).map((project, index) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{
                      padding: '24px',
                      borderBottom: index < 2 ? '1px solid #ffffff' : 'none',
                      cursor: 'pointer',
                      fontFamily: 'Monaco, Menlo, monospace'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                          marginBottom: '4px'
                        }}>
                          {project.title}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#ffffff',
                          opacity: 0.7,
                          marginBottom: '8px'
                        }}>
                          {project.description || 'No description available'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#ffffff',
                          opacity: 0.5
                        }}>
                          {project.type} • {project.status?.replace('_', ' ') || 'draft'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        opacity: 0.5
                      }}>
                        {new Date(project.created_at || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {projects.length > 3 && (
                  <div style={{
                    padding: '16px',
                    borderTop: '1px solid #ffffff',
                    textAlign: 'center'
                  }}>
                    <button
                      onClick={() => navigate('/projects')}
                      style={{
                        background: 'transparent',
                        border: '1px solid #ffffff',
                        borderRadius: '0',
                        color: '#ffffff',
                        padding: '8px 16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontFamily: 'Monaco, Menlo, monospace'
                      }}
                    >
                      View all {projects.length} projects
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Dashboard