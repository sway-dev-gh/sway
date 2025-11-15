'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ActivityLogEntry {
  id: string
  workspace_id: string
  prompt_id?: string
  agent_id?: string
  user_id?: string
  action: string
  description: string
  workflow_context?: string
  activity_pattern?: string
  metadata: Record<string, any>
  created_at: string
}

interface ActivityLogProps {
  workspaceId?: string
  promptId?: string
  agentId?: string
  limit?: number
  autoRefresh?: boolean
  showFilters?: boolean
}

export default function ActivityLog({
  workspaceId,
  promptId,
  agentId,
  limit = 50,
  autoRefresh = true,
  showFilters = true
}: ActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter state
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day')
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadActivities(true) // Silent reload
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, workspaceId, promptId, agentId])

  useEffect(() => {
    loadActivities()
  }, [workspaceId, promptId, agentId])

  useEffect(() => {
    applyFilters()
  }, [activities, selectedActions, selectedPatterns, timeRange])

  const loadActivities = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (workspaceId) params.append('workspace_id', workspaceId)
      if (promptId) params.append('prompt_id', promptId)
      if (agentId) params.append('agent_id', agentId)
      if (limit) params.append('limit', limit.toString())

      // Mock API call - replace with actual implementation
      // const response = await apiRequest(`/api/prompting/activity?${params.toString()}`)

      // For now, using mock data
      const mockActivities: ActivityLogEntry[] = [
        {
          id: '1',
          workspace_id: workspaceId || 'ws-1',
          prompt_id: 'prompt-1',
          agent_id: 'agent-1',
          user_id: 'user-1',
          action: 'prompt_submitted',
          description: 'User submitted a new code review prompt',
          workflow_context: 'code_review_request',
          activity_pattern: 'routine_update',
          metadata: { prompt_type: 'code_review', priority: 'medium' },
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
        },
        {
          id: '2',
          workspace_id: workspaceId || 'ws-1',
          prompt_id: 'prompt-1',
          agent_id: 'agent-1',
          action: 'agent_assigned',
          description: 'Claude Code Assistant assigned to review prompt',
          workflow_context: 'agent_assignment',
          activity_pattern: 'automated_workflow',
          metadata: { agent_name: 'Claude Code Assistant' },
          created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString() // 4 minutes ago
        },
        {
          id: '3',
          workspace_id: workspaceId || 'ws-1',
          prompt_id: 'prompt-1',
          agent_id: 'agent-1',
          action: 'prompt_optimized',
          description: 'Agent optimized prompt for better AI execution',
          workflow_context: 'prompt_optimization',
          activity_pattern: 'quality_improvement',
          metadata: { optimization_type: 'clarity_enhancement', word_count_change: '+15' },
          created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
        }
      ]

      if (!silent) {
        setActivities(mockActivities)
      } else {
        // For silent updates, only add new activities
        const latestTimestamp = activities[0]?.created_at
        const newActivities = mockActivities.filter(activity =>
          !latestTimestamp || activity.created_at > latestTimestamp
        )
        if (newActivities.length > 0) {
          setActivities(prev => [...newActivities, ...prev])
        }
      }

    } catch (error) {
      console.error('Failed to load activity log:', error)
      if (!silent) setError('Failed to load activity log')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...activities]

    // Filter by actions
    if (selectedActions.length > 0) {
      filtered = filtered.filter(activity => selectedActions.includes(activity.action))
    }

    // Filter by patterns
    if (selectedPatterns.length > 0) {
      filtered = filtered.filter(activity =>
        activity.activity_pattern && selectedPatterns.includes(activity.activity_pattern)
      )
    }

    // Filter by time range
    const now = new Date()
    const timeRangeMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }[timeRange]

    filtered = filtered.filter(activity =>
      now.getTime() - new Date(activity.created_at).getTime() <= timeRangeMs
    )

    setFilteredActivities(filtered)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'prompt_submitted': return ''
      case 'agent_assigned': return ''
      case 'prompt_optimized': return ''
      case 'prompt_approved': return ''
      case 'ai_executed': return ''
      case 'prompt_rejected': return ''
      case 'agent_review': return ''
      case 'workflow_started': return ''
      case 'workflow_completed': return ''
      default: return ''
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'prompt_submitted': return 'text-blue-400'
      case 'agent_assigned': return 'text-purple-400'
      case 'prompt_optimized': return 'text-yellow-400'
      case 'prompt_approved': return 'text-green-400'
      case 'ai_executed': return 'text-cyan-400'
      case 'prompt_rejected': return 'text-red-400'
      case 'agent_review': return 'text-orange-400'
      default: return 'text-terminal-text'
    }
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) return `${diffSeconds}s ago`
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const uniqueActions = Array.from(new Set(activities.map(a => a.action)))
  const uniquePatterns = Array.from(new Set(activities.map(a => a.activity_pattern).filter(Boolean)))

  return (
    <div className="bg-terminal-surface border border-terminal-border">
      {/* Header */}
      <div className="border-b border-terminal-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-terminal-text font-medium">Activity Log</h2>
            {autoRefresh && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-terminal-muted text-xs">Live</span>
              </div>
            )}
          </div>

          {showFilters && (
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-terminal-bg border border-terminal-border text-terminal-text text-xs px-2 py-1"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>

              <button
                onClick={() => setShowFiltersModal(true)}
                className="text-terminal-muted hover:text-terminal-text text-xs transition-colors"
              >
                Filters ({selectedActions.length + selectedPatterns.length})
              </button>

              <button
                onClick={() => loadActivities()}
                className="text-terminal-muted hover:text-terminal-text text-xs transition-colors"
              >
                ↻
              </button>
            </div>
          )}
        </div>

        {(selectedActions.length > 0 || selectedPatterns.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedActions.map(action => (
              <span key={action} className="bg-terminal-bg border border-terminal-border px-2 py-1 text-xs text-terminal-text">
                {action.replace('_', ' ')}
                <button
                  onClick={() => setSelectedActions(prev => prev.filter(a => a !== action))}
                  className="ml-1 text-terminal-muted hover:text-red-400"
                >
                  ✕
                </button>
              </span>
            ))}
            {selectedPatterns.map(pattern => (
              <span key={pattern} className="bg-terminal-bg border border-terminal-border px-2 py-1 text-xs text-terminal-text">
                {pattern.replace('_', ' ')}
                <button
                  onClick={() => setSelectedPatterns(prev => prev.filter(p => p !== pattern))}
                  className="ml-1 text-terminal-muted hover:text-red-400"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="p-4">
        {error && (
          <div className="bg-terminal-bg border border-red-500 text-red-400 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-terminal-muted text-sm text-center py-8">
            Loading activity log...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-terminal-muted text-sm text-center py-8">
            {activities.length === 0 ? 'No activity recorded yet.' : 'No activities match current filters.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredActivities.map(activity => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start space-x-3 py-2 border-l-2 border-terminal-border pl-4 hover:border-terminal-text/30 transition-colors"
                >
                  <span className="text-lg flex-shrink-0">
                    {getActionIcon(activity.action)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${getActionColor(activity.action)}`}>
                          {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-terminal-text text-sm mt-1">
                          {activity.description}
                        </div>

                        {activity.workflow_context && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="bg-terminal-bg border border-terminal-border px-2 py-1 text-xs text-terminal-muted">
                              {activity.workflow_context.replace('_', ' ')}
                            </span>
                            {activity.activity_pattern && (
                              <span className="bg-terminal-bg border border-terminal-border px-2 py-1 text-xs text-terminal-muted">
                                {activity.activity_pattern.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        )}

                        {Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-terminal-muted">
                            {Object.entries(activity.metadata).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                {key}: <span className="text-terminal-text">{String(value)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-terminal-muted text-xs">
                          {formatRelativeTime(activity.created_at)}
                        </div>
                        {activity.prompt_id && (
                          <div className="text-terminal-muted text-xs mt-1">
                            {activity.prompt_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-terminal-surface border border-terminal-border p-6 w-full max-w-md">
            <h3 className="text-terminal-text font-medium mb-4">Activity Filters</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-terminal-text mb-2">Actions</label>
                <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                  {uniqueActions.map(action => (
                    <label key={action} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedActions.includes(action)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedActions(prev => [...prev, action])
                          } else {
                            setSelectedActions(prev => prev.filter(a => a !== action))
                          }
                        }}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-terminal-text">{action.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-terminal-text mb-2">Patterns</label>
                <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                  {uniquePatterns.map(pattern => (
                    <label key={pattern} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedPatterns.includes(pattern!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPatterns(prev => [...prev, pattern!])
                          } else {
                            setSelectedPatterns(prev => prev.filter(p => p !== pattern))
                          }
                        }}
                        className="w-3 h-3"
                      />
                      <span className="text-xs text-terminal-text">{pattern!.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedActions([])
                  setSelectedPatterns([])
                }}
                className="flex-1 border border-terminal-border text-terminal-text py-2 text-sm hover:bg-terminal-hover transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 bg-terminal-text text-terminal-bg py-2 text-sm hover:bg-terminal-muted transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}