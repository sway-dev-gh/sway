'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAdaptiveRoles } from '@/contexts/AdaptiveRoleContext'
import { useCollaboration } from '@/contexts/CollaborationContext'

export default function AdaptiveRoles() {
  const { state, applyRoleChange, trackContribution, getOptimalTeamComposition } = useAdaptiveRoles()
  const { state: collabState, recordInteraction } = useCollaboration()
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [showEvolutions, setShowEvolutions] = useState(false)

  // Track contributions from collaboration activities
  useEffect(() => {
    // When team members interact with blocks, track their contributions
    collabState.blockActivities.forEach((activity, blockId) => {
      activity.viewers.forEach(viewer => {
        trackContribution(viewer.id, {
          area: blockId.includes('project') ? 'Project Management' :
                blockId.includes('review') ? 'Code Review' :
                blockId.includes('deploy') ? 'Deployment' : 'General Collaboration',
          quality: Math.min(activity.activityLevel / 10 * 8 + 2, 10),
          impact: activity.activityLevel / 10 * 7 + 3,
          frequency: 0.1
        })
      })
    })
  }, [collabState.blockActivities])

  const getRoleProgressBar = (member: any, contribution: any) => {
    const width = Math.min(contribution.frequency * 10, 100)
    const intensity = contribution.quality / 10

    return (
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-terminal-muted w-24 truncate">{contribution.area}</span>
        <div className="flex-1 bg-terminal-border h-1 relative overflow-hidden">
          <motion.div
            className="h-full bg-terminal-text"
            initial={{ width: 0 }}
            animate={{ width: `${width}%`, opacity: 0.3 + (intensity * 0.7) }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-terminal-muted w-8 text-right">
          {contribution.frequency.toFixed(1)}
        </span>
      </div>
    )
  }

  const getEvolutionConfidence = (evolution: any) => {
    const confidence = Math.round(evolution.confidence * 100)
    if (confidence >= 90) return { text: 'Very High', class: 'text-terminal-text' }
    if (confidence >= 75) return { text: 'High', class: 'text-terminal-text' }
    if (confidence >= 60) return { text: 'Medium', class: 'text-terminal-muted' }
    return { text: 'Low', class: 'text-terminal-border' }
  }

  const handleApplyRoleChange = (memberId: string, newRole: string, reason: string) => {
    applyRoleChange(memberId, newRole, reason)

    recordInteraction({
      type: 'role_evolution',
      memberId,
      newRole,
      reason,
      timestamp: Date.now()
    })

    // Remove from evolutions after applying
    setShowEvolutions(false)
  }

  const getMemberByEvolution = (evolution: any) => {
    return state.teamRoles.find(member => member.primaryRole === evolution.fromRole)
  }

  return (
    <div className="bg-terminal-surface border border-terminal-border">
      {/* Header */}
      <div className="p-4 border-b border-terminal-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-terminal-text rounded-full opacity-60" />
            <h3 className="text-terminal-text text-sm font-medium">Adaptive Team Roles</h3>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-terminal-muted text-xs">
              {state.roleEvolutions.length} evolution{state.roleEvolutions.length !== 1 ? 's' : ''} pending
            </span>
            <button
              onClick={() => setShowEvolutions(!showEvolutions)}
              className="text-terminal-muted hover:text-terminal-text text-xs"
            >
              {showEvolutions ? '▼' : '▶'}
            </button>
          </div>
        </div>
      </div>

      {/* Team Role Overview */}
      <div className="p-4 space-y-3">
        {state.teamRoles.map(member => {
          const isSelected = selectedMember === member.id
          const hasEvolution = state.roleEvolutions.some(e =>
            getMemberByEvolution(e)?.id === member.id
          )

          return (
            <motion.div
              key={member.id}
              className={`p-3 border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-terminal-hover border-terminal-text'
                  : 'bg-terminal-bg border-terminal-border hover:border-terminal-muted'
              }`}
              onClick={() => setSelectedMember(isSelected ? null : member.id)}
              layout
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-terminal-text text-sm font-medium">{member.name}</span>
                  {hasEvolution && (
                    <motion.div
                      className="w-1 h-1 bg-terminal-text rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <div className="text-right">
                  <div className="text-terminal-text text-xs">{member.primaryRole}</div>
                  <div className="text-terminal-muted text-xs">
                    {Math.round(member.collaborationScore * 10)}/100 collab
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-terminal-muted">
                <span>{member.expertiseAreas.slice(0, 2).join(', ')}</span>
                <span>{Math.round(member.currentCapacity * 100)}% capacity</span>
              </div>

              {/* Emerging Roles */}
              {member.emergingRoles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {member.emergingRoles.slice(0, 2).map(role => (
                    <span
                      key={role}
                      className="text-terminal-muted text-xs px-1 border border-terminal-border"
                    >
                      +{role}
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded Details */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-terminal-border space-y-2"
                  >
                    <div className="text-terminal-text text-xs font-medium mb-2">Contribution Areas</div>
                    {member.contributions.slice(0, 4).map((contribution, index) => (
                      <div key={index}>
                        {getRoleProgressBar(member, contribution)}
                      </div>
                    ))}

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="text-terminal-muted">
                        Adaptability: {member.adaptabilityScore.toFixed(1)}/10
                      </span>
                      <span className="text-terminal-muted">
                        {member.expertiseAreas.length} expertise areas
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Role Evolutions */}
      <AnimatePresence>
        {showEvolutions && state.roleEvolutions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-terminal-border"
          >
            <div className="p-4 bg-terminal-bg">
              <div className="text-terminal-text text-sm font-medium mb-3">Suggested Role Evolutions</div>
              <div className="space-y-3">
                {state.roleEvolutions.map((evolution, index) => {
                  const member = getMemberByEvolution(evolution)
                  const confidence = getEvolutionConfidence(evolution)

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-3 bg-terminal-surface border border-terminal-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-terminal-text text-sm font-medium">
                              {member?.name}
                            </span>
                            <span className="text-terminal-muted text-xs">
                              {evolution.fromRole} → {evolution.toRole}
                            </span>
                          </div>
                          <p className="text-terminal-muted text-xs mb-2">
                            {evolution.reason}
                          </p>
                          <div className="flex items-center space-x-4 text-xs">
                            <span className={confidence.class}>
                              {confidence.text} Confidence
                            </span>
                            <span className="text-terminal-muted">
                              {evolution.timeline}
                            </span>
                            <span className="text-terminal-muted">
                              {evolution.impact} impact
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApplyRoleChange(
                              member?.id || '',
                              evolution.toRole,
                              evolution.reason
                            )}
                            className="bg-terminal-text text-terminal-bg px-2 py-1 text-xs hover:bg-terminal-muted"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => {
                              // Remove this evolution suggestion
                            }}
                            className="border border-terminal-border text-terminal-text px-2 py-1 text-xs hover:bg-terminal-hover"
                          >
                            Defer
                          </button>
                        </div>
                      </div>

                      {/* Evidence */}
                      <div className="mt-2">
                        <div className="text-terminal-text text-xs font-medium mb-1">Evidence</div>
                        <div className="text-terminal-muted text-xs space-y-1">
                          {evolution.contributionEvidence.map((evidence, evidenceIndex) => (
                            <div key={evidenceIndex}>• {evidence}</div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emerging Patterns */}
      {state.emergingPatterns.length > 0 && (
        <div className="p-4 border-t border-terminal-border bg-terminal-bg">
          <div className="text-terminal-text text-sm font-medium mb-2">Team Evolution Patterns</div>
          <div className="space-y-1">
            {state.emergingPatterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="text-terminal-muted text-xs">
                • {pattern}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adaptation Suggestions */}
      {state.adaptationSuggestions.length > 0 && (
        <div className="p-4 border-t border-terminal-border">
          <div className="text-terminal-text text-sm font-medium mb-2">AI Insights</div>
          <div className="space-y-1">
            {state.adaptationSuggestions.slice(0, 2).map((suggestion, index) => (
              <div key={index} className="text-terminal-muted text-xs p-2 bg-terminal-bg border border-terminal-border">
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}