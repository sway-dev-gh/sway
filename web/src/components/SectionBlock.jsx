import React, { useState, useRef, useEffect } from 'react'
import { useWorkspace } from '../stores/WorkspaceStore'
import { sanitizeText, sanitizeDescription } from '../utils/sanitization'

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
        border: '1px solid rgba(255, 255, 255, 0.06)',
        marginBottom: '12px',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(0, 0, 0, 0.98) 100%)',
        borderLeft: `3px solid ${getWorkflowColor(section.workflowState)}`,
        borderRadius: '12px',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        boxShadow: isSelected
          ? '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 255, 255, 0.02)'
          : '0 2px 10px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Drag Handle */}
      <div style={{
        position: 'absolute',
        left: '12px',
        top: '20px',
        cursor: 'grab',
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: '14px',
        userSelect: 'none',
        transition: 'color 0.2s ease'
      }}
      onMouseEnter={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
      onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.3)'}
      >
        ⋮⋮
      </div>

      {/* Section Header */}
      <div style={{
        padding: '20px 20px 16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: !collapsed ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
      }}>
        <div style={{ flex: 1, marginRight: '12px' }}>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: '600',
                width: '100%',
                outline: 'none',
                padding: '8px 12px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.01em',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)'
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.02)'
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
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
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '4px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  padding: '4px 6px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.target.style.color = 'rgba(255, 255, 255, 0.8)'
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.02)'
                  e.target.style.color = 'rgba(255, 255, 255, 0.6)'
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                {collapsed ? '▶' : '▼'}
              </button>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  transition: 'color 0.2s ease'
                }}
                onClick={() => setIsEditing(true)}
                onMouseEnter={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
                onMouseLeave={(e) => e.target.style.color = '#ffffff'}
              >
                {section.title}
              </h3>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '2px 8px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: '500',
                letterSpacing: '0.02em'
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
            padding: '4px 8px',
            fontSize: '9px',
            background: `linear-gradient(135deg, ${getWorkflowColor(section.workflowState)}90, ${getWorkflowColor(section.workflowState)}60)`,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderRadius: '4px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: '600',
            boxShadow: `0 0 8px ${getWorkflowColor(section.workflowState)}30`
          }}>
            {section.workflowState.replace('_', ' ')}
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              padding: '4px 8px',
              fontSize: '9px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: '500',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.04)'
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)'
              e.target.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.02)'
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.target.style.color = 'rgba(255, 255, 255, 0.8)'
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
                      {sanitizeText(comment.author)}
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
                    {sanitizeDescription(comment.content)}
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