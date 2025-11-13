'use client'

import AppLayout from '@/components/AppLayout'

export default function Teams() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Teams</h1>
          <p className="text-terminal-muted text-sm mt-1">Collaborate with your team members</p>
        </div>

        <div className="p-6">
          {/* Main Content Area */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <div className="text-center py-12">
              <h2 className="text-terminal-text text-lg mb-2">Team Collaboration</h2>
              <p className="text-terminal-muted text-sm">Invite team members and manage permissions for your projects.</p>

              <div className="mt-8">
                <button className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors">
                  Invite Members
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}