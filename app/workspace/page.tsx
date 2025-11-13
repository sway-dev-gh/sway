'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'

export default function Workspace() {
  const searchParams = useSearchParams()
  const projectId = searchParams?.get('id')

  return (
    <div className="min-h-screen bg-terminal-bg font-mono flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-terminal-surface border-r border-terminal-border p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-terminal-text mb-4">Workspace</h2>
            <p className="text-terminal-muted text-sm">
              Project: {projectId || 'No project selected'}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-terminal-text">Files</h3>
            <div className="space-y-1 text-sm text-terminal-muted">
              <div className="p-2 hover:bg-terminal-bg rounded cursor-pointer">📄 README.md</div>
              <div className="p-2 hover:bg-terminal-bg rounded cursor-pointer">📁 components/</div>
              <div className="p-2 hover:bg-terminal-bg rounded cursor-pointer">📁 styles/</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-4">
          <h1 className="text-xl font-medium text-terminal-text">
            Collaborative Workspace
          </h1>
          <p className="text-terminal-muted text-sm mt-1">
            Real-time collaboration platform - Coming Soon
          </p>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-8">
          <div className="h-full bg-terminal-surface border border-terminal-border rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-4xl text-terminal-muted">🚧</div>
              <div>
                <h2 className="text-lg font-medium text-terminal-text mb-2">
                  Workspace Under Development
                </h2>
                <p className="text-terminal-muted text-sm max-w-md">
                  The collaborative workspace feature is being rebuilt for Swayfiles 2.0.
                  Real-time collaboration, file editing, and team features coming soon.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-terminal-text text-terminal-bg px-6 py-3 font-medium hover:bg-terminal-text/90 transition-colors"
                >
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 bg-terminal-surface border-l border-terminal-border p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-terminal-text mb-2">Comments</h3>
            <p className="text-terminal-muted text-xs">
              No comments yet
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-terminal-text mb-2">Team</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-terminal-text">You</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}