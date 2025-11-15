# Activity & Notification API Endpoints - Comprehensive Analysis
## RightTerminal Component Integration Guide

---

## EXECUTIVE SUMMARY

The Sway backend already has **comprehensive activity and notification infrastructure** in place. The RightTerminal component is currently trying to fetch from three endpoints:

1. `/api/activity/logs` - **NOT YET IMPLEMENTED**
2. `/api/activity/feed` - **NOT YET IMPLEMENTED**  
3. `/api/notifications` - **FULLY IMPLEMENTED**

You can use the existing `/api/activity` and `/api/notifications` endpoints as building blocks, but need to add the `/logs` and `/feed` sub-routes to the activity router.

---

## PART 1: EXISTING INFRASTRUCTURE

### A. Database Tables (Already Created)

#### 1. `activity_log` Table (Migration 014)
**Location**: `/Users/wjc2007/Desktop/sway/backend/migrations/014_collaboration_features.sql`

```sql
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields**:
- `action`: Type of activity (e.g., 'project_created', 'review_completed')
- `resource_type`: What was affected (project, review, collaboration, file_request)
- `metadata`: JSON object storing action-specific data
- `actor_id`: Who performed the action
- `target_user_id`: Who was affected by the action

**Indexes Created**:
- `idx_activity_log_user_id` - For querying user's activities
- `idx_activity_log_actor_id` - For querying who did what
- `idx_activity_log_action` - For filtering by action type
- `idx_activity_log_resource_type` - For filtering by resource
- `idx_activity_log_created_at` - For ordering by time

---

#### 2. `notifications` Table (Migration 009)
**Location**: `/Users/wjc2007/Desktop/sway/backend/migrations/009_notifications.sql`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID REFERENCES users(id),
    sender_id UUID REFERENCES users(id),
    type VARCHAR(50),
    title VARCHAR(200),
    message VARCHAR(1000),
    priority VARCHAR(20),
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Supported Notification Types**:
- `review_assigned` - When user is assigned a review
- `review_completed` - When a review is finished
- `comment_added` - When someone comments
- `file_uploaded` - New file in project
- `project_shared` - Project shared with user
- `collaboration_invite` - Team invitation
- `system_alert` - System-level notifications
- `reminder` - Reminder notifications

---

### B. Existing API Routes

#### 1. Activity Routes
**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`
**Base Path**: `/api/activity`

**Existing Endpoints**:

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| GET | `/` | Get activity feed (all, my_activity, team_activity) | ✓ EXISTS |
| POST | `/` | Log custom activity | ✓ EXISTS |
| GET | `/recent` | Get recent activity summary by type | ✓ EXISTS |
| GET | `/notifications` | Get notification-worthy activities | ✓ EXISTS |
| **GET** | **/logs** | Get raw activity logs | ❌ NEEDS IMPLEMENTATION |
| **GET** | **/feed** | Get formatted activity feed | ❌ NEEDS IMPLEMENTATION |

---

