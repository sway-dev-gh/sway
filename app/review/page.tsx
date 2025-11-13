'use client'

import AppLayout from '@/components/AppLayout'

export default function Review() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Review</h1>
          <p className="text-terminal-muted text-sm mt-1">Code reviews and pull requests</p>
        </div>

        <div className="p-6">
          {/* Main Content Area */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <div className="text-center py-12">
              <h2 className="text-terminal-text text-lg mb-2">Code Reviews</h2>
              <p className="text-terminal-muted text-sm">No pending reviews. All caught up!</p>

              <div className="mt-8">
                <button className="border border-terminal-border text-terminal-text px-4 py-2 text-sm hover:bg-terminal-hover transition-colors">
                  View All Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}