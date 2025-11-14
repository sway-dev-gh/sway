'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AppLayout from '@/components/AppLayout'
import LivingBlock from '@/components/LivingBlock'
import EmergentCollaboration from '@/components/EmergentCollaboration'
import IntelligentRequest from '@/components/IntelligentRequest'
import AdaptiveRoles from '@/components/AdaptiveRoles'
import AIContextDashboard from '@/components/AIContextDashboard'
import { useCollaboration } from '@/contexts/CollaborationContext'
import { apiRequest } from '@/lib/auth'

interface Project {
  id: string
  title: string
  description: string
  project_type: string
  created_at: string
  priority?: number
  last_activity?: number
}

export default function LivingWorkspace() {
  const { state, joinBlock, createIntelligentRequest, recordInteraction } = useCollaboration()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [workspaceContext, setWorkspaceContext] = useState<any>({})

  useEffect(() => {
    loadProjects()
    initializeWorkspaceContext()
  }, [])

  // Update workspace context as team state changes
  useEffect(() => {
    updateWorkspaceContext()
  }, [state, selectedProject])

  const loadProjects = async () => {
    try {
      const response = await apiRequest('/api/projects')
      if (response?.ok) {
        const data = await response.json()
        const userProjects = (data.projects.owned || []).map(enrichProjectWithContext)
        setProjects(userProjects)
        if (userProjects.length > 0) {
          setSelectedProject(userProjects[0])
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const enrichProjectWithContext = (project: any) => ({
    ...project,
    priority: calculateProjectPriority(project),
    last_activity: Date.now() - Math.random() * 3600000 // Simulate last activity
  })

  const calculateProjectPriority = (project: any) => {
    let priority = 5
    if (project.project_type === 'review') priority += 2
    if (project.title.includes('urgent') || project.title.includes('critical')) priority += 3
    if (Date.now() - new Date(project.created_at).getTime() < 86400000) priority += 1 // Recent
    return Math.min(priority, 10)
  }

  const initializeWorkspaceContext = () => {
    setWorkspaceContext({
      viewMode: 'collaborative',
      activeMode: 'project-focused',
      collaborationDepth: 'deep',
      teamAlignment: 'high'
    })
  }

  const updateWorkspaceContext = () => {
    const context = {
      teamPulse: Math.min(state.onlineCount * 25 + state.teamVelocity * 0.5, 100),
      focusIntensity: Array.from(state.blockActivities.values())
        .reduce((sum, activity) => sum + activity.activityLevel, 0) /
        Math.max(state.blockActivities.size, 1),
      collaborationMode: state.onlineCount > 2 ? 'synchronous' : 'asynchronous',
      currentPhase: determineDevelopmentPhase()
    }

    setWorkspaceContext(prev => ({ ...prev, ...context }))
  }

  const determineDevelopmentPhase = () => {
    const phases = ['ideation', 'development', 'review', 'deployment']
    const activeBlocks = Array.from(state.blockActivities.values())

    if (activeBlocks.some(b => b.blockId.includes('review'))) return 'review'
    if (activeBlocks.some(b => b.blockId.includes('deploy'))) return 'deployment'
    if (activeBlocks.length > 3) return 'development'
    return 'ideation'
  }

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
    joinBlock(`project-${project.id}`, 'view')

    recordInteraction({
      type: 'project_switch',
      projectId: project.id,
      priority: project.priority,
      context: workspaceContext
    })

    // Create contextual request if project needs attention
    if (project.priority && project.priority > 7) {
      createIntelligentRequest(
        'collaboration',
        `High-priority project "${project.title}" needs team attention`,
        {
          projectId: project.id,
          priority: project.priority,
          phase: workspaceContext.currentPhase
        }
      )
    }
  }

  const renderTeamPresence = () => {
    if (state.onlineCount === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-2 mb-4"
      >
        <div className="flex items-center space-x-1">
          {state.teamMembers.filter(m => m.status === 'online').slice(0, 3).map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="w-3 h-3 bg-terminal-text rounded-full opacity-60"
              title={`${member.name} is online${member.currentBlock ? ` - viewing ${member.currentBlock}` : ''}`}
            />
          ))}
        </div>
        <span className="text-terminal-muted text-xs">
          {state.onlineCount} team member{state.onlineCount !== 1 ? 's' : ''} collaborating
        </span>
      </motion.div>
    )
  }

  const renderProjectBlocks = () => {
    if (!selectedProject) return null

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Project Overview Block */}
        <LivingBlock
          id={`project-overview-${selectedProject.id}`}
          title="Project Overview"
          type="project"
          priority={selectedProject.priority}
          className="p-4"
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-terminal-text text-sm font-medium">{selectedProject.title}</h4>
              <p className="text-terminal-muted text-xs mt-1">{selectedProject.description}</p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-terminal-muted">{selectedProject.project_type}</span>
              <span className="text-terminal-muted">
                {new Date(selectedProject.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </LivingBlock>

        {/* Files & Resources Block */}
        <LivingBlock
          id={`project-files-${selectedProject.id}`}
          title="Files & Resources"
          type="file"
          priority={6}
          className="p-4"
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-terminal-bg hover:bg-terminal-hover transition-colors cursor-pointer">
              <span className="text-terminal-text">README.md</span>
              <span className="text-terminal-muted">2m ago</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-terminal-bg hover:bg-terminal-hover transition-colors cursor-pointer">
              <span className="text-terminal-text">components/</span>
              <span className="text-terminal-muted">15m ago</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-terminal-bg hover:bg-terminal-hover transition-colors cursor-pointer">
              <span className="text-terminal-text">docs/</span>
              <span className="text-terminal-muted">1h ago</span>
            </div>
          </div>
        </LivingBlock>

        {/* Team Activity Block */}
        <LivingBlock
          id={`team-activity-${selectedProject.id}`}
          title="Team Activity"
          type="discussion"
          priority={7}
          className="p-4"
        >
          <div className="space-y-2 text-xs">
            {state.teamMembers.filter(m => m.status !== 'offline').map((member, index) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    member.status === 'online' ? 'bg-terminal-text' : 'bg-terminal-muted'
                  }`} />
                  <span className="text-terminal-text">{member.name}</span>
                </div>
                <span className="text-terminal-muted">
                  {member.currentBlock || 'Available'}
                </span>
              </div>
            ))}
          </div>
        </LivingBlock>

        {/* Development Phase Block */}
        <LivingBlock
          id={`dev-phase-${selectedProject.id}`}
          title={`Current Phase: ${workspaceContext.currentPhase || 'Loading...'}`}
          type="task"
          priority={8}
          className="p-4"
        >
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-terminal-muted">Team Pulse</span>
              <span className="text-terminal-text">
                {Math.round(workspaceContext.teamPulse || 0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-muted">Focus Intensity</span>
              <span className="text-terminal-text">
                {Math.round((workspaceContext.focusIntensity || 0) * 10)}/10
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-muted">Collaboration</span>
              <span className="text-terminal-text">
                {workspaceContext.collaborationMode || 'async'}
              </span>
            </div>
          </div>
        </LivingBlock>

        {/* Quick Actions Block */}
        <LivingBlock
          id={`quick-actions-${selectedProject.id}`}
          title="Smart Actions"
          type="task"
          priority={5}
          className="p-4"
        >
          <div className="space-y-2">
            {state.suggestedActions.slice(0, 3).map((action, index) => (
              <button
                key={index}
                onClick={() => createIntelligentRequest('collaboration', action.action)}
                className="w-full text-left p-2 bg-terminal-bg hover:bg-terminal-hover transition-colors text-xs"
              >
                <div className="text-terminal-text">{action.action}</div>
                <div className="text-terminal-muted mt-1">Priority: {action.priority}/10</div>
              </button>
            ))}
          </div>
        </LivingBlock>

        {/* Context Insights Block */}
        <LivingBlock
          id={`context-insights-${selectedProject.id}`}
          title="AI Insights"
          type="project"
          priority={6}
          className="p-4"
        >
          <div className="space-y-2 text-xs">
            {state.currentInsights.slice(0, 2).map((insight, index) => (
              <div key={index} className="p-2 bg-terminal-bg border border-terminal-border">
                <p className="text-terminal-muted">{insight}</p>
              </div>
            ))}
            {state.currentInsights.length === 0 && (
              <div className="text-terminal-muted">Analyzing team patterns...</div>
            )}
          </div>
        </LivingBlock>
      </div>
    )
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 overflow-auto bg-terminal-bg flex items-center justify-center">
          <div className="text-terminal-muted">Loading workspace...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 overflow-auto bg-terminal-bg">
        {/* Living Header */}
        <div className="bg-terminal-surface border-b border-terminal-border p-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl text-terminal-text font-medium">Living Workspace</h1>
            <div className="text-xs text-terminal-muted">
              {workspaceContext.currentPhase && (
                <span className="capitalize">{workspaceContext.currentPhase} Phase</span>
              )}
            </div>
          </div>
          <p className="text-terminal-muted text-sm">
            {selectedProject ?
              `Collaborating on: ${selectedProject.title}` :
              'Intelligent project collaboration space'}
          </p>
          {renderTeamPresence()}
        </div>

        <div className="p-6 space-y-6">
          {/* Emergent Collaboration Interface */}
          <EmergentCollaboration />

          {/* Adaptive Team Roles */}
          <AdaptiveRoles />

          {/* AI Context Engine */}
          <AIContextDashboard />

          {/* Project Selection */}
          {projects.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-terminal-text mb-4 flex items-center">
                Your Projects
                <span className="ml-2 text-terminal-muted text-sm">
                  ({projects.length} active)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {projects.map(project => (
                  <motion.div
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={`p-3 border cursor-pointer transition-all duration-200 ${
                      selectedProject?.id === project.id
                        ? 'bg-terminal-hover border-terminal-text'
                        : 'bg-terminal-surface border-terminal-border hover:border-terminal-muted'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-terminal-text text-sm font-medium">{project.title}</h3>
                      {project.priority && project.priority > 7 && (
                        <div className="w-1 h-1 bg-terminal-text rounded-full opacity-60" />
                      )}
                    </div>
                    <p className="text-terminal-muted text-xs mb-2">{project.description}</p>
                    <div className="flex items-center justify-between text-xs text-terminal-muted">
                      <span>{project.project_type}</span>
                      <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Living Project Workspace */}
          {selectedProject && (
            <div>
              <h2 className="text-lg font-medium text-terminal-text mb-4">
                Project Workspace
                <span className="ml-2 text-terminal-muted text-sm">
                  Priority {selectedProject.priority}/10
                </span>
              </h2>
              {renderProjectBlocks()}
            </div>
          )}

          {/* No Projects State */}
          {projects.length === 0 && (
            <div className="bg-terminal-surface border border-terminal-border rounded-sm p-8 text-center">
              <h2 className="text-lg text-terminal-text mb-2">No Projects Yet</h2>
              <p className="text-terminal-muted text-sm mb-4">Create your first project to start collaborating</p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-terminal-text text-terminal-bg px-4 py-2 text-sm hover:bg-terminal-muted transition-colors"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}