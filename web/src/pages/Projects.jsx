import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const Projects = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    type: 'creative'
  })

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

  const createProject = async (e) => {
    e.preventDefault()
    if (!newProject.title.trim()) return

    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      })

      if (response.ok) {
        const data = await response.json()
        navigate(`/projects/${data.project.id}`)
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setCreating(false)
    }
  }

  const openProject = (id) => {
    navigate(`/projects/${id}`)
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
            <div>Loading projects...</div>
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
                Review Projects
              </h1>
              <p style={{
                fontSize: '16px',
                color: '#ffffff',
                margin: '0'
              }}>
                Manage creative and code review projects with section-based approvals
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
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
              New Project
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
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
                {projects.length}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Under Review
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {projects.filter(p => p.status === 'under_review').length}
              </div>
            </div>

            <div style={{
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#ffffff',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Approved
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: '#ffffff'
              }}>
                {projects.filter(p => p.status === 'approved').length}
              </div>
            </div>
          </div>

          {/* Projects List */}
          {projects.length > 0 ? (
            <div style={{
              display: 'grid',
              gap: '16px'
            }}>
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => openProject(project.id)}
                  style={{
                    background: '#000000',
                    border: '1px solid #333333',
                    borderRadius: '8px',
                    padding: '24px',
                    cursor: 'pointer',
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
                        <div>
                          Files: {project.file_count || 0}
                        </div>
                        <div>
                          Reviews: {project.review_count || 0}
                        </div>
                        <div>
                          Type: {project.type}
                        </div>
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
                        color: project.status === 'under_review' ? '#000000' : '#000000',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'uppercase'
                      }}>
                        {getStatusLabel(project.status)}
                      </div>

                      {project.completion_percentage !== undefined && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{
                            width: '80px',
                            height: '4px',
                            background: '#ffffff',
                            borderRadius: '2px'
                          }}>
                            <div style={{
                              width: `${project.completion_percentage}%`,
                              height: '100%',
                              background: '#ffffff',
                              borderRadius: '2px'
                            }} />
                          </div>
                          <span style={{
                            fontSize: '12px',
                            color: '#ffffff'
                          }}>
                            {project.completion_percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 40px',
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 8px 0'
              }}>
                No projects yet
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#ffffff',
                margin: '0 0 24px 0'
              }}>
                Create your first review project to get started
              </p>
              <button
                onClick={() => setShowCreate(true)}
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

          {/* Create Modal */}
          {showCreate && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#000000',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '32px',
                width: '500px',
                maxWidth: '90vw'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 24px 0'
                }}>
                  Create Review Project
                </h2>

                <form onSubmit={createProject}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#ffffff',
                      marginBottom: '8px'
                    }}>
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject({
                        ...newProject,
                        title: e.target.value
                      })}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '12px',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}
                      placeholder="Enter project title"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#ffffff',
                      marginBottom: '8px'
                    }}>
                      Description
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({
                        ...newProject,
                        description: e.target.value
                      })}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '12px',
                        color: '#ffffff',
                        fontSize: '14px',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                      placeholder="Describe what will be reviewed"
                    />
                  </div>

                  <div style={{ marginBottom: '32px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#ffffff',
                      marginBottom: '8px'
                    }}>
                      Project Type
                    </label>
                    <select
                      value={newProject.type}
                      onChange={(e) => setNewProject({
                        ...newProject,
                        type: e.target.value
                      })}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '12px',
                        color: '#ffffff',
                        fontSize: '14px'
                      }}
                    >
                      <option value="creative">Creative Project</option>
                      <option value="code">Code Review</option>
                      <option value="document">Document Review</option>
                      <option value="design">Design Review</option>
                    </select>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      style={{
                        background: 'transparent',
                        color: '#ffffff',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !newProject.title.trim()}
                      style={{
                        background: creating || !newProject.title.trim() ? '#ffffff' : '#ffffff',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: creating || !newProject.title.trim() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {creating ? 'Creating...' : 'Create Project'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

export default Projects