'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import {
  Activity, Users, FileText, MessageSquare, Clock, CheckCircle,
  AlertCircle, TrendingUp, Calendar, Bell, Settings, Search,
  Plus, Star, Archive, Share, Eye, GitBranch, Zap, Target
} from 'lucide-react'
import NotificationCenter from './NotificationCenter'

interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  pendingReviews: number
  totalCollaborators: number
  documentsCreated: number
  commentsThisWeek: number
  activityScore: number
}

interface RecentActivity {
  id: string
  type: 'review_assigned' | 'comment_added' | 'document_created' | 'project_shared' | 'file_uploaded'
  title: string
  description: string
  user: {
    name: string
    email: string
  }
  timestamp: Date
  projectId?: string
  projectTitle?: string
}

interface ActiveProject {
  id: string
  title: string
  description: string
  status: 'active' | 'review' | 'completed' | 'archived'
  progress: number
  collaborators: Array<{
    id: string
    name: string
    email: string
    avatar?: string
    status: 'online' | 'away' | 'offline'
  }>
  lastActivity: Date
  documentsCount: number
  reviewsCount: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

const WorkspaceDashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 4,
    pendingReviews: 15,
    totalCollaborators: 24,
    documentsCreated: 156,
    commentsThisWeek: 89,
    activityScore: 94
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'review_assigned',
      title: 'Review Assigned',
      description: 'New review assigned for Project Specification document',
      user: { name: 'Sarah Chen', email: 'sarah@example.com' },
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      projectTitle: 'SwayFiles Platform'
    },
    {
      id: '2',
      type: 'comment_added',
      title: 'New Comment',
      description: 'Comment added to "API Integration Guidelines"',
      user: { name: 'Alex Rivera', email: 'alex@example.com' },
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      projectTitle: 'Mobile App Development'
    },
    {
      id: '3',
      type: 'document_created',
      title: 'Document Created',
      description: 'Created "Sprint Planning Notes" document',
      user: { name: 'Jordan Kim', email: 'jordan@example.com' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      projectTitle: 'Team Collaboration'
    },
    {
      id: '4',
      type: 'project_shared',
      title: 'Project Shared',
      description: 'Shared "Design System" project with 3 new collaborators',
      user: { name: 'Morgan Taylor', email: 'morgan@example.com' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      projectTitle: 'Design System'
    }
  ])

  const [activeProjects, setActiveProjects] = useState<ActiveProject[]>([
    {
      id: 'proj-1',
      title: 'SwayFiles Platform',
      description: 'Building the next-generation collaborative workspace platform',
      status: 'active',
      progress: 78,
      collaborators: [
        { id: '1', name: 'Sarah Chen', email: 'sarah@example.com', status: 'online' },
        { id: '2', name: 'Alex Rivera', email: 'alex@example.com', status: 'online' },
        { id: '3', name: 'Jordan Kim', email: 'jordan@example.com', status: 'away' }
      ],
      lastActivity: new Date(Date.now() - 1000 * 60 * 30),
      documentsCount: 24,
      reviewsCount: 8,
      priority: 'high'
    },
    {
      id: 'proj-2',
      title: 'Mobile App Development',
      description: 'React Native mobile application for cross-platform deployment',
      status: 'review',
      progress: 65,
      collaborators: [
        { id: '4', name: 'Taylor Wong', email: 'taylor@example.com', status: 'online' },
        { id: '5', name: 'Casey Brown', email: 'casey@example.com', status: 'offline' }
      ],
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 2),
      documentsCount: 18,
      reviewsCount: 12,
      priority: 'medium'
    },
    {
      id: 'proj-3',
      title: 'Design System',
      description: 'Comprehensive design system and component library',
      status: 'active',
      progress: 45,
      collaborators: [
        { id: '6', name: 'Riley Davis', email: 'riley@example.com', status: 'online' },
        { id: '7', name: 'Avery Johnson', email: 'avery@example.com', status: 'away' }
      ],
      lastActivity: new Date(Date.now() - 1000 * 60 * 60 * 6),
      documentsCount: 31,
      reviewsCount: 5,
      priority: 'low'
    }
  ])

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week')

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'review_assigned':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-green-500" />
      case 'document_created':
        return <FileText className="w-4 h-4 text-purple-500" />
      case 'project_shared':
        return <Share className="w-4 h-4 text-orange-500" />
      case 'file_uploaded':
        return <Archive className="w-4 h-4 text-indigo-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: ActiveProject['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50'
      case 'review':
        return 'text-yellow-600 bg-yellow-50'
      case 'completed':
        return 'text-blue-600 bg-blue-50'
      case 'archived':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: ActiveProject['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50'
      case 'high':
        return 'text-orange-600 bg-orange-50'
      case 'medium':
        return 'text-blue-600 bg-blue-50'
      case 'low':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="workspace-dashboard h-screen bg-terminal-bg overflow-y-auto">
      {/* Header */}
      <div className="bg-terminal-surface border-b border-terminal-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-terminal-text">
              Welcome back, {user?.username || user?.email?.split('@')[0] || 'User'}! 👋
            </h1>
            <p className="text-terminal-muted mt-1">
              Here's what's happening in your workspace today
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-muted" />
              <input
                type="text"
                placeholder="Search projects, docs..."
                className="pl-10 pr-4 py-2 bg-terminal-bg border border-terminal-border text-terminal-text text-sm focus:outline-none focus:border-blue-500 w-64"
              />
            </div>
            <NotificationCenter />
            <button className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-terminal-surface border border-terminal-border p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-terminal-muted text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-terminal-text">{stats.activeProjects}</p>
                <p className="text-green-600 text-xs mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-terminal-surface border border-terminal-border p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-terminal-muted text-sm">Team Members</p>
                <p className="text-2xl font-bold text-terminal-text">{stats.totalCollaborators}</p>
                <p className="text-green-600 text-xs mt-1">
                  <Users className="w-3 h-3 inline mr-1" />
                  +3 new this week
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-terminal-surface border border-terminal-border p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-terminal-muted text-sm">Pending Reviews</p>
                <p className="text-2xl font-bold text-terminal-text">{stats.pendingReviews}</p>
                <p className="text-orange-600 text-xs mt-1">
                  <Clock className="w-3 h-3 inline mr-1" />
                  5 urgent reviews
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-terminal-surface border border-terminal-border p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-terminal-muted text-sm">Activity Score</p>
                <p className="text-2xl font-bold text-terminal-text">{stats.activityScore}%</p>
                <p className="text-purple-600 text-xs mt-1">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Very active team
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Projects */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-terminal-surface border border-terminal-border rounded-lg"
          >
            <div className="p-6 border-b border-terminal-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-terminal-text">Active Projects</h2>
                <button className="text-blue-600 hover:text-blue-800 text-sm">View all</button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {activeProjects.map(project => (
                <div
                  key={project.id}
                  className="border border-terminal-border rounded-lg p-4 hover:bg-terminal-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-terminal-text">{project.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                      <p className="text-sm text-terminal-muted mb-3">{project.description}</p>
                    </div>

                    <button className="text-terminal-muted hover:text-terminal-text">
                      <Star className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-xs text-terminal-muted">
                      <span className="flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        {project.documentsCount} docs
                      </span>
                      <span className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {project.reviewsCount} reviews
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(project.lastActivity)}
                      </span>
                    </div>

                    <div className="flex -space-x-1">
                      {project.collaborators.slice(0, 3).map(collaborator => (
                        <div
                          key={collaborator.id}
                          className="relative w-6 h-6 rounded-full bg-blue-500 border-2 border-terminal-surface flex items-center justify-center text-white text-xs"
                          title={collaborator.name}
                        >
                          {collaborator.name.charAt(0)}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${
                            collaborator.status === 'online' ? 'bg-green-500' :
                            collaborator.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                        </div>
                      ))}
                      {project.collaborators.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-terminal-surface flex items-center justify-center text-xs text-gray-600">
                          +{project.collaborators.length - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-terminal-muted">Progress</span>
                      <span className="text-terminal-text font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-terminal-surface border border-terminal-border rounded-lg"
          >
            <div className="p-6 border-b border-terminal-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-terminal-text">Recent Activity</h2>
                <div className="flex space-x-1">
                  {['today', 'week', 'month'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter as any)}
                      className={`px-3 py-1 text-xs rounded ${
                        timeFilter === filter
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-terminal-muted hover:text-terminal-text'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-terminal-text">
                      {activity.title}
                    </p>
                    <p className="text-xs text-terminal-muted mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center text-xs text-terminal-muted space-x-2">
                      <span>{activity.user.name}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                      {activity.projectTitle && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">{activity.projectTitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-terminal-surface border border-terminal-border rounded-lg p-6"
        >
          <h2 className="text-lg font-semibold text-terminal-text mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center">
              <Plus className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <span className="text-sm text-blue-600 font-medium">New Project</span>
            </button>

            <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center">
              <FileText className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <span className="text-sm text-green-600 font-medium">Create Document</span>
            </button>

            <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <span className="text-sm text-purple-600 font-medium">Invite Team</span>
            </button>

            <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center">
              <CheckCircle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <span className="text-sm text-orange-600 font-medium">Review Queue</span>
            </button>

            <button className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-center">
              <GitBranch className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <span className="text-sm text-indigo-600 font-medium">Version History</span>
            </button>

            <button className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-center">
              <Settings className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <span className="text-sm text-gray-600 font-medium">Settings</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default WorkspaceDashboard