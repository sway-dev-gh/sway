import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import theme from '../theme'
import api from '../api/axios'

/**
 * Projects Management Page
 *
 * Business owner interface for managing all client projects.
 * Replaces traditional "requests" with full project workspaces.
 */
function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/api/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesFilter = filter === 'all' || project.status === filter
    const matchesSearch = searchTerm === '' ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.white
      case 'completed': return '#a3a3a3'
      case 'review': return '#a3a3a3'
      case 'cancelled': return '#525252'
      default: return theme.colors.text.secondary
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#525252'
      case 'high': return '#808080'
      case 'medium': return '#a3a3a3'
      case 'low': return theme.colors.text.secondary
      default: return theme.colors.text.secondary
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProjectStats = () => {
    const stats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      review: projects.filter(p => p.status === 'review').length,
      totalValue: projects.reduce((sum, p) => sum + (p.quotedAmount || 0), 0),
      activeValue: projects.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.quotedAmount || 0), 0)
    }
    return stats
  }

  const stats = getProjectStats()

  if (loading) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: theme.colors.text.secondary
        }}>
          Loading your projects...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '48px 60px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '48px'
        }}>
          <div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '800',
              color: theme.colors.text.primary,
              letterSpacing: '-2px',
              marginBottom: '8px'
            }}>
              Projects
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              fontWeight: '500'
            }}>
              Manage all client projects and workspaces
            </p>
          </div>
          <button
            onClick={() => setShowCreateProject(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: theme.colors.white,
              padding: '14px 28px',
              borderRadius: '100px',
              fontWeight: '700',
              fontSize: '15px',
              letterSpacing: '-0.3px',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              border: '1px solid #525252',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)'
              e.target.style.background = 'rgba(255, 255, 255, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
          >
            + Create Project
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Total Projects
            </div>
            <div style={{
              color: theme.colors.text.primary,
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {stats.total}
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Active Projects
            </div>
            <div style={{
              color: theme.colors.white,
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {stats.active}
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Total Value
            </div>
            <div style={{
              color: theme.colors.text.primary,
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {formatCurrency(stats.totalValue)}
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.xs,
              fontWeight: theme.weight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Active Value
            </div>
            <div style={{
              color: theme.colors.white,
              fontSize: '32px',
              fontWeight: theme.weight.bold
            }}>
              {formatCurrency(stats.activeValue)}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'active', 'review', 'completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: filter === status ? theme.colors.white : 'rgba(255, 255, 255, 0.08)',
                  color: filter === status ? theme.colors.black : theme.colors.text.secondary,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 200ms'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search projects or clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 16px',
              background: theme.colors.bg.hover,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '8px',
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.sm,
              width: '300px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Projects List */}
        {filteredProjects.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredProjects.map(project => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                style={{
                  display: 'block',
                  background: theme.colors.bg.hover,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '16px',
                  padding: '24px',
                  textDecoration: 'none',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.colors.bg.secondary
                  e.target.style.borderColor = theme.colors.border.medium
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = theme.colors.bg.hover
                  e.target.style.borderColor = theme.colors.border.light
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto auto',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  {/* Project Info */}
                  <div>
                    <h3 style={{
                      color: theme.colors.text.primary,
                      fontSize: theme.fontSize.base,
                      fontWeight: theme.weight.semibold,
                      marginBottom: '4px'
                    }}>
                      {project.title}
                    </h3>
                    <p style={{
                      color: theme.colors.text.secondary,
                      fontSize: theme.fontSize.sm,
                      marginBottom: '8px'
                    }}>
                      {project.client?.name || 'No client assigned'}
                    </p>
                    <div style={{
                      color: theme.colors.text.tertiary,
                      fontSize: theme.fontSize.xs
                    }}>
                      {project.type} • Due {new Date(project.dueDate).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Priority */}
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '100px',
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.weight.semibold,
                    textTransform: 'uppercase',
                    background: `${getPriorityColor(project.priority)}20`,
                    color: getPriorityColor(project.priority),
                    border: `1px solid ${getPriorityColor(project.priority)}40`
                  }}>
                    {project.priority}
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: '100px',
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    background: `${getStatusColor(project.status)}20`,
                    color: getStatusColor(project.status),
                    border: `1px solid ${getStatusColor(project.status)}40`
                  }}>
                    {project.status}
                  </div>

                  {/* Value */}
                  <div style={{
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.weight.semibold
                  }}>
                    {formatCurrency(project.quotedAmount || 0)}
                  </div>

                  {/* Progress */}
                  <div style={{ width: '120px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        color: theme.colors.text.tertiary,
                        fontSize: theme.fontSize.xs
                      }}>
                        Progress
                      </span>
                      <span style={{
                        color: theme.colors.text.secondary,
                        fontSize: theme.fontSize.xs
                      }}>
                        {project.progress?.overall || 0}%
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '6px',
                      background: theme.colors.border.light,
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${project.progress?.overall || 0}%`,
                        height: '100%',
                        background: getStatusColor(project.status),
                        borderRadius: '3px',
                        transition: 'width 300ms ease-out'
                      }} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '120px 40px',
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '24px'
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '24px',
              opacity: 0.3
            }}>
              ◯
            </div>
            <h3 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: theme.colors.text.primary,
              marginBottom: '12px',
              letterSpacing: '-0.5px'
            }}>
              {searchTerm || filter !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p style={{
              fontSize: '16px',
              color: theme.colors.text.secondary,
              marginBottom: '40px'
            }}>
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first project to start managing client work'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <button
                onClick={() => setShowCreateProject(true)}
                style={{
                  background: theme.colors.white,
                  color: theme.colors.black,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer'
                }}
              >
                Create First Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal (placeholder) */}
      {showCreateProject && (
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
          zIndex: 2000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: theme.colors.bg.page,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '20px',
            padding: '40px',
            width: '600px',
            maxWidth: '90vw'
          }}>
            <h2 style={{
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.xl,
              fontWeight: theme.weight.bold,
              marginBottom: '24px'
            }}>
              Create New Project
            </h2>
            <p style={{
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              marginBottom: '32px'
            }}>
              This feature is coming soon. Projects will integrate with your existing request system.
            </p>
            <button
              onClick={() => setShowCreateProject(false)}
              style={{
                background: theme.colors.white,
                color: theme.colors.black,
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: theme.fontSize.sm,
                fontWeight: theme.weight.medium,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Projects