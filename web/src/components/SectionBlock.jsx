import React, { useState, useRef, useEffect } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'

const SectionBlock = ({ section, isSelected, onSelect, index }) => {
  const { state, actions, WORKFLOW_STATES } = useWorkspace()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(section.title)
  const [editedContent, setEditedContent] = useState(section.content)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Auto-resize textarea
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [isEditing])

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

  const handleAddComment = () => {
    if (newComment.trim()) {
      actions.addComment(section.id, newComment.trim())
      setNewComment('')
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

  const comments = section.comments.map(commentId => state.comments[commentId]).filter(Boolean)

  return (
    <div
      style={{
        border: '1px solid #333333',
        marginBottom: '1px',
        background: isSelected ? '#111111' : '#000000',
        borderLeft: `3px solid ${getWorkflowColor(section.workflowState)}`,
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
                  cursor: 'pointer'
                }}
                onClick={() => setIsEditing(true)}
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
          <div style={{
            padding: '2px 6px',
            fontSize: '9px',
            background: getWorkflowColor(section.workflowState),
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {section.workflowState.replace('_', ' ')}
          </div>

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
              {section.workflowState !== WORKFLOW_STATES.DELIVERED && (
                <button
                  onClick={() => handleWorkflowChange(getNextWorkflowState(section.workflowState))}
                  style={{
                    background: 'none',
                    border: '1px solid #666666',
                    color: '#ffffff',
                    padding: '2px 6px',
                    fontSize: '9px',
                    cursor: 'pointer'
                  }}
                >
                  {getWorkflowActionText(section.workflowState)}
                </button>
              )}

              {section.workflowState === WORKFLOW_STATES.UNDER_REVIEW && (
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
                // Auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              style={{
                minHeight: '60px',
                padding: '8px',
                border: '1px solid transparent',
                fontSize: '12px',
                lineHeight: '1.5',
                color: section.content ? '#ffffff' : '#666666',
                cursor: 'text',
                whiteSpace: 'pre-wrap'
              }}
            >
              {section.content || 'Click to add content...'}
            </div>
          )}
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
          </div>

          {/* Existing Comments */}
          <div style={{ marginBottom: '12px' }}>
            {comments.length === 0 ? (
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
                    borderBottom: '1px solid #222222'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#999999',
                      fontWeight: 'bold'
                    }}>
                      {comment.author}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      color: '#666666'
                    }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
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
                if (e.key === 'Enter') {
                  handleAddComment()
                }
              }}
            />
            <button
              onClick={handleAddComment}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                padding: '4px 8px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Comment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SectionBlock