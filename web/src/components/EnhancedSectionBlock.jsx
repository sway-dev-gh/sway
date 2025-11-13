import React, { useState, useRef, useEffect } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const EnhancedSectionBlock = ({ section, isSelected, onSelect, index, userPermissions = {} }) => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(section.title)
  const [editedContent, setEditedContent] = useState(section.content)
  const [showComments, setShowComments] = useState(false)
  const [showEditRequest, setShowEditRequest] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState('general')
  const [collapsed, setCollapsed] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const textareaRef = useRef(null)

  // Edit request form state
  const [editRequestForm, setEditRequestForm] = useState({
    title: '',
    description: '',
    editType: 'content_edit',
    reason: '',
    priority: 'normal'
  })

  // Get section data with backend integration
  const sectionData = state.sections[section.id] || section
  const comments = (sectionData.comments || []).map(commentId => state.comments[commentId]).filter(Boolean)
  const editRequests = sectionData.editRequests || []

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

  // Load comments when section is expanded
  useEffect(() => {
    if (showComments && !isLoadingComments && comments.length === 0) {
      loadComments()
    }
  }, [showComments])

  const loadComments = async () => {
    setIsLoadingComments(true)
    try {
      await actions.loadSectionComments(section.id)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleSave = () => {
    actions.updateSection(section.id, {
      title: editedTitle,
      content: editedContent
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTitle(section.title)
    setEditedContent(section.content)
    setIsEditing(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setIsAddingComment(true)
    try {
      await actions.addComment(section.id, newComment.trim(), state.user?.name || 'You', commentType)
      setNewComment('')
      setCommentType('general')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsAddingComment(false)
    }
  }

  const handleResolveComment = async (commentId, resolved) => {
    try {
      await actions.resolveComment(commentId, resolved)
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  }

  const handleSubmitEditRequest = async () => {
    if (!editRequestForm.title.trim() || !editRequestForm.description.trim()) {
      return
    }

    try {
      await actions.requestSectionEdit(section.id, {
        title: editRequestForm.title,
        description: editRequestForm.description,
        editType: editRequestForm.editType,
        reason: editRequestForm.reason,
        priority: editRequestForm.priority,
        proposedChanges: {
          content: editedContent,
          title: editedTitle
        }
      })

      setShowEditRequest(false)
      setEditRequestForm({
        title: '',
        description: '',
        editType: 'content_edit',
        reason: '',
        priority: 'normal'
      })
    } catch (error) {
      console.error('Failed to submit edit request:', error)
    }
  }

  const handleWorkflowChange = (newState) => {
    actions.updateWorkflowState(section.id, newState)
  }

  const getWorkflowColor = (state) => {
    switch (state) {
      case WORKFLOW_STATES.DRAFT: return '#666666'
      case WORKFLOW_STATES.UNDER_REVIEW: return '#ffa502'
      case WORKFLOW_STATES.CHANGES_REQUESTED: return '#ff4757'
      case WORKFLOW_STATES.APPROVED: return '#2ed573'
      case WORKFLOW_STATES.DELIVERED: return '#1e90ff'
      default: return '#666666'
    }
  }

  const getNextWorkflowState = (currentState) => {
    switch (currentState) {
      case WORKFLOW_STATES.DRAFT:
        return WORKFLOW_STATES.UNDER_REVIEW
      case WORKFLOW_STATES.UNDER_REVIEW:
        return WORKFLOW_STATES.APPROVED
      case WORKFLOW_STATES.CHANGES_REQUESTED:
        return WORKFLOW_STATES.UNDER_REVIEW
      case WORKFLOW_STATES.APPROVED:
        return WORKFLOW_STATES.DELIVERED
      default:
        return currentState
    }
  }

  const getWorkflowActionText = (currentState) => {
    switch (currentState) {
      case WORKFLOW_STATES.DRAFT:
        return 'Submit for Review'
      case WORKFLOW_STATES.UNDER_REVIEW:
        return 'Approve'
      case WORKFLOW_STATES.CHANGES_REQUESTED:
        return 'Resubmit'
      case WORKFLOW_STATES.APPROVED:
        return 'Mark Delivered'
      default:
        return 'Update'
    }
  }

  const getCommentTypeColor = (type) => {
    switch (type) {
      case 'suggestion': return '#ffa502'
      case 'issue': return '#ff4757'
      case 'approval': return '#2ed573'
      case 'question': return '#5352ed'
      default: return '#666666'
    }
  }

  const canEdit = userPermissions.can_edit || state.user?.role !== 'viewer'
  const canReview = userPermissions.can_review || ['editor', 'reviewer', 'owner'].includes(state.user?.role)
  const canComment = true // Everyone can comment
  const canRequestEdit = !canEdit // Viewers can request edits

  return (
    <div
      style={{
        border: '1px solid #333333',
        marginBottom: '1px',
        background: isSelected ? '#111111' : '#000000',
        borderLeft: `3px solid ${getWorkflowColor(sectionData.workflowState)}`,
        position: 'relative'
      }}
    >
      {/* Drag Handle */}
      <div style={{
        position: 'absolute',
        left: '8px',
        top: '16px',
        cursor: 'grab',
        color: '#666666',
        fontSize: '12px',
        userSelect: 'none'
      }}>
        ⋮⋮
      </div>

      {/* Section Header */}
      <div style={{
        padding: '16px 16px 12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1, marginRight: '12px' }}>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                width: '100%',
                outline: 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                } else if (e.key === 'Escape') {
                  handleCancel()
                }
              }}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: 0
                }}
              >
                {collapsed ? '▶' : '▼'}
              </button>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  margin: 0,
                  cursor: canEdit ? 'pointer' : 'default'
                }}
                onClick={() => canEdit && setIsEditing(true)}
              >
                {section.title}
              </h3>
              <div style={{
                fontSize: '10px',
                color: '#666666'
              }}>
                #{index + 1}
              </div>
            </div>
          )}
        </div>

        {/* Section Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}>
          {/* Workflow State Badge */}
          <div style={{
            padding: '2px 6px',
            fontSize: '9px',
            background: getWorkflowColor(sectionData.workflowState),
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {sectionData.workflowState?.replace('_', ' ') || 'DRAFT'}
          </div>

          {/* Edit Requests Badge */}
          {editRequests.length > 0 && (
            <div style={{
              padding: '2px 6px',
              fontSize: '9px',
              background: '#ff6b6b',
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {editRequests.length} Edit Requests
            </div>
          )}

          {/* Comments Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              background: 'none',
              border: '1px solid #666666',
              color: '#ffffff',
              padding: '2px 6px',
              fontSize: '9px',
              cursor: 'pointer'
            }}
          >
            {comments.length} comments
          </button>

          {/* Edit/Action Buttons */}
          {isEditing ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={handleSave}
                style={{
                  background: '#2ed573',
                  color: '#000000',
                  border: 'none',
                  padding: '2px 6px',
                  fontSize: '9px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                style={{
                  background: 'none',
                  color: '#ffffff',
                  border: '1px solid #666666',
                  padding: '2px 6px',
                  fontSize: '9px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              {/* Request Edit Button for Viewers */}
              {canRequestEdit && (
                <button
                  onClick={() => setShowEditRequest(true)}
                  style={{
                    background: '#ffa502',
                    color: '#ffffff',
                    border: 'none',
                    padding: '2px 6px',
                    fontSize: '9px',
                    cursor: 'pointer'
                  }}
                >
                  Request Edit
                </button>
              )}

              {/* Workflow Actions for Editors/Reviewers */}
              {canReview && sectionData.workflowState !== WORKFLOW_STATES.DELIVERED && (
                <button
                  onClick={() => handleWorkflowChange(getNextWorkflowState(sectionData.workflowState))}
                  style={{
                    background: 'none',
                    border: '1px solid #666666',
                    color: '#ffffff',
                    padding: '2px 6px',
                    fontSize: '9px',
                    cursor: 'pointer'
                  }}
                >
                  {getWorkflowActionText(sectionData.workflowState)}
                </button>
              )}

              {canReview && sectionData.workflowState === WORKFLOW_STATES.UNDER_REVIEW && (
                <button
                  onClick={() => handleWorkflowChange(WORKFLOW_STATES.CHANGES_REQUESTED)}
                  style={{
                    background: '#ff4757',
                    color: '#ffffff',
                    border: 'none',
                    padding: '2px 6px',
                    fontSize: '9px',
                    cursor: 'pointer'
                  }}
                >
                  Request Changes
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Content */}
      {!collapsed && (
        <div style={{
          padding: '0 16px 16px 32px'
        }}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Enter section content..."
              style={{
                width: '100%',
                background: '#111111',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '8px',
                fontSize: '12px',
                lineHeight: '1.5',
                resize: 'none',
                minHeight: '100px',
                outline: 'none'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
          ) : (
            <div
              onClick={() => canEdit && setIsEditing(true)}
              style={{
                minHeight: '60px',
                padding: '8px',
                border: '1px solid transparent',
                fontSize: '12px',
                lineHeight: '1.5',
                color: section.content ? '#ffffff' : '#666666',
                cursor: canEdit ? 'text' : 'default',
                whiteSpace: 'pre-wrap'
              }}
            >
              {section.content || 'Click to add content...'}
            </div>
          )}
        </div>
      )}

      {/* Edit Request Form */}
      {showEditRequest && !collapsed && (
        <div style={{
          borderTop: '1px solid #333333',
          background: '#111111',
          padding: '12px 16px 12px 32px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#ffa502',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Request Edit Access
          </div>

          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Request title (e.g., 'Fix spelling errors')"
              value={editRequestForm.title}
              onChange={(e) => setEditRequestForm({ ...editRequestForm, title: e.target.value })}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '4px 6px',
                fontSize: '11px',
                marginBottom: '4px'
              }}
            />
            <textarea
              placeholder="Describe the changes you want to make..."
              value={editRequestForm.description}
              onChange={(e) => setEditRequestForm({ ...editRequestForm, description: e.target.value })}
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '4px 6px',
                fontSize: '11px',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
            <select
              value={editRequestForm.editType}
              onChange={(e) => setEditRequestForm({ ...editRequestForm, editType: e.target.value })}
              style={{
                background: '#000000',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '4px 6px',
                fontSize: '10px'
              }}
            >
              <option value="content_edit">Content Edit</option>
              <option value="design_change">Design Change</option>
              <option value="structural_change">Structural Change</option>
              <option value="correction">Correction</option>
            </select>

            <select
              value={editRequestForm.priority}
              onChange={(e) => setEditRequestForm({ ...editRequestForm, priority: e.target.value })}
              style={{
                background: '#000000',
                border: '1px solid #333333',
                color: '#ffffff',
                padding: '4px 6px',
                fontSize: '10px'
              }}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleSubmitEditRequest}
              disabled={!editRequestForm.title.trim() || !editRequestForm.description.trim()}
              style={{
                background: '#ffa502',
                color: '#ffffff',
                border: 'none',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                disabled: 'not-allowed'
              }}
            >
              Submit Request
            </button>
            <button
              onClick={() => setShowEditRequest(false)}
              style={{
                background: 'none',
                color: '#ffffff',
                border: '1px solid #666666',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && !collapsed && (
        <div style={{
          borderTop: '1px solid #333333',
          background: '#111111',
          padding: '12px 16px 12px 32px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#999999',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Comments ({comments.length})
            {isLoadingComments && ' - Loading...'}
          </div>

          {/* Existing Comments */}
          <div style={{ marginBottom: '12px' }}>
            {comments.length === 0 && !isLoadingComments ? (
              <div style={{
                color: '#666666',
                fontSize: '11px',
                fontStyle: 'italic'
              }}>
                No comments yet
              </div>
            ) : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  style={{
                    padding: '6px 0',
                    borderBottom: '1px solid #222222',
                    opacity: comment.resolved ? 0.6 : 1
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        color: '#999999',
                        fontWeight: 'bold'
                      }}>
                        {comment.author}
                      </span>
                      {comment.commentType && comment.commentType !== 'general' && (
                        <span style={{
                          fontSize: '8px',
                          color: getCommentTypeColor(comment.commentType),
                          padding: '1px 4px',
                          background: getCommentTypeColor(comment.commentType) + '20',
                          textTransform: 'uppercase'
                        }}>
                          {comment.commentType}
                        </span>
                      )}
                      {comment.resolved && (
                        <span style={{
                          fontSize: '8px',
                          color: '#2ed573',
                          padding: '1px 4px',
                          background: '#2ed57320',
                          textTransform: 'uppercase'
                        }}>
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{
                        fontSize: '9px',
                        color: '#666666'
                      }}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      {canReview && (
                        <button
                          onClick={() => handleResolveComment(comment.id, !comment.resolved)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: comment.resolved ? '#2ed573' : '#666666',
                            fontSize: '8px',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                        >
                          {comment.resolved ? '↻' : '✓'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#ffffff',
                    lineHeight: '1.4'
                  }}>
                    {comment.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Comment */}
          {canComment && (
            <div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  style={{
                    background: '#000000',
                    border: '1px solid #333333',
                    color: '#ffffff',
                    padding: '2px 4px',
                    fontSize: '9px'
                  }}
                >
                  <option value="general">General</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="issue">Issue</option>
                  <option value="question">Question</option>
                  <option value="approval">Approval</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#000000',
                    border: '1px solid #333333',
                    color: '#ffffff',
                    padding: '4px 6px',
                    fontSize: '11px'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAddingComment) {
                      handleAddComment()
                    }
                  }}
                  disabled={isAddingComment}
                />
                <button
                  onClick={handleAddComment}
                  disabled={isAddingComment || !newComment.trim()}
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    border: 'none',
                    padding: '4px 8px',
                    fontSize: '10px',
                    cursor: isAddingComment ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAddingComment ? 'Adding...' : 'Comment'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnhancedSectionBlock