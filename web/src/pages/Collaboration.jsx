import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { standardStyles } from '../components/StandardStyles'

function Collaboration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Data states
  const [teamMembers, setTeamMembers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [activeCollaborations, setActiveCollaborations] = useState([])
  const [editRequests, setEditRequests] = useState([])
  const [approvalQueue, setApprovalQueue] = useState([])
  const [documents, setDocuments] = useState([])

  // Modal states
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [showEditRequest, setShowEditRequest] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchCollaborationData()
  }, [navigate])

  const fetchCollaborationData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 5000)
      )

      // Fetch collaboration data from APIs with timeout
      const apiPromise = Promise.all([
        api.get('/api/team', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/activity', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/api/collaborations', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      const [teamResponse, activityResponse, collaborationsResponse] = await Promise.race([
        apiPromise,
        timeoutPromise
      ])

      setTeamMembers(teamResponse.data.team || [])
      setRecentActivity(activityResponse.data.activity || [])
      setActiveCollaborations(collaborationsResponse.data.collaborations || [])

      // Mock data for new features (replace with real API calls later)
      setEditRequests([
        {
          id: 1,
          documentTitle: 'Marketing Strategy Q1',
          requestedBy: 'Sarah Wilson',
          requestedAt: new Date().toISOString(),
          section: 'Budget Overview',
          description: 'Need to update Q1 budget projections with latest market research',
          status: 'pending',
          priority: 'high'
        },
        {
          id: 2,
          documentTitle: 'Product Launch Plan',
          requestedBy: 'Mike Chen',
          requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          section: 'Timeline',
          description: 'Adjust launch timeline based on development delays',
          status: 'in_review',
          priority: 'urgent'
        }
      ])

      setApprovalQueue([
        {
          id: 1,
          documentTitle: 'Client Proposal - TechCorp',
          submittedBy: 'Jessica Taylor',
          submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'pending_approval',
          priority: 'urgent',
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          documentTitle: 'Employee Handbook Updates',
          submittedBy: 'David Brown',
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'pending_approval',
          priority: 'normal',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])

      setDocuments([
        { id: 1, title: 'Marketing Strategy Q1', lastModified: '2 hours ago', status: 'draft' },
        { id: 2, title: 'Product Launch Plan', lastModified: '1 day ago', status: 'under_review' },
        { id: 3, title: 'Client Proposal - TechCorp', lastModified: '30 minutes ago', status: 'pending_approval' }
      ])

    } catch (error) {
      console.error('Failed to fetch collaboration data:', error)
      // Set empty arrays for clean state - this will make the page render
      setTeamMembers([])
      setRecentActivity([])
      setActiveCollaborations([])
      setEditRequests([])
      setApprovalQueue([])
      setDocuments([])
    } finally {
      setLoading(false) // CRITICAL: Always set loading to false
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
              Collaboration
            </h1>
            <p style={standardStyles.pageDescription}>
              Work together with your team on reviews, share feedback, and track progress
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}>

            {/* Edit Requests */}
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
                Edit Requests
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {editRequests.length}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {editRequests.filter(req => req.status === 'pending').length} pending
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
                {approvalQueue.filter(item => item.priority === 'urgent').length} urgent
              </div>
            </div>

            {/* Team Members */}
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
                Team Members
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {teamMembers.length || 8}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '12px',
                fontWeight: '500'
              }}>
                3 managers
              </div>
            </div>

            {/* Documents */}
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
                Documents
              </div>
              <div style={{
                fontSize: '36px',
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: '4px'
              }}>
                {documents.length}
              </div>
              <div style={{
                color: theme.colors.text.secondary,
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {documents.filter(doc => doc.status === 'pending_approval').length} awaiting approval
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
            {['overview', 'edit_requests', 'approvals', 'team'].map(tab => (
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
                {tab === 'edit_requests' && `Edit Requests (${editRequests.length})`}
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
                  Workflow Overview
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
                    <div style={{
                      padding: '16px',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      background: theme.colors.bg.page
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        Sarah Wilson requested edit to Marketing Strategy Q1
                      </div>
                      <div style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                        2 hours ago • Budget Overview section
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '8px',
                      background: theme.colors.bg.page
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        Client Proposal - TechCorp awaiting your approval
                      </div>
                      <div style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                        30 minutes ago • Submitted by Jessica Taylor
                      </div>
                    </div>
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
                      onClick={() => setActiveTab('edit_requests')}
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
                      Review Edit Requests
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
                    <button
                      onClick={() => setShowCreateRequest(true)}
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
                      Request Document Edit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Requests Tab */}
            {activeTab === 'edit_requests' && (
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
                    Document Edit Requests
                  </h2>
                  <button
                    onClick={() => setShowCreateRequest(true)}
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
                    + New Request
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {editRequests.map(request => (
                    <div
                      key={request.id}
                      style={{
                        padding: '20px',
                        border: `1px solid ${theme.colors.border.light}`,
                        borderLeft: `4px solid ${request.priority === 'urgent' ? '#dc2626' : request.priority === 'high' ? '#f59e0b' : '#10b981'}`,
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
                            {request.documentTitle}
                          </h3>
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '8px'
                          }}>
                            Requested by {request.requestedBy} • {new Date(request.requestedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: request.status === 'pending' ? '#fef3c7' : request.status === 'in_review' ? '#dbeafe' : '#d1fae5',
                            color: request.status === 'pending' ? '#92400e' : request.status === 'in_review' ? '#1e40af' : '#065f46'
                          }}>
                            {request.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: request.priority === 'urgent' ? '#fecaca' : request.priority === 'high' ? '#fed7aa' : '#bbf7d0',
                            color: request.priority === 'urgent' ? '#991b1b' : request.priority === 'high' ? '#9a3412' : '#14532d'
                          }}>
                            {request.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: theme.colors.text.primary,
                          marginBottom: '4px'
                        }}>
                          Section: {request.section}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: theme.colors.text.secondary,
                          lineHeight: '1.5'
                        }}>
                          {request.description}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: `1px solid ${theme.colors.border.light}`,
                          background: 'transparent',
                          color: theme.colors.text.primary,
                          cursor: 'pointer'
                        }}>
                          Review
                        </button>
                        <button style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: `1px solid #10b981`,
                          background: '#10b981',
                          color: 'white',
                          cursor: 'pointer'
                        }}>
                          Approve
                        </button>
                        <button style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: `1px solid #f59e0b`,
                          background: '#f59e0b',
                          color: 'white',
                          cursor: 'pointer'
                        }}>
                          Request Changes
                        </button>
                      </div>
                    </div>
                  ))}
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
                  Approval Queue
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {approvalQueue.map(item => (
                    <div
                      key={item.id}
                      style={{
                        padding: '20px',
                        border: `1px solid ${theme.colors.border.light}`,
                        borderLeft: `4px solid ${item.priority === 'urgent' ? '#dc2626' : '#f59e0b'}`,
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
                            {item.documentTitle}
                          </h3>
                          <div style={{
                            fontSize: '12px',
                            color: theme.colors.text.secondary,
                            marginBottom: '8px'
                          }}>
                            Submitted by {item.submittedBy} • {new Date(item.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: '#fef3c7',
                            color: '#92400e'
                          }}>
                            PENDING APPROVAL
                          </span>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            background: item.priority === 'urgent' ? '#fecaca' : '#fed7aa',
                            color: item.priority === 'urgent' ? '#991b1b' : '#9a3412'
                          }}>
                            {item.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: theme.colors.text.primary,
                          marginBottom: '4px'
                        }}>
                          Deadline: {new Date(item.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: `1px solid ${theme.colors.border.light}`,
                          background: 'transparent',
                          color: theme.colors.text.primary,
                          cursor: 'pointer'
                        }}>
                          View Document
                        </button>
                        <button style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: `1px solid #10b981`,
                          background: '#10b981',
                          color: 'white',
                          cursor: 'pointer'
                        }}>
                          Approve
                        </button>
                        <button style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          border: `1px solid #dc2626`,
                          background: '#dc2626',
                          color: 'white',
                          cursor: 'pointer'
                        }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
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
                    Team & Roles
                  </h2>
                  <button style={{
                    background: theme.colors.text.primary,
                    color: theme.colors.bg.page,
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontWeight: '500',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}>
                    + Invite Member
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
                      Manager Role
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      Can approve documents, manage workflows, assign tasks, and make final decisions on content.
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
                      Contributor Role
                    </h3>
                    <p style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary,
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      Can submit edit requests, collaborate on documents, and provide feedback for review.
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
                    Team Members
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { name: 'John Manager', email: 'john@company.com', role: 'manager' },
                      { name: 'Sarah Wilson', email: 'sarah@company.com', role: 'contributor' },
                      { name: 'Mike Chen', email: 'mike@company.com', role: 'contributor' },
                      { name: 'Jessica Taylor', email: 'jessica@company.com', role: 'manager' },
                      { name: 'David Brown', email: 'david@company.com', role: 'contributor' }
                    ].map((member, index) => (
                      <div
                        key={index}
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
                            {member.email}
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
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
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