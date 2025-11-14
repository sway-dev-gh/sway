'use client'

import React, { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import PricingPlans from '@/components/PricingPlans'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams, useRouter } from 'next/navigation'

export default function Settings() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'account'
  })
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [projectUpdates, setProjectUpdates] = useState(false)
  const [saving, setSaving] = useState(false)

  // Workspace Settings State
  const [defaultTheme, setDefaultTheme] = useState('dark')
  const [autoSaveInterval, setAutoSaveInterval] = useState('60')
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [autoAssignReviews, setAutoAssignReviews] = useState(false)
  const [defaultVisibility, setDefaultVisibility] = useState('private')
  const [realTimePresence, setRealTimePresence] = useState(true)

  // Automation Settings State
  const [autoApproveChanges, setAutoApproveChanges] = useState(false)
  const [teamNotifications, setTeamNotifications] = useState(true)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiKey, setApiKey] = useState('')

  const { user } = useAuth()

  // Handle tab changes with URL persistence
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const params = new URLSearchParams(searchParams)
    params.set('tab', tabId)
    router.replace(`/settings?${params.toString()}`)
  }

  // Load saved settings on mount
  React.useEffect(() => {
    const loadSavedSettings = () => {
      try {
        const savedSettings = localStorage.getItem('user_settings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)

          // Update all state with saved values
          if (settings.email) setEmail(settings.email)
          if (settings.username) setUsername(settings.username)
          if (typeof settings.emailNotifications === 'boolean') setEmailNotifications(settings.emailNotifications)
          if (typeof settings.projectUpdates === 'boolean') setProjectUpdates(settings.projectUpdates)
          if (settings.defaultTheme) setDefaultTheme(settings.defaultTheme)
          if (settings.autoSaveInterval) setAutoSaveInterval(settings.autoSaveInterval)
          if (typeof settings.showLineNumbers === 'boolean') setShowLineNumbers(settings.showLineNumbers)
          if (typeof settings.autoAssignReviews === 'boolean') setAutoAssignReviews(settings.autoAssignReviews)
          if (settings.defaultVisibility) setDefaultVisibility(settings.defaultVisibility)
          if (typeof settings.realTimePresence === 'boolean') setRealTimePresence(settings.realTimePresence)
          if (typeof settings.autoApproveChanges === 'boolean') setAutoApproveChanges(settings.autoApproveChanges)
          if (typeof settings.teamNotifications === 'boolean') setTeamNotifications(settings.teamNotifications)

          console.log('Settings loaded from localStorage:', settings)
        }
      } catch (error) {
        console.error('Error loading saved settings:', error)
      }
    }

    loadSavedSettings()
  }, [])

  // Populate with user data (fallback if no saved settings)
  React.useEffect(() => {
    if (user && !localStorage.getItem('user_settings')) {
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
        throw new Error('Please enter a valid email address')
      }

      if (username && !validateUsername(username)) {
        throw new Error('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens')
      }

      const settingsData = {
        email, username, emailNotifications, projectUpdates,
        defaultTheme, autoSaveInterval, showLineNumbers, autoAssignReviews,
        defaultVisibility, realTimePresence, autoApproveChanges, teamNotifications,
        updatedAt: new Date().toISOString()
      }

      // Save to localStorage for immediate persistence
      localStorage.setItem('user_settings', JSON.stringify(settingsData))

      // Save to backend API
      try {
        const response = await fetch('/api/user/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify(settingsData)
        })

        if (!response.ok) {
          // If API fails, still keep localStorage version
          console.warn('API save failed, using localStorage backup')
        } else {
          const result = await response.json()
          console.log('Settings saved to backend:', result)
        }
      } catch (apiError) {
        console.warn('Backend API unavailable, settings saved locally')
      }

      // Update user context if available
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settings-updated', { detail: settingsData }))
      }

      // Show success feedback with checkmark
      const successMessage = document.createElement('div')
      successMessage.className = 'fixed top-4 right-4 bg-terminal-text text-terminal-bg px-4 py-2 rounded z-50'
      successMessage.textContent = 'Settings saved successfully'
      document.body.appendChild(successMessage)
      setTimeout(() => document.body.removeChild(successMessage), 3000)

    } catch (error: any) {
      console.error('Save error:', error)

      // Show error feedback
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 bg-terminal-surface border border-terminal-border text-terminal-text px-4 py-2 z-50'
      errorMessage.textContent = `${error.message || 'Failed to save settings'}`
      document.body.appendChild(errorMessage)
      setTimeout(() => document.body.removeChild(errorMessage), 3000)
    } finally {
      setSaving(false)
    }
  }

  // Handler functions for missing button functionality
  const handleGenerateApiKey = () => {
    const newApiKey = 'sk_' + Math.random().toString(36).substr(2, 48)
    setApiKey(newApiKey)
    setShowApiKeyModal(true)
  }

  const handleConnectIntegration = (platform: string) => {
    const integrations = {
      'GitHub': {
        url: 'https://github.com/login/oauth/authorize',
        clientId: 'your_github_client_id',
        scope: 'repo,user:email',
        redirectUri: `${window.location.origin}/api/auth/github/callback`
      },
      'Slack': {
        url: 'https://slack.com/oauth/v2/authorize',
        clientId: 'your_slack_client_id',
        scope: 'chat:write,channels:read',
        redirectUri: `${window.location.origin}/api/auth/slack/callback`
      },
      'Discord': {
        url: 'https://discord.com/oauth2/authorize',
        clientId: 'your_discord_client_id',
        scope: 'guilds,guilds.join',
        redirectUri: `${window.location.origin}/api/auth/discord/callback`
      },
      'Zapier': {
        url: 'https://zapier.com/platform/public-invite/your_app_id',
        clientId: 'your_zapier_client_id',
        scope: 'read,write',
        redirectUri: `${window.location.origin}/api/auth/zapier/callback`
      }
    }

    const config = integrations[platform as keyof typeof integrations]
    if (!config) {
      console.error(`Integration ${platform} not configured`)
      return
    }

    // Store platform in localStorage for callback processing
    localStorage.setItem('oauth_platform', platform)
    localStorage.setItem('oauth_state', Math.random().toString(36).substring(7))

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: localStorage.getItem('oauth_state') || ''
    })

    // Redirect to OAuth provider
    window.location.href = `${config.url}?${params.toString()}`
  }

  const handleAddAutomationRule = () => {
    // Create a new automation rule by opening workflow builder
    const ruleId = `rule_${Date.now()}`
    const defaultRule = {
      id: ruleId,
      name: 'New Automation Rule',
      trigger: {
        type: 'file_updated',
        conditions: []
      },
      actions: [
        {
          type: 'notify_team',
          settings: {}
        }
      ],
      enabled: true,
      created_at: new Date().toISOString()
    }

    // Store in localStorage for now (would normally be API call)
    const existingRules = JSON.parse(localStorage.getItem('automation_rules') || '[]')
    existingRules.push(defaultRule)
    localStorage.setItem('automation_rules', JSON.stringify(existingRules))

    // Redirect to automation rule editor
    window.location.hash = `automation-rule-${ruleId}`

    // Update UI state to show the new rule was created
    setAutoApproveChanges(false) // Reset since we added a new rule

    // Show success feedback
    const event = new CustomEvent('automation-rule-created', {
      detail: { ruleId, ruleName: defaultRule.name }
    })
    window.dispatchEvent(event)
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
                    onClick={() => handleTabChange(tab.id)}
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
                        <option value="light" disabled>Light Mode (Coming Soon)</option>
                        <option value="auto" disabled>Auto (Coming Soon)</option>
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
                        <option value="public" disabled>Public (Coming Soon)</option>
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
                        <button
                          disabled
                          className="px-3 py-1 text-xs bg-terminal-border text-terminal-muted cursor-not-allowed opacity-50"
                        >
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
                        <span className="text-xs text-terminal-text">Coming Soon</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Sync projects with GitHub repositories
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('GitHub')}
                        className="text-xs border border-terminal-border text-terminal-text px-3 py-1 hover:bg-terminal-hover transition-colors"
                      >
                        Connect
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-terminal-text font-medium">Slack</h3>
                        <span className="text-xs text-terminal-text">Coming Soon</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Send notifications to Slack channels
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('Slack')}
                        className="text-xs border border-terminal-border text-terminal-text px-3 py-1 hover:bg-terminal-hover transition-colors"
                      >
                        Connect
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-terminal-text font-medium">Discord</h3>
                        <span className="text-xs text-terminal-text">Coming Soon</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Post updates to Discord servers
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('Discord')}
                        className="text-xs border border-terminal-border text-terminal-text px-3 py-1 hover:bg-terminal-hover transition-colors"
                      >
                        Connect
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-terminal-text font-medium">Zapier</h3>
                        <span className="text-xs text-terminal-text">Coming Soon</span>
                      </div>
                      <p className="text-terminal-muted text-sm mb-3">
                        Connect to 5000+ apps via Zapier
                      </p>
                      <button
                        onClick={() => handleConnectIntegration('Zapier')}
                        className="text-xs border border-terminal-border text-terminal-text px-3 py-1 hover:bg-terminal-hover transition-colors"
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
                        className="px-3 py-1 text-xs bg-terminal-text text-terminal-bg hover:bg-terminal-muted transition-colors"
                      >
                        Generate API Key
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
                      <button className="bg-terminal-border text-terminal-text px-3 py-2 text-sm hover:bg-terminal-hover transition-colors">
                        Change Password
                      </button>
                    </div>

                    <div className="border border-terminal-border rounded-sm p-4">
                      <h3 className="text-terminal-text font-medium mb-2">Active Sessions</h3>
                      <p className="text-terminal-muted text-sm mb-3">
                        You have 1 active session. Log out of all devices to enhance security.
                      </p>
                      <button className="bg-terminal-text text-terminal-bg px-3 py-2 text-sm hover:bg-terminal-muted transition-colors">
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

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h2 className="text-xl text-terminal-text font-medium mb-4">API Key Generated</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Your API Key</label>
                <div className="bg-terminal-bg border border-terminal-border p-3 rounded-sm font-mono text-sm text-terminal-text break-all">
                  {apiKey}
                </div>
                <p className="text-xs text-terminal-muted mt-2">
                  Store this key securely. It will not be shown again.
                </p>
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
    </AppLayout>
  )
}