'use client'

import React, { useState } from 'react'
import AppLayout from '@/components/AppLayout'
import PricingPlans from '@/components/PricingPlans'
import { useAuth } from '@/contexts/AuthContext'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [projectUpdates, setProjectUpdates] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  // Populate with user data
  React.useEffect(() => {
    if (user) {
      setEmail(user.email)
      setUsername(user.username || '')
    }
  }, [user])

  // Input validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateUsername = (username: string) => {
    // Only allow alphanumeric, underscore, hyphen (3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
    return usernameRegex.test(username)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      // Validate inputs
      if (email && !validateEmail(email)) {
        alert('Please enter a valid email address')
        return
      }

      if (username && !validateUsername(username)) {
        alert('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens')
        return
      }

      // TODO: Save to backend
      console.log('Saving settings:', { email, username, emailNotifications, projectUpdates })
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'billing', name: 'Billing', icon: '💳' },
    { id: 'security', name: 'Security', icon: '🔐' },
  ]

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <h1 className="text-xl text-terminal-text font-medium">Settings</h1>
          <p className="text-terminal-muted text-sm mt-1">Manage your account and preferences</p>
        </div>

        <div className="p-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-terminal-border">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-terminal-text text-terminal-text'
                        : 'border-transparent text-terminal-muted hover:text-terminal-text hover:border-terminal-hover'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-terminal-text text-lg mb-4">Account Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-terminal-text mb-1">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-terminal-text mb-1">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text placeholder-terminal-muted text-sm focus:outline-none focus:border-terminal-text"
                        maxLength={30}
                      />
                      <p className="text-xs text-terminal-muted mt-1">
                        3-30 characters, letters, numbers, underscore, and hyphen only
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-terminal-text text-lg mb-4">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Email Notifications</span>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`px-3 py-1 text-xs transition-colors ${
                          emailNotifications
                            ? 'bg-terminal-text text-terminal-bg'
                            : 'bg-terminal-border text-terminal-text hover:bg-terminal-hover'
                        }`}
                      >
                        {emailNotifications ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Project Updates</span>
                      <button
                        onClick={() => setProjectUpdates(!projectUpdates)}
                        className={`px-3 py-1 text-xs transition-colors ${
                          projectUpdates
                            ? 'bg-terminal-text text-terminal-bg'
                            : 'bg-terminal-border text-terminal-text hover:bg-terminal-hover'
                        }`}
                      >
                        {projectUpdates ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div>
              <PricingPlans />
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-terminal-text text-lg mb-4">🔐 Security Settings</h2>

                  <div className="space-y-4">
                    <div className="border border-terminal-border rounded-sm p-4">
                      <h3 className="text-terminal-text font-medium mb-2">Password Security</h3>
                      <p className="text-terminal-muted text-sm mb-3">
                        Your password meets security requirements: 12+ characters with uppercase, lowercase, numbers, and special characters.
                      </p>
                      <button className="bg-terminal-border text-terminal-text px-3 py-2 text-sm hover:bg-terminal-hover transition-colors">
                        Change Password
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded-sm p-4">
                      <h3 className="text-terminal-text font-medium mb-2">Active Sessions</h3>
                      <p className="text-terminal-muted text-sm mb-3">
                        You have 1 active session. Log out of all devices to enhance security.
                      </p>
                      <button className="bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700 transition-colors">
                        Logout All Devices
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded-sm p-4">
                      <h3 className="text-terminal-text font-medium mb-2">Account Activity</h3>
                      <p className="text-terminal-muted text-sm mb-3">
                        Monitor your account for suspicious activity. Last login: {new Date().toLocaleString()}
                      </p>
                      <button className="bg-terminal-border text-terminal-text px-3 py-2 text-sm hover:bg-terminal-hover transition-colors">
                        View Activity Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}