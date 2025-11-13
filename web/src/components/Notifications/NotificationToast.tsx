'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import notificationService from '../../services/notificationService'

// Individual Toast Component
const Toast = ({ notification, onDismiss }) => {
  const icon = notificationService.getNotificationIcon(notification.action)
  const color = notificationService.getNotificationColor(notification.action)
  const priority = notificationService.getNotificationPriority(notification.action)

  useEffect(() => {
    // Auto-dismiss after delay based on priority
    const delay = priority === 'high' ? 8000 : priority === 'medium' ? 5000 : 3000
    const timer = setTimeout(() => {
      onDismiss(notification.id)
    }, delay)

    return () => clearTimeout(timer)
  }, [notification.id, priority, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95, transition: { duration: 0.2 } }}
      className={`
        relative bg-terminal-surface border border-terminal-border rounded-lg p-4 mb-3 min-w-80 max-w-96 shadow-lg
        ${priority === 'high' ? 'border-l-4 border-l-red-500' : ''}
        ${priority === 'medium' ? 'border-l-4 border-l-yellow-500' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0
          ${color}
        `}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-terminal-text font-medium">
                {notification.description}
              </p>
              {notification.resource_title && (
                <p className="text-xs text-terminal-muted mt-1">
                  in <span className="text-terminal-text">{notification.resource_title}</span>
                </p>
              )}
            </div>

            <button
              onClick={() => onDismiss(notification.id)}
              className="text-terminal-muted hover:text-terminal-text ml-3 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-terminal-muted">
              {notificationService.formatNotificationTime(notification.created_at)}
            </span>
            {notification.local && (
              <span className="text-xs text-yellow-400">Local</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-terminal-text rounded-b"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{
          duration: priority === 'high' ? 8 : priority === 'medium' ? 5 : 3,
          ease: 'linear'
        }}
      />
    </motion.div>
  )
}

// Toast Container Component
const NotificationToast = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((data) => {
      const newNotifications = data.notifications.filter(n =>
        !n.read &&
        !toasts.find(t => t.id === n.id) &&
        notificationService.getNotificationPriority(n.action) !== 'low' &&
        !n.local // Don't show local notifications as toasts since they're temporary
      )

      if (newNotifications.length > 0) {
        setToasts(prev => [...newNotifications.slice(0, 3), ...prev].slice(0, 5))

        // Show browser notification for high priority items
        newNotifications.forEach(notification => {
          if (notificationService.getNotificationPriority(notification.action) === 'high') {
            notificationService.showBrowserNotification(
              'SwayFiles Notification',
              notification.description,
              null,
              () => {
                // Focus window when notification is clicked
                window.focus()
                dismissToast(notification.id)
              }
            )
          }
        })
      }
    })

    return unsubscribe
  }, [toasts])

  const dismissToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))

    // Mark notification as read
    notificationService.markAsRead([toastId])
  }

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              notification={toast}
              onDismiss={dismissToast}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default NotificationToast