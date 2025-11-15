'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, FileText, Edit3, Clock } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { LivingBlock } from '@/components/collaboration/LivingBlock'
import { EditRequestModal } from '@/components/collaboration/EditRequestModal'
import { EditRequestBadge } from '@/components/collaboration/EditRequestModal'
import { useAuth } from '@/contexts/AuthContext'
import { useCollaboration, EditRequest } from '@/lib/hooks/useCollaboration'
import { apiRequest } from '@/lib/auth'

interface Document {
  id: string
  title: string
  content: string
  content_type: 'text' | 'markdown' | 'code' | 'json'
  project_id: string
  created_at: string
  updated_at: string
  created_by: string
  last_edited_by?: string
}

interface DocumentBlock {
  id: string
  content: string
  blockType: string
  position: number
}

export default function CollaborativeWorkspace() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeDocument, setActiveDocument] = useState<Document | null>(null)
  const [documentBlocks, setDocumentBlocks] = useState<DocumentBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modal state
  const [showEditRequestModal, setShowEditRequestModal] = useState(false)
  const [requestType, setRequestType] = useState<'send' | 'approve'>('send')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null)

  // Initialize collaboration for the workspace
  const {
    isConnected,
    activeUsers,
    focusedBlocks,
    pendingRequests,
    setPendingRequests,
    canEdit,
    sendContentUpdate,
    requestEditPermission,
    respondToEditRequest
  } = useCollaboration({
    workspaceId: activeDocument?.project_id,
    documentId: activeDocument?.id,
    onContentUpdate: (blockId: string, content: string) => {
      setDocumentBlocks(prev =>
        prev.map(block =>
          block.id === blockId ? { ...block, content } : block
        )
      )
    },
    onEditRequest: (request: EditRequest) => {
      // Show notification badge for new requests
      console.log('New edit request received:', request)
    }
  })

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadWorkspaceData()
    }
  }, [authLoading, isAuthenticated])

  // Load document blocks when active document changes
  useEffect(() => {
    if (activeDocument) {
      loadDocumentBlocks()
    }
  }, [activeDocument?.id])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load recent documents
      const response = await apiRequest('/api/files?type=document')

      if (response?.ok) {
        const data = await response.json()
        setDocuments(data.files || [])

        // Auto-select first document if available
        if (data.files?.length > 0 && !activeDocument) {
          setActiveDocument(data.files[0])
        }
      } else {
        setError('Failed to load documents')
      }
    } catch (error) {
      console.error('Failed to load workspace data:', error)
      setError('Failed to load workspace data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadDocumentBlocks = async () => {
    if (!activeDocument) return

    try {
      // For now, create a single block from the document content
      // In a full implementation, this would load actual blocks from the database
      const blocks: DocumentBlock[] = [
        {
          id: `${activeDocument.id}-main`,
          content: activeDocument.content || '',
          blockType: 'text',
          position: 0
        }
      ]
      setDocumentBlocks(blocks)
    } catch (error) {
      console.error('Failed to load document blocks:', error)
      setError('Failed to load document content')
    }
  }

  const handleBlockContentChange = (blockId: string, content: string) => {
    setDocumentBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, content } : block
      )
    )

    // Update the main document as well
    if (activeDocument) {
      setActiveDocument(prev => prev ? { ...prev, content } : null)
    }
  }

  const handleEditRequest = (blockId: string) => {
    setSelectedBlockId(blockId)
    setRequestType('send')
    setShowEditRequestModal(true)
  }

  const handlePendingRequestClick = (request: EditRequest) => {
    setSelectedRequest(request)
    setRequestType('approve')
    setShowEditRequestModal(true)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto bg-terminal-bg flex items-center justify-center">
          <div className="text-terminal-muted">Loading workspace...</div>
        </div>
      </AppLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto bg-terminal-bg flex items-center justify-center">
          <div className="text-center">
            <div className="text-terminal-muted mb-4">Please log in to access the workspace</div>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
            >
              Log In
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto bg-terminal-bg flex items-center justify-center">
          <div className="text-terminal-muted">Loading documents...</div>
        </div>
      </AppLayout>
    )
  }

  if (documents.length === 0) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto bg-terminal-bg">
          <div className="bg-terminal-surface border-b border-terminal-border p-6">
            <h1 className="text-xl text-terminal-text font-medium">Collaborative Workspace</h1>
            <p className="text-terminal-muted text-sm mt-1">Real-time document editing and team collaboration</p>
          </div>

          <div className="p-6">
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-8 text-center">
              <h2 className="text-lg text-terminal-text mb-2">No Documents Yet</h2>
              <p className="text-terminal-muted text-sm mb-4">Create your first document to start collaborating</p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
              >
                Create Document
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 flex overflow-hidden bg-terminal-bg">
        {/* Document Sidebar */}
        <div className="w-64 border-r border-terminal-border bg-terminal-surface">
          <div className="p-4 border-b border-terminal-border">
            <h2 className="text-terminal-text font-medium text-sm">Documents</h2>
            <div className="flex items-center space-x-2 mt-2 text-xs text-terminal-muted">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          <div className="overflow-y-auto">
            {documents.map(doc => (
              <div
                key={doc.id}
                onClick={() => setActiveDocument(doc)}
                className={`p-3 border-b border-terminal-border cursor-pointer transition-colors ${
                  activeDocument?.id === doc.id
                    ? 'bg-terminal-bg'
                    : 'hover:bg-terminal-bg/30'
                }`}
              >
                <div className="text-terminal-text text-sm font-medium truncate">
                  {doc.title}
                </div>
                <div className="text-terminal-muted text-xs mt-1">
                  {formatTimeAgo(doc.updated_at)}
                </div>
                <div className="text-terminal-muted text-xs">
                  {doc.content_type}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-terminal-border bg-terminal-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-terminal-text font-medium">
                  {activeDocument?.title || 'Select a document'}
                </h1>
                <div className="flex items-center mt-1 text-xs text-terminal-muted space-x-2">
                  <Users className="w-3 h-3" />
                  <span>{activeUsers.length} active collaborators</span>
                  {activeUsers.slice(0, 3).map(user => (
                    <div
                      key={user.userId}
                      className="w-5 h-5 rounded-full border border-terminal-border flex items-center justify-center text-xs font-medium"
                      style={{ backgroundColor: user.color, color: 'white' }}
                      title={user.user.name}
                    >
                      {user.user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-xs text-terminal-muted">
                  Real-time collaborative editing
                </div>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 flex">
            {/* Main Editor */}
            <div className="flex-1 relative overflow-y-auto">
              {activeDocument ? (
                <div className="p-4 space-y-4">
                  {documentBlocks.map(block => (
                    <LivingBlock
                      key={block.id}
                      blockId={block.id}
                      content={block.content}
                      blockType={block.blockType}
                      workspaceId={activeDocument.project_id}
                      documentId={activeDocument.id}
                      canEdit={canEdit(block.id)}
                      onContentChange={(content) => handleBlockContentChange(block.id, content)}
                      onEditRequest={() => handleEditRequest(block.id)}
                      className="mb-4"
                    />
                  ))}

                  {documentBlocks.length === 0 && (
                    <LivingBlock
                      blockId="new-block"
                      content=""
                      blockType="text"
                      workspaceId={activeDocument.project_id}
                      documentId={activeDocument.id}
                      canEdit={canEdit("new-block")}
                      onContentChange={(content) => handleBlockContentChange("new-block", content)}
                      onEditRequest={() => handleEditRequest("new-block")}
                      className="mb-4"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-terminal-muted">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <div className="text-lg mb-2">Select a document</div>
                    <div className="text-sm">Choose a document from the sidebar to start collaborative editing</div>
                  </div>
                </div>
              )}
            </div>

            {/* Activity Sidebar */}
            <div className="w-80 border-l border-terminal-border bg-terminal-surface">
              <div className="p-4 border-b border-terminal-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-terminal-text font-medium text-sm">Activity & Requests</h3>
                  {pendingRequests.length > 0 && (
                    <div className="bg-terminal-accent text-terminal-bg text-xs px-2 py-1 rounded-full">
                      {pendingRequests.length}
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto">
                {pendingRequests.length === 0 ? (
                  <div className="p-4 text-center text-terminal-muted text-sm">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div>No pending requests</div>
                    <div className="text-xs mt-1">Edit requests will appear here</div>
                  </div>
                ) : (
                  pendingRequests.map(request => (
                    <div
                      key={request.requestId}
                      className="p-3 border-b border-terminal-border cursor-pointer hover:bg-terminal-bg/30 transition-colors"
                      onClick={() => handlePendingRequestClick(request)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-terminal-muted flex items-center">
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit Request
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-yellow-900 text-yellow-300">
                          pending
                        </span>
                      </div>

                      <div className="text-xs text-terminal-text mb-2">
                        By: {request.requester.name}
                      </div>

                      {request.message && (
                        <div className="text-xs text-terminal-muted mb-2 italic line-clamp-2">
                          "{request.message}"
                        </div>
                      )}

                      <div className="text-xs text-terminal-muted">
                        Block: {request.blockId.slice(-8)}
                      </div>
                      <div className="text-xs text-terminal-muted">
                        {formatTimeAgo(request.timestamp.toString())}
                      </div>
                    </div>
                  ))
                )}

                {/* Live Activity Feed */}
                <div className="border-t border-terminal-border">
                  <div className="p-3 text-xs text-terminal-muted">
                    <div className="font-medium mb-2">Live Activity</div>
                    {Object.entries(focusedBlocks).map(([blockId, users]) =>
                      users.length > 0 && (
                        <div key={blockId} className="mb-2">
                          <div className="text-terminal-text">Block {blockId.slice(-8)}</div>
                          <div className="flex space-x-1 mt-1">
                            {users.map((user: any) => (
                              <div
                                key={user.userId}
                                className="w-3 h-3 rounded-full border border-terminal-border"
                                style={{ backgroundColor: user.color }}
                                title={user.user.name}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Request Modal */}
      <EditRequestModal
        isOpen={showEditRequestModal}
        onClose={() => setShowEditRequestModal(false)}
        workspaceId={activeDocument?.project_id || ''}
        documentId={activeDocument?.id || ''}
        blockId={selectedBlockId || undefined}
        requestType={requestType}
        pendingRequest={selectedRequest || undefined}
      />

      {/* Edit Request Badge */}
      <EditRequestBadge
        count={pendingRequests.length}
        onClick={() => {
          // Focus on the activity sidebar or show notification
          const activitySidebar = document.querySelector('.w-80.border-l');
          activitySidebar?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Error Display */}
      {error && (
        <motion.div
          className="fixed top-4 right-4 bg-red-900 border border-red-500 text-red-400 p-3 text-sm max-w-md rounded"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
        >
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </motion.div>
      )}
    </AppLayout>
  )
}
