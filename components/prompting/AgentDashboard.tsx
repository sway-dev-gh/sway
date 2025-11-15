'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Agent {
  id: string
  agent_name: string
  expertise_areas: string[]
  status: 'active' | 'inactive' | 'busy'
  max_concurrent_workspaces: number
  response_time_avg: number
  created_at: string
}

interface AgentPermissions {
  id: string
  agent_id: string
  workspace_id: string
  can_view_dashboard: boolean
  can_edit_prompts: boolean
  can_approve_prompts: boolean
  can_view_logs: boolean
  can_access_patterns: boolean
}

interface AgentDashboardProps {
  onAgentUpdate?: (agentId: string, action: string, data?: any) => void
}

export default function AgentDashboard({ onAgentUpdate }: AgentDashboardProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [permissions, setPermissions] = useState<AgentPermissions[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // New agent form state
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentExpertise, setNewAgentExpertise] = useState<string[]>([])
  const [newAgentMaxWorkspaces, setNewAgentMaxWorkspaces] = useState(5)

  const expertiseOptions = [
    'code_review',
    'documentation',
    'debugging',
    'architecture',
    'testing',
    'optimization',
    'security',
    'performance',
    'ui_ux',
    'api_design'
  ]

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    // This would typically make an API call
    // For now, showing the structure
    setLoading(true)
    try {
      // API call would go here
      setAgents([])
    } catch (error) {
      setError('Failed to load agents')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return ''
      case 'busy': return ''
      case 'inactive': return ''
      default: return ''
    }
  }

  const getExpertiseIcon = (expertise: string) => {
    switch (expertise) {
      case 'code_review': return ''
      case 'documentation': return ''
      case 'debugging': return ''
      case 'architecture': return ''
      case 'testing': return ''
      case 'optimization': return ''
      case 'security': return ''
      case 'performance': return ''
      case 'ui_ux': return ''
      case 'api_design': return ''
      default: return ''
    }
  }

  const handleExpertiseToggle = (expertise: string) => {
    setNewAgentExpertise(prev =>
      prev.includes(expertise)
        ? prev.filter(e => e !== expertise)
        : [...prev, expertise]
    )
  }

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // API call would go here
      const newAgent: Agent = {
        id: Date.now().toString(), // Temporary ID
        agent_name: newAgentName,
        expertise_areas: newAgentExpertise,
        status: 'active',
        max_concurrent_workspaces: newAgentMaxWorkspaces,
        response_time_avg: 0,
        created_at: new Date().toISOString()
      }

      setAgents(prev => [newAgent, ...prev])
      setShowCreateModal(false)
      setNewAgentName('')
      setNewAgentExpertise([])
      setNewAgentMaxWorkspaces(5)

      if (onAgentUpdate) {
        onAgentUpdate(newAgent.id, 'create', newAgent)
      }
    } catch (error) {
      setError('Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (agentId: string, newStatus: 'active' | 'inactive' | 'busy') => {
    setAgents(prev =>
      prev.map(agent =>
        agent.id === agentId ? { ...agent, status: newStatus } : agent
      )
    )

    if (onAgentUpdate) {
      onAgentUpdate(agentId, 'status_change', { status: newStatus })
    }
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border">
      {/* Header */}
      <div className="border-b border-terminal-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-terminal-text font-medium">Agent Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-terminal-text text-terminal-bg px-3 py-1 text-xs hover:bg-terminal-muted transition-colors"
          >
            Add Agent
          </button>
        </div>
      </div>

      {/* Agent List */}
      <div className="p-4">
        {error && (
          <div className="bg-terminal-bg border border-red-500 text-red-400 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-terminal-muted text-sm text-center py-8">
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="text-terminal-muted text-sm text-center py-8">
            No agents configured. Add your first agent to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map(agent => (
              <motion.div
                key={agent.id}
                layout
                className={`border border-terminal-border p-4 cursor-pointer transition-colors ${
                  selectedAgent?.id === agent.id
                    ? 'border-terminal-text bg-terminal-bg/30'
                    : 'hover:border-terminal-text/50'
                }`}
                onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>{getStatusIcon(agent.status)}</span>
                      <span className="text-terminal-text font-medium">{agent.agent_name}</span>
                      <select
                        value={agent.status}
                        onChange={(e) => handleStatusChange(agent.id, e.target.value as any)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-terminal-bg border border-terminal-border text-terminal-text text-xs px-2 py-1"
                      >
                        <option value="active">Active</option>
                        <option value="busy">Busy</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {agent.expertise_areas.map(expertise => (
                        <span
                          key={expertise}
                          className="flex items-center space-x-1 bg-terminal-bg border border-terminal-border px-2 py-1 text-xs"
                        >
                          <span>{getExpertiseIcon(expertise)}</span>
                          <span className="text-terminal-text">{expertise.replace('_', ' ')}</span>
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-terminal-muted">
                      <span>Max Workspaces: {agent.max_concurrent_workspaces}</span>
                      <span>Avg Response: {agent.response_time_avg}min</span>
                      <span>Created: {new Date(agent.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedAgent?.id === agent.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-terminal-border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-terminal-text text-sm font-medium mb-2">Permissions</h4>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">View Dashboard</span>
                                <span className="text-green-400">✓</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">Edit Prompts</span>
                                <span className="text-green-400">✓</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">Approve Prompts</span>
                                <span className="text-green-400">✓</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">View Logs</span>
                                <span className="text-green-400">✓</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-terminal-muted">Access Code</span>
                                <span className="text-red-400">✗</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-terminal-text text-sm font-medium mb-2">Statistics</h4>
                            <div className="space-y-1 text-xs text-terminal-muted">
                              <div>Prompts Reviewed: 0</div>
                              <div>Avg Rating: N/A</div>
                              <div>Current Load: 0 workspaces</div>
                              <div>Last Active: Never</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Edit agent logic
                            }}
                            className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <span className="text-terminal-muted">|</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // View analytics logic
                            }}
                            className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                          >
                            Analytics
                          </button>
                          <span className="text-terminal-muted">|</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // Deactivate agent logic
                            }}
                            className="text-red-400 hover:text-red-300 text-xs transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h3 className="text-terminal-text font-medium mb-4">Add New Agent</h3>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Agent Name *</label>
                <input
                  type="text"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                  placeholder="Enter agent name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Expertise Areas</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {expertiseOptions.map(expertise => (
                    <label key={expertise} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newAgentExpertise.includes(expertise)}
                        onChange={() => handleExpertiseToggle(expertise)}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-terminal-text">{expertise.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Max Concurrent Workspaces</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newAgentMaxWorkspaces}
                  onChange={(e) => setNewAgentMaxWorkspaces(parseInt(e.target.value))}
                  className="w-full bg-terminal-bg border border-terminal-border px-3 py-2 text-terminal-text text-sm focus:outline-none focus:border-terminal-text"
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={loading || !newAgentName.trim() || newAgentExpertise.length === 0}
                  className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Agent'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}