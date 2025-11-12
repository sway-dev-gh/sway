import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { standardStyles, getFilterButtonStyle, getPrimaryButtonHover } from '../components/StandardStyles'

/**
 * Review Workflows Page
 *
 * Central hub for managing all review and approval workflows.
 * Upload drafts, collect feedback, track approvals, and manage versions.
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

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 5000)
      )

      const apiPromise = api.get('/api/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      const { data } = await Promise.race([apiPromise, timeoutPromise])
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([]) // This will make the page render with empty state
    } finally {
      setLoading(false) // CRITICAL: Always set loading to false
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
    // Clean white/black aesthetic - no colors
    return 'rgba(255, 255, 255, 0.7)'
  }

  const getPriorityColor = (priority) => {
    // Clean white/black aesthetic - no colors
    return 'rgba(255, 255, 255, 0.5)'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getReviewStats = () => {
    const stats = {
      total: projects.length,
      pending: projects.filter(p => p.status === 'review').length,
      approved: projects.filter(p => p.status === 'completed').length,
      needsChanges: projects.filter(p => p.status === 'active').length,
      avgReviewTime: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.reviewDays || 2), 0) / projects.length) : 0,
      totalFeedback: projects.reduce((sum, p) => sum + (p.commentCount || 0), 0)
    }
    return stats
  }

  const stats = getReviewStats()

  if (loading) {
    return (
      <>
        <Sidebar />
        <div style={{ padding: '80px 60px', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '48px'
          }}>
            <div>
              <div style={{
                height: '36px',
                width: '120px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                marginBottom: '12px'
              }}></div>
              <div style={{
                height: '20px',
                width: '300px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          {/* Skeleton for stats cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '32px',
                height: '140px'
              }}>
                <div style={{
                  height: '16px',
                  width: '100px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  marginBottom: '16px'
                }}></div>
                <div style={{
                  height: '32px',
                  width: '60px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}></div>
              </div>
            ))}
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

          {/* Welcome Header */}
          <div style={{
            marginBottom: '48px',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto 48px'
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              margin: '0 0 16px 0',
              letterSpacing: '-0.01em'
            }}>
              Review Workflows
            </h1>
            <p style={{
              fontSize: '18px',
              color: theme.colors.text.secondary,
              margin: '0 0 32px 0',
              lineHeight: '1.6'
            }}>
              Get feedback on your work from clients, colleagues, and stakeholders
            </p>

            {/* Quick Start Guide */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'left',
              marginBottom: '32px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                margin: '0 0 16px 0'
              }}>
                How it works:
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: theme.colors.text.primary,
                    color: theme.colors.bg.page,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Upload your draft
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Documents, designs, videos, anything
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: theme.colors.text.primary,
                    color: theme.colors.bg.page,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Add reviewers
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Invite people to give feedback
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: theme.colors.text.primary,
                    color: theme.colors.bg.page,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    3
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Get feedback
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Collect comments and approvals
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCreateProject(true)}
              style={{
                background: theme.colors.text.primary,
                color: theme.colors.bg.page,
                padding: '16px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Start Your First Review
            </button>
          </div>

          {/* Progress Overview */}
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
              Review Progress Overview
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
                  Total Reviews
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  {stats.total}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  All time
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
                  Pending Review
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#f59e0b',
                  marginBottom: '8px'
                }}>
                  {stats.pending}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  Awaiting feedback
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
                  Approved
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '8px'
                }}>
                  {stats.approved}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  Ready to ship
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
                  Avg Review Time
                </div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  {stats.avgReviewTime}d
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  Response time
                </div>
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
            {['all', 'active', 'review', 'completed'].map(status => {
              const statusLabels = {
                all: 'All',
                active: 'Needs Changes',
                review: 'Pending Review',
                completed: 'Approved'
              }
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={getFilterButtonStyle(filter === status)}
                >
                  {statusLabels[status]}
                </button>
              )
            })}
          </div>

          <input
            type="text"
            placeholder="Search reviews or reviewers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={standardStyles.searchInput}
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
              fontSize: '18px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '12px'
            }}>
              {searchTerm || filter !== 'all' ? 'No reviews found' : 'No reviews yet'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.tertiary,
              marginBottom: '32px'
            }}>
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first file to start collecting feedback'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <button
                onClick={() => setShowCreateProject(true)}
                style={{
                  background: 'transparent',
                  color: theme.colors.text.primary,
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border.light}`,
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer'
                }}
              >
                Upload for Review
              </button>
            )}
          </div>
        )}
      </div>
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
              Create New Review
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              const title = formData.get('title')
              const description = formData.get('description')

              try {
                const token = localStorage.getItem('token')
                const { data } = await api.post('/api/projects', {
                  title,
                  description,
                  type: 'review',
                  status: 'active',
                  priority: 'medium'
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                })

                fetchProjects()
                setShowCreateProject(false)
                toast.success('Review created successfully!')
              } catch (error) {
                console.error('Failed to create review:', error)
                toast.error('Failed to create review')
              }
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  Review Title *
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Enter review title..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe what needs to be reviewed..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: theme.colors.bg.secondary,
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '6px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  style={{
                    background: 'transparent',
                    color: theme.colors.text.secondary,
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border.medium}`,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'transparent',
                    color: theme.colors.text.primary,
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.colors.border.light}`,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.weight.semibold,
                    cursor: 'pointer'
                  }}
                >
                  Create Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Projects