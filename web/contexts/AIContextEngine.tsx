'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface ContextPattern {
  id: string
  type: 'workflow' | 'behavioral' | 'temporal' | 'collaborative' | 'performance'
  name: string
  description: string
  frequency: number
  confidence: number
  impact: number
  lastObserved: number
  relatedEntities: string[]
  predictiveValue: number
}

interface AIInsight {
  id: string
  category: 'optimization' | 'risk' | 'opportunity' | 'prediction' | 'anomaly'
  insight: string
  confidence: number
  evidence: string[]
  actionable: boolean
  suggestedAction?: string
  timeframe: string
  priority: number
}

interface ContextualPrediction {
  event: string
  probability: number
  timeframe: string
  factors: string[]
  preventable: boolean
  impact: 'low' | 'medium' | 'high'
}

interface TeamDynamics {
  cohesionScore: number
  communicationEfficiency: number
  decisionMakingSpeed: number
  conflictResolutionRate: number
  innovationIndex: number
  adaptabilityScore: number
  burnoutRisk: number
  velocityTrend: 'increasing' | 'stable' | 'decreasing'
}

interface AIContextState {
  patterns: ContextPattern[]
  insights: AIInsight[]
  predictions: ContextualPrediction[]
  teamDynamics: TeamDynamics
  contextualMemory: Map<string, any>
  learningMetrics: {
    patternsIdentified: number
    predictionAccuracy: number
    actionsSuggested: number
    actionsImplemented: number
  }
  aiConfidence: number
  systemHealth: number
}

interface AIContextEngineType {
  state: AIContextState
  analyzeContext: (contextData: any) => void
  generateInsights: () => void
  makePredictions: (timeHorizon: number) => void
  learnFromOutcome: (predictionId: string, actualOutcome: any) => void
  getContextualRecommendations: (situation: string) => string[]
  updateMemory: (key: string, data: any) => void
  getMemory: (key: string) => any
}

const AIContextEngine = createContext<AIContextEngineType | undefined>(undefined)

export const useAIContext = () => {
  const context = useContext(AIContextEngine)
  if (!context) {
    throw new Error('useAIContext must be used within AIContextProvider')
  }
  return context
}

export function AIContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AIContextState>({
    patterns: [
      {
        id: 'pattern-1',
        type: 'workflow',
        name: 'Morning Sync Pattern',
        description: 'Team consistently engages in high-activity collaboration between 9-11 AM',
        frequency: 8.5,
        confidence: 0.92,
        impact: 7.8,
        lastObserved: Date.now() - 3600000,
        relatedEntities: ['team-collaboration', 'time-based'],
        predictiveValue: 0.85
      },
      {
        id: 'pattern-2',
        type: 'behavioral',
        name: 'Review Cascading',
        description: 'Code reviews trigger collaborative discussions 73% of the time',
        frequency: 7.3,
        confidence: 0.88,
        impact: 8.2,
        lastObserved: Date.now() - 1800000,
        relatedEntities: ['code-review', 'team-discussion'],
        predictiveValue: 0.79
      },
      {
        id: 'pattern-3',
        type: 'collaborative',
        name: 'Cross-functional Emergence',
        description: 'Designers increasingly contributing to technical discussions',
        frequency: 6.8,
        confidence: 0.81,
        impact: 8.9,
        lastObserved: Date.now() - 900000,
        relatedEntities: ['role-evolution', 'skill-transfer'],
        predictiveValue: 0.87
      }
    ],
    insights: [
      {
        id: 'insight-1',
        category: 'optimization',
        insight: 'Team productivity peaks when design and development collaborate on architectural decisions',
        confidence: 0.89,
        evidence: [
          'Feature completion 34% faster with early designer involvement',
          'Reduced iteration cycles when technical constraints discussed upfront',
          '23% fewer post-implementation design changes'
        ],
        actionable: true,
        suggestedAction: 'Schedule weekly architecture review with design participation',
        timeframe: '1-2 weeks',
        priority: 8
      },
      {
        id: 'insight-2',
        category: 'risk',
        insight: 'Communication gaps emerging in distributed work sessions',
        confidence: 0.74,
        evidence: [
          'Increased clarification requests in async discussions',
          'Decision delays when multiple time zones involved',
          'Context loss between session transitions'
        ],
        actionable: true,
        suggestedAction: 'Implement living documentation for context handoffs',
        timeframe: 'immediate',
        priority: 7
      }
    ],
    predictions: [
      {
        event: 'Sprint velocity will increase by 15% next iteration',
        probability: 0.78,
        timeframe: '2 weeks',
        factors: ['improved team sync patterns', 'resolved technical debt', 'stable team composition'],
        preventable: false,
        impact: 'medium'
      },
      {
        event: 'Potential burnout risk for high-contributing team members',
        probability: 0.62,
        timeframe: '3-4 weeks',
        factors: ['sustained high activity', 'limited capacity increases', 'complex project demands'],
        preventable: true,
        impact: 'high'
      }
    ],
    teamDynamics: {
      cohesionScore: 8.7,
      communicationEfficiency: 7.9,
      decisionMakingSpeed: 8.2,
      conflictResolutionRate: 9.1,
      innovationIndex: 7.8,
      adaptabilityScore: 8.9,
      burnoutRisk: 3.4,
      velocityTrend: 'increasing'
    },
    contextualMemory: new Map(),
    learningMetrics: {
      patternsIdentified: 47,
      predictionAccuracy: 0.73,
      actionsSuggested: 23,
      actionsImplemented: 17
    },
    aiConfidence: 0.81,
    systemHealth: 0.93
  })

  // Continuous pattern analysis
  useEffect(() => {
    const interval = setInterval(() => {
      analyzeEmergingPatterns()
      updateTeamDynamics()
      generatePredictiveInsights()
    }, 45000) // Every 45 seconds

    return () => clearInterval(interval)
  }, [])

  const analyzeContext = useCallback((contextData: any) => {
    setState(prev => {
      const newPatterns = identifyPatternsInData(contextData)
      const updatedPatterns = mergePatternsWithExisting(prev.patterns, newPatterns)

      return {
        ...prev,
        patterns: updatedPatterns,
        aiConfidence: calculateAIConfidence(updatedPatterns),
        systemHealth: assessSystemHealth(contextData)
      }
    })
  }, [])

  const identifyPatternsInData = (contextData: any): ContextPattern[] => {
    const newPatterns: ContextPattern[] = []

    // Temporal pattern detection
    if (contextData.timestamps) {
      const timePattern = analyzeTemporalPatterns(contextData.timestamps)
      if (timePattern.confidence > 0.7) {
        newPatterns.push({
          id: `temporal-${Date.now()}`,
          type: 'temporal',
          name: timePattern.name,
          description: timePattern.description,
          frequency: timePattern.frequency,
          confidence: timePattern.confidence,
          impact: timePattern.impact,
          lastObserved: Date.now(),
          relatedEntities: timePattern.entities,
          predictiveValue: timePattern.predictiveValue
        })
      }
    }

    // Collaborative pattern detection
    if (contextData.interactions) {
      const collabPattern = analyzeCollaborativePatterns(contextData.interactions)
      if (collabPattern.confidence > 0.75) {
        newPatterns.push({
          id: `collaborative-${Date.now()}`,
          type: 'collaborative',
          name: collabPattern.name,
          description: collabPattern.description,
          frequency: collabPattern.frequency,
          confidence: collabPattern.confidence,
          impact: collabPattern.impact,
          lastObserved: Date.now(),
          relatedEntities: collabPattern.entities,
          predictiveValue: collabPattern.predictiveValue
        })
      }
    }

    // Workflow pattern detection
    if (contextData.workflows) {
      const workflowPattern = analyzeWorkflowPatterns(contextData.workflows)
      if (workflowPattern.confidence > 0.8) {
        newPatterns.push({
          id: `workflow-${Date.now()}`,
          type: 'workflow',
          name: workflowPattern.name,
          description: workflowPattern.description,
          frequency: workflowPattern.frequency,
          confidence: workflowPattern.confidence,
          impact: workflowPattern.impact,
          lastObserved: Date.now(),
          relatedEntities: workflowPattern.entities,
          predictiveValue: workflowPattern.predictiveValue
        })
      }
    }

    return newPatterns
  }

  const analyzeTemporalPatterns = (timestamps: number[]) => {
    // Analyze time-based patterns
    const hourCounts = new Map<number, number>()
    timestamps.forEach(ts => {
      const hour = new Date(ts).getHours()
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
    })

    const peakHours = Array.from(hourCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    return {
      name: 'Peak Activity Hours',
      description: `Team activity peaks at ${peakHours.map(([h]) => `${h}:00`).join(', ')}`,
      frequency: peakHours[0][1] / timestamps.length * 10,
      confidence: 0.85,
      impact: 7.5,
      entities: ['team-activity', 'temporal'],
      predictiveValue: 0.82
    }
  }

  const analyzeCollaborativePatterns = (interactions: any[]) => {
    // Analyze collaboration patterns
    const collaborationTypes = new Map<string, number>()
    interactions.forEach(interaction => {
      const type = interaction.type || 'general'
      collaborationTypes.set(type, (collaborationTypes.get(type) || 0) + 1)
    })

    const dominantType = Array.from(collaborationTypes.entries())
      .sort(([,a], [,b]) => b - a)[0]

    return {
      name: 'Dominant Collaboration Pattern',
      description: `Team primarily engages in ${dominantType[0]} interactions`,
      frequency: dominantType[1] / interactions.length * 10,
      confidence: 0.79,
      impact: 8.1,
      entities: ['collaboration', dominantType[0]],
      predictiveValue: 0.76
    }
  }

  const analyzeWorkflowPatterns = (workflows: any[]) => {
    // Analyze workflow efficiency patterns
    const completionTimes = workflows.map(w => w.completionTime || 0)
    const avgCompletion = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length

    return {
      name: 'Workflow Efficiency Pattern',
      description: `Average workflow completion: ${avgCompletion.toFixed(1)} minutes`,
      frequency: workflows.length / 10,
      confidence: 0.84,
      impact: 8.7,
      entities: ['workflow', 'efficiency'],
      predictiveValue: 0.88
    }
  }

  const mergePatternsWithExisting = (existing: ContextPattern[], newPatterns: ContextPattern[]): ContextPattern[] => {
    const merged = [...existing]

    newPatterns.forEach(newPattern => {
      const existingIndex = merged.findIndex(p =>
        p.type === newPattern.type &&
        p.name.toLowerCase().includes(newPattern.name.toLowerCase().split(' ')[0])
      )

      if (existingIndex >= 0) {
        // Update existing pattern
        merged[existingIndex] = {
          ...merged[existingIndex],
          frequency: (merged[existingIndex].frequency + newPattern.frequency) / 2,
          confidence: Math.max(merged[existingIndex].confidence, newPattern.confidence),
          lastObserved: newPattern.lastObserved
        }
      } else if (merged.length < 20) {
        // Add new pattern if under limit
        merged.push(newPattern)
      }
    })

    // Sort by relevance (confidence * impact * recency)
    return merged.sort((a, b) => {
      const scoreA = a.confidence * a.impact * (1 - (Date.now() - a.lastObserved) / (86400000 * 7))
      const scoreB = b.confidence * b.impact * (1 - (Date.now() - b.lastObserved) / (86400000 * 7))
      return scoreB - scoreA
    }).slice(0, 15)
  }

  const analyzeEmergingPatterns = () => {
    setState(prev => {
      // Simulate emerging pattern detection
      const emergingPatterns = prev.patterns.map(pattern => ({
        ...pattern,
        frequency: Math.min(pattern.frequency + (Math.random() * 0.2 - 0.1), 10),
        lastObserved: pattern.lastObserved + Math.random() * 1800000 // Random up to 30 min
      }))

      return {
        ...prev,
        patterns: emergingPatterns
      }
    })
  }

  const updateTeamDynamics = () => {
    setState(prev => {
      // Update team dynamics based on recent patterns
      const highConfidencePatterns = prev.patterns.filter(p => p.confidence > 0.8)
      const collaborativePatterns = prev.patterns.filter(p => p.type === 'collaborative')

      const newDynamics = {
        cohesionScore: Math.min(prev.teamDynamics.cohesionScore + (collaborativePatterns.length * 0.1), 10),
        communicationEfficiency: calculateCommunicationEfficiency(prev.patterns),
        decisionMakingSpeed: calculateDecisionSpeed(prev.patterns),
        conflictResolutionRate: prev.teamDynamics.conflictResolutionRate,
        innovationIndex: calculateInnovationIndex(prev.patterns),
        adaptabilityScore: calculateAdaptability(prev.patterns),
        burnoutRisk: calculateBurnoutRisk(prev.patterns),
        velocityTrend: determineVelocityTrend(prev.patterns) as 'increasing' | 'stable' | 'decreasing'
      }

      return {
        ...prev,
        teamDynamics: newDynamics
      }
    })
  }

  const calculateCommunicationEfficiency = (patterns: ContextPattern[]): number => {
    const commPatterns = patterns.filter(p =>
      p.relatedEntities.some(e => e.includes('communication') || e.includes('discussion'))
    )
    return commPatterns.reduce((acc, p) => acc + p.impact * p.confidence, 0) / Math.max(commPatterns.length, 1)
  }

  const calculateDecisionSpeed = (patterns: ContextPattern[]): number => {
    const decisionPatterns = patterns.filter(p =>
      p.description.toLowerCase().includes('decision') || p.name.toLowerCase().includes('decision')
    )
    return decisionPatterns.length > 0 ?
      decisionPatterns.reduce((acc, p) => acc + p.frequency, 0) / decisionPatterns.length :
      7.5 // Default score
  }

  const calculateInnovationIndex = (patterns: ContextPattern[]): number => {
    const innovativePatterns = patterns.filter(p =>
      p.type === 'behavioral' && p.description.toLowerCase().includes('new') ||
      p.description.toLowerCase().includes('creative') ||
      p.description.toLowerCase().includes('innovative')
    )
    return Math.min(innovativePatterns.length * 1.5 + 5, 10)
  }

  const calculateAdaptability = (patterns: ContextPattern[]): number => {
    const adaptationPatterns = patterns.filter(p =>
      p.type === 'behavioral' || p.name.toLowerCase().includes('evolution')
    )
    return Math.min(adaptationPatterns.reduce((acc, p) => acc + p.frequency * 0.8, 0) + 3, 10)
  }

  const calculateBurnoutRisk = (patterns: ContextPattern[]): number => {
    const highIntensityPatterns = patterns.filter(p => p.frequency > 8.5)
    const baseRisk = 2.0
    const intensityRisk = highIntensityPatterns.length * 0.8
    return Math.min(baseRisk + intensityRisk, 10)
  }

  const determineVelocityTrend = (patterns: ContextPattern[]): string => {
    const efficiencyPatterns = patterns.filter(p =>
      p.type === 'workflow' || p.description.toLowerCase().includes('efficiency')
    )

    const avgImpact = efficiencyPatterns.reduce((acc, p) => acc + p.impact, 0) /
                     Math.max(efficiencyPatterns.length, 1)

    if (avgImpact > 8) return 'increasing'
    if (avgImpact > 6.5) return 'stable'
    return 'decreasing'
  }

  const generatePredictiveInsights = () => {
    setState(prev => {
      const newInsights = createInsightsFromPatterns(prev.patterns)
      const newPredictions = generatePredictions(prev.patterns, prev.teamDynamics)

      return {
        ...prev,
        insights: [...prev.insights, ...newInsights].slice(-10), // Keep last 10
        predictions: [...prev.predictions, ...newPredictions].slice(-5) // Keep last 5
      }
    })
  }

  const createInsightsFromPatterns = (patterns: ContextPattern[]): AIInsight[] => {
    const insights: AIInsight[] = []

    // High-frequency patterns suggest optimization opportunities
    patterns.filter(p => p.frequency > 8.0 && p.confidence > 0.85).forEach(pattern => {
      if (pattern.type === 'collaborative') {
        insights.push({
          id: `insight-collab-${Date.now()}`,
          category: 'optimization',
          insight: `Strong collaborative pattern detected: ${pattern.description}`,
          confidence: pattern.confidence,
          evidence: [`Pattern frequency: ${pattern.frequency}/10`, `Impact level: ${pattern.impact}/10`],
          actionable: true,
          suggestedAction: 'Formalize this collaborative approach as team standard',
          timeframe: '1 week',
          priority: Math.round(pattern.impact)
        })
      }
    })

    // Low-confidence patterns suggest areas needing attention
    patterns.filter(p => p.confidence < 0.6).forEach(pattern => {
      insights.push({
        id: `insight-unclear-${Date.now()}`,
        category: 'risk',
        insight: `Unclear pattern emerging: ${pattern.name}`,
        confidence: pattern.confidence,
        evidence: [`Low confidence: ${Math.round(pattern.confidence * 100)}%`],
        actionable: true,
        suggestedAction: 'Monitor this area for clearer signals',
        timeframe: '2-3 weeks',
        priority: 6
      })
    })

    return insights.slice(0, 3) // Return top 3
  }

  const generatePredictions = (patterns: ContextPattern[], dynamics: TeamDynamics): ContextualPrediction[] => {
    const predictions: ContextualPrediction[] = []

    // Predict based on velocity trend
    if (dynamics.velocityTrend === 'increasing') {
      predictions.push({
        event: 'Sprint goals will be exceeded by 10-20%',
        probability: 0.72,
        timeframe: 'next sprint',
        factors: ['increasing velocity trend', 'high team cohesion'],
        preventable: false,
        impact: 'medium'
      })
    }

    // Predict based on burnout risk
    if (dynamics.burnoutRisk > 6.0) {
      predictions.push({
        event: 'Team productivity decline due to burnout',
        probability: 0.68,
        timeframe: '2-4 weeks',
        factors: ['high burnout risk', 'sustained high activity'],
        preventable: true,
        impact: 'high'
      })
    }

    return predictions
  }

  const calculateAIConfidence = (patterns: ContextPattern[]): number => {
    const avgConfidence = patterns.reduce((acc, p) => acc + p.confidence, 0) /
                         Math.max(patterns.length, 1)
    const recentPatterns = patterns.filter(p => Date.now() - p.lastObserved < 3600000)
    const recencyBonus = recentPatterns.length / patterns.length * 0.1

    return Math.min(avgConfidence + recencyBonus, 1)
  }

  const assessSystemHealth = (contextData: any): number => {
    // Assess overall system health based on various factors
    let health = 0.8 // Base health

    if (contextData.errors && contextData.errors.length === 0) health += 0.1
    if (contextData.responseTime && contextData.responseTime < 200) health += 0.05
    if (contextData.userSatisfaction && contextData.userSatisfaction > 8) health += 0.05

    return Math.min(health, 1)
  }

  const generateInsights = useCallback(() => {
    generatePredictiveInsights()
  }, [])

  const makePredictions = useCallback((timeHorizon: number) => {
    setState(prev => {
      const predictions = generateTimeBasedPredictions(prev.patterns, timeHorizon)
      return {
        ...prev,
        predictions: [...prev.predictions, ...predictions].slice(-8)
      }
    })
  }, [])

  const generateTimeBasedPredictions = (patterns: ContextPattern[], timeHorizon: number): ContextualPrediction[] => {
    // Generate predictions based on time horizon
    const predictions: ContextualPrediction[] = []

    if (timeHorizon <= 7) { // Next week
      predictions.push({
        event: 'Team will establish new collaboration rhythm',
        probability: 0.75,
        timeframe: `${timeHorizon} days`,
        factors: ['recent pattern changes', 'team adaptability'],
        preventable: false,
        impact: 'medium'
      })
    } else if (timeHorizon <= 30) { // Next month
      predictions.push({
        event: 'Significant workflow optimization opportunity will emerge',
        probability: 0.65,
        timeframe: `${Math.round(timeHorizon/7)} weeks`,
        factors: ['pattern maturation', 'accumulated insights'],
        preventable: false,
        impact: 'high'
      })
    }

    return predictions
  }

  const learnFromOutcome = useCallback((predictionId: string, actualOutcome: any) => {
    setState(prev => {
      const prediction = prev.predictions.find(p => p.event.includes(predictionId))
      if (!prediction) return prev

      // Update learning metrics based on accuracy
      const accuracy = calculatePredictionAccuracy(prediction, actualOutcome)
      const updatedMetrics = {
        ...prev.learningMetrics,
        predictionAccuracy: (prev.learningMetrics.predictionAccuracy + accuracy) / 2
      }

      // Store learning in memory
      updateMemory(`prediction-${predictionId}`, { prediction, actualOutcome, accuracy })

      return {
        ...prev,
        learningMetrics: updatedMetrics
      }
    })
  }, [])

  const calculatePredictionAccuracy = (prediction: ContextualPrediction, actualOutcome: any): number => {
    // Simple accuracy calculation - would be more sophisticated in production
    const outcomeMatch = actualOutcome.occurred === true ? 1 : 0
    const probabilityAccuracy = 1 - Math.abs(prediction.probability - outcomeMatch)
    return probabilityAccuracy
  }

  const getContextualRecommendations = useCallback((situation: string): string[] => {
    const recommendations: string[] = []
    const relevantPatterns = state.patterns.filter(p =>
      p.description.toLowerCase().includes(situation.toLowerCase()) ||
      p.relatedEntities.some(e => e.toLowerCase().includes(situation.toLowerCase()))
    )

    relevantPatterns.forEach(pattern => {
      if (pattern.confidence > 0.8) {
        recommendations.push(`Leverage ${pattern.name} pattern (${Math.round(pattern.confidence * 100)}% confidence)`)
      }
    })

    // Add general recommendations based on team dynamics
    if (state.teamDynamics.cohesionScore > 8.5) {
      recommendations.push('Team cohesion is high - ideal time for complex initiatives')
    }

    if (state.teamDynamics.burnoutRisk > 6.0) {
      recommendations.push('Monitor team workload - burnout risk elevated')
    }

    return recommendations.slice(0, 3)
  }, [state.patterns, state.teamDynamics])

  const updateMemory = useCallback((key: string, data: any) => {
    setState(prev => {
      const newMemory = new Map(prev.contextualMemory)
      newMemory.set(key, { ...data, timestamp: Date.now() })
      return {
        ...prev,
        contextualMemory: newMemory
      }
    })
  }, [])

  const getMemory = useCallback((key: string) => {
    return state.contextualMemory.get(key)
  }, [state.contextualMemory])

  const value: AIContextEngineType = {
    state,
    analyzeContext,
    generateInsights,
    makePredictions,
    learnFromOutcome,
    getContextualRecommendations,
    updateMemory,
    getMemory
  }

  return (
    <AIContextEngine.Provider value={value}>
      {children}
    </AIContextEngine.Provider>
  )
}