'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkspaceProvider, useWorkspace } from '../../src/stores/WorkspaceStore'
import WorkspaceCanvas from '../../src/components/Workspace/WorkspaceCanvas'
import { LeftSidebar, RightSidebar } from '../../src/components/Workspace/WorkspaceSidebar'

// Inner component that uses the workspace context
function WorkspaceInner() {
  const { state, actions } = useWorkspace()
  const searchParams = useSearchParams()
  const [selectedSection, setSelectedSection] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Get project ID from URL params
  const projectId = searchParams?.get('id')

  // Initialize authentication when component mounts
  useEffect(() => {
    actions.initializeAuth()
  }, [])

  // Load workspace when projectId is available
  useEffect(() => {
    if (projectId && state.workspaces.length > 0) {
      const workspace = state.workspaces.find(w => w.id === projectId)
      if (workspace && state.currentWorkspace?.id !== workspace.id) {
        actions.selectWorkspace(workspace)
      }
    }
  }, [projectId, state.workspaces])

  const handleFileSelect = (file) => {
    actions.selectFile(file)
  }

  const handleWorkspaceSelect = (workspace) => {
    actions.selectWorkspace(workspace)
  }

  if (!state.isAuthenticated && !state.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-terminal-bg">
        <div className="text-center">
          <h1 className="text-2xl text-terminal-text mb-4">Please sign in</h1>
          <p className="text-terminal-muted mb-6">You need to be signed in to access workspaces.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-terminal-text text-terminal-bg px-6 py-3 rounded hover:bg-terminal-text/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-terminal-bg flex">
      {/* Left Sidebar */}
      {!sidebarCollapsed && (
        <LeftSidebar
          onFileSelect={handleFileSelect}
          onWorkspaceSelect={handleWorkspaceSelect}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Canvas */}
        <div className="flex-1 min-h-0">
          <WorkspaceCanvas
            projectId={projectId}
            selectedSection={selectedSection}
            onSectionSelect={setSelectedSection}
          />
        </div>
      </div>

      {/* Right Sidebar - Comments & Inspector */}
      <RightSidebar selectedSection={selectedSection} />

      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10 bg-terminal-surface border border-terminal-border rounded p-2 text-terminal-muted hover:text-terminal-text"
      >
        {sidebarCollapsed ? '→' : '←'}
      </button>

      {/* Error Display */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-500 text-red-100 p-4 rounded max-w-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Error</div>
              <div className="text-sm">{state.error}</div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 text-red-200 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 text-center">
            <div className="text-terminal-text mb-2">Loading...</div>
            <div className="text-terminal-muted text-sm">Setting up your workspace</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main component with WorkspaceProvider
export default function Workspace() {
  return (
    <WorkspaceProvider>
      <WorkspaceInner />
    </WorkspaceProvider>
  )
}