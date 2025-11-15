# Activity API Implementation Guide - Quick Reference

## Current State vs Required State

### What Exists Now
```
Backend Routes:
├── /api/activity              [Main route - EXISTS]
│   ├── GET /                  [Activity feed with filters]
│   ├── POST /                 [Log activity]
│   ├── GET /recent            [Summary by type]
│   └── GET /notifications     [Notification-worthy activities]
│
├── /api/notifications         [Complete API - ALL IMPLEMENTED]
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   ├── POST /mark-all-read
│   ├── DELETE /:id
│   ├── GET /preferences
│   ├── PUT /preferences
│   └── GET /stats

Frontend:
├── /components/RightTerminal.tsx
│   ├── Logs Tab               [Calls /api/activity/logs - NEEDS IMPL]
│   ├── Activity Tab           [Calls /api/activity/feed - NEEDS IMPL]
│   └── Notifications Tab      [Calls /api/notifications - WORKS]
```

---

## What Needs to Be Added

### Two New Sub-Routes in activity.js

#### Route 1: GET /api/activity/logs

**Location**: `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`

**Code Template**:
```javascript
// =====================================================
// GET /api/activity/logs - Get raw activity logs
// =====================================================
router.get('/logs', authenticateToken, activityLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { limit = 50, offset = 0, since, action, resource_type } = req.query

    let query = `
      SELECT
        a.id,
        a.created_at as timestamp,
        a.action,
        a.resource_type,
        a.metadata,
        actor.name as actor_name,
        -- Determine log type based on action
        CASE 
          WHEN a.action LIKE '%error%' OR a.action LIKE '%rejected%' THEN 'error'
          WHEN a.action LIKE '%approved%' OR a.action LIKE '%completed%' THEN 'success'
          WHEN a.action LIKE '%pending%' OR a.action LIKE '%waiting%' THEN 'warning'
          ELSE 'info'
        END as log_type
      FROM activity_log a
      LEFT JOIN users actor ON a.actor_id = actor.id
      WHERE (
        a.user_id = $1 OR
        a.actor_id = $1 OR
        a.target_user_id = $1 OR
        EXISTS (
          SELECT 1 FROM collaborations c
          WHERE c.id::text = a.resource_id
          AND (c.owner_id = $1 OR c.collaborator_id = $1)
        ) OR
        EXISTS (
          SELECT 1 FROM projects p
          WHERE p.id::text = a.resource_id AND p.user_id = $1
        ) OR
        EXISTS (
          SELECT 1 FROM reviews r
          WHERE r.id::text = a.resource_id
          AND (r.reviewer_id = $1 OR r.assigned_by_id = $1)
        )
      )
    `

    const params = [userId]
    let paramIndex = 2

    // Optional filters
    if (since) {
      query += ` AND a.created_at >= $${paramIndex}`
      params.push(since)
      paramIndex++
    }

    if (action) {
      query += ` AND a.action = $${paramIndex}`
      params.push(action)
      paramIndex++
    }

    if (resource_type) {
      query += ` AND a.resource_type = $${paramIndex}`
      params.push(resource_type)
      paramIndex++
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(parseInt(limit), parseInt(offset))

    const result = await pool.query(query, params)

    // Format for terminal display
    const logs = result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      type: row.log_type,
      message: getActivityDescription(row.action, row.metadata, row.actor_name || 'System'),
      user: row.actor_name,
      action: row.action,
      details: row.metadata ? JSON.stringify(row.metadata) : ''
    }))

    res.json({
      success: true,
      logs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: logs.length === parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Get activity logs error:', error)
    res.status(500).json({
      error: 'Failed to fetch activity logs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})
```

---

#### Route 2: GET /api/activity/feed

**Location**: `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`

