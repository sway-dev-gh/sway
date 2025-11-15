# Sway Activity & Notification API - Complete Endpoints Summary

## Overview

This document provides a complete reference of all activity and notification-related API endpoints in the Sway backend.

---

## Notation

- ✓ = Implemented and working
- ❌ = Not yet implemented
- ⚠ = Partially implemented or has known issues
- R = Requires authentication (JWT token)

---

## API Endpoints by Module

### Activity API (`/api/activity`)
**Rate Limit**: 200 requests per 15 minutes  
**Authentication**: Required (R)  
**Base URL**: `/api/activity`

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/` | ✓ | Get activity feed with filters (type, action, resource_type, limit, offset, since, before) |
| POST | `/` | ✓ | Log a custom activity (action, resource_type, resource_id, target_user_id, metadata) |
| GET | `/recent` | ✓ | Get activity summary by type for last N hours (hours parameter) |
| GET | `/notifications` | ✓ | Get notification-worthy activities (since parameter) |
| GET | `/logs` | ❌ | Get raw activity logs for terminal display |
| GET | `/feed` | ❌ | Get formatted activity feed for UI display |

---

### Notifications API (`/api/notifications`)
**Rate Limit**: 200 requests per 15 minutes  
**Authentication**: Required (R)  
**Base URL**: `/api/notifications`

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| GET | `/` | ✓ | Get notifications with filters (page, limit, type, is_read, priority, start_date, end_date) |
| POST | `/` | ✓ | Create new notification (recipient_id, type, title, message, priority, action_url, metadata) |
| PUT | `/:id` | ✓ | Update notification (is_read, is_dismissed) |
| POST | `/mark-all-read` | ✓ | Mark all notifications as read |
| DELETE | `/:id` | ✓ | Delete a notification |
| GET | `/preferences` | ✓ | Get user's notification preferences |
| PUT | `/preferences` | ✓ | Update notification preferences (email_notifications, push_notifications, notification_types) |
| GET | `/stats` | ✓ | Get notification statistics |

---

## API Response Formats

### Activity Feed Response (GET /api/activity)
```json
{
  "success": true,
  "activities": [
    {
      "id": "uuid",
      "action": "project_created",
      "resource_type": "project",
      "resource_id": "uuid",
      "actor_name": "John Doe",
      "actor_email": "john@example.com",
      "actor_id": "uuid",
      "resource_title": "My Project",
      "resource_description": "Project description",
      "description": "John Doe created a new project",
      "is_my_action": true,
      "created_at": "2024-11-14T15:30:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": false,
    "total_shown": 5
  },
  "stats": {
    "today_activities": 3,
    "week_activities": 15,
    "review_activities": 4,
    "collaboration_activities": 2,
    "project_activities": 9
  }
}
```

### Notifications Response (GET /api/notifications)
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "review_assigned",
      "title": "Review Assigned",
      "message": "You have a new code review",
      "priority": "high",
      "is_read": false,
      "is_dismissed": false,
      "action_url": "/reviews/abc123",
      "created_at": "2024-11-14T15:30:00Z",
      "updated_at": "2024-11-14T15:30:00Z",
      "sender_email": "alice@example.com",
      "sender_first_name": "Alice",
      "sender_last_name": "Johnson"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "pages": 3
  },
  "unread_count": 5
}
```

### Notification Stats Response (GET /api/notifications/stats)
```json
{
  "success": true,
  "stats": {
    "total_notifications": 150,
    "unread_count": 5,
    "dismissed_count": 30,
    "high_priority_count": 8,
    "urgent_count": 2,
    "last_24h_count": 10,
    "last_week_count": 35
  },
  "type_breakdown": [
    {
      "type": "review_assigned",
      "count": 25
    },
    {
      "type": "comment_added",
      "count": 18
    }
  ]
}
```

---

## Supported Activity Actions

### Project Activities
- `project_created` - New project created
- `project_shared` - Project shared with others
- `project_updated` - Project settings modified
- `project_completed` - Project marked complete

### Collaboration Activities
- `collaboration_created` - Collaboration session started
- `collaboration_invited` - User invited to collaboration
- `collaboration_accepted` - Collaboration invitation accepted
- `collaboration_ended` - Collaboration ended
- `collaboration_updated` - Collaboration permissions changed

### Review Activities
- `review_assigned` - Review assigned to someone
- `review_received` - User assigned to review
- `review_started` - Review work started
- `review_approved` - Review approved
- `review_rejected` - Review rejected
- `review_changes_requested` - Changes requested
- `review_updated` - Review modified

### File Activities
- `file_uploaded` - File uploaded
- `file_request_created` - File request created
- `file_request_fulfilled` - File request fulfilled

### Team Activities
- `team_invitation_sent` - Team invitation sent
- `team_invitation_accepted` - Team invitation accepted
- `team_member_removed` - Team member removed

### Comment Activities
- `review_comment_added` - Comment added on review
- `comment_reply` - Reply to comment

### Edit Request Activities
- `edit_request_created` - Edit request created
- `edit_request_approved` - Edit request approved
- `edit_request_denied` - Edit request denied
- `edit_started` - Edit work started
- `edit_completed` - Edit work completed

---

## Supported Notification Types

- `review_assigned` - Assigned to review
- `review_completed` - Review finished
- `comment_added` - Comment on resource
- `file_uploaded` - New file shared
- `project_shared` - Project shared
- `collaboration_invite` - Team invitation
- `system_alert` - System notification
- `reminder` - Reminder notification

---

## Query Parameters Guide

### Activity Endpoints

#### GET /api/activity
- `type` - Filter type: 'all' (default), 'my_activity', 'team_activity'
- `action` - Filter by specific action type
- `resource_type` - Filter by resource type
- `limit` - Results per page (default: 50, max: 200)
- `offset` - Pagination offset (default: 0)
- `since` - Get activities after this date (ISO format)
- `before` - Get activities before this date (ISO format)

#### GET /api/activity/recent
- `hours` - Time window in hours (default: 24)

#### GET /api/activity/notifications
- `since` - Get notifications after this date (ISO format)

### Notification Endpoints

#### GET /api/notifications
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)
- `type` - Filter by notification type
- `is_read` - Filter by read status (true/false)
- `priority` - Filter by priority (low, medium, high, urgent)
- `start_date` - Filter from date (ISO format)
- `end_date` - Filter to date (ISO format)
- `include_dismissed` - Include dismissed notifications (false by default)

