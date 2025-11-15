'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Terminal, Activity, FileText, Clock, User, GitBranch, FileIcon, Upload } from 'lucide-react'
import { apiRequest } from '@/lib/auth'

interface TerminalLog {
  id: string
  timestamp: string
  type: 'info' | 'error' | 'success' | 'warning'
  message: string
  user?: string
  action?: string
  details?: string
}

interface ActivityItem {
  id: string
  user: string
  action: string
  resource: string
  timestamp: string
  type: 'project' | 'file' | 'review' | 'team'
}

interface NotificationItem {
  id: string
  title: string
  message: string
  timestamp: string
  read: boolean
  type: 'info' | 'success' | 'warning' | 'error'
}

export default function RightTerminal() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'activity' | 'output'>('logs')
  const [logs, setLogs] = useState<TerminalLog[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Data fetching effects
  useEffect(() => {
    loadActivityData()
    // Refresh data every 30 seconds
    const interval = setInterval(loadActivityData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadActivityData = async () => {
    try {
      await Promise.all([
        fetchLogs(),
        fetchActivity(),
        fetchNotifications()
      ])
      setError('')
    } catch (err) {
      console.error('Failed to load activity data:', err)
      setError('Failed to load activity data')
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await apiRequest('/api/activity/logs')
      if (response?.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        throw new Error('Failed to fetch logs')
      }
    } catch (error) {
      console.log('Failed to fetch logs:', error)
      setLogs([])
    }
  }

  const fetchActivity = async () => {
    try {
      const response = await apiRequest('/api/activity/feed')
      if (response?.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      } else {
        throw new Error('Failed to fetch activity')
      }
    } catch (error) {
      console.log('Failed to fetch activity:', error)
      setActivities([])
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await apiRequest('/api/notifications')
      if (response?.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        throw new Error('Failed to fetch notifications')
      }
    } catch (error) {
      console.log('Failed to fetch notifications:', error)
      setNotifications([])
    }
  }

  const generateMockLogs = () => {
    const mockLogs: TerminalLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'success',
        message: 'Project "Design System" created successfully',
        user: 'current-user',
        action: 'CREATE_PROJECT'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'info',
        message: 'File uploaded: components/Button.tsx',
        user: 'teammate',
        action: 'FILE_UPLOAD'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'warning',
        message: 'Review pending for main.css changes',
        user: 'reviewer',
        action: 'REVIEW_PENDING'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'success',
        message: 'Team member invited: alice@company.com',
        user: 'admin',
        action: 'TEAM_INVITE'
      }
    ]
    setLogs(mockLogs)
  }

  const generateMockActivity = () => {
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        user: 'You',
        action: 'created',
        resource: 'Design System project',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'project'
      },
      {
        id: '2',
        user: 'Alice Johnson',
        action: 'uploaded',
        resource: 'Button.tsx',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'file'
      },
      {
        id: '3',
        user: 'Bob Smith',
        action: 'requested review for',
        resource: 'main.css',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'review'
      },
      {
        id: '4',
        user: 'You',
        action: 'invited',
        resource: 'charlie@company.com to team',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        type: 'team'
      }
    ]
    setActivities(mockActivity)
  }

  const generateMockNotifications = () => {
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        title: 'Review Complete',
        message: 'Your changes to Button.tsx have been approved',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        read: false,
        type: 'success'
      },
      {
        id: '2',
        title: 'New Team Member',
        message: 'Alice Johnson joined your project team',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        read: false,
        type: 'info'
      },
      {
        id: '3',
        title: 'Storage Warning',
        message: 'Project storage is 85% full',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: true,
        type: 'warning'
      }
    ]
    setNotifications(mockNotifications)
  }

  const loadMockData = () => {
    generateMockLogs()
    generateMockActivity()
    generateMockNotifications()
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project': return <GitBranch size={12} />
      case 'file': return <FileIcon size={12} />
      case 'review': return <Activity size={12} />
      case 'team': return <User size={12} />
      default: return <Clock size={12} />
    }
  }

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'warning': return 'text-yellow-400'
      default: return 'text-terminal-text'
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-400'
      case 'error': return 'border-red-400'
      case 'warning': return 'border-yellow-400'
      default: return 'border-terminal-border'
    }
  }

  const tabs = [
    { key: 'logs', label: 'Recent', icon: Clock },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'output', label: 'Notifications', icon: FileText },
  ]

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 64 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col bg-terminal-surface border-l border-terminal-border h-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-terminal-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <span className="text-sm text-terminal-text font-medium">
                Activity
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-terminal-muted hover:text-terminal-text transition-colors p-1"
        >
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Tabs */}
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex border-b border-terminal-border"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-2 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                  activeTab === tab.key
                    ? 'bg-terminal-accent text-terminal-text border-b border-terminal-text'
                    : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <tab.icon size={12} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full p-2"
            >
              {activeTab === 'logs' && (
                <div className="space-y-3">
                  <div className="text-sm text-terminal-text mb-3 border-b border-terminal-border pb-2">
                    Recent Activity
                  </div>
                  <div className="space-y-2 max-h-full overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-4">
                        <p className="text-terminal-muted text-xs">Loading...</p>
                      </div>
                    ) : logs.length > 0 ? (
                      logs.map((log) => (
                        <div key={log.id} className="border-l-2 border-terminal-border pl-2 py-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${getLogTypeColor(log.type)}`}>
                              {log.message}
                            </span>
                          </div>
                          <div className="text-xs text-terminal-muted mt-0.5">
                            {formatRelativeTime(log.timestamp)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-terminal-muted text-sm">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-3">
                  <div className="text-sm text-terminal-text mb-3 border-b border-terminal-border pb-2">
                    Activity Feed
                  </div>
                  <div className="space-y-2 max-h-full overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-4">
                        <p className="text-terminal-muted text-xs">Loading...</p>
                      </div>
                    ) : activities.length > 0 ? (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-2 py-1">
                          <div className="mt-1 text-terminal-muted">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-terminal-text">
                              <span className="font-medium">{activity.user}</span>{' '}
                              {activity.action}{' '}
                              <span className="text-terminal-muted">{activity.resource}</span>
                            </div>
                            <div className="text-xs text-terminal-muted">
                              {formatRelativeTime(activity.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-terminal-muted text-sm">No activity yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'output' && (
                <div className="space-y-3">
                  <div className="text-sm text-terminal-text mb-3 border-b border-terminal-border pb-2">
                    Notifications
                  </div>
                  <div className="space-y-2 max-h-full overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-4">
                        <p className="text-terminal-muted text-xs">Loading...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className={`border-l-2 ${getNotificationTypeColor(notification.type)} pl-2 py-1 ${!notification.read ? 'bg-terminal-hover/30' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-terminal-text">
                              {notification.title}
                            </span>
                            {!notification.read && (
                              <span className="w-1.5 h-1.5 bg-terminal-text rounded-full"></span>
                            )}
                          </div>
                          <div className="text-xs text-terminal-muted mt-0.5">
                            {notification.message}
                          </div>
                          <div className="text-xs text-terminal-muted mt-1">
                            {formatRelativeTime(notification.timestamp)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-terminal-muted text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed state */}
        {collapsed && (
          <div className="flex flex-col items-center py-4 space-y-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`p-2 rounded transition-colors relative ${
                  activeTab === tab.key
                    ? 'bg-terminal-accent text-terminal-text'
                    : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover'
                }`}
                title={tab.label}
              >
                <tab.icon size={16} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-terminal-border p-2">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs font-mono text-terminal-muted text-center"
            >
              SYSTEM ONLINE
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}