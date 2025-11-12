import React, { useState, useEffect } from 'react'
import theme from '../theme'
import { standardStyles } from './StandardStyles'

function ApprovalTracker({ projectId, fileId, sections, onWorkflowUpdate }) {
  const [loading, setLoading] = useState(true)
  const [approvalData, setApprovalData] = useState({
    overall: {},
    sections: {},
    reviewers: {},
    timeline: []
  })
  const [selectedSection, setSelectedSection] = useState('all')
  const [viewMode, setViewMode] = useState('overview') // overview, consensus, timeline

  useEffect(() => {
    fetchApprovalData()
  }, [projectId, fileId])

  const fetchApprovalData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workflow/projects/${projectId}/approval-tracking${fileId ? `?fileId=${fileId}` : ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setApprovalData(data)
      }
    } catch (error) {
      console.error('Failed to fetch approval data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleForceApproval = async (sectionId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workflow/projects/${projectId}/sections/${sectionId}/force-approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchApprovalData()
        onWorkflowUpdate && onWorkflowUpdate()
      }
    } catch (error) {
      console.error('Failed to force approval:', error)
    }
  }

  const getOverallStatus = () => {
    const { overall } = approvalData
    if (!overall.totalSections) return { status: 'pending', percentage: 0 }

    const percentage = (overall.approvedSections / overall.totalSections) * 100

    if (overall.approvedSections === overall.totalSections) {
      return { status: 'approved', percentage: 100 }
    } else if (overall.changesRequestedSections > 0) {
      return { status: 'changes_requested', percentage }
    } else if (overall.pendingSections === overall.totalSections) {
      return { status: 'pending', percentage: 0 }
    } else {
      return { status: 'in_review', percentage }
    }
  }

  const getSectionApprovalDetails = (sectionId) => {
    const sectionData = approvalData.sections[sectionId]
    if (!sectionData) return null

    const totalReviewers = sectionData.assignedReviewers || 0
    const approvals = sectionData.approvals || 0
    const rejections = sectionData.rejections || 0
    const pending = totalReviewers - approvals - rejections

    const consensusThreshold = Math.ceil(totalReviewers * 0.6) // 60% consensus required
    const hasConsensus = approvals >= consensusThreshold

    return {
      totalReviewers,
      approvals,
      rejections,
      pending,
      consensusThreshold,
      hasConsensus,
      percentage: totalReviewers > 0 ? (approvals / totalReviewers) * 100 : 0,
      status: hasConsensus ? 'approved' :
              rejections > 0 ? 'changes_requested' :
              approvals > 0 ? 'partial' : 'pending'
    }
  }

  const getWorkflowStage = () => {
    const overall = getOverallStatus()

    switch (overall.status) {
      case 'pending':
        return { stage: 'draft', color: '#6b7280', label: 'Draft' }
      case 'in_review':
        return { stage: 'review', color: '#f59e0b', label: 'Under Review' }
      case 'changes_requested':
        return { stage: 'changes', color: '#ef4444', label: 'Changes Requested' }
      case 'approved':
        return { stage: 'approved', color: '#10b981', label: 'Approved' }
      default:
        return { stage: 'unknown', color: '#6b7280', label: 'Unknown' }
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const days = Math.floor(diffInHours / 24)
    return `${days}d ago`
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
          Loading approval tracking...
        </div>
      </div>
    )
  }

  const overallStatus = getOverallStatus()
  const workflowStage = getWorkflowStage()

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
        background: theme.colors.bg.primary
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              margin: '0 0 4px 0'
            }}>
              Approval Tracking
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.secondary,
              margin: '0'
            }}>
              Monitor review progress and consensus status
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              background: workflowStage.color,
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {workflowStage.label}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: theme.colors.text.primary
            }}>
              {Math.round(overallStatus.percentage)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: theme.colors.bg.secondary,
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <div style={{
            width: `${overallStatus.percentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${workflowStage.color}, ${workflowStage.color}dd)`,
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* View Mode Tabs */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: theme.colors.bg.secondary,
          padding: '4px',
          borderRadius: '8px'
        }}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'consensus', label: 'Consensus' },
            { key: 'timeline', label: 'Timeline' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                background: viewMode === tab.key ? theme.colors.bg.primary : 'transparent',
                color: viewMode === tab.key ? theme.colors.text.primary : theme.colors.text.secondary,
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 32px' }}>
        {viewMode === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '4px'
                }}>
                  {approvalData.overall.approvedSections || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Approved
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#f59e0b',
                  marginBottom: '4px'
                }}>
                  {approvalData.overall.pendingSections || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Pending
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ef4444',
                  marginBottom: '4px'
                }}>
                  {approvalData.overall.changesRequestedSections || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Changes Needed
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                  marginBottom: '4px'
                }}>
                  {approvalData.overall.totalReviewers || 0}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Reviewers
                </div>
              </div>
            </div>

            {/* Section Status List */}
            {sections && sections.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                  marginBottom: '16px'
                }}>
                  Section Status
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sections.map((section) => {
                    const details = getSectionApprovalDetails(section.id)
                    if (!details) return null

                    return (
                      <div
                        key={section.id}
                        style={{
                          background: theme.colors.bg.primary,
                          border: `1px solid ${theme.colors.border.light}`,
                          borderRadius: '6px',
                          padding: '16px',
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
                            marginBottom: '4px'
                          }}>
                            {section.title || `Section ${section.order}`}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.secondary
                          }}>
                            {details.approvals}✓ {details.rejections}✗ {details.pending}⏳
                            ({details.totalReviewers} reviewers)
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '80px',
                            height: '6px',
                            background: theme.colors.bg.secondary,
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${details.percentage}%`,
                              height: '100%',
                              background: details.status === 'approved' ? '#10b981' :
                                         details.status === 'changes_requested' ? '#ef4444' :
                                         details.status === 'partial' ? '#f59e0b' : '#6b7280',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>

                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: details.status === 'approved' ? '#065f46' :
                                       details.status === 'changes_requested' ? '#991b1b' :
                                       details.status === 'partial' ? '#92400e' : '#374151',
                            color: 'white',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px'
                          }}>
                            {details.status}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'consensus' && (
          <div>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: theme.colors.bg.primary,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: '8px'
            }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                margin: '0 0 8px 0'
              }}>
                Consensus Rules
              </h4>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text.secondary,
                lineHeight: '1.5'
              }}>
                • 60% approval rate required for section consensus<br/>
                • Any rejection triggers "Changes Requested" status<br/>
                • Project owners can force approve if needed
              </div>
            </div>

            {sections && sections.map((section) => {
              const details = getSectionApprovalDetails(section.id)
              if (!details) return null

              return (
                <div
                  key={section.id}
                  style={{
                    background: theme.colors.bg.primary,
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <h5 style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: theme.colors.text.primary,
                        margin: '0 0 4px 0'
                      }}>
                        {section.title || `Section ${section.order}`}
                      </h5>
                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.secondary
                      }}>
                        Consensus: {details.approvals}/{details.consensusThreshold} required
                      </div>
                    </div>

                    {!details.hasConsensus && details.rejections === 0 && (
                      <button
                        onClick={() => handleForceApproval(section.id)}
                        style={{
                          ...standardStyles.secondaryButton,
                          padding: '6px 12px',
                          fontSize: '12px'
                        }}
                      >
                        Force Approve
                      </button>
                    )}
                  </div>

                  {/* Visual consensus meter */}
                  <div style={{
                    display: 'flex',
                    height: '40px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: `${(details.approvals / details.totalReviewers) * 100}%`,
                      background: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {details.approvals > 0 && `${details.approvals}✓`}
                    </div>
                    <div style={{
                      width: `${(details.rejections / details.totalReviewers) * 100}%`,
                      background: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {details.rejections > 0 && `${details.rejections}✗`}
                    </div>
                    <div style={{
                      width: `${(details.pending / details.totalReviewers) * 100}%`,
                      background: '#d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {details.pending > 0 && `${details.pending}⏳`}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: details.hasConsensus ? '#065f46' :
                           details.rejections > 0 ? '#991b1b' : theme.colors.text.secondary,
                    fontWeight: '500'
                  }}>
                    {details.hasConsensus ? '✓ Consensus reached' :
                     details.rejections > 0 ? '✗ Changes requested' :
                     `${details.consensusThreshold - details.approvals} more approval${details.consensusThreshold - details.approvals !== 1 ? 's' : ''} needed`}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'timeline' && (
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '16px'
            }}>
              Review Activity Timeline
            </h4>

            {approvalData.timeline && approvalData.timeline.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {approvalData.timeline.map((event, index) => (
                  <div
                    key={event.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: '16px',
                      background: theme.colors.bg.primary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: event.type === 'approval' ? '#10b981' :
                                 event.type === 'rejection' ? '#ef4444' :
                                 event.type === 'comment' ? '#3b82f6' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      {event.type === 'approval' ? '✓' :
                       event.type === 'rejection' ? '✗' :
                       event.type === 'comment' ? '💬' : '📋'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '4px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: theme.colors.text.primary
                        }}>
                          {event.reviewer_name || event.reviewer_email}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: theme.colors.text.secondary
                        }}>
                          {formatTimeAgo(event.created_at)}
                        </div>
                      </div>

                      <div style={{
                        fontSize: '14px',
                        color: theme.colors.text.secondary,
                        marginBottom: '4px'
                      }}>
                        {event.action} on {event.section_title || `Section ${event.section_order}`}
                      </div>

                      {event.comment && (
                        <div style={{
                          fontSize: '13px',
                          color: theme.colors.text.primary,
                          background: theme.colors.bg.secondary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          marginTop: '8px',
                          fontStyle: 'italic'
                        }}>
                          "{event.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: theme.colors.text.secondary
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                  📋
                </div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                  No activity yet
                </div>
                <div style={{ fontSize: '14px' }}>
                  Review activity will appear here as reviewers provide feedback
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApprovalTracker