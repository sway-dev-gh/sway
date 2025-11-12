import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import theme from '../theme'
import api from '../api/axios'
import { standardStyles, getFilterButtonStyle, getPrimaryButtonHover } from '../components/StandardStyles'

function WorkflowDashboard() {
  const navigate = useNavigate()

  // Core workflow state
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showReviewerModal, setShowReviewerModal] = useState(false)

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Reviewer management
  const [reviewerEmails, setReviewerEmails] = useState([''])
  const [reviewDeadline, setReviewDeadline] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')

  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const fileInputRef = useRef()
  const dropZoneRef = useRef()

  useEffect(() => {
    checkAuth()
    fetchReviews()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token')
      const { data } = await api.get('/api/reviews', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
      setReviews([])
    }
  }

  // File upload handlers
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = Array.from(event.dataTransfer.files)
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addReviewerField = () => {
    setReviewerEmails(prev => [...prev, ''])
  }

  const updateReviewerEmail = (index, email) => {
    setReviewerEmails(prev => prev.map((e, i) => i === index ? email : e))
  }

  const removeReviewerField = (index) => {
    if (reviewerEmails.length > 1) {
      setReviewerEmails(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleCreateReview = async () => {
    if (!uploadTitle.trim()) {
      toast.error('Please enter a title for your review')
      return
    }

    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one file')
      return
    }

    const validEmails = reviewerEmails.filter(email => email.trim())
    if (validEmails.length === 0) {
      toast.error('Please add at least one reviewer email')
      return
    }

    setIsUploading(true)

    try {
      // Create new review
      const newReview = {
        id: reviews.length + 1,
        title: uploadTitle,
        description: uploadDescription,
        status: 'pending',
        createdAt: new Date().toISOString(),
        deadline: reviewDeadline ? new Date(reviewDeadline).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        files: uploadedFiles.map(file => ({
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          type: file.name.split('.').pop()
        })),
        reviewers: validEmails.map(email => ({
          email: email.trim(),
          status: 'pending',
          feedback: ''
        })),
        comments: 0,
        approvals: 0,
        version: 'v1.0'
      }

      setReviews(prev => [newReview, ...prev])

      // Reset form
      setUploadTitle('')
      setUploadDescription('')
      setUploadedFiles([])
      setReviewerEmails([''])
      setReviewDeadline('')
      setReviewMessage('')
      setShowUploadModal(false)

      toast.success('Review created and sent to reviewers!')

    } catch (error) {
      console.error('Failed to create review:', error)
      toast.error('Failed to create review')
    } finally {
      setIsUploading(false)
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = searchTerm === '' ||
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' || review.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#a3a3a3'
      case 'approved': return theme.colors.white
      case 'changes_requested': return '#808080'
      case 'rejected': return '#525252'
      default: return theme.colors.text.secondary
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review'
      case 'approved': return 'Approved'
      case 'changes_requested': return 'Changes Requested'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  const getFileIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄'
      case 'doc':
      case 'docx': return '📝'
      case 'zip':
      case 'rar': return '📦'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️'
      case 'figma': return '🎨'
      default: return '📄'
    }
  }

  // Calculate review statistics
  const getReviewStats = () => {
    const stats = {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      changesRequested: reviews.filter(r => r.status === 'changes_requested').length,
      avgReviewTime: reviews.length > 0 ? Math.round(reviews.reduce((sum, r) => sum + (r.reviewDays || 3), 0) / reviews.length) : 0,
      totalComments: reviews.reduce((sum, r) => sum + (r.comments || 0), 0)
    }
    return stats
  }

  const stats = getReviewStats()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.colors.bg.page }}>
      <Sidebar />

      <div style={{ flex: 1, marginTop: '54px', padding: '80px 120px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '48px'
        }}>
          <div>
            <h1 style={standardStyles.pageHeader}>
              Review Workflows
            </h1>
            <p style={standardStyles.pageDescription}>
              Upload drafts, collect feedback, and manage approval workflows
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            style={standardStyles.primaryButton}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, getPrimaryButtonHover())
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, standardStyles.primaryButton)
            }}
          >
            + Upload for Review
          </button>
        </div>

        {/* Review Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '48px'
        }}>
          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={standardStyles.statsLabel}>
              Total Reviews
            </div>
            <div style={standardStyles.statsNumber}>
              {stats.total}
            </div>
            <div style={standardStyles.statsDescription}>
              All workflows
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={standardStyles.statsLabel}>
              Pending Review
            </div>
            <div style={{...standardStyles.statsNumber, color: '#a3a3a3'}}>
              {stats.pending}
            </div>
            <div style={standardStyles.statsDescription}>
              Awaiting feedback
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={standardStyles.statsLabel}>
              Approved
            </div>
            <div style={{...standardStyles.statsNumber, color: theme.colors.white}}>
              {stats.approved}
            </div>
            <div style={standardStyles.statsDescription}>
              Ready to proceed
            </div>
          </div>

          <div style={{
            background: theme.colors.bg.hover,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={standardStyles.statsLabel}>
              Avg Review Time
            </div>
            <div style={standardStyles.statsNumber}>
              {stats.avgReviewTime}d
            </div>
            <div style={standardStyles.statsDescription}>
              Days to completion
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'pending', 'approved', 'changes_requested'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filterStatus === status ? theme.colors.white : 'rgba(255, 255, 255, 0.04)',
                  color: filterStatus === status ? theme.colors.black : theme.colors.text.secondary,
                  fontSize: '13px',
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {status === 'all' ? 'All Reviews' : status === 'changes_requested' ? 'Changes Requested' : status}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 16px',
              background: theme.colors.bg.card,
              border: `1px solid ${theme.colors.border.medium}`,
              borderRadius: '6px',
              color: theme.colors.text.primary,
              fontSize: '14px',
              width: '300px',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                onClick={() => setSelectedReview(review)}
                style={{
                  padding: '24px',
                  background: theme.colors.bg.card,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.medium
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border.light
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: theme.weight.semibold,
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      {review.title}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: theme.colors.text.tertiary,
                      marginBottom: '12px'
                    }}>
                      {review.description}
                    </p>
                  </div>

                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '100px',
                    fontSize: '11px',
                    fontWeight: theme.weight.bold,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: `${getStatusColor(review.status)}20`,
                    color: getStatusColor(review.status),
                    border: `1px solid ${getStatusColor(review.status)}40`
                  }}>
                    {getStatusLabel(review.status)}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: theme.colors.text.tertiary
                }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span>{review.files.length} file{review.files.length !== 1 ? 's' : ''}</span>
                    <span>{review.reviewers.length} reviewer{review.reviewers.length !== 1 ? 's' : ''}</span>
                    <span>{review.comments} comment{review.comments !== 1 ? 's' : ''}</span>
                    <span>{review.approvals}/{review.reviewers.length} approved</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span>Due: {new Date(review.deadline).toLocaleDateString()}</span>
                    <span>{review.version}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '120px 40px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: '12px',
            background: theme.colors.bg.card
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '24px',
              opacity: 0.3
            }}>
              📄
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '12px'
            }}>
              {searchTerm || filterStatus !== 'all' ? 'No reviews found' : 'No reviews yet'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: theme.colors.text.tertiary,
              marginBottom: '32px'
            }}>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first file to start collecting feedback'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  padding: '12px 24px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: theme.weight.semibold,
                  cursor: 'pointer'
                }}
              >
                Upload for Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: theme.colors.bg.card,
            border: `1px solid ${theme.colors.border.medium}`,
            borderRadius: '12px',
            padding: '40px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: theme.weight.semibold,
              color: theme.colors.text.primary,
              marginBottom: '24px'
            }}>
              Upload for Review
            </h2>

            {/* Title & Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Title
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter review title..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: theme.colors.bg.page,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Description
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Describe what you're looking for feedback on..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: theme.colors.bg.page,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* File Upload */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Files
              </label>

              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? theme.colors.border.medium : theme.colors.border.light}`,
                  borderRadius: '8px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isDragOver ? theme.colors.bg.secondary : theme.colors.bg.page
                }}
              >
                <div style={{
                  fontSize: '24px',
                  marginBottom: '12px',
                  opacity: 0.5
                }}>
                  📎
                </div>
                <p style={{
                  color: theme.colors.text.secondary,
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  Drop files here or click to browse
                </p>
                <p style={{
                  color: theme.colors.text.tertiary,
                  fontSize: '12px'
                }}>
                  Support for any file type
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: theme.colors.bg.secondary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getFileIcon(file.name.split('.').pop())}</span>
                        <div>
                          <div style={{
                            color: theme.colors.text.primary,
                            fontSize: '13px',
                            fontWeight: theme.weight.medium
                          }}>
                            {file.name}
                          </div>
                          <div style={{
                            color: theme.colors.text.tertiary,
                            fontSize: '11px'
                          }}>
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: theme.colors.text.secondary,
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviewers */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Reviewers
              </label>

              {reviewerEmails.map((email, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateReviewerEmail(index, e.target.value)}
                    placeholder="reviewer@company.com"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: theme.colors.bg.page,
                      color: theme.colors.text.primary,
                      border: `1px solid ${theme.colors.border.medium}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'inherit'
                    }}
                  />
                  {reviewerEmails.length > 1 && (
                    <button
                      onClick={() => removeReviewerField(index)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${theme.colors.border.medium}`,
                        color: theme.colors.text.secondary,
                        borderRadius: '6px',
                        width: '36px',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addReviewerField}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border.medium}`,
                  color: theme.colors.text.secondary,
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                + Add Reviewer
              </button>
            </div>

            {/* Deadline */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: theme.weight.semibold,
                color: theme.colors.text.primary,
                marginBottom: '8px'
              }}>
                Review Deadline (Optional)
              </label>
              <input
                type="date"
                value={reviewDeadline}
                onChange={(e) => setReviewDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  padding: '10px 12px',
                  background: theme.colors.bg.page,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.border.medium}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: theme.colors.text.secondary,
                  border: `1px solid ${theme.colors.border.light}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: theme.weight.medium,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReview}
                disabled={isUploading}
                style={{
                  padding: '12px 24px',
                  background: theme.colors.white,
                  color: theme.colors.black,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: theme.weight.semibold,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.5 : 1
                }}
              >
                {isUploading ? 'Creating Review...' : 'Create Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowDashboard