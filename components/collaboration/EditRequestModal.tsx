/**
 * Edit Request Modal Component
 * Handles the request-to-edit workflow with notifications and permissions
 */
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit3, Clock, CheckCircle, XCircle, Send, User, MessageSquare } from 'lucide-react'
import { EditRequest, useCollaboration } from '@/lib/hooks/useCollaboration'

interface EditRequestModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  documentId: string
  blockId?: string
  requestType: 'send' | 'approve'
  pendingRequest?: EditRequest
}

export function EditRequestModal({
  isOpen,
  onClose,
  workspaceId,
  documentId,
  blockId,
  requestType,
  pendingRequest
}: EditRequestModalProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'pending' | 'approved' | 'denied' | null>(null)

  const {
    requestEditPermission,
    respondToEditRequest,
    pendingRequests,
    setPendingRequests
  } = useCollaboration({ workspaceId, documentId })

  // Handle sending edit request
  const handleSendRequest = async () => {
    if (!blockId) return

    setIsSubmitting(true)
    try {
      await requestEditPermission(blockId, message || 'Requesting permission to edit this block')
      setRequestStatus('pending')

      setTimeout(() => {
        onClose()
        setMessage('')
        setRequestStatus(null)
      }, 2000)
    } catch (error) {
      console.error('Failed to send edit request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle approving/denying request
  const handleRequestResponse = async (approved: boolean) => {
    if (!pendingRequest) return

    setIsSubmitting(true)
    try {
      await respondToEditRequest(
        pendingRequest.requestId,
        pendingRequest.requester.id,
        pendingRequest.blockId,
        approved
      )

      // Remove from pending requests
      setPendingRequests(prev =>
        prev.filter(req => req.requestId !== pendingRequest.requestId)
      )

      setRequestStatus(approved ? 'approved' : 'denied')

      setTimeout(() => {
        onClose()
        setRequestStatus(null)
      }, 1500)
    } catch (error) {
      console.error('Failed to respond to edit request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessage('')
      setRequestStatus(null)
      setIsSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-terminal-card border border-terminal-border rounded-lg shadow-2xl max-w-md w-full"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-terminal-border">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-terminal-accent/20 rounded-lg">
                <Edit3 className="w-5 h-5 text-terminal-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-terminal-text">
                  {requestType === 'send' ? 'Request Edit Permission' : 'Edit Permission Request'}
                </h3>
                <p className="text-sm text-terminal-muted">
                  {requestType === 'send'
                    ? 'Ask for permission to edit this content block'
                    : 'Someone wants to edit a content block'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-terminal-border/50 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-terminal-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {requestType === 'send' ? (
              /* Send Request Mode */
              <div className="space-y-4">
                {requestStatus === 'pending' ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-terminal-accent/20 rounded-full">
                        <Clock className="w-8 h-8 text-terminal-accent animate-pulse" />
                      </div>
                    </div>
                    <h4 className="text-terminal-text font-semibold mb-2">Request Sent!</h4>
                    <p className="text-terminal-muted text-sm">
                      Waiting for approval from workspace administrators...
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {/* Block Info */}
                    <div className="bg-terminal-bg/50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-sm text-terminal-muted">
                        <Edit3 className="w-4 h-4" />
                        <span>Block ID: {blockId?.slice(-8)}</span>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div>
                      <label className="block text-sm font-medium text-terminal-text mb-2">
                        Message (Optional)
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-terminal-muted" />
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Explain why you need to edit this content..."
                          className="w-full pl-10 pr-3 py-2 bg-terminal-bg border border-terminal-border rounded-md text-terminal-text text-sm resize-none focus:outline-none focus:ring-1 focus:ring-terminal-accent"
                          rows={3}
                          maxLength={200}
                        />
                      </div>
                      <div className="mt-1 text-xs text-terminal-muted text-right">
                        {message.length}/200 characters
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-terminal-muted border border-terminal-border rounded-md hover:bg-terminal-border/20 transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendRequest}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-terminal-accent text-terminal-bg rounded-md hover:bg-terminal-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-terminal-bg border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Send Request</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Approve Request Mode */
              <div className="space-y-4">
                {requestStatus === 'approved' ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-green-500/20 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                    <h4 className="text-terminal-text font-semibold mb-2">Permission Granted!</h4>
                    <p className="text-terminal-muted text-sm">
                      {pendingRequest?.requester.name} can now edit the content block.
                    </p>
                  </motion.div>
                ) : requestStatus === 'denied' ? (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-red-500/20 rounded-full">
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                    </div>
                    <h4 className="text-terminal-text font-semibold mb-2">Request Denied</h4>
                    <p className="text-terminal-muted text-sm">
                      The edit request has been declined.
                    </p>
                  </motion.div>
                ) : pendingRequest && (
                  <>
                    {/* Requester Info */}
                    <div className="bg-terminal-bg/50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-terminal-accent/20 rounded-full">
                          <User className="w-4 h-4 text-terminal-accent" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-terminal-text">
                            {pendingRequest.requester.name}
                          </div>
                          <div className="text-xs text-terminal-muted">
                            {pendingRequest.requester.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Request Details */}
                    <div>
                      <div className="text-sm text-terminal-muted mb-2">Block ID: {pendingRequest.blockId.slice(-8)}</div>
                      <div className="text-sm text-terminal-muted mb-2">
                        Requested: {new Date(pendingRequest.timestamp).toLocaleString()}
                      </div>
                      {pendingRequest.message && (
                        <div>
                          <div className="text-sm font-medium text-terminal-text mb-1">Message:</div>
                          <div className="bg-terminal-bg border border-terminal-border rounded-md p-3 text-sm text-terminal-text">
                            {pendingRequest.message}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRequestResponse(false)}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 text-red-400 border border-red-400/30 rounded-md hover:bg-red-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Deny</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRequestResponse(true)}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-terminal-accent text-terminal-bg rounded-md hover:bg-terminal-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-terminal-bg border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Notification Badge Component for Pending Requests
 */
interface EditRequestBadgeProps {
  count: number
  onClick: () => void
}

export function EditRequestBadge({ count, onClick }: EditRequestBadgeProps) {
  if (count === 0) return null

  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-terminal-accent text-terminal-bg rounded-full p-3 shadow-lg border border-terminal-border hover:bg-terminal-accent/90 transition-colors z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center space-x-2">
        <Edit3 className="w-5 h-5" />
        <span className="text-sm font-semibold">{count}</span>
      </div>

      {/* Pulse animation */}
      <motion.div
        className="absolute inset-0 bg-terminal-accent rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />
    </motion.button>
  )
}