#### 2. Notifications Routes
**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/notifications.js`
**Base Path**: `/api/notifications`

**All Endpoints** (Fully Implemented):

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Get user's notifications with filtering |
| POST | `/` | Create new notification |
| PUT | `/:id` | Update notification (read/dismissed) |
| POST | `/mark-all-read` | Mark all as read |
| DELETE | `/:id` | Delete notification |
| GET | `/preferences` | Get notification preferences |
| PUT | `/preferences` | Update preferences |
| GET | `/stats` | Get notification statistics |

---

### C. Frontend Components Already Integrated

#### 1. NotificationCenter Component
**File**: `/Users/wjc2007/Desktop/sway/components/NotificationCenter.tsx`

**Features**:
- Shows unread notification badge
- Filters by type, priority, read status
- Pagination support
- Notification preferences UI
- Mark as read / dismiss functionality
- Statistics (total, unread, high priority, etc.)

**API Calls**:
```typescript
GET  /api/notifications                    // Fetch notifications
PUT  /api/notifications/:id                // Mark as read/dismissed
POST /api/notifications/mark-all-read      // Bulk action
DELETE /api/notifications/:id              // Delete
GET  /api/notifications/preferences        // Get preferences
PUT  /api/notifications/preferences        // Update preferences
GET  /api/notifications/stats              // Get stats
```

---

#### 2. RightTerminal Component (Partially Implemented)
**File**: `/Users/wjc2007/Desktop/sway/components/RightTerminal.tsx`

**Current State**:
- Has UI for 3 tabs: Logs, Activity, Notifications
- Tries to fetch from three endpoints
- Has mock data fallback
- Uses real API calls but with incorrect endpoints

**Missing Endpoints**:
```typescript
// Lines 72, 87 - These endpoints don't exist yet:
const response = await apiRequest('/api/activity/logs')      // ❌ NOT IMPLEMENTED
const response = await apiRequest('/api/activity/feed')      // ❌ NOT IMPLEMENTED
const response = await apiRequest('/api/notifications')      // ✓ WORKS
```

---

#### 3. ActivityLog Component (Prompting)
**File**: `/Users/wjc2007/Desktop/sway/components/prompting/ActivityLog.tsx`

**Purpose**: Shows activity log for prompting workflows
**Status**: Uses mock data (API integration commented out)

---

## PART 2: WHAT NEEDS TO BE IMPLEMENTED

### Missing Sub-Routes in `/api/activity`

#### 1. GET `/api/activity/logs` (NEW)

**Purpose**: Return raw activity logs for terminal display

**Query Parameters**:
- `limit` (default: 50) - Max records to return
- `offset` (default: 0) - Pagination offset
- `since` (ISO timestamp) - Get activities since this time
- `action` - Filter by specific action type
- `resource_type` - Filter by resource type (project, review, etc.)
- `user_id` - Filter by specific user (optional)

**Response Format**:
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "timestamp": "ISO datetime",
      "type": "info|error|success|warning",
      "message": "Human-readable description",
      "user": "User name or ID",
      "action": "ACTION_TYPE",
      "details": "Additional context"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Implementation Notes**:
- Should use the existing `activity_log` table
- Convert database records to terminal-friendly format
- Type mapping: `action` field determines the icon/color in terminal

---

#### 2. GET `/api/activity/feed` (NEW)

**Purpose**: Return formatted activity feed items

**Query Parameters**:
- `limit` (default: 50) - Max records
- `offset` (default: 0) - Pagination
- `type` (default: 'all') - 'all', 'my_activity', 'team_activity'
- `resource_type` - Filter by resource type
- `start_date`, `end_date` - Date range filtering

**Response Format**:
```json
{
  "success": true,
  "activities": [
    {
      "id": "uuid",
      "user": "John Doe",
      "action": "created|updated|uploaded|etc",
      "resource": "Resource name/title",
      "timestamp": "ISO datetime",
      "type": "project|file|review|team"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Implementation Notes**:
- Human-readable formatting for display
- Join with users table to get names
- Join with resource tables (projects, reviews, files) for titles
- Format timestamps as relative times in frontend

---

## PART 3: DATABASE QUERY REFERENCES

### Activity Types Already Supported
From the codebase, these action types are documented:

**Project Activities**:
- `project_created` - New project
- `project_shared` - Project shared with others
- `project_updated` - Project settings changed
- `project_completed` - Marked as complete

**Collaboration Activities**:
- `collaboration_created` - Collaboration started
- `collaboration_invited` - User invited
- `collaboration_accepted` - Invitation accepted
- `collaboration_ended` - Collaboration ended
- `collaboration_updated` - Permissions changed

**Review Activities**:
- `review_assigned` - Review assigned to someone
- `review_received` - User was assigned review
- `review_started` - Review work begun
- `review_approved` - Review approved
- `review_rejected` - Review rejected
- `review_changes_requested` - Changes needed
- `review_updated` - Review modified

**File Activities**:
- `file_uploaded` - File added
- `file_request_created` - Request for files
- `file_request_fulfilled` - Request fulfilled

**Comment Activities**:
- `review_comment_added` - Comment on review
- `comment_reply` - Reply to comment

**Edit Request Activities**:
- `edit_request_created` - Edit request made
- `edit_request_approved` - Edit allowed
- `edit_request_denied` - Edit rejected
- `edit_started` - Edit work begun
- `edit_completed` - Edit finished

**Team Activities**:
- `team_invitation_sent` - Team invite sent
- `team_invitation_accepted` - Invite accepted
- `team_member_removed` - Member removed

---

## PART 4: RECOMMENDED IMPLEMENTATION APPROACH

### Step 1: Add `/logs` Sub-Route
```javascript
// In /Users/wjc2007/Desktop/sway/backend/src/routes/activity.js

router.get('/logs', authenticateToken, activityLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { limit = 50, offset = 0, since, action, resource_type } = req.query

    // Build dynamic query with filters
    // Query activity_log table
    // Format response as terminal logs
    // Include: id, timestamp, type (derived from action), message, user, action, details
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' })
  }
})
```

### Step 2: Add `/feed` Sub-Route
```javascript
// In /Users/wjc2007/Desktop/sway/backend/src/routes/activity.js

router.get('/feed', authenticateToken, activityLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { limit = 50, offset = 0, type = 'all' } = req.query

    // Query activity_log with joins to get human-readable names
    // Join users table for actor names
    // Join resource tables (projects, reviews, etc.) for titles
    // Format response as activity items
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity feed' })
  }
})
```

### Step 3: Test with RightTerminal
The RightTerminal component will automatically work once these endpoints are available.

---

## PART 5: EXISTING HELPER FUNCTION

The activity route already has this helper that RightTerminal can leverage:

```javascript
const getActivityDescription = (action, metadata, actorName) => {
  const descriptions = {
    'project_created': `${actorName} created a new project`,
    'review_assigned': `${actorName} assigned review to ${metadata.reviewer_email}`,
    'file_uploaded': `${actorName} uploaded file ${metadata.file_name}`,
    // ... 40+ more descriptions
  }
  return descriptions[action] || `${actorName} performed ${action.replace(/_/g, ' ')}`
}
```

This can be used to generate human-readable messages for both `/logs` and `/feed` endpoints.

---

## PART 6: AUTHENTICATION & AUTHORIZATION

Both endpoints use `authenticateToken` middleware:
- **Authentication**: JWT token required in Authorization header
- **Authorization**: Only user's own activities can be retrieved
- **Rate Limiting**: 200 requests per 15 minutes (intelligent rate limiter)

---

## PART 7: FILE LOCATIONS SUMMARY

| File | Purpose | Status |
|------|---------|--------|
| `/backend/src/routes/activity.js` | Activity API endpoints | Partial |
| `/backend/src/routes/notifications.js` | Notification API endpoints | Complete |
| `/backend/migrations/014_collaboration_features.sql` | activity_log table | Complete |
| `/backend/migrations/009_notifications.sql` | notifications table | Complete |
| `/components/RightTerminal.tsx` | Terminal UI for activities | Partial |
| `/components/NotificationCenter.tsx` | Notification UI | Complete |

---

## PART 8: QUICK START FOR RightTerminal

1. **For Notifications Tab** - Already working:
   ```javascript
   const response = await apiRequest('/api/notifications')
   ```

2. **For Activity Tab** - Use existing endpoint:
   ```javascript
   const response = await apiRequest('/api/activity')
   // Parameters: type='team_activity', limit=50, offset=0
   ```

3. **For Logs Tab** - Need to implement:
   ```javascript
   // This will work after implementing /api/activity/logs
   const response = await apiRequest('/api/activity/logs')
   ```

---

## PART 9: DATABASE SCHEMA CONTEXT

The activity tracking integrates with these existing tables:
- `users` - Actor and target user info
- `projects` - Resource info
- `reviews` - Resource info
- `collaborations` - Resource info
- `file_requests` - Resource info
- `uploads` - File tracking
- `notifications` - User notifications

All relationships are maintained via UUIDs with cascading deletes for data integrity.

---

## CONCLUSION

**You have 90% of the infrastructure in place:**
- Database tables: ✓
- Notification API: ✓ (100% complete)
- Activity API: Partial (2 endpoints needed)
- Frontend components: ✓ (with fallback to mock data)

**To complete RightTerminal integration:**
1. Implement `/api/activity/logs` endpoint
2. Implement `/api/activity/feed` endpoint
3. No database changes needed
4. No frontend changes needed
5. Existing rate limiting and auth applies automatically

