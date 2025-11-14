'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollaboration } from '@/contexts/CollaborationContext'

interface IntelligentRequestProps {
  id: string
  type: 'review' | 'approval' | 'collaboration' | 'insight'
  content: string
  priority: number
  context?: any
  onRoute?: (assigneeId: string, reason: string) => void
  onComplete?: () => void
}

export default function IntelligentRequest({
  id,
  type,
  content,
  priority,
  context,
  onRoute,
  onComplete
}: IntelligentRequestProps) {
  const { state, routeRequest, recordInteraction } = useCollaboration()
  const [isExpanded, setIsExpanded] = useState(false)
  const [suggestedAssignees, setSuggestedAssignees] = useState<any[]>([])
  const [contextualReason, setContextualReason] = useState('')
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [aiInsight, setAiInsight] = useState('')

  // Find the request in state
  const request = state.activeRequests.find(r => r.id === id)

  useEffect(() => {
    if (request) {
      // Generate intelligent assignee suggestions
      const suggestions = generateAssigneeSuggestions()
      setSuggestedAssignees(suggestions)
      setContextualReason(request.contextualReason)
      setEstimatedTime(request.estimatedTime || 0)

      // Generate AI insight for this request
      generateAIInsight()
    }
  }, [request, state.teamMembers, state.blockActivities])

  const generateAssigneeSuggestions = () => {
    if (!request) return []

    const availableMembers = state.teamMembers.filter(m => m.status !== 'offline')

    // AI-powered suggestion algorithm
    return availableMembers.map(member => {
      let score = 5 // Base score

      // Contextual factors
      if (type === 'review' && member.currentBlock?.includes('review')) score += 3
      if (type === 'approval' && member.name.includes('Alex')) score += 2 // Simulate learned patterns
      if (member.status === 'online') score += 2
      if (member.status === 'busy') score -= 1

      // Time zone and availability optimization
      const now = new Date().getHours()
      if (now >= 9 && now <= 17) score += 1 // During work hours

      // Historical collaboration patterns
      score += Math.random() * 2 // Simulate learned effectiveness

      const confidence = Math.min(score / 10, 1)
      const reason = generateAssignmentReason(member, score)

      return {
        ...member,
        score,
        confidence,
        reason,
        estimatedResponse: calculateResponseTime(member, type)
      }
    }).sort((a, b) => b.score - a.score)
  }

  const generateAssignmentReason = (member: any, score: number) => {
    const reasons = [
      `${member.name} has relevant expertise and is currently online`,
      `Based on ${member.name}'s collaboration patterns with similar requests`,
      `${member.name} is most available and has context on this area`,
      `Optimal assignment based on team workload distribution`,
      `${member.name} frequently collaborates on ${type} requests successfully`
    ]

    if (score > 8) return reasons[0]
    if (score > 6) return reasons[1]
    if (score > 4) return reasons[2]
    return reasons[Math.floor(Math.random() * reasons.length)]
  }

  const calculateResponseTime = (member: any, requestType: string) => {
    let baseTime = requestType === 'review' ? 2 : 4 // hours

    if (member.status === 'online') baseTime *= 0.5
    if (member.status === 'busy') baseTime *= 2

    return Math.ceil(baseTime + Math.random() * 2)
  }

  const generateAIInsight = () => {
    const insights = [
      "Similar requests completed 40% faster when assigned during team's peak collaboration hours",
      "This type of request typically requires 2-3 iterations based on historical patterns",
      "Consider scheduling a brief sync - complex requests benefit from initial discussion",
      "Team velocity suggests this can be prioritized without impacting sprint goals",
      "Pattern detected: Reviews with early design feedback complete with fewer revisions"
    ]

    setAiInsight(insights[Math.floor(Math.random() * insights.length)])
  }

  const handleAssignRequest = (assignee: any) => {
    if (onRoute) {
      onRoute(assignee.id, assignee.reason)
    }

    routeRequest(id, assignee.id, assignee.reason)

    recordInteraction({
      type: 'request_assigned',
      requestId: id,
      assigneeId: assignee.id,
      confidence: assignee.confidence,
      estimatedTime: assignee.estimatedResponse,
      timestamp: Date.now()
    })
  }

  const getPriorityColor = () => {
    if (priority >= 8) return 'border-l-terminal-text bg-terminal-bg'
    if (priority >= 6) return 'border-l-terminal-muted bg-terminal-surface'
    return 'border-l-terminal-border bg-terminal-surface'
  }

  const getTypeIcon = () => {
    switch (type) {
      case 'review': return '👁'
      case 'approval': return '✓'
      case 'collaboration': return '🤝'
      case 'insight': return '💡'
      default: return '•'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`border-l-2 ${getPriorityColor()} p-4 mb-3`}
    >
      {/* Request Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-sm mt-1">{getTypeIcon()}</span>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-terminal-text text-sm font-medium capitalize">{type} Request</span>
              <span className="text-terminal-muted text-xs">
                Priority {priority}/10
              </span>
              {estimatedTime > 0 && (
                <span className="text-terminal-muted text-xs">
                  ~{estimatedTime}m
                </span>
              )}
            </div>
            <p className="text-terminal-muted text-sm mb-2">{content}</p>

            {/* Contextual Reason */}
            {contextualReason && (
              <p className="text-terminal-muted text-xs italic mb-2">
                {contextualReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time indicator */}
          <span className="text-terminal-muted text-xs">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-terminal-muted hover:text-terminal-text text-xs"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3 border-t border-terminal-border"
          >
            {/* AI Insight */}
            {aiInsight && (
              <div className="mb-4 p-3 bg-terminal-bg border border-terminal-border">
                <div className="text-terminal-text text-xs font-medium mb-1">AI Insight</div>
                <p className="text-terminal-muted text-xs">{aiInsight}</p>
              </div>
            )}

            {/* Suggested Assignees */}
            <div className="mb-4">
              <div className="text-terminal-text text-xs font-medium mb-2">
                Suggested Assignees (AI-optimized)
              </div>
              <div className="space-y-2">
                {suggestedAssignees.slice(0, 3).map((assignee) => (
                  <motion.div
                    key={assignee.id}
                    className="flex items-center justify-between p-2 bg-terminal-bg border border-terminal-border hover:border-terminal-muted cursor-pointer"
                    onClick={() => handleAssignRequest(assignee)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        assignee.status === 'online' ? 'bg-terminal-text' :
                        assignee.status === 'busy' ? 'bg-terminal-muted' :
                        'bg-terminal-border'
                      }`} />
                      <span className="text-terminal-text text-xs">{assignee.name}</span>
                      <span className="text-terminal-muted text-xs">
                        ({Math.round(assignee.confidence * 100)}% match)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-terminal-muted text-xs">
                        ~{assignee.estimatedResponse}h response
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Context Information */}
            {context && (
              <div className="mb-4">
                <div className="text-terminal-text text-xs font-medium mb-2">Context</div>
                <div className="text-terminal-muted text-xs space-y-1">
                  {context.relatedBlocks && (
                    <div>Related blocks: {context.relatedBlocks.join(', ')}</div>
                  )}
                  {context.deadline && (
                    <div>Deadline: {new Date(context.deadline).toLocaleDateString()}</div>
                  )}
                  {context.dependencies && (
                    <div>Dependencies: {context.dependencies.join(', ')}</div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2 text-xs">
              <button
                className="bg-terminal-text text-terminal-bg px-2 py-1 hover:bg-terminal-muted"
                onClick={() => handleAssignRequest(suggestedAssignees[0])}
                disabled={suggestedAssignees.length === 0}
              >
                Auto-Assign Best Match
              </button>
              <button
                className="border border-terminal-border text-terminal-text px-2 py-1 hover:bg-terminal-hover"
                onClick={() => recordInteraction({ type: 'request_deferred', requestId: id })}
              >
                Defer
              </button>
              {onComplete && (
                <button
                  className="text-terminal-muted hover:text-terminal-text px-2 py-1"
                  onClick={onComplete}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart notification */}
      {priority >= 8 && !isExpanded && (
        <motion.div
          className="mt-2 text-terminal-text text-xs"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          High priority - requires immediate attention
        </motion.div>
      )}
    </motion.div>
  )
}