'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIContext } from '@/contexts/AIContextEngine'
import { useCollaboration } from '@/contexts/CollaborationContext'

export default function AIContextDashboard() {
  const { state, analyzeContext, generateInsights, getContextualRecommendations } = useAIContext()
  const { state: collabState, recordInteraction } = useCollaboration()
  const [activeTab, setActiveTab] = useState<'patterns' | 'insights' | 'predictions' | 'dynamics'>('patterns')
  const [isExpanded, setIsExpanded] = useState(false)

  // Continuously feed context data to AI engine
  useEffect(() => {
    const contextData = {
      timestamps: Array.from(collabState.blockActivities.values()).map(a => Date.now()),
      interactions: collabState.activeRequests.map(r => ({ type: r.type, priority: r.priority })),
      workflows: [{ completionTime: Math.random() * 30 + 5 }], // Simulated workflow data
      teamActivity: collabState.onlineCount,
      velocity: collabState.teamVelocity
    }

    analyzeContext(contextData)
  }, [collabState, analyzeContext])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-terminal-text'
    if (confidence >= 0.75) return 'text-terminal-text opacity-80'
    if (confidence >= 0.6) return 'text-terminal-muted'
    return 'text-terminal-border'
  }

  const getImpactIndicator = (impact: number) => {
    const width = Math.min(impact * 10, 100)
    const opacity = 0.3 + (impact / 10) * 0.7

    return (
      <div className="w-16 h-1 bg-terminal-border relative overflow-hidden">
        <motion.div
          className="h-full bg-terminal-text"
          initial={{ width: 0 }}
          animate={{ width: `${width}%`, opacity }}
          transition={{ duration: 0.5 }}
        />
      </div>
    )
  }

  const getPriorityIcon = (priority: number) => {
    if (priority >= 8) return '🔴'
    if (priority >= 6) return '🟡'
    return '🟢'
  }

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab)
    recordInteraction({
      type: 'ai_dashboard_navigation',
      tab,
      timestamp: Date.now()
    })
  }

  const renderPatterns = () => (
    <div className="space-y-3">
      {state.patterns.slice(0, 5).map((pattern, index) => (
        <motion.div
          key={pattern.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-terminal-bg border border-terminal-border"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-terminal-text text-sm font-medium">{pattern.name}</span>
                <span className={`text-xs px-1 border border-terminal-border ${
                  pattern.type === 'workflow' ? 'text-terminal-text' :
                  pattern.type === 'collaborative' ? 'text-terminal-muted' :
                  'text-terminal-border'
                }`}>
                  {pattern.type}
                </span>
              </div>
              <p className="text-terminal-muted text-xs mb-2">{pattern.description}</p>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <span className="text-terminal-muted">Confidence:</span>
                  <span className={getConfidenceColor(pattern.confidence)}>
                    {Math.round(pattern.confidence * 100)}%
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-terminal-muted">Impact:</span>
                  {getImpactIndicator(pattern.impact)}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-terminal-muted">Frequency:</span>
                  <span className="text-terminal-text">{pattern.frequency.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderInsights = () => (
    <div className="space-y-3">
      {state.insights.slice(0, 4).map((insight, index) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-terminal-bg border border-terminal-border"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-terminal-text text-sm font-medium">{insight.category}</span>
                <span className="text-terminal-muted text-xs">
                  {Math.round(insight.confidence * 100)}% confidence
                </span>
                <span className="text-xs">{getPriorityIcon(insight.priority)}</span>
              </div>
              <p className="text-terminal-muted text-xs mb-2">{insight.insight}</p>

              {insight.evidence.length > 0 && (
                <div className="mb-2">
                  <div className="text-terminal-text text-xs font-medium mb-1">Evidence:</div>
                  {insight.evidence.slice(0, 2).map((evidence, evidenceIndex) => (
                    <div key={evidenceIndex} className="text-terminal-muted text-xs">
                      • {evidence}
                    </div>
                  ))}
                </div>
              )}

              {insight.actionable && insight.suggestedAction && (
                <div className="mt-2 p-2 bg-terminal-surface border border-terminal-border">
                  <div className="text-terminal-text text-xs font-medium mb-1">Suggested Action:</div>
                  <p className="text-terminal-muted text-xs">{insight.suggestedAction}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-terminal-muted text-xs">Timeframe: {insight.timeframe}</span>
                    <button
                      onClick={() => {
                        recordInteraction({
                          type: 'ai_suggestion_action',
                          insightId: insight.id,
                          action: 'implement',
                          timestamp: Date.now()
                        })
                      }}
                      className="bg-terminal-text text-terminal-bg px-2 py-1 text-xs hover:bg-terminal-muted"
                    >
                      Implement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderPredictions = () => (
    <div className="space-y-3">
      {state.predictions.map((prediction, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 bg-terminal-bg border border-terminal-border"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-terminal-text text-sm">{prediction.event}</span>
                <span className={`text-xs px-1 border border-terminal-border ${
                  prediction.impact === 'high' ? 'text-terminal-text' :
                  prediction.impact === 'medium' ? 'text-terminal-muted' :
                  'text-terminal-border'
                }`}>
                  {prediction.impact}
                </span>
              </div>

              <div className="flex items-center space-x-4 text-xs mb-2">
                <div className="flex items-center space-x-1">
                  <span className="text-terminal-muted">Probability:</span>
                  <span className="text-terminal-text">
                    {Math.round(prediction.probability * 100)}%
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-terminal-muted">Timeframe:</span>
                  <span className="text-terminal-text">{prediction.timeframe}</span>
                </div>
                {prediction.preventable && (
                  <span className="text-terminal-muted text-xs">preventable</span>
                )}
              </div>

              <div className="mb-2">
                <div className="text-terminal-text text-xs font-medium mb-1">Contributing Factors:</div>
                {prediction.factors.map((factor, factorIndex) => (
                  <div key={factorIndex} className="text-terminal-muted text-xs">
                    • {factor}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderTeamDynamics = () => (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(state.teamDynamics).map(([key, value]) => {
          if (key === 'velocityTrend') return null

          const displayValue = typeof value === 'number' ? value.toFixed(1) : value
          const normalizedValue = typeof value === 'number' ? value / 10 : 0.5

          return (
            <div key={key} className="p-2 bg-terminal-bg border border-terminal-border">
              <div className="text-terminal-text text-xs font-medium mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-terminal-border h-1 relative overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      normalizedValue > 0.8 ? 'bg-terminal-text' :
                      normalizedValue > 0.6 ? 'bg-terminal-muted' :
                      'bg-terminal-border opacity-80'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${normalizedValue * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-terminal-text text-xs w-8 text-right">
                  {displayValue}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Velocity Trend */}
      <div className="p-3 bg-terminal-bg border border-terminal-border">
        <div className="text-terminal-text text-sm font-medium mb-2">Velocity Trend</div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${
            state.teamDynamics.velocityTrend === 'increasing' ? 'text-terminal-text' :
            state.teamDynamics.velocityTrend === 'stable' ? 'text-terminal-muted' :
            'text-terminal-border'
          }`}>
            {state.teamDynamics.velocityTrend === 'increasing' ? '↗' :
             state.teamDynamics.velocityTrend === 'stable' ? '→' : '↘'}
          </span>
          <span className="text-terminal-text text-xs capitalize">
            {state.teamDynamics.velocityTrend}
          </span>
        </div>
      </div>

      {/* Learning Metrics */}
      <div className="p-3 bg-terminal-surface border border-terminal-border">
        <div className="text-terminal-text text-sm font-medium mb-2">AI Learning Progress</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-terminal-muted">Patterns Identified:</span>
            <span className="text-terminal-text">{state.learningMetrics.patternsIdentified}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Prediction Accuracy:</span>
            <span className="text-terminal-text">
              {Math.round(state.learningMetrics.predictionAccuracy * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Implementation Rate:</span>
            <span className="text-terminal-text">
              {Math.round((state.learningMetrics.actionsImplemented / Math.max(state.learningMetrics.actionsSuggested, 1)) * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">AI Confidence:</span>
            <span className="text-terminal-text">
              {Math.round(state.aiConfidence * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'patterns':
        return renderPatterns()
      case 'insights':
        return renderInsights()
      case 'predictions':
        return renderPredictions()
      case 'dynamics':
        return renderTeamDynamics()
      default:
        return renderPatterns()
    }
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border">
      {/* Header */}
      <div
        className="p-4 border-b border-terminal-border cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-terminal-text rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className="text-terminal-text text-sm font-medium">AI Context Engine</span>
          </div>
          <div className="text-terminal-muted text-xs">
            {state.patterns.length} patterns • {state.insights.length} insights • {Math.round(state.aiConfidence * 100)}% confidence
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-terminal-muted text-xs">
            Health: {Math.round(state.systemHealth * 100)}%
          </div>
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
            {/* Tab Navigation */}
            <div className="p-4 border-b border-terminal-border bg-terminal-bg">
              <div className="flex space-x-4">
                {[
                  { key: 'patterns' as const, label: 'Patterns', count: state.patterns.length },
                  { key: 'insights' as const, label: 'Insights', count: state.insights.length },
                  { key: 'predictions' as const, label: 'Predictions', count: state.predictions.length },
                  { key: 'dynamics' as const, label: 'Dynamics', count: null }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabClick(tab.key)}
                    className={`text-xs px-2 py-1 border transition-colors ${
                      activeTab === tab.key
                        ? 'bg-terminal-text text-terminal-bg border-terminal-text'
                        : 'bg-terminal-surface text-terminal-text border-terminal-border hover:border-terminal-muted'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && ` (${tab.count})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}