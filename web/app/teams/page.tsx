'use client'

import React, { useState } from 'react'
import AppLayout from '@/components/AppLayout'

export default function Teams() {
  const [activeTab, setActiveTab] = useState('members')

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-terminal-text font-medium">Teams</h1>
              <p className="text-terminal-muted text-sm mt-1">
                Team collaboration features - Coming Soon
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">0</div>
              <div className="text-sm text-terminal-muted">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">0</div>
              <div className="text-sm text-terminal-muted">Pending Invitations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-medium text-terminal-text">0</div>
              <div className="text-sm text-terminal-muted">Teams Joined</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="text-4xl text-terminal-muted">👥</div>
              <div>
                <h2 className="text-lg font-medium text-terminal-text mb-2">
                  Team Management Under Development
                </h2>
                <p className="text-terminal-muted text-sm max-w-md">
                  Advanced team collaboration features including member invitations,
                  role management, and project permissions are being rebuilt for Swayfiles 2.0.
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-terminal-text text-terminal-bg px-6 py-3 font-medium hover:bg-terminal-text/90 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}