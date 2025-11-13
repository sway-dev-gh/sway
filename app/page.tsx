'use client'

import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Dashboard</h1>
          <p className="text-terminal-muted text-sm mt-1">Welcome to SwayFiles</p>
        </div>

        <div className="p-6">
          {/* Main Content Area */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <div className="text-center py-12">
              <h2 className="text-terminal-text text-lg mb-2">Your Workspace</h2>
              <p className="text-terminal-muted text-sm">Start by creating your first project or uploading files</p>

              <div className="mt-8 space-x-4">
                <button className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors">
                  Create Project
                </button>
                <button className="border border-terminal-border text-terminal-text px-4 py-2 text-sm hover:bg-terminal-hover transition-colors">
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}