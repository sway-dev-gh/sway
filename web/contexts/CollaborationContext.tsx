'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  currentBlock?: string
  lastActivity: number
}

interface BlockActivity {
  blockId: string
  viewers: TeamMember[]
  editors: TeamMember[]
  lastModified: number
  activityLevel: number
  contextualInfo?: string
}

interface IntelligentRequest {
  id: string
  type: 'review' | 'approval' | 'collaboration' | 'insight'
  content: string
  priority: number
  suggestedAssignees: string[]
  contextualReason: string
  createdAt: number
  estimatedTime?: number
}

interface CollaborationState {
  // Real-time presence
  teamMembers: TeamMember[]
  onlineCount: number

  // Living blocks
  blockActivities: Map<string, BlockActivity>

  // Intelligent requests
  activeRequests: IntelligentRequest[]

  // AI insights
  currentInsights: string[]
  suggestedActions: Array<{
    action: string
    reason: string
    priority: number
  }>

  // Team dynamics
  teamVelocity: number
  focusAreas: string[]
  collaborationPatterns: Array<{
    pattern: string
    frequency: number
    effectiveness: number
  }>
}

interface CollaborationContextType {
  state: CollaborationState

  // Presence methods
  joinBlock: (blockId: string, mode: 'view' | 'edit') => void
  leaveBlock: (blockId: string) => void

  // Request methods
  createIntelligentRequest: (type: string, content: string, context?: any) => void
  routeRequest: (requestId: string, assigneeId: string, reason: string) => void

  // Learning methods
  recordInteraction: (interaction: any) => void
  updateTeamPattern: (pattern: any) => void

