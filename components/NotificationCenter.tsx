'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Bell, Check, X, Settings, Filter, Search, Clock, AlertCircle } from 'lucide-react'

interface Notification {
  id: string
  type: 'review_assigned' | 'review_completed' | 'comment_added' | 'file_uploaded' | 'project_shared' | 'collaboration_invite' | 'system_alert' | 'reminder'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_read: boolean
  is_dismissed: boolean
  action_url?: string
  metadata?: any
  created_at: string
  updated_at: string
  sender_email?: string
  sender_first_name?: string
  sender_last_name?: string
}

interface NotificationStats {
  total_notifications: number
  unread_count: number
  dismissed_count: number
  high_priority_count: number
  urgent_count: number
  last_24h_count: number
  last_week_count: number
}

interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  notification_types: {
    [key: string]: boolean
  }
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  // Filters and pagination
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    is_read: '',
    search: ''
  })
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.type && { type: filters.type }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.is_read && { is_read: filters.is_read })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setPagination(data.pagination || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stats`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch notification stats:', err)
    }
  }, [])

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/preferences`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err)
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ is_read: true })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        )
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        )
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ is_dismissed: true })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notif => notif.id !== notificationId)
        )
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notif => notif.id !== notificationId)
        )
        await fetchStats()
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(newPreferences)
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (err) {
      console.error('Failed to update preferences:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    if (isOpen) {
      fetchStats()
      fetchPreferences()
    }
  }, [isOpen, fetchStats, fetchPreferences])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_assigned':
      case 'review_completed':
        return 'REV'
      case 'comment_added':
        return 'MSG'
      case 'file_uploaded':
        return 'FILE'
      case 'project_shared':
        return 'SHARE'
      case 'collaboration_invite':
        return 'TEAM'
      case 'system_alert':
        return 'ALERT'
      case 'reminder':
        return 'TIME'
      default:
        return 'INFO'
    }
  }

  const getPriorityColor = (priority: string) => {
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
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
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 text-terminal-muted hover:text-terminal-text transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {stats && stats.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
            {stats.unread_count > 99 ? '99+' : stats.unread_count}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {stats && stats.unread_count > 0 && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  {stats.unread_count} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={!stats || stats.unread_count === 0}
              >
                Mark all read
              </button>
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>{stats.total_notifications} total</span>
                <span>{stats.last_24h_count} in last 24h</span>
              </div>
            </div>
          )}

          {/* Preferences Panel */}
          {showPreferences && preferences && (
            <div className="border-b border-gray-100 p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Preferences</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={(e) => updatePreferences({ email_notifications: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.push_notifications}
                    onChange={(e) => updatePreferences({ push_notifications: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Push notifications</span>
                </label>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex space-x-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All types</option>
                <option value="review_assigned">Reviews</option>
                <option value="comment_added">Comments</option>
                <option value="file_uploaded">Files</option>
                <option value="project_shared">Projects</option>
                <option value="collaboration_invite">Invites</option>
                <option value="system_alert">Alerts</option>
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filters.is_read}
                onChange={(e) => setFilters(prev => ({ ...prev, is_read: e.target.value }))}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="false">Unread</option>
                <option value="true">Read</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="p-4 text-center text-red-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No notifications found</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-xs font-mono text-terminal-muted bg-terminal-bg px-2 py-1 rounded">{getNotificationIcon(notification.type)}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.sender_first_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                From: {notification.sender_first_name} {notification.sender_last_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimeAgo(notification.created_at)}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="text-xs text-gray-500 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Action URL */}
                        {notification.action_url && (
                          <div className="mt-2">
                            <a
                              href={notification.action_url}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              View details →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={page === pagination.pages}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationCenter