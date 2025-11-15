'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PromptCardProps {
  id: string
  originalPrompt: string
  optimizedPrompt?: string
  promptType: string
  status: 'pending' | 'agent_review' | 'optimized' | 'approved' | 'executed' | 'rejected'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  submittedAt: string
  agentId?: string
  aiResponse?: string
  executionTimeMs?: number
  tokensUsed?: number
  onUpdate?: (promptId: string, action: string) => void
}

export default function PromptCard({
  id,
  originalPrompt,
  optimizedPrompt,
  promptType,
  status,
  priority,
  submittedAt,
  agentId,
  aiResponse,
  executionTimeMs,
  tokensUsed,
  onUpdate
}: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showOptimization, setShowOptimization] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      case 'agent_review': return 'text-blue-400 bg-blue-400/10'
      case 'optimized': return 'text-purple-400 bg-purple-400/10'
      case 'approved': return 'text-green-400 bg-green-400/10'
      case 'executed': return 'text-terminal-text bg-terminal-text/10'
      case 'rejected': return 'text-red-400 bg-red-400/10'
      default: return 'text-terminal-muted bg-terminal-muted/10'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return ''
      case 'high': return ''
      case 'medium': return ''
      case 'low': return ''
      default: return ''
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code_review': return ''
      case 'documentation': return ''
      case 'bug_fix': return ''
      case 'optimization': return ''
      case 'testing': return ''
      default: return ''
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleAction = (action: string) => {
    if (onUpdate) {
      onUpdate(id, action)
    }
  }

  return (
    <motion.div
      layout
      className="bg-terminal-surface border border-terminal-border hover:border-terminal-text/30 transition-colors"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-terminal-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm">{getTypeIcon(promptType)}</span>
              <span className="text-terminal-text text-sm font-medium capitalize">
                {promptType.replace('_', ' ')}
              </span>
              <span className="text-xs">{getPriorityIcon(priority)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status).split(' ')[1]} ${getStatusColor(status).split(' ')[0]}`}>
                {status.replace('_', ' ')}
              </span>
            </div>

            <div className="text-terminal-text text-sm">
              {originalPrompt.length > 120 && !isExpanded
                ? `${originalPrompt.slice(0, 120)}...`
                : originalPrompt}
            </div>

            {originalPrompt.length > 120 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-terminal-muted hover:text-terminal-text text-xs mt-1 transition-colors"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          <div className="text-right ml-4">
            <div className="text-terminal-muted text-xs">
              {formatDate(submittedAt)}
            </div>
            {agentId && (
              <div className="text-terminal-muted text-xs mt-1">
                Agent: {agentId.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Optimized Prompt Section */}
      {optimizedPrompt && (
        <div className="p-4 border-b border-terminal-border bg-terminal-bg/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-400 text-xs font-medium">OPTIMIZED VERSION</span>
            <button
              onClick={() => setShowOptimization(!showOptimization)}
              className="text-terminal-muted hover:text-terminal-text text-xs transition-colors"
            >
              {showOptimization ? 'Hide' : 'Show'}
            </button>
          </div>

          <AnimatePresence>
            {showOptimization && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="text-terminal-text text-sm bg-terminal-surface border border-terminal-border p-3 font-mono">
                  {optimizedPrompt}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* AI Response Section */}
      {aiResponse && (
        <div className="p-4 border-b border-terminal-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 text-xs font-medium">AI RESPONSE</span>
            <div className="flex items-center space-x-4 text-xs text-terminal-muted">
              {executionTimeMs && (
                <span>{executionTimeMs}ms</span>
              )}
              {tokensUsed && (
                <span>{tokensUsed} tokens</span>
              )}
            </div>
          </div>

          <div className="text-terminal-text text-sm bg-terminal-bg border border-terminal-border p-3 max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {aiResponse}
            </pre>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-terminal-muted text-xs">
            ID: {id.slice(0, 8)}...
          </div>

          <div className="flex space-x-2">
            {status === 'pending' && (
              <>
                <button
                  onClick={() => handleAction('assign_agent')}
                  className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                >
                  Assign Agent
                </button>
                <span className="text-terminal-muted">|</span>
                <button
                  onClick={() => handleAction('auto_approve')}
                  className="text-green-400 hover:text-green-300 text-xs transition-colors"
                >
                  Auto Approve
                </button>
              </>
            )}

            {status === 'optimized' && (
              <>
                <button
                  onClick={() => handleAction('approve')}
                  className="text-green-400 hover:text-green-300 text-xs transition-colors"
                >
                  Approve
                </button>
                <span className="text-terminal-muted">|</span>
                <button
                  onClick={() => handleAction('request_changes')}
                  className="text-yellow-400 hover:text-yellow-300 text-xs transition-colors"
                >
                  Request Changes
                </button>
              </>
            )}

            {status === 'approved' && (
              <button
                onClick={() => handleAction('execute')}
                className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
              >
                Execute AI
              </button>
            )}

            <span className="text-terminal-muted">|</span>
            <button
              onClick={() => handleAction('view_details')}
              className="text-terminal-muted hover:text-terminal-text text-xs transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}