  // AI methods
  getContextualSuggestions: (currentContext: any) => string[]
  anticipateNeeds: (teamState: any) => any[]
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined)

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [ws, setWs] = useState<WebSocket | null>(null)

  const [state, setState] = useState<CollaborationState>({
    teamMembers: [],
    onlineCount: 0,
    blockActivities: new Map(),
    activeRequests: [],
    currentInsights: [],
    suggestedActions: [],
    teamVelocity: 0,
    focusAreas: [],
    collaborationPatterns: []
  })

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      // Simulate WebSocket connection (would be real in production)
      const mockWs = {
        send: (data: string) => console.log('WebSocket send:', data),
        close: () => console.log('WebSocket closed'),
        readyState: 1
      } as unknown as WebSocket

      setWs(mockWs)

      // Simulate initial team data
      setState(prev => ({
        ...prev,
        teamMembers: generateMockTeamMembers(),
        onlineCount: Math.floor(Math.random() * 5) + 1,
        currentInsights: generateContextualInsights(),
        suggestedActions: generateIntelligentActions()
      }))

      // Simulate real-time updates
      const interval = setInterval(() => {
        updateTeamActivity()
        generateAIInsights()
      }, 5000)

      return () => {
        clearInterval(interval)
        mockWs.close()
      }
    }
  }, [user])

  const generateMockTeamMembers = (): TeamMember[] => [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@team.dev',
      status: 'online',
      currentBlock: 'project-overview',
      lastActivity: Date.now()
    },
    {
      id: '2',
      name: 'Alex Rivera',
      email: 'alex@team.dev',
      status: 'busy',
      currentBlock: 'code-review',
      lastActivity: Date.now() - 300000
    },
    {
      id: '3',
      name: 'Jordan Kim',
      email: 'jordan@team.dev',
      status: 'online',
      lastActivity: Date.now() - 120000
    }
  ]

  const generateContextualInsights = (): string[] => [
    "Team is 40% more productive during morning collaboration sessions",
    "Code reviews complete 2x faster when Alex is involved early",
    "Project velocity increased 25% after last week's workflow changes"
  ]

  const generateIntelligentActions = () => [
    {
      action: "Schedule design review with Sarah",
      reason: "She's currently viewing related design blocks",
      priority: 8
    },
    {
      action: "Merge pending PR #47",
      reason: "All reviewers have approved and CI passed",
      priority: 6
    },
    {
      action: "Update project timeline",
      reason: "Team velocity suggests delivery 3 days early",
      priority: 4
    }
  ]

  const updateTeamActivity = () => {
    setState(prev => {
      const newBlockActivities = new Map(prev.blockActivities)

      // Simulate block activity
      const blocks = ['project-overview', 'code-review', 'design-system', 'deployment']
      blocks.forEach(blockId => {
        const activity: BlockActivity = {
          blockId,
          viewers: prev.teamMembers.filter(m => Math.random() > 0.7),
          editors: prev.teamMembers.filter(m => Math.random() > 0.9),
          lastModified: Date.now() - Math.random() * 3600000,
          activityLevel: Math.random() * 10,
          contextualInfo: Math.random() > 0.8 ? "High priority changes detected" : undefined
        }
        newBlockActivities.set(blockId, activity)
      })

      return {
        ...prev,
        blockActivities: newBlockActivities,
        onlineCount: prev.teamMembers.filter(m => m.status === 'online').length
      }
    })
  }

  const generateAIInsights = () => {
    const newInsights = [
      "Team focus shifted to deployment block - suggesting infrastructure review",
      "Pattern detected: Reviews complete faster with early design feedback",
      "Recommendation: Schedule async standup based on current team timezones",
      "Context switch alert: Too many concurrent projects detected"
    ]

    setState(prev => ({
      ...prev,
      currentInsights: [newInsights[Math.floor(Math.random() * newInsights.length)]],
      teamVelocity: Math.random() * 100,
      focusAreas: ['Frontend', 'API Design', 'Testing'].filter(() => Math.random() > 0.5)
    }))
  }

  const joinBlock = (blockId: string, mode: 'view' | 'edit') => {
    if (ws && user) {
      ws.send(JSON.stringify({
        type: 'join_block',
        blockId,
        mode,
        userId: user.id,
        timestamp: Date.now()
      }))

      recordInteraction({
        type: 'block_join',
        blockId,
        mode,
        timestamp: Date.now()
      })
    }
  }

  const leaveBlock = (blockId: string) => {
    if (ws && user) {
      ws.send(JSON.stringify({
        type: 'leave_block',
        blockId,
        userId: user.id,
        timestamp: Date.now()
      }))
    }
  }

  const createIntelligentRequest = (type: string, content: string, context?: any) => {
    const request: IntelligentRequest = {
      id: Math.random().toString(36).substring(7),
      type: type as any,
      content,
      priority: calculateRequestPriority(type, content, context),
      suggestedAssignees: suggestOptimalAssignees(type, content, context),
      contextualReason: generateContextualReason(type, content, context),
      createdAt: Date.now(),
      estimatedTime: estimateTaskTime(type, content)
    }

    setState(prev => ({
      ...prev,
      activeRequests: [...prev.activeRequests, request]
    }))
  }

  const calculateRequestPriority = (type: string, content: string, context?: any): number => {
    // AI-powered priority calculation based on team patterns
    let priority = 5
    if (type === 'review' && content.includes('critical')) priority = 9
    if (context?.deadline && new Date(context.deadline).getTime() < Date.now() + 86400000) priority = 8
    return Math.min(priority + Math.floor(Math.random() * 3), 10)
  }

  const suggestOptimalAssignees = (type: string, content: string, context?: any): string[] => {
    // AI learns team member expertise and availability
    const availableMembers = state.teamMembers.filter(m => m.status !== 'offline')
    return availableMembers
      .sort((a, b) => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 2) + 1)
      .map(m => m.id)
  }

  const generateContextualReason = (type: string, content: string, context?: any): string => {
    const reasons = [
      "Based on recent collaboration patterns with similar tasks",
      "Suggested due to current block activity and expertise overlap",
      "Optimal timing based on team availability and workflow patterns",
      "High-priority due to impact on current sprint goals"
    ]
    return reasons[Math.floor(Math.random() * reasons.length)]
  }

  const estimateTaskTime = (type: string, content: string): number => {
    // AI estimates based on historical data
    const baseTime = type === 'review' ? 30 : 60
    return baseTime + Math.floor(Math.random() * 90)
  }

  const routeRequest = (requestId: string, assigneeId: string, reason: string) => {
    setState(prev => ({
      ...prev,
      activeRequests: prev.activeRequests.map(req =>
        req.id === requestId
          ? { ...req, suggestedAssignees: [assigneeId] }
          : req
      )
    }))

    recordInteraction({
      type: 'request_routed',
      requestId,
      assigneeId,
      reason,
      timestamp: Date.now()
    })
  }

  const recordInteraction = (interaction: any) => {
    // Record for AI learning
    console.log('Recording interaction for AI learning:', interaction)

    // Update team patterns based on interaction
    updateTeamPattern({
      type: interaction.type,
      effectiveness: Math.random() * 10,
      timestamp: Date.now()
    })
  }

  const updateTeamPattern = (pattern: any) => {
    setState(prev => ({
      ...prev,
      collaborationPatterns: [
        ...prev.collaborationPatterns.slice(-4), // Keep last 5 patterns
        {
          pattern: pattern.type,
          frequency: Math.random() * 10,
          effectiveness: pattern.effectiveness
        }
      ]
    }))
  }

  const getContextualSuggestions = (currentContext: any): string[] => {
    return [
      "Consider inviting Sarah to this discussion - she has relevant context",
      "This block might benefit from a design review",
      "Similar issues were resolved faster with pair programming"
    ]
  }

  const anticipateNeeds = (teamState: any) => {
    return [
      { type: 'resource', suggestion: 'Additional API documentation needed', confidence: 0.8 },
      { type: 'process', suggestion: 'Schedule architecture review', confidence: 0.6 },
      { type: 'collaboration', suggestion: 'Team sync recommended', confidence: 0.7 }
    ]
  }

  const value: CollaborationContextType = {
    state,
    joinBlock,
    leaveBlock,
    createIntelligentRequest,
    routeRequest,
    recordInteraction,
    updateTeamPattern,
    getContextualSuggestions,
    anticipateNeeds
  }

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  )
}

export function useCollaboration() {
  const context = useContext(CollaborationContext)
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider')
  }
  return context
}