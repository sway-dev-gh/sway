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
                Manage your team members and collaboration settings
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
          {/* Team Members List */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-terminal-text mb-4">Team Members</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-terminal-bg rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-terminal-text rounded-full flex items-center justify-center">
                    <span className="text-terminal-bg text-sm font-medium">U</span>
                  </div>
                  <div>
                    <div className="text-terminal-text font-medium">You</div>
                    <div className="text-terminal-muted text-sm">Owner</div>
                  </div>
                </div>
                <div className="text-terminal-muted text-sm">Active</div>
              </div>
            </div>
          </div>

          {/* Team Actions */}
          <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
            <h3 className="text-lg font-medium text-terminal-text mb-4">Team Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 border border-terminal-border hover:bg-terminal-hover transition-colors">
                <div className="text-terminal-text font-medium">Invite Team Member</div>
                <div className="text-terminal-muted text-sm">Send invitation to collaborate</div>
              </button>
              <button className="w-full text-left p-3 border border-terminal-border hover:bg-terminal-hover transition-colors">
                <div className="text-terminal-text font-medium">Manage Permissions</div>
                <div className="text-terminal-muted text-sm">Control access to projects</div>
              </button>
              <button className="w-full text-left p-3 border border-terminal-border hover:bg-terminal-hover transition-colors">
                <div className="text-terminal-text font-medium">Team Settings</div>
                <div className="text-terminal-muted text-sm">Configure team preferences</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}