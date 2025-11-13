/**
 * Notification Service
 * Handles all notification-related API operations and management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class NotificationService {
  constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.unreadCount = 0;
    this.pollInterval = null;
    this.isPolling = false;
  }

  // Helper method for making authenticated requests
  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get notifications from the backend
  async getNotifications(since = null) {
    try {
      const query = since ? `?since=${since}` : '';
      const response = await this.makeRequest(`/activity/notifications${query}`);

      if (response.success) {
        this.notifications = response.notifications || [];
        this.unreadCount = response.unread_count || 0;
        this.notifyListeners();
        return response;
      }
      return { notifications: [], unread_count: 0 };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], unread_count: 0 };
    }
  }

  // Get full activity feed
  async getActivityFeed(options = {}) {
    try {
      const {
        type = 'all',
        limit = 20,
        offset = 0,
        since,
        before
      } = options;

      const params = new URLSearchParams({
        type,
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (since) params.append('since', since);
      if (before) params.append('before', before);

      return await this.makeRequest(`/activity?${params.toString()}`);
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  }

  // Mark notifications as read (client-side for now)
  markAsRead(notificationIds = []) {
    if (notificationIds.length === 0) {
      // Mark all as read
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
      this.unreadCount = 0;
    } else {
      // Mark specific notifications as read
      this.notifications = this.notifications.map(n =>
        notificationIds.includes(n.id) ? { ...n, read: true } : n
      );
      this.unreadCount = Math.max(0, this.unreadCount - notificationIds.length);
    }
    this.notifyListeners();
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyListeners();
  }

  // Start polling for new notifications
  startPolling(intervalMs = 30000) {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollInterval = setInterval(() => {
      this.getNotifications();
    }, intervalMs);

    // Initial load
    this.getNotifications();
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  // Add listener for notification updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener({
        notifications: this.notifications,
        unreadCount: this.unreadCount
      });
    });
  }

  // Get notification icon based on activity type
  getNotificationIcon(action) {
    const iconMap = {
      // Project activities
      'project_created': '🆕',
      'project_shared': '📤',
      'project_updated': '📝',
      'project_completed': '✅',

      // Collaboration activities
      'collaboration_created': '🤝',
      'collaboration_invited': '💌',
      'collaboration_accepted': '✓',
      'collaboration_ended': '👋',

      // Review activities
      'review_assigned': '👁️',
      'review_approved': '✅',
      'review_rejected': '❌',
      'review_changes_requested': '🔄',

      // Team activities
      'team_invitation_sent': '📨',
      'team_invitation_accepted': '🎉',
      'team_member_removed': '➖',

      // Comment activities
      'review_comment_added': '💬',
      'comment_reply': '↩️',

      // File activities
      'file_uploaded': '📁',
      'file_request_created': '📋',

      // Edit activities
      'edit_request_created': '✏️',
      'edit_request_approved': '✅',
      'edit_started': '⚡',

      // Default
      'default': '📢'
    };

    return iconMap[action] || iconMap.default;
  }

  // Get notification color based on activity type
  getNotificationColor(action) {
    const colorMap = {
      // Positive actions
      'project_completed': 'text-green-400 bg-green-900/20',
      'review_approved': 'text-green-400 bg-green-900/20',
      'collaboration_accepted': 'text-green-400 bg-green-900/20',
      'team_invitation_accepted': 'text-green-400 bg-green-900/20',

      // Warning actions
      'review_changes_requested': 'text-yellow-400 bg-yellow-900/20',
      'review_rejected': 'text-yellow-400 bg-yellow-900/20',

      // Negative actions
      'collaboration_ended': 'text-red-400 bg-red-900/20',
      'team_member_removed': 'text-red-400 bg-red-900/20',

      // Neutral/info actions
      'default': 'text-blue-400 bg-blue-900/20'
    };

    return colorMap[action] || colorMap.default;
  }

  // Format notification time
  formatNotificationTime(timestamp) {
    if (!timestamp) return 'Unknown';

    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return time.toLocaleDateString();
  }

  // Get notification priority
  getNotificationPriority(action) {
    const highPriority = [
      'review_assigned',
      'collaboration_invited',
      'team_invitation_sent',
      'edit_request_created',
      'review_changes_requested'
    ];

    const mediumPriority = [
      'review_approved',
      'collaboration_accepted',
      'team_invitation_accepted',
      'comment_reply',
      'review_comment_added'
    ];

    if (highPriority.includes(action)) return 'high';
    if (mediumPriority.includes(action)) return 'medium';
    return 'low';
  }

  // Create a local notification (for immediate feedback)
  createLocalNotification(type, title, message, metadata = {}) {
    const notification = {
      id: `local_${Date.now()}`,
      action: type,
      description: message,
      actor_name: 'You',
      created_at: new Date().toISOString(),
      resource_title: title,
      metadata,
      read: false,
      local: true // Mark as local notification
    };

    this.notifications.unshift(notification);
    this.unreadCount += 1;
    this.notifyListeners();

    // Auto-remove local notifications after 5 seconds
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyListeners();
    }, 5000);
  }

  // Browser notification support
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return 'not-supported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Show browser notification
  showBrowserNotification(title, body, icon = null, onClick = null) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'swayfiles-notification'
      });

      if (onClick) {
        notification.onclick = onClick;
      }

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();

export default notificationService;