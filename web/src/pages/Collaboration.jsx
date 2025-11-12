import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import useReviewStore from '../store/reviewStore'
import toast from 'react-hot-toast'
import { standardStyles } from '../components/StandardStyles'

function Collaboration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const {
    projects,
    reviews,
    comments,
    isLoading,
    error,
    fetchProjects,
    fetchReviewsByProject,
    fetchCommentsByReview,
    updateReviewStatus
  } = useReviewStore()

  // Computed data from review store
  const [pendingReviews, setPendingReviews] = useState([])
  const [approvalQueue, setApprovalQueue] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [collaborators, setCollaborators] = useState([])

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    loadCollaborationData()
  }, [navigate])

  const loadCollaborationData = async () => {
    try {
      setLoading(true)

      // Fetch projects and related review data
      await fetchProjects()

      // Process data to extract collaboration insights
      if (projects.length > 0) {
        // Get all reviews for all projects
        const allReviews = []
        for (const project of projects) {
          try {
            const projectReviews = await fetchReviewsByProject(project.id)
            allReviews.push(...projectReviews)
          } catch (error) {
            console.error(`Failed to fetch reviews for project ${project.id}:`, error)
          }
        }

        // Extract pending reviews (under review status)
        const pending = allReviews.filter(review => review.status === 'under_review')
        setPendingReviews(pending)

        // Extract approvals (reviews awaiting final approval)
        const awaitingApproval = allReviews.filter(review =>
          review.status === 'changes_requested' ||
          review.section_status === 'awaiting_approval'
        )
        setApprovalQueue(awaitingApproval)

        // Generate recent activity from reviews and comments
        const activity = allReviews
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
          .slice(0, 10)
          .map(review => {
            const project = projects.find(p => p.id === review.project_id)
            return {
              id: review.id,
              type: review.status === 'approved' ? 'approval_granted' :
                    review.status === 'under_review' ? 'review_submitted' :
                    'changes_requested',
              project: project?.title || 'Unknown Project',
              user: review.reviewer_name || 'Unknown Reviewer',
              time: formatTimeAgo(review.submitted_at),
              section: review.section_name
            }
          })
        setRecentActivity(activity)

        // Mock collaborators data (to be replaced with real team management)
        setCollaborators([
          { id: 1, name: 'Project Manager', email: 'manager@company.com', role: 'manager', projects: projects.length },
          { id: 2, name: 'Senior Reviewer', email: 'reviewer@company.com', role: 'reviewer', projects: Math.floor(projects.length / 2) },
          { id: 3, name: 'Content Editor', email: 'editor@company.com', role: 'contributor', projects: Math.floor(projects.length / 3) }
        ])
      }

    } catch (error) {
      console.error('Failed to fetch collaboration data:', error)
      toast.error('Failed to load collaboration data')
      setPendingReviews([])
      setApprovalQueue([])
      setRecentActivity([])
      setCollaborators([])
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`
    }
  }

  const handleReviewAction = async (reviewId, action) => {
    try {
      await updateReviewStatus(reviewId, action)
      toast.success(`Review ${action} successfully`)
      loadCollaborationData() // Refresh data
    } catch (error) {
      console.error('Failed to update review:', error)
      toast.error(`Failed to ${action} review`)
    }
  }

  if (loading) {
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
    <Sidebar>
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

          {/* Header */}
          <div style={{ marginBottom: '48px' }}>
            <h1 style={standardStyles.pageHeader}>
              Review Collaboration
            </h1>
            <p style={standardStyles.pageDescription}>
              Collaborate on reviews, manage approvals, and coordinate with your team
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>

            {/* Pending Reviews */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                fontWeight: '500',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Pending Reviews
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {pendingReviews.length}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Awaiting feedback
              </div>
            </div>

            {/* Approval Queue */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                fontWeight: '500',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Approval Queue
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {approvalQueue.length}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Needs approval
              </div>
            </div>

            {/* Collaborators */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                fontWeight: '500',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Collaborators
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {collaborators.length}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Active reviewers
              </div>
            </div>

            {/* Active Projects */}
            <div style={{
              background: theme.colors.bg.secondary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '12px',
                color: theme.colors.text.secondary,
                fontWeight: '500',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Active Projects
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {projects.filter(p => p.status === 'active').length}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '12px',
                fontWeight: '500'
              }}>
                In review workflow
              </div>
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
            {['overview', 'pending_reviews', 'approvals', 'team'].map(tab => (
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
                {tab === 'pending_reviews' && `Pending Reviews (${pendingReviews.length})`}
                {tab === 'approvals' && `Approvals (${approvalQueue.length})`}
                {tab === 'team' && 'Team Management'}
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
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: '24px',
                  margin: '0 0 24px 0'
                }}>
                  Review Workflow Overview
                </h2>

                {/* Recent Activity */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Recent Activity
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {recentActivity.length > 0 ? recentActivity.slice(0, 4).map(activity => (
                      <div
                        key={activity.id}
                        style={{
                          padding: '16px',
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: '8px',
                          background: theme.colors.bg.page
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                          {activity.type === 'review_submitted' && `${activity.user} submitted review for ${activity.project}`}
                          {activity.type === 'approval_granted' && `${activity.user} approved ${activity.project}`}
                          {activity.type === 'changes_requested' && `${activity.user} requested changes to ${activity.project}`}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                          {activity.time} {activity.section && `• ${activity.section} section`}
                        </div>
                      </div>
                    )) : (
                      <div style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: theme.colors.text.secondary,
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '8px',
                        background: theme.colors.bg.page
                      }}>
                        No recent activity. Create your first project to start collaborating!
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Quick Actions
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px'
                  }}>
                    <button
                      onClick={() => setActiveTab('pending_reviews')}
                      style={{
                        background: 'transparent',
                        color: theme.colors.text.primary,
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        textAlign: 'center',
                        border: `1px solid ${theme.colors.border.light}`,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Review Pending Items
                    </button>
                    <button
                      onClick={() => setActiveTab('approvals')}
                      style={{
                        background: 'transparent',
                        color: theme.colors.text.primary,
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        textAlign: 'center',
                        fontSize: '14px',
                        border: `1px solid ${theme.colors.border.light}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Process Approvals
                    </button>
                    <Link
                      to="/projects"
                      style={{
                        background: 'transparent',
                        color: theme.colors.text.primary,
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '500',
                        textAlign: 'center',
                        fontSize: '14px',
                        border: `1px solid ${theme.colors.border.light}`,
                        textDecoration: 'none',
                        display: 'block',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Create Review Project
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Reviews Tab */}
            {activeTab === 'pending_reviews' && (
              <div style={{ padding: '32px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    margin: '0'
                  }}>
                    Pending Reviews
                  </h2>
                  <Link
                    to="/projects"
                    style={{
                      background: theme.colors.text.primary,
                      color: theme.colors.bg.page,
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      fontSize: '14px',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    + New Project
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingReviews.length > 0 ? pendingReviews.map(review => {
                    const project = projects.find(p => p.id === review.project_id)
                    return (
                      <div
                        key={review.id}
                        style={{
                          padding: '20px',
                          border: `1px solid ${theme.colors.border.light}`,
                          borderLeft: `4px solid #f59e0b`,
                          borderRadius: '8px',
                          background: theme.colors.bg.page
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: theme.colors.text.primary,
                              margin: '0 0 4px 0'
                            }}>
                              {project?.title || 'Unknown Project'}
                            </h3>
                            <div style={{
                              fontSize: '12px',
                              color: theme.colors.text.secondary,
                              marginBottom: '8px'
                            }}>
                              Review by {review.reviewer_name} • {new Date(review.submitted_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#fef3c7',
                            color: '#92400e'
                          }}>
                            UNDER REVIEW
                          </span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: theme.colors.text.primary,
                            marginBottom: '4px'
                          }}>
                            Section: {review.section_name || 'General Review'}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: theme.colors.text.secondary,
                            lineHeight: '1.5'
                          }}>
                            {review.feedback || 'Review feedback pending...'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link
                            to={`/projects/${review.project_id}`}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: `1px solid ${theme.colors.border.light}`,
                              background: 'transparent',
                              color: theme.colors.text.primary,
                              textDecoration: 'none'
                            }}
                          >
                            View Project
                          </Link>
                          <button
                            onClick={() => handleReviewAction(review.id, 'approved')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: `1px solid #10b981`,
                              background: '#10b981',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewAction(review.id, 'changes_requested')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: `1px solid #f59e0b`,
                              background: '#f59e0b',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            Request Changes
                          </button>
                        </div>
                      </div>
                    )
                  }) : (
                    <div style={{
                      padding: '48px',
                      textAlign: 'center',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      background: theme.colors.bg.page
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px', color: theme.colors.text.primary }}>No pending reviews</h3>
                      <p style={{ marginBottom: '24px' }}>All reviews are up to date!</p>
                      <Link
                        to="/projects"
                        style={{
                          background: theme.colors.text.primary,
                          color: theme.colors.bg.page,
                          padding: '12px 24px',
                          borderRadius: '6px',
                          fontWeight: '500',
                          textDecoration: 'none'
                        }}
                      >
                        Create New Project
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Approval Queue Tab */}
            {activeTab === 'approvals' && (
              <div style={{ padding: '32px' }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: '24px',
                  margin: '0 0 24px 0'
                }}>
                  Final Approvals
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {approvalQueue.length > 0 ? approvalQueue.map(review => {
                    const project = projects.find(p => p.id === review.project_id)
                    return (
                      <div
                        key={review.id}
                        style={{
                          padding: '20px',
                          border: `1px solid ${theme.colors.border.light}`,
                          borderLeft: `4px solid #dc2626`,
                          borderRadius: '8px',
                          background: theme.colors.bg.page
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: theme.colors.text.primary,
                              margin: '0 0 4px 0'
                            }}>
                              {project?.title || 'Unknown Project'}
                            </h3>
                            <div style={{
                              fontSize: '12px',
                              color: theme.colors.text.secondary,
                              marginBottom: '8px'
                            }}>
                              Review by {review.reviewer_name} • {new Date(review.submitted_at).toLocaleDateString()}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#fecaca',
                            color: '#991b1b'
                          }}>
                            NEEDS APPROVAL
                          </span>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: theme.colors.text.primary,
                            marginBottom: '4px'
                          }}>
                            Section: {review.section_name || 'General Review'}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: theme.colors.text.secondary,
                            lineHeight: '1.5'
                          }}>
                            {review.feedback || 'Review pending final approval...'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link
                            to={`/projects/${review.project_id}`}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: `1px solid ${theme.colors.border.light}`,
                              background: 'transparent',
                              color: theme.colors.text.primary,
                              textDecoration: 'none'
                            }}
                          >
                            View Project
                          </Link>
                          <button
                            onClick={() => handleReviewAction(review.id, 'approved')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: `1px solid #10b981`,
                              background: '#10b981',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            Final Approve
                          </button>
                          <button
                            onClick={() => handleReviewAction(review.id, 'rejected')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              border: `1px solid #dc2626`,
                              background: '#dc2626',
                              color: 'white',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )
                  }) : (
                    <div style={{
                      padding: '48px',
                      textAlign: 'center',
                      color: theme.colors.text.secondary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      background: theme.colors.bg.page
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                      <h3 style={{ fontSize: '18px', marginBottom: '8px', color: theme.colors.text.primary }}>All caught up!</h3>
                      <p>No reviews awaiting final approval.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team Management Tab */}
            {activeTab === 'team' && (
              <div style={{ padding: '32px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    margin: '0'
                  }}>
                    Review Team
                  </h2>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    style={{
                      background: theme.colors.text.primary,
                      color: theme.colors.bg.page,
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    + Invite Reviewer
                  </button>
                </div>

                {/* Role Descriptions */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    padding: '16px',
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '8px',
                    background: theme.colors.bg.page
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      margin: '0 0 8px 0'
                    }}>
                      Review Manager
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      Can approve final reviews, manage review workflows, assign reviewers, and make project decisions.
                    </p>
                  </div>
                  <div style={{
                    padding: '16px',
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '8px',
                    background: theme.colors.bg.page
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      margin: '0 0 8px 0'
                    }}>
                      Reviewer
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      Can review project sections, provide feedback, and submit review recommendations.
                    </p>
                  </div>
                </div>

                {/* Team Members List */}
                <div>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Current Collaborators
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {collaborators.length > 0 ? collaborators.map((member, index) => (
                      <div
                        key={member.id || index}
                        style={{
                          padding: '16px',
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: '8px',
                          background: theme.colors.bg.page,
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
                            {member.name}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.secondary
                          }}>
                            {member.email} • {member.projects || 0} active projects
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: member.role === 'manager' ? '#dbeafe' : '#d1fae5',
                            color: member.role === 'manager' ? '#1e40af' : '#065f46'
                          }}>
                            {member.role.toUpperCase()}
                          </span>
                          <button style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            border: `1px solid ${theme.colors.border.light}`,
                            background: 'transparent',
                            color: theme.colors.text.secondary,
                            cursor: 'pointer'
                          }}>
                            Manage
                          </button>
                        </div>
                      </div>
                    )) : (
                      <div style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: theme.colors.text.secondary,
                        border: `1px solid ${theme.colors.border.light}`,
                        borderRadius: '8px',
                        background: theme.colors.bg.page
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                        <h3 style={{ fontSize: '18px', marginBottom: '8px', color: theme.colors.text.primary }}>No team members yet</h3>
                        <p style={{ marginBottom: '24px' }}>Invite reviewers to collaborate on your projects</p>
                        <button
                          onClick={() => setShowInviteModal(true)}
                          style={{
                            background: theme.colors.text.primary,
                            color: theme.colors.bg.page,
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Invite First Reviewer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </Sidebar>
  )
}

export default Collaboration