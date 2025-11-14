'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import FileVersionHistory from '@/components/FileVersionHistory'
import CustomDropdown from '@/components/CustomDropdown'

interface Review {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'needs_changes'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  feedback?: string
  rating?: number
  due_date?: string
  created_at: string
  updated_at: string
  comment_count: number
  project_title?: string
  request_title?: string
  original_filename?: string
  reviewer_email: string
  reviewer_first_name?: string
  reviewer_last_name?: string
  assigned_by_email: string
  assigned_by_first_name?: string
  assigned_by_last_name?: string
}

interface ReviewComment {
  id: string
  content: string
  comment_type: 'comment' | 'suggestion' | 'approval' | 'rejection'
  parent_id?: string
  is_resolved: boolean
  created_at: string
  author_email: string
  author_first_name?: string
  author_last_name?: string
  depth: number
  reply_count: number
}

interface DetailedReview extends Review {
  project_description?: string
  project_type?: string
  request_description?: string
  file_size?: number
  content_type?: string
  storage_path?: string
  comments: ReviewComment[]
}

export default function Review() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedReview, setSelectedReview] = useState<DetailedReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('assigned') // assigned, created, all
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Comment system state
  const [newComment, setNewComment] = useState('')
  const [commentType, setCommentType] = useState<'comment' | 'suggestion' | 'approval' | 'rejection'>('comment')
  const [replyToComment, setReplyToComment] = useState<string | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)

  // Review status update
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState<number>(0)

  // Version history
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionHistoryFileId, setVersionHistoryFileId] = useState<string | null>(null)

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        type: filter,
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  // Fetch detailed review
  const fetchReviewDetails = async (reviewId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch review details')
      }

      const data = await response.json()
      setSelectedReview(data.review)
      setNewStatus(data.review.status)
      setFeedback(data.review.feedback || '')
      setRating(data.review.rating || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch review details')
    }
  }

  // Update review status
  const updateReviewStatus = async () => {
    if (!selectedReview) return

    try {
      setUpdatingStatus(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${selectedReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          feedback: feedback,
          rating: rating || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update review')
      }

      const data = await response.json()
      setSelectedReview(data.review)
      await fetchReviews() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Add comment
  const addComment = async () => {
    if (!selectedReview || !newComment.trim()) return

    try {
      setSubmittingComment(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${selectedReview.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newComment,
          comment_type: commentType,
          parent_id: replyToComment
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      const data = await response.json()
      // Refresh review details to get updated comments
      await fetchReviewDetails(selectedReview.id)
      setNewComment('')
      setReplyToComment(null)
      setCommentType('comment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [filter, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400'
      case 'rejected': return 'text-red-400'
      case 'needs_changes': return 'text-yellow-400'
      case 'in_progress': return 'text-blue-400'
      default: return 'text-terminal-muted'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      default: return 'text-terminal-muted'
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const renderComments = (comments: ReviewComment[]) => {
    return comments.map(comment => (
      <div key={comment.id} className={`border-l-2 border-terminal-border pl-4 ${comment.depth > 0 ? 'ml-4' : ''}`}>
        <div className="bg-terminal-surface border border-terminal-border rounded p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-terminal-text text-sm font-medium">
                {comment.author_first_name} {comment.author_last_name}
                <span className="text-terminal-muted">({comment.author_email})</span>
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                comment.comment_type === 'approval' ? 'bg-green-900 text-green-400' :
                comment.comment_type === 'rejection' ? 'bg-red-900 text-red-400' :
                comment.comment_type === 'suggestion' ? 'bg-blue-900 text-blue-400' :
                'bg-terminal-hover text-terminal-text'
              }`}>
                {comment.comment_type}
              </span>
            </div>
            <span className="text-terminal-muted text-xs">{formatRelativeTime(comment.created_at)}</span>
          </div>
          <p className="text-terminal-text text-sm mb-2">{comment.content}</p>
          <button
            onClick={() => setReplyToComment(comment.id)}
            className="text-terminal-muted text-xs hover:text-terminal-text"
          >
            Reply
          </button>
        </div>
      </div>
    ))
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center bg-terminal-bg">
          <div className="text-terminal-text">Loading reviews...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-terminal-text font-medium">Reviews</h1>
              <p className="text-terminal-muted text-sm mt-1">Manage file reviews and approvals</p>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <CustomDropdown
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'assigned', label: 'Assigned to Me' },
                  { value: 'created', label: 'Created by Me' },
                  { value: 'all', label: 'All Reviews' }
                ]}
                className="w-48"
              />

              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'needs_changes', label: 'Needs Changes' }
                ]}
                className="w-40"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-400 px-4 py-3 mx-6 mt-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        )}

        <div className="p-6">
          {reviews.length === 0 ? (
            <div className="bg-terminal-surface border border-terminal-border rounded p-6 text-center">
              <h2 className="text-terminal-text text-lg mb-2">No Reviews Found</h2>
              <p className="text-terminal-muted text-sm">
                {filter === 'assigned' ? 'No reviews assigned to you' : 'No reviews created by you'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-terminal-surface border border-terminal-border rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-terminal-text font-medium">{review.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(review.status)}`}>
                        {review.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`text-xs ${getPriorityColor(review.priority)}`}>
                        {review.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-terminal-muted">
                      <span>{formatRelativeTime(review.created_at)}</span>
                      <span>{review.comment_count} comments</span>
                    </div>
                  </div>

                  <div className="text-terminal-muted text-sm mb-3">
                    {review.project_title && <span>Project: {review.project_title} • </span>}
                    {review.request_title && <span>Request: {review.request_title} • </span>}
                    {review.original_filename && <span>File: {review.original_filename} • </span>}
                    Reviewer: {review.reviewer_first_name} {review.reviewer_last_name} ({review.reviewer_email})
                  </div>

                  {review.feedback && (
                    <div className="bg-terminal-bg border border-terminal-border rounded p-3 mb-3">
                      <p className="text-terminal-text text-sm">{review.feedback}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {review.rating && (
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} className={star <= review.rating! ? 'text-yellow-400' : 'text-terminal-muted'}>
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-terminal-muted text-xs">
                        Assigned by: {review.assigned_by_first_name} {review.assigned_by_last_name}
                      </span>
                    </div>

                    <button
                      onClick={() => fetchReviewDetails(review.id)}
                      className="border border-terminal-border text-terminal-text px-3 py-1 text-sm hover:bg-terminal-hover transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-terminal-surface border border-terminal-border w-full max-w-6xl h-full max-h-screen overflow-auto">
            {/* Header */}
            <div className="border-b border-terminal-border p-6 sticky top-0 bg-terminal-surface">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl text-terminal-text font-medium">{selectedReview.title}</h2>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-terminal-muted">
                    <span className={getStatusColor(selectedReview.status)}>
                      {selectedReview.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={getPriorityColor(selectedReview.priority)}>
                      {selectedReview.priority.toUpperCase()} Priority
                    </span>
                    <span>Created: {formatRelativeTime(selectedReview.created_at)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-terminal-muted hover:text-terminal-text text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left: Review Details & Status */}
              <div className="space-y-6">
                {/* File Info */}
                {selectedReview.original_filename && (
                  <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                    <h3 className="text-terminal-text font-medium mb-3">File Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-terminal-muted">Filename:</span>
                        <span className="text-terminal-text">{selectedReview.original_filename}</span>
                      </div>
                      {selectedReview.file_size && (
                        <div className="flex justify-between">
                          <span className="text-terminal-muted">Size:</span>
                          <span className="text-terminal-text">{(selectedReview.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                      )}
                      {selectedReview.content_type && (
                        <div className="flex justify-between">
                          <span className="text-terminal-muted">Type:</span>
                          <span className="text-terminal-text">{selectedReview.content_type}</span>
                        </div>
                      )}
                    </div>

                    {/* Version History Button */}
                    <div className="mt-4 pt-4 border-t border-terminal-border">
                      <button
                        onClick={() => {
                          setVersionHistoryFileId((selectedReview as any).upload_id || selectedReview.id)
                          setShowVersionHistory(true)
                        }}
                        className="w-full border border-terminal-border text-terminal-text px-3 py-2 text-sm hover:bg-terminal-hover transition-colors"
                      >
                        📁 View Version History
                      </button>
                    </div>
                  </div>
                )}

                {/* Update Status */}
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <h3 className="text-terminal-text font-medium mb-3">Update Review</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-terminal-muted text-sm mb-1">Status</label>
                      <CustomDropdown
                        value={newStatus}
                        onChange={setNewStatus}
                        options={[
                          { value: 'pending', label: 'Pending' },
                          { value: 'in_progress', label: 'In Progress' },
                          { value: 'approved', label: 'Approved' },
                          { value: 'rejected', label: 'Rejected' },
                          { value: 'needs_changes', label: 'Needs Changes' }
                        ]}
                        placeholder="Select status..."
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-terminal-muted text-sm mb-1">Feedback</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full bg-terminal-surface border border-terminal-border text-terminal-text px-3 py-2 h-24"
                        placeholder="Provide feedback..."
                      />
                    </div>

                    <div>
                      <label className="block text-terminal-muted text-sm mb-1">Rating (1-5)</label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-terminal-muted hover:text-yellow-400'}`}
                          >
                            ★
                          </button>
                        ))}
                        <button
                          onClick={() => setRating(0)}
                          className="text-terminal-muted text-sm hover:text-terminal-text ml-4"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={updateReviewStatus}
                      disabled={updatingStatus}
                      className="w-full bg-terminal-text text-terminal-bg px-4 py-2 hover:bg-terminal-muted transition-colors disabled:opacity-50"
                    >
                      {updatingStatus ? 'Updating...' : 'Update Review'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Comments */}
              <div className="space-y-6">
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <h3 className="text-terminal-text font-medium mb-4">Comments ({selectedReview.comments.length})</h3>

                  {/* Add Comment */}
                  <div className="mb-6">
                    {replyToComment && (
                      <div className="bg-terminal-hover border border-terminal-border rounded p-2 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-terminal-muted text-sm">Replying to comment</span>
                          <button
                            onClick={() => setReplyToComment(null)}
                            className="text-terminal-muted hover:text-terminal-text"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}

                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-terminal-surface border border-terminal-border text-terminal-text px-3 py-2 h-20 mb-2"
                      placeholder="Add a comment..."
                    />

                    <div className="flex items-center justify-between">
                      <CustomDropdown
                        value={commentType}
                        onChange={(value) => setCommentType(value as any)}
                        options={[
                          { value: 'comment', label: 'Comment' },
                          { value: 'suggestion', label: 'Suggestion' },
                          { value: 'approval', label: 'Approval' },
                          { value: 'rejection', label: 'Rejection' }
                        ]}
                        className="w-32"
                      />

                      <button
                        onClick={addComment}
                        disabled={submittingComment || !newComment.trim()}
                        className="bg-terminal-text text-terminal-bg px-4 py-1 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                      >
                        {submittingComment ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedReview.comments.length === 0 ? (
                      <p className="text-terminal-muted text-sm text-center py-4">No comments yet</p>
                    ) : (
                      renderComments(selectedReview.comments)
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Version History Modal */}
      {showVersionHistory && versionHistoryFileId && (
        <FileVersionHistory
          fileId={versionHistoryFileId}
          currentFileName={selectedReview?.original_filename}
          onClose={() => {
            setShowVersionHistory(false)
            setVersionHistoryFileId(null)
          }}
        />
      )}
    </AppLayout>
  )
}