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
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [autoAssignReviews, setAutoAssignReviews] = useState(false)
  const [realTimePresence, setRealTimePresence] = useState(true)
  const [autoApproveChanges, setAutoApproveChanges] = useState(false)
  const [teamNotifications, setTeamNotifications] = useState(true)
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
        setSaving(false)
        return
      }

      if (username && !validateUsername(username)) {
        alert('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens')
        setSaving(false)
        return
      }

      // Save to backend
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          emailNotifications,
          projectUpdates
        })
      })

      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateApiKey = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/generate-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
        setShowApiKeyModal(true)
      } else {
        alert('Failed to generate API key')
      }
    } catch (error) {
      console.error('API key generation error:', error)
      alert('Failed to generate API key')
    } finally {
      setSaving(false)
    }
  }

  const handleConnectIntegration = (integration: string) => {
    // TODO: Implement OAuth flow for each integration
    alert(`Connecting to ${integration}... This will redirect you to authorize access.`)
  }

  const handleChangePassword = () => {
    setShowPasswordModal(true)
  }

  const handleLogoutAllDevices = async () => {
    if (confirm('Are you sure you want to log out of all devices? You will need to sign in again on all your devices.')) {
      try {
        const response = await fetch('/api/auth/logout-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          alert('Successfully logged out of all devices')
          window.location.href = '/login'
        } else {
          alert('Failed to logout all devices')
        }
      } catch (error) {
        console.error('Logout all devices error:', error)
        alert('Failed to logout all devices')
      }
    }
  }

  const handleViewActivityLog = () => {
    window.open('/security/activity-log', '_blank')
  }

  const handleAddAutomationRule = () => {
    setShowAutomationModal(true)
  }

  const tabs = [
    { id: 'account', name: 'Account', icon: '' },
    { id: 'workspace', name: 'Workspace', icon: '' },
    { id: 'automation', name: 'Automation', icon: '' },
    { id: 'billing', name: 'Billing', icon: '' },
    { id: 'security', name: 'Security', icon: '' },
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

          {/* Workspace Tab */}
          {activeTab === 'workspace' && (
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-terminal-text text-lg mb-4">Workspace Configuration</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Default Theme</span>
                      <select className="bg-terminal-bg border border-terminal-border px-3 py-1 text-terminal-text text-sm">
                        <option value="dark">Dark Terminal</option>
                        <option value="light">Light Mode</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Auto-save Interval</span>
                      <select className="bg-terminal-bg border border-terminal-border px-3 py-1 text-terminal-text text-sm">
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Show Line Numbers</span>
                      <button
                        onClick={() => setShowLineNumbers(!showLineNumbers)}
                        className={`px-3 py-1 text-xs transition-colors ${
                          showLineNumbers
                            ? 'bg-terminal-text text-terminal-bg'
                            : 'bg-terminal-border text-terminal-text hover:bg-terminal-hover'
                        }`}
                      >
                        {showLineNumbers ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Command Palette Shortcut</span>
                      <div className="text-terminal-text text-sm font-mono">Ctrl + /</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-terminal-text text-lg mb-4">Collaboration Defaults</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Auto-assign Reviews</span>
                      <button
                        onClick={() => setAutoAssignReviews(!autoAssignReviews)}
                        className={`px-3 py-1 text-xs transition-colors ${
                          autoAssignReviews
                            ? 'bg-terminal-text text-terminal-bg'
                            : 'bg-terminal-border text-terminal-text hover:bg-terminal-hover'
                        }`}
                      >
                        {autoAssignReviews ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Default Project Visibility</span>
                      <select className="bg-terminal-bg border border-terminal-border px-3 py-1 text-terminal-text text-sm">
                        <option value="private">Private</option>
                        <option value="team">Team</option>
                        <option value="public">Public</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-terminal-text text-sm">Real-time Presence</span>
                      <button
                        onClick={() => setRealTimePresence(!realTimePresence)}
                        className={`px-3 py-1 text-xs transition-colors ${
                          realTimePresence
                            ? 'bg-terminal-text text-terminal-bg'
                            : 'bg-terminal-border text-terminal-text hover:bg-terminal-hover'
                        }`}
                      >
                        {realTimePresence ? 'Enabled' : 'Disabled'}
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
                    {saving ? 'Saving...' : 'Save Workspace Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Automation Tab */}
          {activeTab === 'automation' && (
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-terminal-text text-lg mb-4">Workflow Automation</h2>
                  <p className="text-terminal-muted text-sm mb-6">
                    Create automated workflows that trigger actions when specific events occur in your projects.
                  </p>

                  {/* Sample Workflow Rules */}
                  <div className="space-y-4">
                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-terminal-text font-medium">Auto-approve simple changes</h3>
                        <button
                          onClick={() => setAutoApproveChanges(!autoApproveChanges)}
                          className={`px-3 py-1 text-xs transition-colors ${
                            autoApproveChanges
                              ? 'bg-terminal-text text-terminal-bg'
                              : 'bg-terminal-border text-terminal-text hover:bg-terminal-hover'
                          }`}
                        >
                          {autoApproveChanges ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                      <div className="text-sm text-terminal-muted">
                        <div className="mb-2">
                          <span className="text-terminal-text">When:</span> Block is updated with less than 10 lines changed
                        </div>
                        <div>
                          <span className="text-terminal-text">Then:</span> Auto-approve if no breaking changes detected
                        </div>
                      </div>
                    </div>

                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-terminal-text font-medium">Team notifications</h3>
                        <button
                          onClick={() => setTeamNotifications(!teamNotifications)}
                          className={`px-3 py-1 text-xs transition-colors ${
                            teamNotifications
                              ? 'bg-terminal-text text-terminal-bg'
                              : 'bg-terminal-border text-terminal-text hover:bg-terminal-hover'
                          }`}
                        >
                          {teamNotifications ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                      <div className="text-sm text-terminal-muted">
                        <div className="mb-2">
                          <span className="text-terminal-text">When:</span> Block is approved
                        </div>
                        <div>
                          <span className="text-terminal-text">Then:</span> Notify all project members
                        </div>
                      </div>
                    </div>

                    <div className="border border-terminal-border rounded p-4 bg-terminal-bg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-terminal-text font-medium">Slack integration</h3>
                        <button className="px-3 py-1 text-xs bg-terminal-border text-terminal-text">
                          Coming Soon
                        </button>
                      </div>
                      <div className="text-sm text-terminal-muted">
                        <div className="mb-2">
                          <span className="text-terminal-text">When:</span> Review is requested
                        </div>
                        <div>
                          <span className="text-terminal-text">Then:</span> Send message to #reviews channel
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-terminal-border">
                    <button
                      onClick={handleAddAutomationRule}
                      className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
                    >
                      Add New Automation Rule
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-terminal-text text-lg mb-4">Integrations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-terminal-text font-medium">GitHub</h3>
                        <span className="text-xs text-terminal-text">Available</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Sync projects with GitHub repositories
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('GitHub')}
                        className="text-xs border border-terminal-border px-3 py-1 hover:bg-terminal-hover transition-colors"
                      >
                        Connect
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-terminal-text font-medium">Slack</h3>
                        <span className="text-xs text-terminal-text">Available</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Send notifications to Slack channels
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('Slack')}
                        className="text-xs border border-terminal-border px-3 py-1 hover:bg-terminal-hover transition-colors"
                      >
                        Connect
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-terminal-text font-medium">Discord</h3>
                        <span className="text-xs text-terminal-text">Available</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Post updates to Discord servers
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('Discord')}
                        className="text-xs border border-terminal-border px-3 py-1 hover:bg-terminal-hover transition-colors"
                      >
                        Connect
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-terminal-text font-medium">Zapier</h3>
                        <span className="text-xs text-terminal-text">Available</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Connect to 5000+ apps via Zapier
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('Zapier')}
                        className="text-xs border border-terminal-border px-3 py-1 hover:bg-terminal-hover transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-terminal-text text-lg mb-4">API & Webhooks</h2>
                  <div className="border border-terminal-border rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-terminal-text font-medium">API Access</h3>
                      <button
                        onClick={handleGenerateApiKey}
                        disabled={saving}
                        className="px-3 py-1 text-xs bg-terminal-text text-terminal-bg hover:bg-terminal-muted transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Generating...' : 'Generate API Key'}
                      </button>
                    </div>
                    <div className="text-sm text-terminal-muted mb-3">
                      Use our REST API to integrate SwayFiles with your custom applications.
                    </div>
                    <div className="bg-terminal-accent rounded p-3 font-mono text-xs text-terminal-text">
                      curl -H "Authorization: Bearer YOUR_API_KEY" \\<br />
                      &nbsp;&nbsp;https://api.swayfiles.com/v1/projects
                    </div>
                  </div>
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
                  <h2 className="text-terminal-text text-lg mb-4">Security Settings</h2>

                  <div className="space-y-4">
                    <div className="border border-terminal-border rounded-sm p-4">
                      <h3 className="text-terminal-text font-medium mb-2">Password Security</h3>
                      <p className="text-terminal-muted text-sm mb-3">
                        Your password meets security requirements: 12+ characters with uppercase, lowercase, numbers, and special characters.
                      </p>
                      <button
                        onClick={handleChangePassword}
                        className="bg-terminal-border text-terminal-text px-3 py-2 text-sm hover:bg-terminal-hover transition-colors"
                      >
                        Change Password
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded-sm p-4">
                      <h3 className="text-terminal-text font-medium mb-2">Active Sessions</h3>
                      <p className="text-terminal-muted text-sm mb-3">
                        You have 1 active session. Log out of all devices to enhance security.
                      </p>
                      <button
                        onClick={handleLogoutAllDevices}
                        className="bg-terminal-text text-terminal-bg px-3 py-2 text-sm hover:bg-terminal-muted transition-colors"
                      >
                        Logout All Devices
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded-sm p-4">
                      <h3 className="text-terminal-text font-medium mb-2">Account Activity</h3>
                      <p className="text-terminal-muted text-sm mb-3">
                        Monitor your account for suspicious activity. Last login: {new Date().toLocaleString()}
                      </p>
                      <button
                        onClick={handleViewActivityLog}
                        className="bg-terminal-border text-terminal-text px-3 py-2 text-sm hover:bg-terminal-hover transition-colors"
                      >
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Change Password</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Current Password</label>
                <input
                  type="password"
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">New Password</label>
                <input
                  type="password"
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors">
                  Change Password
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && apiKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">API Key Generated</h2>

            <div className="space-y-4">
              <p className="text-terminal-muted text-sm">
                Your new API key has been generated. Copy it now as it won't be shown again.
              </p>

              <div className="bg-terminal-bg border border-terminal-border p-3 rounded">
                <code className="text-terminal-text text-sm font-mono break-all">{apiKey}</code>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => navigator.clipboard.writeText(apiKey)}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Automation Rule Modal */}
      {showAutomationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-lg">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Create Automation Rule</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Rule Name</label>
                <input
                  type="text"
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="e.g., Auto-approve small changes"
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Trigger Condition</label>
                <select className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm">
                  <option value="file_change">File changed</option>
                  <option value="review_requested">Review requested</option>
                  <option value="project_created">Project created</option>
                  <option value="team_member_added">Team member added</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Action</label>
                <select className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm">
                  <option value="auto_approve">Auto-approve</option>
                  <option value="notify_team">Notify team</option>
                  <option value="assign_reviewer">Assign reviewer</option>
                  <option value="send_email">Send email</option>
                </select>
              </div>

              <div className="flex space-x-4 mt-6">
                <button className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors">
                  Create Rule
                </button>
                <button
                  onClick={() => setShowAutomationModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}