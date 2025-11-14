'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCollaboration } from '@/contexts/CollaborationContext'
import IntelligentRequest from './IntelligentRequest'

interface PredictiveInsight {
  id: string
  type: 'trend' | 'bottleneck' | 'opportunity' | 'risk'
  message: string
  confidence: number
  actionable: boolean
  suggestedAction?: string
  impact: 'low' | 'medium' | 'high'
}

interface CollectiveMemory {
  pattern: string
  frequency: number
  lastSeen: number
  effectiveness: number
  context: string
}

export default function EmergentCollaboration() {
  const { state, createIntelligentRequest, getContextualSuggestions, anticipateNeeds } = useCollaboration()
  const [insights, setInsights] = useState<PredictiveInsight[]>([])
  const [anticipatedNeeds, setAnticipatedNeeds] = useState<any[]>([])
  const [teamPulse, setTeamPulse] = useState(0)
  const [focusState, setFocusState] = useState<'flow' | 'scattered' | 'converging'>('flow')
  const [collectiveMemory, setCollectiveMemory] = useState<CollectiveMemory[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // Analyze team state and generate insights
  useEffect(() => {
    analyzeTeamState()
    generatePredictiveInsights()
    updateCollectiveMemory()

    const interval = setInterval(() => {
      analyzeTeamState()
      generatePredictiveInsights()
    }, 10000)

    return () => clearInterval(interval)
  }, [state])

  const analyzeTeamState = () => {
    const { teamMembers, onlineCount, blockActivities, teamVelocity } = state

    // Calculate team pulse (0-100)
    let pulse = onlineCount * 20
    pulse += teamVelocity * 0.3
    pulse += Array.from(blockActivities.values()).reduce((sum, activity) => sum + activity.activityLevel, 0) * 2
    pulse = Math.min(pulse, 100)

    setTeamPulse(pulse)

    // Determine focus state
    const activeBlocks = Array.from(blockActivities.values()).filter(a => a.activityLevel > 3)
    if (activeBlocks.length <= 2 && pulse > 60) {
      setFocusState('flow')
    } else if (activeBlocks.length > 5) {
      setFocusState('scattered')
    } else {
      setFocusState('converging')
    }

    // Generate anticipated needs
    const needs = anticipateNeeds({ pulse, focusState, activeBlocks: activeBlocks.length })
    setAnticipatedNeeds(needs)
  }

  const generatePredictiveInsights = () => {
    const newInsights: PredictiveInsight[] = []

    // Team velocity insights
    if (state.teamVelocity > 80) {
      newInsights.push({
        id: 'velocity-high',
        type: 'opportunity',
        message: 'Team velocity is exceptionally high. Consider taking on additional scope.',
        confidence: 0.85,
        actionable: true,
        suggestedAction: 'Review sprint capacity and add stretch goals',
        impact: 'medium'
      })
    }

    // Collaboration pattern insights
    if (state.onlineCount > 3 && focusState === 'flow') {
      newInsights.push({
        id: 'flow-state',
        type: 'trend',
        message: 'Team is in deep flow state. Minimize interruptions for next 45 minutes.',
        confidence: 0.92,
        actionable: true,
        suggestedAction: 'Defer non-critical notifications',
        impact: 'high'
      })
    }

    // Bottleneck detection
    const highActivityBlocks = Array.from(state.blockActivities.values())
      .filter(a => a.activityLevel > 8 && a.viewers.length > 2)

    if (highActivityBlocks.length > 0) {
      newInsights.push({
        id: 'bottleneck-detected',
        type: 'bottleneck',
        message: 'Multiple people converging on same block. Potential bottleneck forming.',
        confidence: 0.75,
        actionable: true,
        suggestedAction: 'Schedule quick sync or split work streams',
        impact: 'medium'
      })
    }

    // Risk detection
    if (state.activeRequests.filter(r => r.priority > 7).length > 3) {
      newInsights.push({
        id: 'request-overload',
        type: 'risk',
        message: 'High-priority request queue is building. Risk of team overload.',
        confidence: 0.68,
        actionable: true,
        suggestedAction: 'Redistribute requests or extend timelines',
        impact: 'high'
      })
    }

    // Opportunity detection
    if (state.focusAreas.length === 1 && state.onlineCount > 2) {
      newInsights.push({
        id: 'alignment-opportunity',
        type: 'opportunity',
        message: 'Team aligned on single focus area. Ideal time for complex decisions.',
        confidence: 0.80,
        actionable: true,
        suggestedAction: 'Schedule architecture or design decision sessions',
        impact: 'medium'
      })
    }

    setInsights(newInsights)
  }

  const updateCollectiveMemory = () => {
    const patterns = state.collaborationPatterns.map(p => ({
      pattern: p.pattern,
      frequency: p.frequency,
      lastSeen: Date.now(),
      effectiveness: p.effectiveness,
      context: generatePatternContext(p.pattern)
    }))

    setCollectiveMemory(patterns.slice(0, 5)) // Keep most relevant patterns
  }

  const generatePatternContext = (pattern: string): string => {
    const contexts = {
      'block_join': 'Team members joining project discussions',
      'request_routed': 'Task assignment and delegation patterns',
      'block_focus': 'Areas of concentrated team attention',
      'collaboration_sync': 'Synchronous working sessions'
    }
    return contexts[pattern as keyof typeof contexts] || 'Team collaboration activity'
  }

  const handleInsightAction = (insight: PredictiveInsight) => {
    if (insight.suggestedAction) {
      // Create intelligent request based on insight
      createIntelligentRequest(
        'insight',
        insight.suggestedAction,
        {
          insightId: insight.id,
          confidence: insight.confidence,
          impact: insight.impact,
          relatedBlocks: state.focusAreas
        }
      )
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return '📈'
      case 'bottleneck': return '🚧'
      case 'opportunity': return '✨'
      case 'risk': return '⚠️'
      default: return '💡'
    }
  }

  const getTeamPulseColor = () => {
    if (teamPulse > 75) return 'text-terminal-text'
    if (teamPulse > 40) return 'text-terminal-muted'
    return 'text-terminal-border'
  }

  const getFocusStateDescription = () => {
    switch (focusState) {
      case 'flow': return 'Deep focus - high productivity state'
      case 'scattered': return 'Distributed attention across multiple areas'
      case 'converging': return 'Team alignment in progress'
      default: return 'Analyzing team dynamics...'
    }
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border">
      {/* Emergent Intelligence Header */}
      <div
        className="p-4 border-b border-terminal-border cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${getTeamPulseColor()}`}
              animate={{
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: teamPulse / 50,
                repeat: Infinity
              }}
            />
            <span className="text-terminal-text text-sm font-medium">Collective Intelligence</span>
          </div>

          <div className="text-terminal-muted text-xs">
            Team Pulse: {Math.round(teamPulse)}% • {getFocusStateDescription()}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-terminal-muted text-xs">
            {insights.length} insights • {anticipatedNeeds.length} needs
          </span>
          <span className="text-terminal-muted">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {/* Expanded Interface */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-terminal-border"
          >
            {/* Team State Overview */}
            <div className="p-4 border-b border-terminal-border bg-terminal-bg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-terminal-text font-medium mb-1">Active Members</div>
                  <div className="text-terminal-muted">
                    {state.onlineCount}/{state.teamMembers.length} online
                  </div>
                </div>
                <div>
                  <div className="text-terminal-text font-medium mb-1">Focus Areas</div>
                  <div className="text-terminal-muted">
                    {state.focusAreas.join(', ') || 'Analyzing...'}
                  </div>
                </div>
                <div>
                  <div className="text-terminal-text font-medium mb-1">Velocity</div>
                  <div className="text-terminal-muted">
                    {Math.round(state.teamVelocity)}% of baseline
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="p-4 border-b border-terminal-border">
                <div className="text-terminal-text text-sm font-medium mb-3">AI Insights</div>
                <div className="space-y-2">
                  {insights.map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start justify-between p-2 bg-terminal-bg border border-terminal-border"
                    >
                      <div className="flex items-start space-x-2 flex-1">
                        <span className="text-sm mt-0.5">{getInsightIcon(insight.type)}</span>
                        <div className="flex-1">
                          <p className="text-terminal-muted text-xs mb-1">{insight.message}</p>
                          <div className="flex items-center space-x-2 text-xs">
                            <span className={`
                              ${insight.confidence > 0.8 ? 'text-terminal-text' : 'text-terminal-muted'}
                            `}>
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                            <span className={`
                              px-1 ${insight.impact === 'high' ? 'text-terminal-text' : 'text-terminal-muted'}
                            `}>
                              {insight.impact} impact
                            </span>
                          </div>
                        </div>
                      </div>
                      {insight.actionable && (
                        <button
                          onClick={() => handleInsightAction(insight)}
                          className="text-terminal-text hover:text-terminal-muted text-xs px-2 py-1 border border-terminal-border hover:border-terminal-muted"
                        >
                          Act
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Intelligent Requests */}
            {state.activeRequests.length > 0 && (
              <div className="p-4 border-b border-terminal-border">
                <div className="text-terminal-text text-sm font-medium mb-3">Active Requests</div>
                <div className="space-y-1">
                  {state.activeRequests.slice(0, 3).map((request) => (
                    <IntelligentRequest
                      key={request.id}
                      id={request.id}
                      type={request.type}
                      content={request.content}
                      priority={request.priority}
                    />
                  ))}
                  {state.activeRequests.length > 3 && (
                    <div className="text-terminal-muted text-xs p-2">
                      +{state.activeRequests.length - 3} more requests
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collective Memory */}
            {collectiveMemory.length > 0 && (
              <div className="p-4">
                <div className="text-terminal-text text-sm font-medium mb-3">Learning Patterns</div>
                <div className="space-y-1 text-xs">
                  {collectiveMemory.slice(0, 3).map((memory, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-terminal-muted">{memory.context}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-terminal-muted">
                          {Math.round(memory.effectiveness * 10)}/10 effective
                        </span>
                        <span className="text-terminal-border">
                          {memory.frequency}x
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Insights */}
            {state.currentInsights.length > 0 && (
              <div className="p-4 bg-terminal-bg border-t border-terminal-border">
                <div className="text-terminal-text text-xs font-medium mb-2">Real-time Analysis</div>
                {state.currentInsights.map((insight, index) => (
                  <div key={index} className="text-terminal-muted text-xs mb-1">
                    • {insight}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}