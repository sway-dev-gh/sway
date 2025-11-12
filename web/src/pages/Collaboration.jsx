import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Collaboration = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // active, all, reviewing

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredProjects = () => {
    if (filter === 'active') {
      return projects.filter(p => p.status === 'under_review' || p.status === 'draft')
    }
    if (filter === 'reviewing') {
      return projects.filter(p => p.pending_approvals > 0)
    }
    return projects
  }

  const openProjectWorkspace = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const getStatusColor = (status) => {
    const statusMap = {
      'draft': '#ffffff',
      'under_review': '#ffffff',
      'changes_requested': '#ff6b6b',
      'approved': '#51cf66',
      'delivered': '#4c6ef5'
    }
    return statusMap[status] || '#ffffff'
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
            <div>Loading collaboration workspace...</div>
          </div>
        </div>
      </>
    )
  }

  const filteredProjects = getFilteredProjects()

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
            marginBottom: '48px'
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 8px 0'
            }}>
              Collaboration Workspace
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#ffffff',
              margin: '0'
            }}>
              Active projects and review collaborations
            </p>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #ffffff',
            marginBottom: '32px'
          }}>
            {[
              { key: 'active', label: 'Active Projects' },
              { key: 'reviewing', label: 'Need Review' },
              { key: 'all', label: 'All Projects' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  background: 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  borderBottom: filter === tab.key ? '2px solid #ffffff' : '2px solid transparent',
                  padding: '16px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Projects List */}
          {filteredProjects.length > 0 ? (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => openProjectWorkspace(project.id)}
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
                    alignItems: 'flex-start',
                    gap: '24px'
                  }}>
                    <div style={{ flex: 1 }}>
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
                        margin: '0 0 16px 0',
                        lineHeight: '1.5'
                      }}>
                        {project.description || 'No description'}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        fontSize: '12px',
                        color: '#ffffff'
                      }}>
                        <div>Files: {project.file_count || 0}</div>
                        <div>Reviews: {project.review_count || 0}</div>
                        <div>Collaborators: {project.collaborator_count || 1}</div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '8px'
                    }}>
                      <div style={{
                        padding: '6px 12px',
                        background: getStatusColor(project.status),
                        color: '#000000',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'uppercase'
                      }}>
                        {project.status?.replace('_', ' ') || 'Draft'}
                      </div>

                      {project.pending_approvals > 0 && (
                        <div style={{
                          fontSize: '12px',
                          color: '#ffffff'
                        }}>
                          {project.pending_approvals} pending approvals
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#000000',
              border: '1px solid #ffffff',
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
                {filter === 'active' ? 'No active collaborations' :
                 filter === 'reviewing' ? 'No pending reviews' : 'No projects yet'}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#ffffff',
                margin: '0 0 20px 0'
              }}>
                {filter === 'active' ? 'Start collaborating by creating a project' :
                 filter === 'reviewing' ? 'All reviews are up to date' :
                 'Create your first project to start collaborating'}
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
                Go to Projects
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Collaboration