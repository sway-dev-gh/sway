/**
 * React Hook for Notifications
 * Provides easy access to notification service functionality
 */

import { useState, useEffect } from 'react'
import notificationService from '../services/notificationService'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((data) => {
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    })

    // Initial load
    loadNotifications()

    return unsubscribe
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    setError(null)

    try {
      await notificationService.getNotifications()
    } catch (err) {
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = (notificationIds = []) => {
    notificationService.markAsRead(notificationIds)
  }

  const clearAll = () => {
    notificationService.clearAll()
  }

  const showNotification = (type, title, message, metadata = {}) => {
    notificationService.createLocalNotification(type, title, message, metadata)
  }

  const startPolling = (intervalMs = 30000) => {
    notificationService.startPolling(intervalMs)
  }

  const stopPolling = () => {
    notificationService.stopPolling()
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    clearAll,
    showNotification,
    startPolling,
    stopPolling
  }
}

export default useNotifications