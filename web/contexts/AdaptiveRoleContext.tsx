'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface ContributionMetric {
  area: string
  frequency: number
  quality: number
  impact: number
  recentActivity: number
}

interface TeamMemberRole {
  id: string
  name: string
  primaryRole: string
  emergingRoles: string[]
  contributions: ContributionMetric[]
  expertiseAreas: string[]
  collaborationScore: number
  adaptabilityScore: number
  currentCapacity: number
  suggestedRoleChanges: RoleEvolution[]
}

interface RoleEvolution {
  fromRole: string
  toRole: string
  confidence: number
  reason: string
  contributionEvidence: string[]
  impact: 'low' | 'medium' | 'high'
  timeline: string
}

interface ProjectRoleNeed {
  role: string
  urgency: number
  skillsRequired: string[]
  currentGap: number
  suggestedMembers: string[]
}

interface AdaptiveRoleState {
  teamRoles: TeamMemberRole[]
  roleEvolutions: RoleEvolution[]
  projectNeeds: ProjectRoleNeed[]
  emergingPatterns: string[]
  roleDistribution: Record<string, number>
  adaptationSuggestions: string[]
}

interface AdaptiveRoleContextType {
  state: AdaptiveRoleState
  analyzeContributions: (memberId: string, activity: any) => void
  suggestRoleEvolution: (memberId: string, evidence: any) => void
  applyRoleChange: (memberId: string, newRole: string, reason: string) => void
  identifyProjectNeeds: (projectContext: any) => void
  getOptimalTeamComposition: (projectType: string) => TeamMemberRole[]
  trackContribution: (memberId: string, contribution: any) => void
}

const AdaptiveRoleContext = createContext<AdaptiveRoleContextType | undefined>(undefined)

export const useAdaptiveRoles = () => {
  const context = useContext(AdaptiveRoleContext)
  if (!context) {
    throw new Error('useAdaptiveRoles must be used within AdaptiveRoleProvider')
  }
  return context
}