#### GET /api/notifications/preferences
- No parameters

#### PUT /api/notifications/preferences
Request body:
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "notification_types": {
    "review_assigned": true,
    "review_completed": true,
    "comment_added": true,
    "file_uploaded": true,
    "project_shared": true,
    "collaboration_invite": true,
    "system_alert": true,
    "reminder": true
  }
}
```

---

## Priority Levels

Available for notifications:
- `low` - Low priority (green)
- `medium` - Medium priority (blue, default)
- `high` - High priority (orange)
- `urgent` - Urgent (red)

---

## Error Handling

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional context (development mode only)"
}
```

Common error codes:
- `400` - Bad request / validation error
- `401` - Unauthorized / missing authentication
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Server error

---

## Authentication

All activity and notification endpoints require authentication via JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Tokens are obtained from the `/api/auth` endpoints.

---

## Rate Limiting

Both modules use intelligent rate limiting:
- **Window**: 15 minutes
- **Limit**: 200 requests per window
- **Response Header**: `X-RateLimit-Remaining`

When rate limited, endpoints return `429 Too Many Requests`.

---

## Database Integration

The APIs interact with these database tables:
- `activity_log` - Core activity tracking table
- `notifications` - User notifications storage
- `users` - User information
- `projects` - Project details
- `reviews` - Review information
- `collaborations` - Collaboration sessions
- `file_requests` - File request tracking
- `uploads` - File uploads tracking

---

## Frontend Integration Examples

### Using NotificationCenter Component
```typescript
import NotificationCenter from '@/components/NotificationCenter'

export default function Layout() {
  return (
    <div>
      {/* Renders notification bell with full UI */}
      <NotificationCenter />
    </div>
  )
}
```

### Using RightTerminal Component
```typescript
import RightTerminal from '@/components/RightTerminal'

export default function Workspace() {
  return (
    <div className="flex">
      <main>{/* Main content */}</main>
      {/* Shows Activity, Logs, and Notifications tabs */}
      <RightTerminal />
    </div>
  )
}
```

### Manual API Calls
```typescript
import { apiRequest } from '@/lib/auth'

// Get activity feed
const { activities, stats } = await (
  await apiRequest('/api/activity?type=team_activity&limit=50')
).json()

// Get notifications
const { notifications, unread_count } = await (
  await apiRequest('/api/notifications?page=1')
).json()

// Mark notification as read
await apiRequest(`/api/notifications/${notificationId}`, {
  method: 'PUT',
  body: JSON.stringify({ is_read: true })
})
```

---

## Implementation Status

- Database tables: 100% complete
- Notifications API: 100% complete
- Activity API: 67% complete (4/6 endpoints)
- Frontend components: 100% complete (with fallback to mock data)

To achieve 100% completion, implement:
1. GET `/api/activity/logs`
2. GET `/api/activity/feed`

---

## Additional Resources

- See `ACTIVITY_API_ANALYSIS.md` for detailed infrastructure analysis
- See `ACTIVITY_API_IMPLEMENTATION_GUIDE.md` for code templates and implementation steps
- See `/backend/src/routes/activity.js` for existing route implementations
- See `/backend/src/routes/notifications.js` for notification route implementations

