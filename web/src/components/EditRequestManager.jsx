import React, { useState, useEffect } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const EditRequestManager = ({ projectId, onClose }) => {
  const { state, actions } = useWorkspace()
  const [editRequests, setEditRequests] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [reviewForm, setReviewForm] = useState({
    action: '',
    feedback: '',
    conditions: ''
  })

  useEffect(() => {
    loadEditRequests()
  }, [projectId, filter])

  const loadEditRequests = async () => {
    setIsLoading(true)
    try {
      const response = await actions.getMyEditRequests(projectId)

      // Filter requests based on current filter
      const filteredRequests = response.editRequests?.filter(request => {
        if (filter === 'pending') return request.status === 'pending'
        if (filter === 'approved') return request.status === 'approved'
        if (filter === 'denied') return request.status === 'denied'
        return true
      }) || []

      setEditRequests(filteredRequests)
    } catch (error) {
      console.error('Failed to load edit requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      await actions.approveEditRequest(requestId, {
        approval_feedback: reviewForm.feedback,
        conditions: reviewForm.conditions
      })

      // Update local state
      setEditRequests(requests =>
        requests.map(req =>
          req.id === requestId
            ? { ...req, status: 'approved' }
            : req
        )
      )

      setSelectedRequest(null)
      setReviewForm({ action: '', feedback: '', conditions: '' })
    } catch (error) {
      console.error('Failed to approve request:', error)
    }
  }

  const handleDenyRequest = async (requestId) => {
    try {
      await actions.denyEditRequest(requestId, reviewForm.feedback)

      // Update local state
      setEditRequests(requests =>
        requests.map(req =>
          req.id === requestId
            ? { ...req, status: 'denied' }
            : req
        )
      )

      setSelectedRequest(null)
      setReviewForm({ action: '', feedback: '', conditions: '' })
    } catch (error) {
      console.error('Failed to deny request:', error)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff4757'
      case 'high': return '#ffa502'
      case 'normal': return '#2ed573'
      case 'low': return '#666666'
      default: return '#666666'
    }
  }

  const getEditTypeIcon = (editType) => {
    switch (editType) {
      case 'content_edit': return '📝'
      case 'design_change': return '🎨'
      case 'structural_change': return '🏗️'
      case 'correction': return '✏️'
      default: return '📄'
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const then = new Date(timestamp)
    const diffInHours = Math.floor((now - then) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return 'Yesterday'
    return then.toLocaleDateString()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#000000',
        border: '1px solid #333333',
        width: '90%',
        maxWidth: '1200px',
        height: '80%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #333333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: '#ffffff',
            fontSize: '18px'
          }}>
            Edit Request Management
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {['pending', 'approved', 'denied', 'all'].map(filterType => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  style={{
                    background: filter === filterType ? '#333333' : 'transparent',
                    border: '1px solid #666666',
                    color: '#ffffff',
                    padding: '4px 8px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  {filterType}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid #666666',
                color: '#ffffff',
                padding: '8px 12px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden'
        }}>
          {/* Request List */}
          <div style={{
            width: selectedRequest ? '40%' : '100%',
            borderRight: selectedRequest ? '1px solid #333333' : 'none',
            overflow: 'auto'
          }}>
            {isLoading ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666666'
              }}>
                Loading edit requests...
              </div>
            ) : editRequests.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666666'
              }}>
                No {filter !== 'all' ? filter : ''} edit requests found
              </div>
            ) : (
              <div>
                {editRequests.map(request => (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #222222',
                      cursor: 'pointer',
                      background: selectedRequest?.id === request.id ? '#111111' : 'transparent'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{ fontSize: '14px' }}>
                          {getEditTypeIcon(request.edit_type)}
                        </span>
                        <h4 style={{
                          margin: 0,
                          color: '#ffffff',
                          fontSize: '14px'
                        }}>
                          {request.title}
                        </h4>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span style={{
                          padding: '2px 6px',
                          fontSize: '9px',
                          background: getPriorityColor(request.priority),
                          color: '#ffffff',
                          textTransform: 'uppercase'
                        }}>
                          {request.priority}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          fontSize: '9px',
                          background: request.status === 'pending' ? '#ffa502'
                                   : request.status === 'approved' ? '#2ed573'
                                   : '#ff4757',
                          color: '#ffffff',
                          textTransform: 'uppercase'
                        }}>
                          {request.status}
                        </span>
                      </div>
                    </div>

                    <p style={{
                      margin: '0 0 8px 0',
                      color: '#cccccc',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {request.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '11px',
                        color: '#666666'
                      }}>
                        by {request.requester_name || 'Unknown'} • Section #{request.section_id?.slice(-6)}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: '#666666'
                      }}>
                        {formatTimeAgo(request.requested_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Request Details & Review */}
          {selectedRequest && (
            <div style={{
              width: '60%',
              overflow: 'auto',
              background: '#111111'
            }}>
              <div style={{ padding: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '16px' }}>
                    {getEditTypeIcon(selectedRequest.edit_type)}
                  </span>
                  <h3 style={{
                    margin: 0,
                    color: '#ffffff',
                    fontSize: '16px'
                  }}>
                    {selectedRequest.title}
                  </h3>
                  <span style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    background: selectedRequest.status === 'pending' ? '#ffa502'
                             : selectedRequest.status === 'approved' ? '#2ed573'
                             : '#ff4757',
                    color: '#ffffff',
                    textTransform: 'uppercase'
                  }}>
                    {selectedRequest.status}
                  </span>
                </div>

                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#000000',
                  border: '1px solid #333333'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    color: '#ffffff',
                    fontSize: '12px',
                    textTransform: 'uppercase'
                  }}>
                    Description
                  </h4>
                  <p style={{
                    margin: 0,
                    color: '#cccccc',
                    fontSize: '12px',
                    lineHeight: '1.5'
                  }}>
                    {selectedRequest.description}
                  </p>
                </div>

                {selectedRequest.change_reason && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#000000',
                    border: '1px solid #333333'
                  }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      color: '#ffffff',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}>
                      Reason
                    </h4>
                    <p style={{
                      margin: 0,
                      color: '#cccccc',
                      fontSize: '12px',
                      lineHeight: '1.5'
                    }}>
                      {selectedRequest.change_reason}
                    </p>
                  </div>
                )}

                {selectedRequest.proposed_changes && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#000000',
                    border: '1px solid #333333'
                  }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      color: '#ffffff',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}>
                      Proposed Changes
                    </h4>
                    <pre style={{
                      margin: 0,
                      color: '#cccccc',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      background: '#222222',
                      padding: '8px',
                      borderRadius: '2px'
                    }}>
                      {JSON.stringify(selectedRequest.proposed_changes, null, 2)}
                    </pre>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginBottom: '16px',
                  fontSize: '11px',
                  color: '#666666'
                }}>
                  <span>Priority: <strong style={{color: getPriorityColor(selectedRequest.priority)}}>{selectedRequest.priority}</strong></span>
                  <span>Type: <strong>{selectedRequest.edit_type.replace('_', ' ')}</strong></span>
                  <span>Requested: <strong>{formatTimeAgo(selectedRequest.requested_at)}</strong></span>
                </div>

                {selectedRequest.status === 'pending' && (
                  <div style={{
                    padding: '16px',
                    background: '#000000',
                    border: '1px solid #333333'
                  }}>
                    <h4 style={{
                      margin: '0 0 12px 0',
                      color: '#ffffff',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}>
                      Review Request
                    </h4>

                    <div style={{ marginBottom: '12px' }}>
                      <textarea
                        placeholder="Add feedback for the requester..."
                        value={reviewForm.feedback}
                        onChange={(e) => setReviewForm({...reviewForm, feedback: e.target.value})}
                        style={{
                          width: '100%',
                          background: '#111111',
                          border: '1px solid #333333',
                          color: '#ffffff',
                          padding: '8px',
                          fontSize: '12px',
                          minHeight: '80px',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <input
                        type="text"
                        placeholder="Add conditions for approval (optional)"
                        value={reviewForm.conditions}
                        onChange={(e) => setReviewForm({...reviewForm, conditions: e.target.value})}
                        style={{
                          width: '100%',
                          background: '#111111',
                          border: '1px solid #333333',
                          color: '#ffffff',
                          padding: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApproveRequest(selectedRequest.id)}
                        style={{
                          background: '#2ed573',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => handleDenyRequest(selectedRequest.id)}
                        style={{
                          background: '#ff4757',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Deny Request
                      </button>
                    </div>
                  </div>
                )}

                {selectedRequest.status !== 'pending' && (
                  <div style={{
                    padding: '16px',
                    background: '#000000',
                    border: '1px solid #333333'
                  }}>
                    <h4 style={{
                      margin: '0 0 8px 0',
                      color: '#ffffff',
                      fontSize: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {selectedRequest.status === 'approved' ? 'Approval' : 'Denial'} Details
                    </h4>
                    <p style={{
                      margin: 0,
                      color: '#cccccc',
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}>
                      {selectedRequest.status === 'approved'
                        ? `Approved on ${new Date(selectedRequest.approved_at).toLocaleDateString()}`
                        : `Denied on ${new Date(selectedRequest.denied_at).toLocaleDateString()}`
                      }
                      {selectedRequest.approval_feedback && (
                        <>
                          <br />
                          <strong>Feedback:</strong> {selectedRequest.approval_feedback}
                        </>
                      )}
                      {selectedRequest.denial_reason && (
                        <>
                          <br />
                          <strong>Reason:</strong> {selectedRequest.denial_reason}
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditRequestManager