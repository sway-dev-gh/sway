import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useReviewStore from '../store/reviewStore'
import theme from '../theme'
import { standardStyles } from './StandardStyles'
import toast from 'react-hot-toast'

const SectionReviewInterface = ({ sectionId, onClose }) => {
  const [reviewData, setReviewData] = useState({
    review_status: 'pending',
    review_notes: '',
    review_score: 3,
    is_final_approval: false
  })
  const [commentText, setCommentText] = useState('')
  const [commentType, setCommentType] = useState('general')
  const [selectedText, setSelectedText] = useState('')
  const [lineNumber, setLineNumber] = useState(null)

  const {
    currentSection,
    reviews,
    comments,
    isLoading,
    error,
    fetchSection,
    submitReview,
    addComment
  } = useReviewStore()

  useEffect(() => {
    if (sectionId) {
      fetchSection(sectionId)
    }
  }, [sectionId, fetchSection])

  const handleSubmitReview = async () => {
    try {
      await submitReview(sectionId, reviewData)
      toast.success('Review submitted successfully!')
      setReviewData({
        review_status: 'pending',
        review_notes: '',
        review_score: 3,
        is_final_approval: false
      })
    } catch (error) {
      toast.error('Failed to submit review')
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return

    try {
      await addComment(sectionId, {
        comment_text: commentText,
        comment_type: commentType,
        highlighted_text: selectedText || null,
        line_number: lineNumber
      })

      setCommentText('')
      setSelectedText('')
      setLineNumber(null)
      toast.success('Comment added successfully!')
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    if (text) {
      setSelectedText(text)
      // Try to estimate line number based on selection
      const range = selection.getRangeAt(0)
      const preText = range.startContainer.textContent.substring(0, range.startOffset)
      const lineNum = preText.split('\n').length
      setLineNumber(lineNum)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: '#525252',
      under_review: '#1e40af',
      changes_requested: '#dc2626',
      approved: '#059669'
    }
    return colors[status] || '#525252'
  }

  const getStatusBackground = (status) => {
    const backgrounds = {
      draft: '#262626',
      under_review: '#1e3a8a',
      changes_requested: '#991b1b',
      approved: '#047857'
    }
    return backgrounds[status] || '#262626'
  }

  if (isLoading) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: theme.colors.text.secondary
      }}>
        Loading section details...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: theme.colors.text.secondary
      }}>
        Error: {error}
      </div>
    )
  }

  if (!currentSection) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: theme.colors.text.secondary
      }}>
        Section not found
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.bg.page,
      color: theme.colors.text.primary
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: theme.colors.bg.page,
        borderBottom: `1px solid ${theme.colors.border.light}`,
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <div>
          <h1 style={{
            ...standardStyles.sectionHeader,
            margin: '0 0 4px 0'
          }}>
            {currentSection.section_name}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{
              fontSize: '13px',
              color: theme.colors.text.secondary
            }}>
              {currentSection.filename}
            </span>
            <div style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: theme.weight.medium,
              color: getStatusColor(currentSection.section_status),
              background: getStatusBackground(currentSection.section_status),
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {currentSection.section_status?.replace('_', ' ')}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              ...standardStyles.secondaryButton,
              padding: '8px 16px'
            }}
          >
            Close
          </button>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '32px',
        padding: '32px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* Main Content Area */}
        <div style={{
          background: '#000000',
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Section Content */}
          <div style={{
            padding: '24px',
            borderBottom: `1px solid ${theme.colors.border.light}`
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              margin: '0 0 16px 0'
            }}>
              Section Content
            </h3>

            <div style={{
              background: '#0a0a0a',
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: '6px',
              padding: '16px',
              minHeight: '200px',
              fontFamily: 'Monaco, Menlo, monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              userSelect: 'text',
              cursor: 'text'
            }}
            onMouseUp={handleTextSelection}
            >
              {currentSection.description || 'No content available for this section.'}
              {currentSection.section_data && typeof currentSection.section_data === 'object' && (
                <div style={{ marginTop: '16px' }}>
                  {JSON.stringify(currentSection.section_data, null, 2)}
                </div>
              )}
            </div>

            {selectedText && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#93c5fd'
              }}>
                Selected: "{selectedText}" (Line {lineNumber})
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div style={{ padding: '24px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              margin: '0 0 16px 0'
            }}>
              Comments ({comments.length})
            </h3>

            {/* Add Comment Form */}
            <div style={{
              background: '#0a0a0a',
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <select
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  style={{
                    background: '#000000',
                    border: `1px solid ${theme.colors.border.medium}`,
                    borderRadius: '4px',
                    padding: '6px 10px',
                    color: theme.colors.text.primary,
                    fontSize: '12px',
                    marginBottom: '8px'
                  }}
                >
                  <option value="general">General Comment</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="issue">Issue</option>
                  <option value="question">Question</option>
                  <option value="approval">Approval Note</option>
                </select>
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  background: '#000000',
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '4px',
                  padding: '12px',
                  color: theme.colors.text.primary,
                  fontSize: '13px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />

              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || isLoading}
                style={{
                  ...standardStyles.primaryButton,
                  opacity: !commentText.trim() ? 0.5 : 1
                }}
              >
                Add Comment
              </button>
            </div>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    background: '#0a0a0a',
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: '6px',
                    padding: '16px',
                    borderLeft: `3px solid ${
                      comment.comment_type === 'issue' ? '#dc2626' :
                      comment.comment_type === 'suggestion' ? '#059669' :
                      comment.comment_type === 'approval' ? '#2563eb' :
                      theme.colors.border.medium
                    }`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.text.secondary
                    }}>
                      {comment.commenter_name} • {comment.comment_type}
                      {comment.line_number && (
                        <span> • Line {comment.line_number}</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: theme.colors.text.tertiary
                    }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {comment.highlighted_text && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      marginBottom: '8px',
                      fontSize: '12px',
                      color: '#93c5fd'
                    }}>
                      "{comment.highlighted_text}"
                    </div>
                  )}

                  <div style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: theme.colors.text.primary
                  }}>
                    {comment.comment_text}
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: theme.colors.text.secondary,
                  fontSize: '13px'
                }}>
                  No comments yet. Add one above to start the discussion.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review Panel */}
        <div style={{
          background: '#000000',
          border: `1px solid ${theme.colors.border.light}`,
          borderRadius: '8px',
          padding: '24px',
          height: 'fit-content',
          position: 'sticky',
          top: '120px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: theme.weight.semibold,
            color: theme.colors.text.primary,
            margin: '0 0 20px 0'
          }}>
            Submit Review
          </h3>

          {/* Review Status */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.secondary,
              marginBottom: '6px'
            }}>
              Review Decision
            </label>
            <select
              value={reviewData.review_status}
              onChange={(e) => setReviewData({
                ...reviewData,
                review_status: e.target.value
              })}
              style={{
                width: '100%',
                background: '#0a0a0a',
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '4px',
                padding: '10px 12px',
                color: theme.colors.text.primary,
                fontSize: '13px'
              }}
            >
              <option value="pending">Pending</option>
              <option value="reviewing">In Review</option>
              <option value="approved">Approve</option>
              <option value="changes_requested">Request Changes</option>
              <option value="rejected">Reject</option>
            </select>
          </div>

          {/* Review Score */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.secondary,
              marginBottom: '6px'
            }}>
              Quality Score (1-5)
            </label>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px'
            }}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setReviewData({
                    ...reviewData,
                    review_score: score
                  })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    border: `1px solid ${theme.colors.border.medium}`,
                    background: reviewData.review_score >= score ? theme.colors.white : '#0a0a0a',
                    color: reviewData.review_score >= score ? '#000000' : theme.colors.text.secondary,
                    fontSize: '12px',
                    fontWeight: theme.weight.medium,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Review Notes */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: theme.weight.medium,
              color: theme.colors.text.secondary,
              marginBottom: '6px'
            }}>
              Review Notes
            </label>
            <textarea
              value={reviewData.review_notes}
              onChange={(e) => setReviewData({
                ...reviewData,
                review_notes: e.target.value
              })}
              placeholder="Optional notes about your review..."
              style={{
                width: '100%',
                minHeight: '100px',
                background: '#0a0a0a',
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: '4px',
                padding: '12px',
                color: theme.colors.text.primary,
                fontSize: '13px',
                lineHeight: '1.5',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Final Approval Checkbox */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              color: theme.colors.text.secondary
            }}>
              <input
                type="checkbox"
                checked={reviewData.is_final_approval}
                onChange={(e) => setReviewData({
                  ...reviewData,
                  is_final_approval: e.target.checked
                })}
                style={{
                  width: '16px',
                  height: '16px'
                }}
              />
              Mark as final approval
            </label>
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={isLoading}
            style={{
              ...standardStyles.primaryButton,
              width: '100%',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </button>

          {/* Current Reviews */}
          {reviews.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                margin: '0 0 12px 0'
              }}>
                Previous Reviews ({reviews.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      background: '#0a0a0a',
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '4px',
                      padding: '12px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <span style={{ color: theme.colors.text.primary }}>
                        {review.reviewer_name}
                      </span>
                      <span style={{
                        color: getStatusColor(review.review_status),
                        fontWeight: theme.weight.medium
                      }}>
                        {review.review_status}
                      </span>
                    </div>
                    {review.review_notes && (
                      <div style={{
                        color: theme.colors.text.secondary,
                        marginTop: '4px'
                      }}>
                        {review.review_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SectionReviewInterface