'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import CollaborativeTextEditor, { CollaborativeTextEditorRef } from './CollaborativeTextEditor'
import CollaborativeCursors from './CollaborativeCursors'
import { Plus, FileText, Save, Users, Eye, MessageSquare, Clock, Settings } from 'lucide-react'

interface Document {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
  collaborators: string[]
}

interface CollaborativeWorkspaceProps {
  workspaceId: string
  projectId: string
}

const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  workspaceId,
  projectId
}) => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'doc-1',
      title: 'Project Specification',
      content: '# Project Specification\n\nThis document outlines the requirements and specifications for our collaborative project.\n\n## Overview\nStart writing your content here...',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date(),
      collaborators: ['user1', 'user2']
    },
    {
      id: 'doc-2',
      title: 'Meeting Notes',
      content: '# Meeting Notes - November 14, 2024\n\n## Attendees\n- Team Lead\n- Project Manager\n- Development Team\n\n## Agenda\n1. Review current progress\n2. Discuss upcoming milestones\n3. Address blockers\n\n## Discussion Points\n',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date(),
      collaborators: ['user1', 'user3']
    }
  ])

  const [selectedDocument, setSelectedDocument] = useState<string | null>('doc-1')
  const [isCreating, setIsCreating] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')

  const editorRef = useRef<CollaborativeTextEditorRef>(null)

  const selectedDoc = documents.find(doc => doc.id === selectedDocument)

  const handleCreateDocument = () => {
    if (!newDocTitle.trim()) return

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      content: `# ${newDocTitle}\n\nStart writing your content here...`,
      createdAt: new Date(),
      updatedAt: new Date(),
      collaborators: []
    }

    setDocuments(prev => [...prev, newDoc])
    setSelectedDocument(newDoc.id)
    setNewDocTitle('')
    setIsCreating(false)
  }

  const handleDocumentSave = (content: string) => {
    if (!selectedDocument) return

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === selectedDocument
          ? { ...doc, content, updatedAt: new Date() }
          : doc
      )
    )

    console.log('Document saved:', content.slice(0, 100) + '...')
  }

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
    if (selectedDocument === docId) {
      setSelectedDocument(documents[0]?.id || null)
    }
  }

  return (
    <div className="collaborative-workspace h-screen flex bg-terminal-bg">
      {/* Global Collaborative Cursors */}
      <CollaborativeCursors
        workspaceId={workspaceId}
        projectId={projectId}
        className="z-50"
      />

      {/* Document Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 bg-terminal-surface border-r border-terminal-border flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-terminal-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-terminal-text">Documents</h2>
            <button
              onClick={() => setIsCreating(true)}
              className="p-2 hover:bg-terminal-hover rounded text-terminal-muted"
              title="Create new document"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Create Document Form */}
          {isCreating && (
            <div className="space-y-3">
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Document title..."
                className="w-full px-3 py-2 bg-terminal-bg border border-terminal-border text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateDocument()
                  if (e.key === 'Escape') {
                    setIsCreating(false)
                    setNewDocTitle('')
                  }
                }}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateDocument}
                  className="flex-1 bg-terminal-text text-terminal-bg px-3 py-1 text-sm hover:bg-terminal-muted"
                  disabled={!newDocTitle.trim()}
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false)
                    setNewDocTitle('')
                  }}
                  className="flex-1 border border-terminal-border text-terminal-text px-3 py-1 text-sm hover:bg-terminal-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => setSelectedDocument(doc.id)}
              className={`p-4 border-b border-terminal-border cursor-pointer hover:bg-terminal-hover transition-colors ${
                selectedDocument === doc.id ? 'bg-terminal-hover' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-terminal-muted flex-shrink-0" />
                    <h3 className="text-sm font-medium text-terminal-text truncate">
                      {doc.title}
                    </h3>
                  </div>

                  <p className="text-xs text-terminal-muted mb-2 line-clamp-2">
                    {doc.content.split('\n').find(line => line.trim() && !line.startsWith('#')) || 'No content'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-terminal-muted">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{doc.updatedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{doc.collaborators.length}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteDocument(doc.id)
                  }}
                  className="ml-2 p-1 text-terminal-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete document"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {documents.length === 0 && (
            <div className="p-8 text-center text-terminal-muted">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm mb-4">No documents yet</p>
              <button
                onClick={() => setIsCreating(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Create your first document
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {selectedDoc ? (
          <>
            {/* Document Header */}
            <div className="p-4 border-b border-terminal-border bg-terminal-surface">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h1 className="text-xl font-medium text-terminal-text">
                    {selectedDoc.title}
                  </h1>
                  <div className="flex items-center space-x-2 text-xs text-terminal-muted">
                    <span>Last updated: {selectedDoc.updatedAt.toLocaleString()}</span>
                    <span>•</span>
                    <span>{selectedDoc.collaborators.length} collaborator{selectedDoc.collaborators.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => editorRef.current?.focus()}
                    className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover rounded"
                    title="Focus editor"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const content = editorRef.current?.getContent() || ''
                      handleDocumentSave(content)
                    }}
                    className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover rounded"
                    title="Save document"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover rounded"
                    title="Document settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Collaborative Editor */}
            <div className="flex-1 p-4 overflow-auto">
              <CollaborativeTextEditor
                ref={editorRef}
                blockId={selectedDoc.id}
                workspaceId={workspaceId}
                initialContent={selectedDoc.content}
                onSave={handleDocumentSave}
                placeholder="Start typing to begin collaborating..."
                showToolbar={true}
                allowComments={true}
                className="w-full h-full"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-terminal-bg">
            <div className="text-center text-terminal-muted">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h2 className="text-lg mb-2">No document selected</h2>
              <p className="text-sm mb-4">Choose a document from the sidebar or create a new one</p>
              <button
                onClick={() => setIsCreating(true)}
                className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
              >
                Create Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Activity Panel */}
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        className="w-64 bg-terminal-surface border-l border-terminal-border flex flex-col"
      >
        <div className="p-4 border-b border-terminal-border">
          <h3 className="text-sm font-medium text-terminal-text mb-3">Activity</h3>

          <div className="space-y-3 text-xs text-terminal-muted">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Real-time collaboration active</span>
            </div>

            <div className="flex items-center space-x-2">
              <MessageSquare className="w-3 h-3" />
              <span>Comments enabled</span>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="w-3 h-3" />
              <span>Multi-user editing</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="text-xs text-terminal-muted">
            <p className="mb-4">🎉 Real-time collaborative editing is now active!</p>

            <div className="space-y-2">
              <p><strong>Features:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Live cursor tracking</li>
                <li>• Real-time text sync</li>
                <li>• Typing indicators</li>
                <li>• Collaborative comments</li>
                <li>• Auto-save</li>
                <li>• Version history</li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <p><strong>Shortcuts:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• Ctrl+S - Save</li>
                <li>• Ctrl+M - Toggle cursors</li>
                <li>• Ctrl+/ - Add comment</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CollaborativeWorkspace