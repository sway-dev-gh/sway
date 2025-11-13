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
        border: '1px solid #ffffff',
        marginBottom: '16px',
        background: '#000000',
        position: 'relative'
      }}
    >
      {/* Terminal Block Header */}
      <div style={{
        borderBottom: '1px solid #ffffff',
        padding: '8px 12px',
        background: '#000000',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}>
        ┌─[SECTION #{index + 1}]───[{section.workflowState.replace('_', '-')}]─┐
      </div>

      {/* Title and Controls Block */}
      <div style={{
        padding: '12px',
        borderBottom: !collapsed ? '1px solid #ffffff' : 'none',
        background: '#000000'
      }}>
        {isEditing ? (
          <div>
            <div style={{
              marginBottom: '8px',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#ffffff',
              textTransform: 'uppercase'
            }}>
              │ EDIT TITLE:
            </div>
            <div style={{ border: '1px solid #ffffff', background: '#000000' }}>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                style={{
                  background: '#000000',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  width: '100%',
                  outline: 'none',
                  padding: '8px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave()
                  } else if (e.key === 'Escape') {
                    handleCancel()
                  }
                }}
              />
            </div>
            <div style={{
              marginTop: '8px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={handleSave}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                [SAVE]
              </button>
              <button
                onClick={handleCancel}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                [CANCEL]
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  background: '#000000',
                  border: '1px solid #ffffff',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '10px',
                  padding: '2px 6px',
                  fontFamily: 'monospace',
                  fontWeight: 'bold'
                }}
              >
                {collapsed ? '[+]' : '[-]'}
              </button>
              <div
                style={{
                  fontSize: '14px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  flex: 1
                }}
                onClick={() => setIsEditing(true)}
              >
                │ {section.title}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              fontSize: '10px',
              fontFamily: 'monospace',
              textTransform: 'uppercase'
            }}>
              <button
                onClick={() => setShowComments(!showComments)}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontWeight: 'bold'
                }}
              >
                [COMMENTS: {comments.length}]
              </button>

              {section.workflowState !== WORKFLOW_STATES.DELIVERED && (
                <button
                  onClick={() => handleWorkflowChange(getNextWorkflowState(section.workflowState))}
                  style={{
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid #ffffff',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}
                >
                  [{getWorkflowActionText(section.workflowState).toUpperCase()}]
                </button>
              )}

              {section.workflowState === WORKFLOW_STATES.UNDER_REVIEW && (
                <button
                  onClick={() => handleWorkflowChange(WORKFLOW_STATES.CHANGES_REQUESTED)}
                  style={{
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid #ffffff',
                    padding: '2px 8px',
                    cursor: 'pointer',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}
                >
                  [REQUEST CHANGES]
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content Block */}
      {!collapsed && (
        <div style={{
          padding: '12px',
          borderBottom: showComments ? '1px solid #ffffff' : 'none'
        }}>
          <div style={{
            marginBottom: '8px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff',
            textTransform: 'uppercase'
          }}>
            │ CONTENT:
          </div>

          {isEditing ? (
            <div style={{
              border: '1px solid #ffffff',
              background: '#000000'
            }}>
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="> enter content..."
                style={{
                  width: '100%',
                  background: '#000000',
                  border: 'none',
                  color: '#ffffff',
                  padding: '12px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  resize: 'none',
                  minHeight: '100px',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
              />
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              style={{
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #ffffff',
                fontSize: '12px',
                lineHeight: '1.5',
                color: section.content ? '#ffffff' : '#ffffff',
                cursor: 'pointer',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                background: '#000000'
              }}
            >
              {section.content || '> click to edit content...'}
            </div>
          )}
        </div>
      )}

      {/* Comments Block */}
      {showComments && !collapsed && (
        <div style={{
          padding: '12px',
          background: '#000000'
        }}>
          <div style={{
            marginBottom: '8px',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            │ COMMENTS ({comments.length}):
          </div>

          {/* Comment List */}
          <div style={{ marginBottom: '12px' }}>
            {comments.length === 0 ? (
              <div style={{
                border: '1px solid #ffffff',
                padding: '8px',
                background: '#000000',
                color: '#ffffff',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>
                > no comments
              </div>
            ) : (
              comments.map(comment => (
                <div
                  key={comment.id}
                  style={{
                    border: '1px solid #ffffff',
                    padding: '8px',
                    marginBottom: '4px',
                    background: '#000000'
                  }}
                >
                  <div style={{
                    fontSize: '10px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    marginBottom: '4px',
                    fontWeight: 'bold'
                  }}>
                    [{sanitizeText(comment.author)}] - {new Date(comment.createdAt).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#ffffff',
                    lineHeight: '1.4',
                    fontFamily: 'monospace'
                  }}>
                    {sanitizeDescription(comment.content)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Block */}
          <div style={{
            border: '1px solid #ffffff',
            padding: '8px',
            background: '#000000'
          }}>
            <div style={{
              marginBottom: '6px',
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#ffffff',
              fontWeight: 'bold'
            }}>
              ADD COMMENT:
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="> enter comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  background: '#000000',
                  border: '1px solid #ffffff',
                  color: '#ffffff',
                  padding: '6px 8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  outline: 'none'
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
                  background: '#000000',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  padding: '6px 12px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                [ADD]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Block Footer */}
      <div style={{
        padding: '8px 12px',
        background: '#000000',
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontWeight: 'bold'
      }}>
        └─────────────────────────────────────────┘
      </div>
    </div>
  )
}

export default SectionBlock