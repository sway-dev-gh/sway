'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/auth'
import PromptCard from '@/components/prompting/PromptCard'
import AgentDashboard from '@/components/prompting/AgentDashboard'
import ActivityLog from '@/components/prompting/ActivityLog'
import PermissionManager from '@/components/prompting/PermissionManager'

interface Agent {
  id: string
  agent_name: string
  expertise_areas: string[]
  status: 'active' | 'inactive' | 'busy'
  max_concurrent_workspaces: number
  response_time_avg: number
}

interface Prompt {
  id: string
  original_prompt: string
  optimized_prompt?: string
  prompt_type: string
  status: 'pending' | 'agent_review' | 'optimized' | 'approved' | 'executed' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  submitted_at: string
  agent_id?: string
  user_id: string
  ai_response?: string
  execution_time_ms?: number
  tokens_used?: number
  created_at?: string
  updated_at?: string
}

interface WorkspaceConfig {
  id: string
  workspace_id: string
  prompting_enabled: boolean
  assigned_agent_id?: string
  auto_approve_simple_prompts: boolean
  require_agent_review: boolean
  ai_model: string
  max_prompt_length: number
}

export default function PromptingDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tab state
  const [activeTab, setActiveTab] = useState('overview')

  // New prompt submission state
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [newPromptText, setNewPromptText] = useState('')
  const [newPromptType, setNewPromptType] = useState('general')
  const [newPromptPriority, setNewPromptPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadDashboardData()
    }
  }, [authLoading, isAuthenticated])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      // Load agents, prompts, and workspace config in parallel
      const [agentsRes, promptsRes, configRes] = await Promise.all([
        apiRequest('/api/prompting/agents'),
        apiRequest('/api/prompting/prompts'),
        apiRequest('/api/prompting/workspace-config')
      ])

      if (agentsRes?.ok) {
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents || [])
      }

      if (promptsRes?.ok) {
        const promptsData = await promptsRes.json()
        setPrompts(promptsData.prompts || [])
      }

      if (configRes?.ok) {
        const configData = await configRes.json()
        setWorkspaceConfig(configData.config || null)
      }

    } catch (error) {
      console.error('Failed to load prompting dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiRequest('/api/prompting/prompts', {
        method: 'POST',
        body: JSON.stringify({
          original_prompt: newPromptText,
          prompt_type: newPromptType,
          priority: newPromptPriority
        })
      })

      if (response?.ok) {
        const data = await response.json()
        setPrompts(prev => [data.prompt, ...prev])
        setShowSubmitModal(false)
        setNewPromptText('')
        setNewPromptType('general')
        setNewPromptPriority('medium')
      } else {
        const errorData = await response?.json()
        setError(errorData?.error || 'Failed to submit prompt')
      }
    } catch (error: any) {
      console.error('Prompt submission error:', error)
      setError(error.message || 'Failed to submit prompt')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400'
      case 'agent_review': return 'text-blue-400'
      case 'optimized': return 'text-purple-400'
      case 'approved': return 'text-green-400'
      case 'executed': return 'text-terminal-text'
      case 'rejected': return 'text-red-400'
      default: return 'text-terminal-muted'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-terminal-muted'
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl text-terminal-text font-medium">Prompting Dashboard</h1>
              <p className="text-terminal-muted text-sm mt-1">
                AI prompt management with human-in-the-loop oversight
              </p>
            </div>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
            >
              Submit Prompt
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-terminal-border bg-terminal-surface">
          <div className="flex space-x-0">
            {[
              { key: 'overview', label: 'Overview', icon: '' },
              { key: 'prompts', label: 'Prompts', icon: '' },
              { key: 'agents', label: 'Agents', icon: '' },
              { key: 'activity', label: 'Activity', icon: '' },
              { key: 'permissions', label: 'Permissions', icon: '' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-terminal-text text-terminal-text bg-terminal-bg'
                    : 'border-transparent text-terminal-muted hover:text-terminal-text hover:bg-terminal-bg/30'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="bg-terminal-bg border border-red-500 text-red-400 p-3 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-terminal-surface border border-terminal-border p-4">
                  <div className="text-terminal-text text-lg font-medium">{prompts.length}</div>
                  <div className="text-terminal-muted text-xs">Total Prompts</div>
                </div>
                <div className="bg-terminal-surface border border-terminal-border p-4">
                  <div className="text-terminal-text text-lg font-medium">
                    {prompts.filter(p => p.status === 'pending').length}
                  </div>
                  <div className="text-terminal-muted text-xs">Pending Review</div>
                </div>
                <div className="bg-terminal-surface border border-terminal-border p-4">
                  <div className="text-terminal-text text-lg font-medium">{agents.length}</div>
                  <div className="text-terminal-muted text-xs">Active Agents</div>
                </div>
                <div className="bg-terminal-surface border border-terminal-border p-4">
                  <div className="text-terminal-text text-lg font-medium">
                    {agents.filter(a => a.status === 'active').length}
                  </div>
                  <div className="text-terminal-muted text-xs">Available</div>
                </div>
              </div>

              {/* Recent Prompts */}
              <div className="bg-terminal-surface border border-terminal-border">
                <div className="border-b border-terminal-border p-4">
                  <h2 className="text-terminal-text font-medium">Recent Prompts</h2>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="text-terminal-muted text-sm">Loading prompts...</div>
                  ) : prompts.length === 0 ? (
                    <div className="text-terminal-muted text-sm text-center py-8">
                      No prompts submitted yet. Click "Submit Prompt" to get started.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prompts.slice(0, 5).map(prompt => (
                        <PromptCard
                          key={prompt.id}
                          id={prompt.id}
                          originalPrompt={prompt.original_prompt}
                          optimizedPrompt={prompt.optimized_prompt}
                          promptType={prompt.prompt_type}
                          status={prompt.status}
                          priority={prompt.priority}
                          submittedAt={prompt.submitted_at}
                          agentId={prompt.agent_id}
                          aiResponse={prompt.ai_response}
                          executionTimeMs={prompt.execution_time_ms}
                          tokensUsed={prompt.tokens_used}
                          onUpdate={(promptId, action) => {
                            console.log('Prompt action:', action, 'for prompt:', promptId)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Agents Status */}
              <div className="bg-terminal-surface border border-terminal-border">
                <div className="border-b border-terminal-border p-4">
                  <h2 className="text-terminal-text font-medium">Agent Status</h2>
                </div>
                <div className="p-4">
                  {agents.length === 0 ? (
                    <div className="text-terminal-muted text-sm text-center py-4">
                      No agents available
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {agents.slice(0, 3).map(agent => (
                        <div key={agent.id} className="flex items-center justify-between border border-terminal-border p-3">
                          <div>
                            <div className="text-terminal-text text-sm">{agent.agent_name}</div>
                            <div className="text-terminal-muted text-xs">
                              {agent.expertise_areas.join(', ')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs ${agent.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                              {agent.status}
                            </div>
                            <div className="text-terminal-muted text-xs">
                              {agent.response_time_avg}min avg
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="space-y-4">
              {prompts.length === 0 ? (
                <div className="text-terminal-muted text-sm text-center py-8">
                  No prompts submitted yet. Click "Submit Prompt" to get started.
                </div>
              ) : (
                prompts.map(prompt => (
                  <PromptCard
                    key={prompt.id}
                    id={prompt.id}
                    originalPrompt={prompt.original_prompt}
                    optimizedPrompt={prompt.optimized_prompt}
                    promptType={prompt.prompt_type}
                    status={prompt.status}
                    priority={prompt.priority}
                    submittedAt={prompt.submitted_at}
                    agentId={prompt.agent_id}
                    aiResponse={prompt.ai_response}
                    executionTimeMs={prompt.execution_time_ms}
                    tokensUsed={prompt.tokens_used}
                    onUpdate={(promptId, action) => {
                      console.log('Prompt action:', action, 'for prompt:', promptId)
                    }}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'agents' && (
            <AgentDashboard
              onAgentUpdate={(agentId, action, data) => {
                // Handle agent updates
                if (action === 'create') {
                  setAgents(prev => [data, ...prev])
                } else if (action === 'status_change') {
                  setAgents(prev => prev.map(a =>
                    a.id === agentId ? { ...a, status: data.status } : a
                  ))
                }
              }}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityLog
              workspaceId={undefined}
              autoRefresh={true}
              showFilters={true}
            />
          )}

          {activeTab === 'permissions' && (
            <PermissionManager
              workspaceId={'default'}
              onPermissionUpdate={(action, data) => {
                // Handle permission updates - could trigger notifications, etc.
                console.log('Permission update:', action, data)
              }}
            />
          )}
        </div>
      </div>

      {/* Submit Prompt Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-2xl">
            <h2 className="text-xl text-terminal-text font-medium mb-4">Submit AI Prompt</h2>

            {error && (
              <div className="bg-terminal-bg border border-red-500 text-red-400 p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Prompt Text *</label>
                <textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text h-32 resize-none font-mono"
                  placeholder="Enter your AI prompt here..."
                  required
                />
                <div className="text-terminal-muted text-xs mt-1">
                  {newPromptText.length}/4000 characters
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-terminal-text mb-2">Type</label>
                  <select
                    value={newPromptType}
                    onChange={(e) => setNewPromptType(e.target.value)}
                    className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  >
                    <option value="general">General</option>
                    <option value="code_review">Code Review</option>
                    <option value="documentation">Documentation</option>
                    <option value="bug_fix">Bug Fix</option>
                    <option value="optimization">Optimization</option>
                    <option value="testing">Testing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-terminal-text mb-2">Priority</label>
                  <select
                    value={newPromptPriority}
                    onChange={(e) => setNewPromptPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                    className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="submit"
                  disabled={loading || !newPromptText.trim()}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Prompt'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}