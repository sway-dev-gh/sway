import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import ProjectWorkspace from '../components/ProjectWorkspace'
import useReviewStore from '../store/reviewStore'
import theme from '../theme'
import { standardStyles, getFilterButtonStyle } from '../components/StandardStyles'

/**
 * Enhanced Review Workflows Page
 *
 * Integrates the new section-based review system with the existing design.
 * Supports workspace creation, file uploads with sections, and comprehensive review workflows.
 */
function EnhancedProjects() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    workspace_type: 'review',
    workflow_template: 'standard',
    project_type: 'review',
    visibility: 'private',
    auto_assign_reviewers: false,
    external_access_enabled: true,
    default_reviewers: []
  })

  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    getFilteredProjects,
    getProjectStats,
    setSearchQuery,
    setFilterStatus,
    searchQuery
  } = useReviewStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    setSearchQuery(searchTerm)
  }, [searchTerm, setSearchQuery])

  useEffect(() => {
    setFilterStatus(filter)
  }, [filter, setFilterStatus])

  // If we have a projectId in the URL, show the workspace view
  if (projectId) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: theme.colors.bg.page,
          paddingTop: '68px'
        }}>
          <ProjectWorkspace
            projectId={projectId}
            onClose={() => navigate('/projects')}
          />
        </div>
      </>
    )
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()

    if (!newProject.title.trim()) {
      toast.error('Project title is required')
      return
    }

    try {
      const project = await createProject(newProject)
      toast.success('Review workspace created successfully!')
      setShowCreateProject(false)
      setNewProject({
        title: '',
        description: '',
        workspace_type: 'review',
        workflow_template: 'standard',
        project_type: 'review',
        visibility: 'private',
        auto_assign_reviewers: false,
        external_access_enabled: true,
        default_reviewers: []
      })

      // Navigate to the new project workspace
      navigate(`/projects/${project.id}`)
    } catch (error) {
      toast.error('Failed to create project')
    }
  }

  const filteredProjects = getFilteredProjects()
  const stats = getProjectStats()

  // Enhanced stats with review workflow data
  const enhancedStats = {
    total: stats.total,
    pending: projects.filter(p => p.pending_reviews > 0).length,
    approved: projects.filter(p => p.approved_sections >= (p.section_count || 0) && p.section_count > 0).length,
    avgReviewTime: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + (p.reviewDays || 2), 0) / projects.length) : 0,
    totalComments: projects.reduce((sum, p) => sum + (p.total_comments || 0), 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: '#525252',
      active: '#1e40af',
      under_review: '#1e40af',
      changes_requested: '#dc2626',
      completed: '#059669',
      approved: '#059669',
      delivered: '#7c3aed'
    }
    return colors[status] || '#525252'
  }

  const getStatusBackground = (status) => {
    const backgrounds = {
      draft: '#262626',
      active: '#1e3a8a',
      under_review: '#1e3a8a',
      changes_requested: '#991b1b',
      completed: '#047857',
      approved: '#047857',
      delivered: '#5b21b6'
    }
    return backgrounds[status] || '#262626'
  }

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      active: 'In Progress',
      under_review: 'Under Review',
      changes_requested: 'Needs Changes',
      completed: 'Completed',
      approved: 'Approved',
      delivered: 'Delivered'
    }
    return labels[status] || status
  }

  if (isLoading) {
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
                width: '200px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                marginBottom: '12px'
              }}></div>
              <div style={{
                height: '20px',
                width: '400px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          {/* Loading skeleton */}
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
            <h1 style={standardStyles.pageHeader}>
              Review Workflows
            </h1>
            <p style={standardStyles.pageDescription}>
              Create workspaces for section-based reviews, approvals, and collaboration with external stakeholders
            </p>

            {/* Enhanced Quick Start Guide */}
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
                Enhanced Workflow Features:
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
                      Upload with Sections
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Divide files into reviewable sections
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
                      Section-based Reviews
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Independent approval for each section
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
                      External Collaboration
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Share access without requiring signup
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
                    4
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      Track Progress
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      lineHeight: '1.4'
                    }}>
                      Real-time workflow status tracking
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCreateProject(true)}
              style={standardStyles.primaryButton}
            >
              Create Review Workspace
            </button>
          </div>

          {/* Enhanced Progress Overview */}
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
              Workflow Overview
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
                  Total Workspaces
                </div>
                <div style={standardStyles.statsNumber}>
                  {enhancedStats.total}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  All projects
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
                  Pending Reviews
                </div>
                <div style={{
                  ...standardStyles.statsNumber,
                  color: '#f59e0b'
                }}>
                  {enhancedStats.pending}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  Need attention
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
                  ...standardStyles.statsNumber,
                  color: '#10b981'
                }}>
                  {enhancedStats.approved}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  Ready to deliver
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
                  Total Comments
                </div>
                <div style={standardStyles.statsNumber}>
                  {enhancedStats.totalComments}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: theme.colors.text.secondary
                }}>
                  Feedback received
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
            {['all', 'active', 'draft', 'completed'].map(status => {
              const statusLabels = {
                all: 'All',
                active: 'In Progress',
                draft: 'Draft',
                completed: 'Completed'
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
            placeholder="Search workspaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={standardStyles.searchInput}
          />
        </div>

        {/* Enhanced Projects List */}
        {filteredProjects.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredProjects.map(project => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  display: 'block',
                  background: theme.colors.bg.hover,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '16px',
                  padding: '24px',
                  textDecoration: 'none',
                  transition: 'all 200ms',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.bg.secondary
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = theme.colors.bg.hover
                  e.currentTarget.style.borderColor = theme.colors.border.light
                  e.currentTarget.style.transform = 'translateY(0px)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  gap: '20px',
                  alignItems: 'center'
                }}>
                  {/* Project Info */}
                  <div>
                    <h3 style={{
                      color: theme.colors.text.primary,
                      fontSize: '16px',
                      fontWeight: theme.weight.semibold,
                      marginBottom: '8px'
                    }}>
                      {project.title}
                    </h3>
                    <p style={{
                      color: theme.colors.text.secondary,
                      fontSize: '14px',
                      marginBottom: '12px'
                    }}>
                      {project.description || 'No description provided'}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '13px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: theme.colors.text.secondary }}>
                          Workspace:
                        </span>
                        <div style={{
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: theme.weight.medium,
                          color: theme.colors.text.primary,
                          background: '#262626',
                          textTransform: 'capitalize'
                        }}>
                          {project.workspace_type || 'review'}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: theme.colors.text.secondary }}>
                          Files:
                        </span>
                        <span style={{ color: theme.colors.text.primary }}>
                          {project.files_with_workflow || 0}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ color: theme.colors.text.secondary }}>
                          Comments:
                        </span>
                        <span style={{ color: theme.colors.text.primary }}>
                          {project.total_comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: theme.weight.medium,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: getStatusBackground(project.status),
                    color: getStatusColor(project.status),
                    textAlign: 'center',
                    whiteSpace: 'nowrap'
                  }}>
                    {getStatusLabel(project.status)}
                  </div>

                  {/* Review Progress */}
                  <div style={{ minWidth: '120px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        color: theme.colors.text.secondary,
                        fontSize: '12px'
                      }}>
                        Review Progress
                      </span>
                      <span style={{
                        color: theme.colors.text.primary,
                        fontSize: '12px',
                        fontWeight: theme.weight.medium
                      }}>
                        {project.completion_percentage || 0}%
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
                        width: `${project.completion_percentage || 0}%`,
                        height: '100%',
                        background: getStatusColor(project.status),
                        borderRadius: '3px',
                        transition: 'width 300ms ease-out'
                      }} />
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    minWidth: '80px'
                  }}>
                    {project.pending_reviews > 0 && (
                      <div style={{
                        fontSize: '11px',
                        color: '#f59e0b',
                        background: 'rgba(245, 158, 11, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: theme.weight.medium
                      }}>
                        {project.pending_reviews} pending
                      </div>
                    )}
                    {project.approved_sections > 0 && (
                      <div style={{
                        fontSize: '11px',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontWeight: theme.weight.medium
                      }}>
                        {project.approved_sections} approved
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
              📋
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '12px'
            }}>
              {searchTerm || filter !== 'all' ? 'No workspaces found' : 'No review workspaces yet'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.tertiary,
              marginBottom: '32px'
            }}>
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first review workspace to start collecting feedback'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <button
                onClick={() => setShowCreateProject(true)}
                style={standardStyles.secondaryButton}
              >
                Create Workspace
              </button>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Enhanced Create Project Modal */}
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
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              color: theme.colors.text.primary,
              fontSize: '24px',
              fontWeight: theme.weight.bold,
              marginBottom: '24px'
            }}>
              Create Review Workspace
            </h2>
            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  Workspace Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter workspace title..."
                  value={newProject.title}
                  onChange={(e) => setNewProject({
                    ...newProject,
                    title: e.target.value
                  })}
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

              <div style={{ marginBottom: '20px' }}>
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
                  rows={3}
                  placeholder="Describe what needs to be reviewed..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({
                    ...newProject,
                    description: e.target.value
                  })}
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

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.primary,
                    marginBottom: '8px'
                  }}>
                    Workspace Type
                  </label>
                  <select
                    value={newProject.workspace_type}
                    onChange={(e) => setNewProject({
                      ...newProject,
                      workspace_type: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: theme.colors.bg.secondary,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '14px'
                    }}
                  >
                    <option value="review">Review</option>
                    <option value="approval">Approval</option>
                    <option value="creative">Creative</option>
                    <option value="code">Code Review</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: theme.weight.medium,
                    color: theme.colors.text.primary,
                    marginBottom: '8px'
                  }}>
                    Workflow Template
                  </label>
                  <select
                    value={newProject.workflow_template}
                    onChange={(e) => setNewProject({
                      ...newProject,
                      workflow_template: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: theme.colors.bg.secondary,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '14px'
                    }}
                  >
                    <option value="standard">Standard</option>
                    <option value="fast">Fast Track</option>
                    <option value="thorough">Thorough Review</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: theme.colors.text.secondary,
                  marginBottom: '8px'
                }}>
                  <input
                    type="checkbox"
                    checked={newProject.external_access_enabled}
                    onChange={(e) => setNewProject({
                      ...newProject,
                      external_access_enabled: e.target.checked
                    })}
                    style={{
                      width: '16px',
                      height: '16px'
                    }}
                  />
                  Enable external collaborator access
                </label>
                <p style={{
                  fontSize: '12px',
                  color: theme.colors.text.tertiary,
                  margin: '4px 0 0 24px'
                }}>
                  Allow sharing with people outside your organization
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  style={standardStyles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    ...standardStyles.primaryButton,
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {isLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default EnhancedProjects