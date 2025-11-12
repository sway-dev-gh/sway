import React, { useState, useEffect } from 'react'
import theme from '../theme'
import { standardStyles } from './StandardStyles'

function ReviewerManager({ projectId, sections, onReviewerUpdate }) {
  const [loading, setLoading] = useState(true)
  const [reviewers, setReviewers] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newReviewer, setNewReviewer] = useState({
    email: '',
    name: '',
    role: 'reviewer',
    sections: []
  })
  const [reviewerStats, setReviewerStats] = useState({})

  useEffect(() => {
    fetchReviewers()
  }, [projectId])

  const fetchReviewers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workflow/projects/${projectId}/reviewers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setReviewers(data.reviewers || [])
        setReviewerStats(data.stats || {})
      }
    } catch (error) {
      console.error('Failed to fetch reviewers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddReviewer = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workflow/projects/${projectId}/reviewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReviewer)
      })

      if (response.ok) {
        const data = await response.json()
        setReviewers([...reviewers, data.reviewer])
        setNewReviewer({ email: '', name: '', role: 'reviewer', sections: [] })
        setShowAddModal(false)
        onReviewerUpdate && onReviewerUpdate()
      }
    } catch (error) {
      console.error('Failed to add reviewer:', error)
    }
  }

  const handleRemoveReviewer = async (reviewerId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workflow/projects/${projectId}/reviewers/${reviewerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setReviewers(reviewers.filter(r => r.id !== reviewerId))
        onReviewerUpdate && onReviewerUpdate()
      }
    } catch (error) {
      console.error('Failed to remove reviewer:', error)
    }
  }

  const getReviewerProgress = (reviewer) => {
    const assignedSections = reviewer.sections || []
    const completedReviews = reviewer.completed_reviews || 0
    const pendingReviews = assignedSections.length - completedReviews

    return {
      total: assignedSections.length,
      completed: completedReviews,
      pending: pendingReviews,
      percentage: assignedSections.length > 0 ? (completedReviews / assignedSections.length) * 100 : 0
    }
  }

  const getConsensusStatus = (sectionId) => {
    const sectionReviewers = reviewers.filter(r =>
      r.sections && r.sections.includes(sectionId)
    )

    if (sectionReviewers.length === 0) return { status: 'unassigned', percentage: 0 }

    const approvals = sectionReviewers.filter(r =>
      r.reviews && r.reviews[sectionId] === 'approved'
    ).length

    const rejections = sectionReviewers.filter(r =>
      r.reviews && r.reviews[sectionId] === 'changes_requested'
    ).length

    const pending = sectionReviewers.length - approvals - rejections

    if (pending === sectionReviewers.length) return { status: 'pending', percentage: 0 }
    if (approvals === sectionReviewers.length) return { status: 'approved', percentage: 100 }
    if (rejections > 0) return { status: 'changes_requested', percentage: (rejections / sectionReviewers.length) * 100 }

    return {
      status: 'partial',
      percentage: (approvals / sectionReviewers.length) * 100,
      approvals,
      rejections,
      pending
    }
  }

  if (loading) {
    return (
      <div style={{
        background: theme.colors.bg.secondary,
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{ color: theme.colors.text.secondary }}>
          Loading reviewer information...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: theme.colors.bg.secondary,
      border: `1px solid ${theme.colors.border.light}`,
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: `1px solid ${theme.colors.border.light}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: theme.colors.text.primary,
            margin: '0 0 4px 0'
          }}>
            Review Team ({reviewers.length})
          </h3>
          <p style={{
            fontSize: '14px',
            color: theme.colors.text.secondary,
            margin: '0'
          }}>
            Manage parallel reviewers and track approval consensus
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            ...standardStyles.secondaryButton,
            padding: '8px 16px',
            fontSize: '14px'
          }}
        >
          + Add Reviewer
        </button>
      </div>

      {/* Reviewers List */}
      <div style={{ padding: '24px 32px' }}>
        {reviewers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reviewers.map((reviewer) => {
              const progress = getReviewerProgress(reviewer)
              return (
                <div
                  key={reviewer.id}
                  style={{
                    background: theme.colors.bg.primary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '8px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: theme.colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {reviewer.name ? reviewer.name.charAt(0).toUpperCase() : reviewer.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '500',
                          color: theme.colors.text.primary
                        }}>
                          {reviewer.name || reviewer.email}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: theme.colors.text.secondary
                        }}>
                          {reviewer.email} • {reviewer.role}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginTop: '12px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: theme.colors.text.secondary,
                          fontWeight: '500'
                        }}>
                          Review Progress
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: theme.colors.text.secondary
                        }}>
                          {progress.completed}/{progress.total} sections
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: theme.colors.bg.secondary,
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress.percentage}%`,
                          height: '100%',
                          background: progress.percentage === 100 ? '#10b981' : theme.colors.primary,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginLeft: '20px'
                  }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: reviewer.status === 'active' ? '#065f46' : '#374151',
                      color: 'white'
                    }}>
                      {reviewer.status || 'Active'}
                    </div>
                    <button
                      onClick={() => handleRemoveReviewer(reviewer.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.colors.text.secondary,
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = theme.colors.bg.secondary}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme.colors.text.secondary
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
              👥
            </div>
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
              No reviewers assigned
            </div>
            <div style={{ fontSize: '14px' }}>
              Add reviewers to enable parallel review workflows
            </div>
          </div>
        )}
      </div>

      {/* Section Consensus Overview */}
      {sections && sections.length > 0 && (
        <div style={{
          borderTop: `1px solid ${theme.colors.border.light}`,
          padding: '24px 32px'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.text.primary,
            margin: '0 0 16px 0'
          }}>
            Section Consensus Status
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sections.map((section) => {
              const consensus = getConsensusStatus(section.id)
              return (
                <div
                  key={section.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: theme.colors.bg.primary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '6px'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.text.primary,
                    fontWeight: '500'
                  }}>
                    {section.title || `Section ${section.order}`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {consensus.status === 'partial' && (
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.text.secondary
                      }}>
                        {consensus.approvals}✓ {consensus.rejections}✗ {consensus.pending}⏳
                      </div>
                    )}
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: consensus.status === 'approved' ? '#065f46' :
                                 consensus.status === 'changes_requested' ? '#991b1b' :
                                 consensus.status === 'partial' ? '#f59e0b' : '#374151',
                      color: 'white'
                    }}>
                      {consensus.status === 'approved' ? 'Approved' :
                       consensus.status === 'changes_requested' ? 'Changes Requested' :
                       consensus.status === 'partial' ? 'Partial Approval' :
                       consensus.status === 'pending' ? 'Pending Review' : 'Unassigned'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Reviewer Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: theme.colors.bg.primary,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '24px 32px',
              borderBottom: `1px solid ${theme.colors.border.light}`
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                margin: '0 0 8px 0'
              }}>
                Add Reviewer
              </h3>
              <p style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                margin: '0'
              }}>
                Add a new team member to review sections
              </p>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newReviewer.email}
                  onChange={(e) => setNewReviewer({...newReviewer, email: e.target.value})}
                  placeholder="reviewer@company.com"
                  style={{
                    ...standardStyles.input,
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={newReviewer.name}
                  onChange={(e) => setNewReviewer({...newReviewer, name: e.target.value})}
                  placeholder="John Smith"
                  style={{
                    ...standardStyles.input,
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: theme.colors.text.primary,
                  marginBottom: '8px'
                }}>
                  Role
                </label>
                <select
                  value={newReviewer.role}
                  onChange={(e) => setNewReviewer({...newReviewer, role: e.target.value})}
                  style={{
                    ...standardStyles.input,
                    width: '100%'
                  }}
                >
                  <option value="reviewer">Reviewer</option>
                  <option value="approver">Approver</option>
                  <option value="stakeholder">Stakeholder</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={standardStyles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReviewer}
                  disabled={!newReviewer.email}
                  style={{
                    ...standardStyles.primaryButton,
                    opacity: !newReviewer.email ? 0.5 : 1
                  }}
                >
                  Add Reviewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewerManager