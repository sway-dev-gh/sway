'use client'

import AppLayout from '@/components/AppLayout'

export default function Workspace() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Workspace</h1>
          <p className="text-terminal-muted text-sm mt-1">Manage your projects and files</p>
        </div>

        <div className="p-6">
          {/* Main Content Area */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <div className="text-center py-12">
              <h2 className="text-terminal-text text-lg mb-2">Your Projects</h2>
              <p className="text-terminal-muted text-sm">No projects yet. Create your first project to get started.</p>

              <div className="mt-8">
                <button className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors">
                  New Project
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}