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

          {/* Terminal Header */}
          <div className="terminal-window" style={{ marginBottom: '32px' }}>
            <div className="terminal-titlebar">
              > WORKSPACE_STATUS
            </div>
            <div style={{ padding: '16px' }}>
              <div className="terminal-prompt" style={{
                fontSize: '18px',
                marginBottom: '8px'
              }}>
                SWAYFILES_DASHBOARD
              </div>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                opacity: 0.7,
                fontFamily: 'Monaco, monospace'
              }}>
                // Review and collaboration management system
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="terminal-window" style={{ marginBottom: '32px' }}>
            <div className="terminal-titlebar">
              > SYSTEM_MONITOR
            </div>
            <div className="terminal-grid" style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1px'
            }}>
              <div className="system-stat">
                <div className="stat-label">TOTAL_PROJECTS</div>
                <div className="stat-value">{stats.totalProjects}</div>
              </div>
              <div className="system-stat">
                <div className="stat-label">ACTIVE_REVIEWS</div>
                <div className="stat-value">{stats.activeReviews}</div>
              </div>
              <div className="system-stat">
                <div className="stat-label">PENDING_APPROVALS</div>
                <div className="stat-value">{stats.pendingApprovals}</div>
              </div>
              <div className="system-stat">
                <div className="stat-label">COMPLETED_PROJECTS</div>
                <div className="stat-value">{stats.completedProjects}</div>
              </div>
            </div>
          </div>

          {/* Command Actions */}
          <div className="terminal-window" style={{ marginBottom: '32px' }}>
            <div className="terminal-titlebar">
              > QUICK_COMMANDS
            </div>
            <div style={{
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <button
                className="cmd-button"
                onClick={() => navigate('/projects')}
                style={{ textAlign: 'left', padding: '12px 16px' }}
              >
                $ PROJECTS --LIST
              </button>
              <button
                className="cmd-button"
                onClick={() => navigate('/collaboration')}
                style={{ textAlign: 'left', padding: '12px 16px' }}
              >
                $ COLLAB --INIT
              </button>
              <button
                className="cmd-button"
                onClick={() => navigate('/uploads')}
                style={{ textAlign: 'left', padding: '12px 16px' }}
              >
                $ FILES --MANAGE
              </button>
              <button
                className="cmd-button"
                onClick={() => navigate('/settings')}
                style={{ textAlign: 'left', padding: '12px 16px' }}
              >
                $ CONFIG --EDIT
              </button>
            </div>
          </div>

          {/* Repository Listing */}
          {projects.length > 0 && (
            <div className="terminal-window">
              <div className="terminal-titlebar">
                > REPOSITORIES
              </div>
              <div style={{ padding: '0' }}>
                {projects.slice(0, 3).map((project, index) => (
                  <div
                    key={project.id}
                    className="repo-card"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{
                      borderTop: index === 0 ? 'none' : '1px solid #ffffff',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderRadius: '0',
                      margin: '0'
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
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                          marginBottom: '4px',
                          fontFamily: 'Monaco, monospace'
                        }}>
                          {project.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#ffffff',
                          opacity: 0.7,
                          marginBottom: '8px',
                          fontFamily: 'Monaco, monospace'
                        }}>
                          {project.description || 'No description available'}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: '#ffffff',
                          opacity: 0.5,
                          textTransform: 'uppercase',
                          fontFamily: 'Monaco, monospace'
                        }}>
                          TYPE: {project.type} | STATUS: {project.status?.replace('_', '-') || 'draft'}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#ffffff',
                        opacity: 0.7,
                        fontFamily: 'Monaco, monospace'
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
                      className="cmd-button"
                      onClick={() => navigate('/projects')}
                    >
                      $ LIST --ALL ({projects.length} REPOS)
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