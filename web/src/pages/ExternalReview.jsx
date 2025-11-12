import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const ExternalReview = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [file, setFile] = useState(null)
  const [sections, setSections] = useState([])
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [reviewerName, setReviewerName] = useState('')

  useEffect(() => {
    fetchExternalData()
  }, [token])

  const fetchExternalData = async () => {
    try {
      // Fetch project and file data using the external token
      const response = await fetch(`/api/external/${token}`)

      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          setError('Invalid or expired link')
        } else {
          setError('Failed to load review')
        }
        return
      }

      const data = await response.json()
      setProject(data.project)
      setFile(data.file)
      setSections(data.file.sections || [])

      // Fetch comments
      const commentsData = data.comments || []
      const commentsBySection = {}
      commentsData.forEach(comment => {
        if (!commentsBySection[comment.section_id]) {
          commentsBySection[comment.section_id] = []
        }
        commentsBySection[comment.section_id].push(comment)
      })
      setComments(commentsBySection)
    } catch (error) {
      console.error('Failed to fetch external data:', error)
      setError('Failed to load review')
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async (sectionId) => {
    if (!newComment.trim() || !reviewerName.trim()) return

    try {
      const response = await fetch(`/api/external/${token}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          section_id: sectionId,
          content: newComment,
          reviewer_name: reviewerName
        })
      })

      if (response.ok) {
        setNewComment('')
        await fetchExternalData()
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
    }
  }

  const updateSectionStatus = async (sectionId, status, feedback = '') => {
    if (!reviewerName.trim()) return

    try {
      const response = await fetch(`/api/external/${token}/sections/${sectionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          feedback,
          reviewer_name: reviewerName
        })
      })

      if (response.ok) {
        await fetchExternalData()
      }
    } catch (error) {
      console.error('Failed to update section status:', error)
    }
  }

  const getStatusColor = (status) => {
    const statusMap = {
      'draft': '#666666',
      'under_review': '#ffffff',
      'changes_requested': '#ff6b6b',
      'approved': '#51cf66'
    }
    return statusMap[status] || '#666666'
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      'draft': 'Draft',
      'under_review': 'Under Review',
      'changes_requested': 'Changes Requested',
      'approved': 'Approved'
    }
    return statusMap[status] || 'Draft'
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading review...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#ffffff',
          margin: 0
        }}>
          {error}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#a3a3a3',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          This review link may have expired or been removed. Please contact the project owner for a new link.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff'
    }}>
      {/* Header Bar */}
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #333333',
        borderLeft: 'none',
        borderRight: 'none',
        padding: '16px 32px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#ffffff'
          }}>
            SwayFiles External Review
          </div>
          <div style={{
            fontSize: '14px',
            color: '#a3a3a3'
          }}>
            •
          </div>
          <div style={{
            fontSize: '14px',
            color: '#a3a3a3'
          }}>
            {project?.title}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '48px 32px'
      }}>

        {/* Header */}
        <div style={{
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 8px 0'
          }}>
            {file?.name}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            fontSize: '14px',
            color: '#a3a3a3',
            marginBottom: '24px'
          }}>
            <div>Project: {project?.title}</div>
            <div>Type: {file?.type}</div>
            <div>Sections: {sections.length}</div>
            <div>Total Comments: {Object.values(comments).flat().length}</div>
          </div>

          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '8px'
            }}>
              <label style={{
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: '500'
              }}>
                Your Name (required for comments/approvals):
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                style={{
                  background: '#000000',
                  border: '1px solid #333333',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  width: '200px'
                }}
                placeholder="Enter your name"
              />
            </div>
            <div style={{
              fontSize: '12px',
              color: '#a3a3a3'
            }}>
              No account required - your name will be shown with your feedback
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '32px'
        }}>

          {/* File Content & Sections */}
          <div>
            {/* File Content */}
            {file?.content && (
              <div style={{
                background: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '24px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0 0 16px 0'
                }}>
                  File Content
                </h3>
                <div style={{
                  fontSize: '14px',
                  color: '#a3a3a3',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {file.content}
                </div>
              </div>
            )}

            {/* Sections */}
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 24px 0'
              }}>
                Review Sections
              </h3>

              {sections.map(section => (
                <div
                  key={section.id}
                  style={{
                    background: '#1a1a1a',
                    border: `2px solid ${activeSectionId === section.id ? '#ffffff' : '#333333'}`,
                    borderRadius: '8px',
                    padding: '24px',
                    marginBottom: '24px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#ffffff',
                      margin: 0
                    }}>
                      {section.title}
                    </h4>
                    <div style={{
                      padding: '4px 8px',
                      background: getStatusColor(section.status),
                      color: '#000000',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'uppercase'
                    }}>
                      {getStatusLabel(section.status)}
                    </div>
                  </div>

                  {section.content && (
                    <div style={{
                      fontSize: '14px',
                      color: '#a3a3a3',
                      lineHeight: '1.6',
                      marginBottom: '16px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {section.content}
                    </div>
                  )}

                  {/* Section Actions */}
                  {reviewerName && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '16px'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateSectionStatus(section.id, 'approved')
                        }}
                        style={{
                          background: '#51cf66',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateSectionStatus(section.id, 'changes_requested')
                        }}
                        style={{
                          background: '#ff6b6b',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Request Changes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateSectionStatus(section.id, 'under_review')
                        }}
                        style={{
                          background: '#ffffff',
                          color: '#000000',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Mark for Review
                      </button>
                    </div>
                  )}

                  {/* Comments count */}
                  {comments[section.id] && (
                    <div style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#a3a3a3'
                    }}>
                      {comments[section.id].length} comment{comments[section.id].length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments Panel */}
          <div style={{
            position: 'sticky',
            top: '100px',
            height: 'fit-content',
            background: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#ffffff',
              margin: '0 0 16px 0'
            }}>
              Comments
            </h3>

            {activeSectionId ? (
              <div>
                <div style={{
                  fontSize: '14px',
                  color: '#a3a3a3',
                  marginBottom: '16px'
                }}>
                  Reviewing: {sections.find(s => s.id === activeSectionId)?.title}
                </div>

                {/* Existing Comments */}
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  marginBottom: '16px'
                }}>
                  {comments[activeSectionId]?.map(comment => (
                    <div
                      key={comment.id}
                      style={{
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '12px',
                        marginBottom: '8px'
                      }}
                    >
                      <div style={{
                        fontSize: '12px',
                        color: '#a3a3a3',
                        marginBottom: '4px'
                      }}>
                        {comment.reviewer_name} • {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#ffffff',
                        lineHeight: '1.4'
                      }}>
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                {reviewerName ? (
                  <div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        padding: '12px',
                        color: '#ffffff',
                        fontSize: '14px',
                        minHeight: '80px',
                        resize: 'vertical',
                        marginBottom: '12px'
                      }}
                      placeholder="Add a comment or suggestion..."
                    />
                    <button
                      onClick={() => submitComment(activeSectionId)}
                      disabled={!newComment.trim()}
                      style={{
                        background: newComment.trim() ? '#ffffff' : '#666666',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                        width: '100%'
                      }}
                    >
                      Add Comment
                    </button>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#a3a3a3',
                    fontSize: '14px',
                    padding: '20px',
                    fontStyle: 'italic'
                  }}>
                    Enter your name above to add comments
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#a3a3a3',
                fontSize: '14px',
                padding: '40px 20px'
              }}>
                Select a section to view and add comments
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '48px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#666666',
          borderTop: '1px solid #333333',
          paddingTop: '24px'
        }}>
          Powered by SwayFiles • No account required for external reviewers
        </div>

      </div>
    </div>
  )
}

export default ExternalReview