export function AdaptiveRoleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AdaptiveRoleState>({
    teamRoles: [
      {
        id: 'user-1',
        name: 'Alex Chen',
        primaryRole: 'Designer',
        emergingRoles: ['Product Strategy', 'User Research'],
        contributions: [
          { area: 'Design Systems', frequency: 8.5, quality: 9.2, impact: 8.8, recentActivity: 0.95 },
          { area: 'User Research', frequency: 6.2, quality: 8.7, impact: 7.5, recentActivity: 0.85 },
          { area: 'Product Strategy', frequency: 4.8, quality: 8.1, impact: 8.9, recentActivity: 0.75 }
        ],
        expertiseAreas: ['UI/UX', 'Design Systems', 'User Psychology', 'Prototyping'],
        collaborationScore: 8.6,
        adaptabilityScore: 9.1,
        currentCapacity: 0.75,
        suggestedRoleChanges: []
      },
      {
        id: 'user-2',
        name: 'Morgan Taylor',
        primaryRole: 'Developer',
        emergingRoles: ['DevOps', 'Architecture'],
        contributions: [
          { area: 'Backend Development', frequency: 9.1, quality: 8.8, impact: 9.2, recentActivity: 0.92 },
          { area: 'DevOps', frequency: 7.3, quality: 8.2, impact: 8.5, recentActivity: 0.88 },
          { area: 'Code Review', frequency: 8.7, quality: 9.1, impact: 8.3, recentActivity: 0.90 }
        ],
        expertiseAreas: ['Node.js', 'React', 'AWS', 'Docker', 'Database Design'],
        collaborationScore: 7.9,
        adaptabilityScore: 8.4,
        currentCapacity: 0.82,
        suggestedRoleChanges: []
      },
      {
        id: 'user-3',
        name: 'Jordan Kim',
        primaryRole: 'Product Manager',
        emergingRoles: ['Data Analysis', 'Growth'],
        contributions: [
          { area: 'Product Strategy', frequency: 8.9, quality: 8.6, impact: 9.1, recentActivity: 0.89 },
          { area: 'Stakeholder Management', frequency: 7.8, quality: 8.9, impact: 8.7, recentActivity: 0.85 },
          { area: 'Data Analysis', frequency: 6.5, quality: 7.8, impact: 8.2, recentActivity: 0.78 }
        ],
        expertiseAreas: ['Product Strategy', 'Analytics', 'User Stories', 'Roadmapping'],
        collaborationScore: 9.2,
        adaptabilityScore: 8.7,
        currentCapacity: 0.78,
        suggestedRoleChanges: []
      }
    ],
    roleEvolutions: [],
    projectNeeds: [],
    emergingPatterns: [],
    roleDistribution: {
      'Designer': 1,
      'Developer': 1,
      'Product Manager': 1
    },
    adaptationSuggestions: []
  })

  // Analyze contributions and suggest role adaptations
  const analyzeContributions = useCallback((memberId: string, activity: any) => {
    setState(prev => {
      const member = prev.teamRoles.find(m => m.id === memberId)
      if (!member) return prev

      // Update contribution metrics based on activity
      const updatedContributions = member.contributions.map(contrib => {
        if (activity.area && activity.area === contrib.area) {
          return {
            ...contrib,
            frequency: Math.min(contrib.frequency + 0.1, 10),
            recentActivity: Math.min(contrib.recentActivity + 0.05, 1)
          }
        }
        return contrib
      })

      // Check for new expertise areas
      if (activity.area && !member.expertiseAreas.includes(activity.area)) {
        if (activity.quality > 7) {
          member.expertiseAreas.push(activity.area)
        }
      }

      // Calculate if role evolution is needed
      const roleEvolution = calculateRoleEvolution(member, updatedContributions)

      return {
        ...prev,
        teamRoles: prev.teamRoles.map(m =>
          m.id === memberId
            ? { ...m, contributions: updatedContributions }
            : m
        ),
        roleEvolutions: roleEvolution ? [...prev.roleEvolutions, roleEvolution] : prev.roleEvolutions
      }
    })
  }, [])

  const calculateRoleEvolution = (member: TeamMemberRole, contributions: ContributionMetric[]): RoleEvolution | null => {
    // Find strongest emerging contribution area
    const emergingArea = contributions
      .filter(c => c.frequency > 7 && c.quality > 8 && !member.primaryRole.toLowerCase().includes(c.area.toLowerCase()))
      .sort((a, b) => (b.frequency * b.quality * b.impact) - (a.frequency * a.quality * a.impact))[0]

    if (!emergingArea) return null

    const potentialRole = mapAreaToRole(emergingArea.area)
    const confidence = calculateEvolutionConfidence(emergingArea, member)

    if (confidence > 0.75) {
      return {
        fromRole: member.primaryRole,
        toRole: potentialRole,
        confidence,
        reason: `Strong consistent contributions in ${emergingArea.area} (${emergingArea.frequency}/10 frequency, ${emergingArea.quality}/10 quality)`,
        contributionEvidence: [
          `${emergingArea.frequency}/10 contribution frequency`,
          `${emergingArea.quality}/10 work quality`,
          `${emergingArea.impact}/10 team impact`
        ],
        impact: confidence > 0.9 ? 'high' : 'medium',
        timeline: confidence > 0.9 ? '1-2 weeks' : '2-4 weeks'
      }
    }

    return null
  }

  const mapAreaToRole = (area: string): string => {
    const roleMap: Record<string, string> = {
      'Design Systems': 'Lead Designer',
      'User Research': 'UX Researcher',
      'Product Strategy': 'Product Strategist',
      'Backend Development': 'Backend Lead',
      'DevOps': 'DevOps Engineer',
      'Architecture': 'Technical Architect',
      'Data Analysis': 'Data Analyst',
      'Code Review': 'Technical Lead',
      'Stakeholder Management': 'Product Lead'
    }
    return roleMap[area] || `${area} Specialist`
  }

  const calculateEvolutionConfidence = (area: ContributionMetric, member: TeamMemberRole): number => {
    let confidence = 0

    // Contribution strength (40%)
    confidence += (area.frequency / 10) * 0.2
    confidence += (area.quality / 10) * 0.1
    confidence += (area.impact / 10) * 0.1

    // Consistency and recency (30%)
    confidence += area.recentActivity * 0.2
    confidence += (area.frequency > 7 ? 0.1 : 0)

    // Member adaptability (20%)
    confidence += (member.adaptabilityScore / 10) * 0.15
    confidence += (member.collaborationScore / 10) * 0.05

    // Capacity and fit (10%)
    confidence += (member.currentCapacity < 0.9 ? 0.05 : 0)
    confidence += (member.expertiseAreas.includes(area.area) ? 0.05 : 0)

    return Math.min(confidence, 1)
  }

  const suggestRoleEvolution = useCallback((memberId: string, evidence: any) => {
    setState(prev => {
      const suggestions = generateRoleEvolutionSuggestions(memberId, evidence, prev.teamRoles)
      return {
        ...prev,
        adaptationSuggestions: [...prev.adaptationSuggestions, ...suggestions]
      }
    })
  }, [])

  const generateRoleEvolutionSuggestions = (memberId: string, evidence: any, teamRoles: TeamMemberRole[]): string[] => {
    const member = teamRoles.find(m => m.id === memberId)
    if (!member) return []

    const suggestions = []

    // Analyze cross-functional growth
    const crossFunctionalAreas = member.contributions.filter(c =>
      !member.primaryRole.toLowerCase().includes(c.area.toLowerCase()) && c.frequency > 6
    )

    if (crossFunctionalAreas.length > 0) {
      suggestions.push(`${member.name} showing strong cross-functional growth in ${crossFunctionalAreas.map(c => c.area).join(', ')}`)
    }

    // Identify leadership potential
    if (member.collaborationScore > 8.5 && member.adaptabilityScore > 8.0) {
      suggestions.push(`${member.name} demonstrates leadership potential - consider mentoring or lead role opportunities`)
    }

    // Specialization recommendations
    const topContribution = member.contributions.sort((a, b) =>
      (b.frequency * b.quality * b.impact) - (a.frequency * a.quality * a.impact)
    )[0]

    if (topContribution && topContribution.frequency > 8.5 && topContribution.quality > 8.5) {
      suggestions.push(`${member.name} excels in ${topContribution.area} - consider specialist track or expert role`)
    }

    return suggestions
  }

  const applyRoleChange = useCallback((memberId: string, newRole: string, reason: string) => {
    setState(prev => ({
      ...prev,
      teamRoles: prev.teamRoles.map(member =>
        member.id === memberId
          ? { ...member, primaryRole: newRole }
          : member
      ),
      roleEvolutions: prev.roleEvolutions.filter(evolution =>
        !(evolution.fromRole === prev.teamRoles.find(m => m.id === memberId)?.primaryRole)
      )
    }))

    // Record the role change for learning
    trackRoleChange(memberId, newRole, reason)
  }, [])

  const trackRoleChange = (memberId: string, newRole: string, reason: string) => {
    // This would integrate with the AI learning system
    console.log(`Role change applied: ${memberId} -> ${newRole} (${reason})`)
  }

  const identifyProjectNeeds = useCallback((projectContext: any) => {
    setState(prev => {
      const needs = analyzeProjectRoleNeeds(projectContext, prev.teamRoles)
      return {
        ...prev,
        projectNeeds: needs
      }
    })
  }, [])

  const analyzeProjectRoleNeeds = (projectContext: any, teamRoles: TeamMemberRole[]): ProjectRoleNeed[] => {
    const needs: ProjectRoleNeed[] = []

    // Analyze project type and identify missing skills
    const projectType = projectContext.type || 'general'
    const requiredRoles = getRequiredRolesForProject(projectType)

    requiredRoles.forEach(requiredRole => {
      const currentCoverage = teamRoles.filter(member =>
        member.primaryRole === requiredRole.role ||
        member.emergingRoles.includes(requiredRole.role)
      ).length

      if (currentCoverage < requiredRole.minCount) {
        const gap = requiredRole.minCount - currentCoverage
        const suggestedMembers = findBestCandidates(requiredRole.role, teamRoles)

        needs.push({
          role: requiredRole.role,
          urgency: requiredRole.urgency,
          skillsRequired: requiredRole.skills,
          currentGap: gap,
          suggestedMembers: suggestedMembers.map(m => m.id)
        })
      }
    })

    return needs
  }

  const getRequiredRolesForProject = (projectType: string) => {
    const roleRequirements: Record<string, any[]> = {
      'design-system': [
        { role: 'Lead Designer', minCount: 1, urgency: 9, skills: ['Design Systems', 'Component Libraries'] },
        { role: 'Frontend Developer', minCount: 1, urgency: 8, skills: ['React', 'CSS-in-JS'] },
        { role: 'UX Researcher', minCount: 1, urgency: 6, skills: ['User Testing', 'Research'] }
      ],
      'api-integration': [
        { role: 'Backend Developer', minCount: 1, urgency: 9, skills: ['API Design', 'Database'] },
        { role: 'DevOps Engineer', minCount: 1, urgency: 7, skills: ['Deployment', 'Infrastructure'] },
        { role: 'Technical Lead', minCount: 1, urgency: 8, skills: ['Architecture', 'Code Review'] }
      ],
      'user-research': [
        { role: 'UX Researcher', minCount: 1, urgency: 9, skills: ['User Interviews', 'Data Analysis'] },
        { role: 'Product Manager', minCount: 1, urgency: 8, skills: ['Requirements', 'Stakeholder Management'] },
        { role: 'Data Analyst', minCount: 1, urgency: 6, skills: ['Analytics', 'Insights'] }
      ]
    }

    return roleRequirements[projectType] || []
  }

  const findBestCandidates = (targetRole: string, teamRoles: TeamMemberRole[]): TeamMemberRole[] => {
    return teamRoles
      .filter(member => member.emergingRoles.includes(targetRole) ||
                      member.contributions.some(c => c.area.toLowerCase().includes(targetRole.toLowerCase().split(' ')[0])))
      .sort((a, b) => b.adaptabilityScore - a.adaptabilityScore)
      .slice(0, 3)
  }

  const getOptimalTeamComposition = useCallback((projectType: string): TeamMemberRole[] => {
    const requiredRoles = getRequiredRolesForProject(projectType)
    const optimalTeam: TeamMemberRole[] = []

    requiredRoles.forEach(roleReq => {
      const bestCandidate = state.teamRoles
        .filter(member =>
          member.primaryRole === roleReq.role ||
          member.emergingRoles.includes(roleReq.role) ||
          member.contributions.some(c => roleReq.skills.some(skill => c.area.includes(skill)))
        )
        .sort((a, b) => {
          const aScore = calculateRoleMatch(a, roleReq)
          const bScore = calculateRoleMatch(b, roleReq)
          return bScore - aScore
        })[0]

      if (bestCandidate) {
        optimalTeam.push(bestCandidate)
      }
    })

    return optimalTeam
  }, [state.teamRoles])

  const calculateRoleMatch = (member: TeamMemberRole, roleReq: any): number => {
    let score = 0

    // Direct role match
    if (member.primaryRole === roleReq.role) score += 50
    if (member.emergingRoles.includes(roleReq.role)) score += 30

    // Skill match
    const skillMatches = roleReq.skills.filter((skill: string) =>
      member.expertiseAreas.some(area => area.toLowerCase().includes(skill.toLowerCase())) ||
      member.contributions.some(c => c.area.toLowerCase().includes(skill.toLowerCase()))
    ).length

    score += (skillMatches / roleReq.skills.length) * 30

    // Performance factors
    score += member.collaborationScore
    score += member.adaptabilityScore
    score += (1 - member.currentCapacity) * 10 // Prefer less loaded members

    return score
  }

  const trackContribution = useCallback((memberId: string, contribution: any) => {
    setState(prev => {
      const updatedRoles = prev.teamRoles.map(member => {
        if (member.id === memberId) {
          const existingContrib = member.contributions.find(c => c.area === contribution.area)
          if (existingContrib) {
            // Update existing contribution
            const updatedContributions = member.contributions.map(c =>
              c.area === contribution.area
                ? {
                    ...c,
                    frequency: Math.min(c.frequency + (contribution.impact || 0.1), 10),
                    quality: (c.quality + (contribution.quality || 8)) / 2,
                    impact: (c.impact + (contribution.impact || 7)) / 2,
                    recentActivity: Math.min(c.recentActivity + 0.1, 1)
                  }
                : c
            )
            return { ...member, contributions: updatedContributions }
          } else {
            // Add new contribution area
            return {
              ...member,
              contributions: [...member.contributions, {
                area: contribution.area,
                frequency: contribution.frequency || 1,
                quality: contribution.quality || 7,
                impact: contribution.impact || 6,
                recentActivity: 1
              }]
            }
          }
        }
        return member
      })

      return { ...prev, teamRoles: updatedRoles }
    })
  }, [])

  // Continuous role analysis
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        // Decay recent activity over time
        const updatedRoles = prev.teamRoles.map(member => ({
          ...member,
          contributions: member.contributions.map(contrib => ({
            ...contrib,
            recentActivity: Math.max(contrib.recentActivity - 0.01, 0)
          }))
        }))

        // Identify emerging patterns
        const patterns = identifyEmergingPatterns(updatedRoles)

        return {
          ...prev,
          teamRoles: updatedRoles,
          emergingPatterns: patterns
        }
      })
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const identifyEmergingPatterns = (teamRoles: TeamMemberRole[]): string[] => {
    const patterns = []

    // Cross-functional growth pattern
    const crossFunctional = teamRoles.filter(member =>
      member.contributions.filter(c => !member.primaryRole.toLowerCase().includes(c.area.toLowerCase())).length > 2
    )
    if (crossFunctional.length > teamRoles.length * 0.6) {
      patterns.push('Team showing strong cross-functional growth')
    }

    // Specialization trend
    const specialists = teamRoles.filter(member =>
      member.contributions.some(c => c.frequency > 9 && c.quality > 8.5)
    )
    if (specialists.length > teamRoles.length * 0.4) {
      patterns.push('Increasing specialization in key areas')
    }

    // Collaboration intensity
    const highCollaborators = teamRoles.filter(member => member.collaborationScore > 8.5)
    if (highCollaborators.length === teamRoles.length) {
      patterns.push('Team operating at peak collaboration levels')
    }

    return patterns
  }

  const value: AdaptiveRoleContextType = {
    state,
    analyzeContributions,
    suggestRoleEvolution,
    applyRoleChange,
    identifyProjectNeeds,
    getOptimalTeamComposition,
    trackContribution
  }

  return (
    <AdaptiveRoleContext.Provider value={value}>
      {children}
    </AdaptiveRoleContext.Provider>
  )
}