**Code Template**:
```javascript
// =====================================================
// GET /api/activity/feed - Get formatted activity feed
// =====================================================
router.get('/feed', authenticateToken, activityLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { limit = 50, offset = 0, type = 'all' } = req.query

    // Base query with resource information
    let baseQuery = `
      SELECT
        a.id,
        a.created_at as timestamp,
        a.action,
        a.resource_type,
        a.actor_id,
        actor.name as actor_name,
        
        -- Get resource title based on type
        CASE
          WHEN a.resource_type = 'project' THEN p.title
          WHEN a.resource_type = 'review' THEN r.title
          WHEN a.resource_type = 'file_request' THEN fr.title
          WHEN a.resource_type = 'collaboration' THEN COALESCE(p2.title, 'Collaboration')
          ELSE 'Activity'
        END as resource_title,
        
        -- Determine UI type
        CASE
          WHEN a.resource_type = 'project' THEN 'project'
          WHEN a.resource_type IN ('review', 'review_comment') THEN 'review'
          WHEN a.resource_type IN ('upload', 'file_request') THEN 'file'
          WHEN a.resource_type IN ('collaboration', 'team_invitation') THEN 'team'
          ELSE 'project'
        END as activity_type
        
      FROM activity_log a
      LEFT JOIN users actor ON a.actor_id = actor.id
      LEFT JOIN projects p ON a.resource_type = 'project' AND a.resource_id = p.id::text
      LEFT JOIN reviews r ON a.resource_type = 'review' AND a.resource_id = r.id::text
      LEFT JOIN file_requests fr ON a.resource_type = 'file_request' AND a.resource_id = fr.id::text
      LEFT JOIN collaborations c ON a.resource_type = 'collaboration' AND a.resource_id = c.id::text
      LEFT JOIN projects p2 ON c.project_id = p2.id
    `

    const conditions = []
    const params = []
    let paramIndex = 1

    // Type filtering
    if (type === 'my_activity') {
      conditions.push(`a.actor_id = $${paramIndex}`)
      params.push(userId)
      paramIndex++
    } else if (type === 'team_activity') {
      conditions.push(`(
        a.user_id = $${paramIndex} OR
        a.target_user_id = $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM collaborations co
          WHERE co.id::text = a.resource_id
          AND (co.owner_id = $${paramIndex} OR co.collaborator_id = $${paramIndex})
        ) OR
        EXISTS (
          SELECT 1 FROM projects pr
          WHERE pr.id::text = a.resource_id AND pr.user_id = $${paramIndex}
        ) OR
        EXISTS (
          SELECT 1 FROM reviews rv
          WHERE rv.id::text = a.resource_id
          AND (rv.reviewer_id = $${paramIndex} OR rv.assigned_by_id = $${paramIndex})
        )
      )`)
      params.push(userId, userId, userId, userId, userId, userId)
      paramIndex += 6
    } else {
      // 'all' - default
      conditions.push(`(
        a.user_id = $${paramIndex} OR
        a.actor_id = $${paramIndex} OR
        a.target_user_id = $${paramIndex} OR
        EXISTS (
          SELECT 1 FROM collaborations co
          WHERE co.id::text = a.resource_id
          AND (co.owner_id = $${paramIndex} OR co.collaborator_id = $${paramIndex})
        ) OR
        EXISTS (
          SELECT 1 FROM projects pr
          WHERE pr.id::text = a.resource_id AND pr.user_id = $${paramIndex}
        ) OR
        EXISTS (
          SELECT 1 FROM reviews rv
          WHERE rv.id::text = a.resource_id
          AND (rv.reviewer_id = $${paramIndex} OR rv.assigned_by_id = $${paramIndex})
        )
      )`)
      params.push(userId, userId, userId, userId, userId, userId, userId, userId)
      paramIndex += 8
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const finalQuery = `
      ${baseQuery}
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(parseInt(limit), parseInt(offset))

    const result = await pool.query(finalQuery, params)

    // Format for feed display
    const activities = result.rows.map(row => ({
      id: row.id,
      user: row.actor_name || 'Unknown User',
      action: row.action.replace(/_/g, ' '),
      resource: row.resource_title,
      timestamp: row.timestamp,
      type: row.activity_type
    }))

    res.json({
      success: true,
      activities,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: activities.length === parseInt(limit)
      }
    })

  } catch (error) {
    console.error('Get activity feed error:', error)
    res.status(500).json({
      error: 'Failed to fetch activity feed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})
```

---

## Implementation Checklist

- [ ] Open `/Users/wjc2007/Desktop/sway/backend/src/routes/activity.js`
- [ ] Find the section starting with `// =====================================================`
- [ ] Add Route 1 (GET /logs) after the existing `/recent` endpoint
- [ ] Add Route 2 (GET /feed) after the new `/logs` endpoint
- [ ] Test with curl or Postman:
  ```bash
  # Test logs endpoint
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    "http://localhost:5001/api/activity/logs"
  
  # Test feed endpoint
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    "http://localhost:5001/api/activity/feed"
  ```
- [ ] Verify RightTerminal component receives data
- [ ] Check browser console for any errors

---

## Expected Responses After Implementation

### /api/activity/logs Response
```json
{
  "success": true,
  "logs": [
    {
      "id": "uuid",
      "timestamp": "2024-11-14T15:30:00Z",
      "type": "success",
      "message": "Alice Johnson created a new project",
      "user": "Alice Johnson",
      "action": "project_created",
      "details": "{\"title\": \"Design System\"}"
    },
    {
      "id": "uuid",
      "timestamp": "2024-11-14T15:25:00Z",
      "type": "info",
      "message": "Bob Smith assigned review to reviewer@example.com",
      "user": "Bob Smith",
      "action": "review_assigned",
      "details": "{\"reviewer_email\": \"reviewer@example.com\"}"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

### /api/activity/feed Response
```json
{
  "success": true,
  "activities": [
    {
      "id": "uuid",
      "user": "Alice Johnson",
      "action": "created",
      "resource": "Design System",
      "timestamp": "2024-11-14T15:30:00Z",
      "type": "project"
    },
    {
      "id": "uuid",
      "user": "Bob Smith",
      "action": "assigned",
      "resource": "Code Review",
      "timestamp": "2024-11-14T15:25:00Z",
      "type": "review"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

---

## Notes

1. Both endpoints automatically use `authenticateToken` middleware
2. Rate limiting (200 requests/15 min) applied automatically
3. No database changes needed - uses existing `activity_log` table
4. RightTerminal component will automatically work once these routes exist
5. Mock data fallback in RightTerminal will be replaced with real data

---

## Verification

After implementation, RightTerminal will show:
- **Logs Tab**: Real terminal-style activity logs
- **Activity Tab**: Human-readable activity feed
- **Notifications Tab**: Real notifications (already working)

All three tabs will display live data from the backend instead of mock data.
