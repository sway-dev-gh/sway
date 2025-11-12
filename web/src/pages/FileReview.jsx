import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import VersionHistory from '../components/VersionHistory'

const FileReview = () => {
  const { projectId, fileId } = useParams()
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [sections, setSections] = useState([])
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [activeTab, setActiveTab] = useState('review') // review, history

  useEffect(() => {
    fetchFileData()
  }, [projectId, fileId])

  const fetchFileData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Fetch file info
      const fileRes = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (fileRes.ok) {
        const fileData = await fileRes.json()
        setFile(fileData.file)
        setSections(fileData.file.sections || [])
      }

      // Fetch comments
      const commentsRes = await fetch(`/api/projects/${projectId}/files/${fileId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        const commentsBySection = {}
        commentsData.comments.forEach(comment => {
          if (!commentsBySection[comment.section_id]) {
            commentsBySection[comment.section_id] = []
          }
          commentsBySection[comment.section_id].push(comment)
        })
        setComments(commentsBySection)
      }
    } catch (error) {
      console.error('Failed to fetch file data:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async (sectionId) => {
    if (!newComment.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          section_id: sectionId,
          content: newComment,
          reviewer_name: reviewerName || 'Anonymous'
        })
      })

      if (response.ok) {
        setNewComment('')
        await fetchFileData()
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
    }
  }

  const updateSectionStatus = async (sectionId, status, feedback = '') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${projectId}/files/${fileId}/sections/${sectionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          feedback,
          reviewer_name: reviewerName || 'Anonymous'
        })
      })

      if (response.ok) {
        await fetchFileData()
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
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          color: '#ffffff',
          paddingTop: '68px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '48px 32px'
          }}>
            Loading file...
          </div>
        </div>
      </>
    )
  }

  if (!file) {
    return (
      <>
        <Sidebar />
        <div style={{
          minHeight: '100vh',
          background: '#000000',
          color: '#ffffff',
          paddingTop: '68px'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '48px 32px'
          }}>
            File not found
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <div style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#ffffff',
        paddingTop: '68px'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '48px 32px'
        }}>

          {/* Header */}
          <div style={{
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => navigate(`/projects/${projectId}`)}
                style={{
                  background: 'transparent',
                  color: '#a3a3a3',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '4px 0'
                }}
              >
                ← Back to Project
              </button>
            </div>

            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#ffffff',
              margin: '0 0 8px 0'
            }}>
              {file.name}
            </h1>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '14px',
              color: '#a3a3a3'
            }}>
              <div>Type: {file.type}</div>
              <div>Sections: {sections.length}</div>
              <div>Total Comments: {Object.values(comments).flat().length}</div>
              <div style={{
                padding: '4px 8px',
                background: getStatusColor(file.status),
                color: '#000000',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'uppercase'
              }}>
                {getStatusLabel(file.status)}
              </div>
            </div>
          </div>

          {/* Reviewer Info */}
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <label style={{
                fontSize: '14px',
                color: '#ffffff',
                fontWeight: '500'
              }}>
                Your Name (optional):
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
                placeholder="Anonymous Reviewer"
              />
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #333333',
            marginBottom: '32px'
          }}>
            {['review', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  color: activeTab === tab ? '#ffffff' : '#a3a3a3',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #ffffff' : '2px solid transparent',
                  padding: '16px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'review' ? 'Review' : 'Version History'}
              </button>
            ))}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'review' ? (
            /* Content Layout */
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 400px',
              gap: '32px'
            }}>

            {/* File Content & Sections */}
            <div>
              {/* File Content */}
              {file.content && (
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
          ) : (
            /* Version History Tab */
            <VersionHistory projectId={projectId} fileId={fileId} />
          )}

        </div>
      </div>
    </>
  )
}

export default FileReview