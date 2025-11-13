'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import notificationService from '../../services/notificationService'

// Individual Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onClose }) => {
  const icon = notificationService.getNotificationIcon(notification.action)
  const color = notificationService.getNotificationColor(notification.action)
  const time = notificationService.formatNotificationTime(notification.created_at)
  const priority = notificationService.getNotificationPriority(notification.action)

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead([notification.id])
    }
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={handleClick}
      className={`
        p-3 border-b border-terminal-border cursor-pointer hover:bg-terminal-accent transition-colors
        ${!notification.read ? 'bg-terminal-surface' : ''}
        ${priority === 'high' ? 'border-l-2 border-l-red-500' : ''}
        ${priority === 'medium' ? 'border-l-2 border-l-yellow-500' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm
          ${color}
        `}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`text-sm ${!notification.read ? 'text-terminal-text font-medium' : 'text-terminal-muted'}`}>
              {notification.description || `${notification.actor_name} performed ${notification.action}`}
            </p>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            )}
          </div>

          {notification.resource_title && (
            <p className="text-xs text-terminal-muted mt-1">
              in <span className="text-terminal-text">{notification.resource_title}</span>
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-terminal-muted">{time}</span>
            {notification.local && (
              <span className="text-xs text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded">
                Local
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Notification Bell Component
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe((data) => {
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    })

    // Start polling for notifications
    notificationService.startPolling(30000) // 30 seconds

    // Request browser notification permission
    notificationService.requestNotificationPermission()

    return () => {
      unsubscribe()
      notificationService.stopPolling()
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = async () => {
    if (!isOpen) {
      setLoading(true)
      try {
        await notificationService.getNotifications()
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }
    setIsOpen(!isOpen)
  }

  const handleMarkAllRead = () => {
    notificationService.markAsRead()
  }

  const handleMarkRead = (notificationIds) => {
    notificationService.markAsRead(notificationIds)
  }

  const handleClearAll = () => {
    notificationService.clearAll()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-terminal-muted hover:text-terminal-text transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-5-5h5l-5-5m-6 10v1a3 3 0 01-6 0v-1m6-4V9a3 3 0 116 0v3.5"
          />
        </svg>

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-96 bg-terminal-bg border border-terminal-border rounded-lg shadow-lg z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-terminal-border">
              <div className="flex items-center justify-between">
                <h3 className="text-terminal-text font-medium">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-terminal-muted hover:text-terminal-text"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-xs text-terminal-muted hover:text-red-400"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-terminal-muted">
                  Loading notifications...
                </div>
              ) : notifications.length > 0 ? (
                <AnimatePresence>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div className="p-8 text-center text-terminal-muted">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">
                    You'll see activity updates here
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-terminal-border">
                <button className="w-full text-center text-xs text-terminal-muted hover:text-terminal-text">
                  View all activity
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell