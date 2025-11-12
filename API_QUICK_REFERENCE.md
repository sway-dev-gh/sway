# SwayFiles API Quick Reference Guide

## Authentication

### Signup
- **Endpoint**: `POST /api/auth/signup`
- **Auth**: None (public)
- **Rate Limit**: 3 signups/hour/IP
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response**: `{ token: "jwt_token", user: { id, email, name, plan } }`
- **Validation**: Password 12+ chars, uppercase, lowercase, number, special char

### Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: None (public)
- **Rate Limit**: 10 attempts/15 min/IP
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response**: `{ token: "jwt_token", user: { id, email, name, plan } }`

### Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth**: JWT required
- **Response**: `{ success: true }`

---

## File Requests (Authenticated)

### Create Request
- **Endpoint**: `POST /api/requests`
- **Auth**: JWT required
- **Rate Limit**: Per plan (Free: 20 active max, Pro: unlimited)
- **Request Body**:
  ```json
  {
    "title": "Q4 Marketing Materials",
    "description": "Please submit your team's Q4 marketing updates",
    "type": "documents",
    "timeLimit": "7",
    "fields": ["name", "email"],
    "customFields": [
      { "name": "department", "type": "text" },
      { "name": "date", "type": "date" }
    ],
    "fieldRequirements": {
      "required": ["name", "email"],
      "minLength": { "description": 10 }
    },
    "password": "optional_password",
    "requireEmail": true,
    "requireName": true
  }
  ```
- **Response**: 
  ```json
  {
    "id": "uuid",
    "shortCode": "abc12345",
    "title": "Q4 Marketing Materials",
    "expiresAt": "2024-11-20T12:00:00Z",
    "createdAt": "2024-11-13T12:00:00Z"
  }
  ```

### List Requests
- **Endpoint**: `GET /api/requests`
- **Auth**: JWT required
- **Query Params**: `status`, `limit`, `offset`
- **Response**: 
  ```json
  {
    "requests": [
      {
        "id": "uuid",
        "shortCode": "abc12345",
        "title": "...",
        "status": "active",
        "uploadCount": 3,
        "lastUploadAt": "2024-11-13T10:00:00Z",
        "expiresAt": "2024-11-20T12:00:00Z",
        "createdAt": "2024-11-13T12:00:00Z"
      }
    ],
    "total": 5
  }
  ```

### Get Request Details
- **Endpoint**: `GET /api/requests/:id`
- **Auth**: JWT required
- **Response**: Request object with all uploads

### Update Request
- **Endpoint**: `PUT /api/requests/:id`
- **Auth**: JWT required
- **Request Body**: Partial update of request fields
- **Response**: Updated request object

### Delete Request
- **Endpoint**: `DELETE /api/requests/:id`
- **Auth**: JWT required
- **Response**: `{ success: true }`

---

## Public File Upload (Unauthenticated)

### Get Request Info
- **Endpoint**: `GET /api/r/:shortCode`
- **Auth**: None (public)
- **Rate Limit**: 30 requests/min/IP
- **Response**:
  ```json
  {
    "id": "uuid",
    "title": "Q4 Marketing Materials",
    "description": "...",
    "requestType": "documents",
    "isActive": true,
    "requireEmail": true,
    "requireName": true,
    "customFields": [
      { "name": "department", "type": "text" }
    ],
    "brandingData": {
      "logo": "url",
      "color": "#123456",
      "removeCompanyBranding": false
    }
  }
  ```

### Upload File
- **Endpoint**: `POST /api/r/:shortCode/upload`
- **Auth**: None (public)
- **Rate Limit**: 10 uploads/15 min/IP
- **Request**: multipart/form-data
  ```
  file: <binary file>
  uploader_name: "John Doe"
  uploader_email: "john@example.com"
  custom_field_data: '{"department": "Sales"}'
  password: "optional_password_if_request_protected"
  ```
- **File Limits**: 50MB max per file
- **Response**:
  ```json
  {
    "success": true,
    "uploadId": "uuid",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "uploadedAt": "2024-11-13T10:00:00Z"
  }
  ```

---

## File Management (Authenticated)

### List Files
- **Endpoint**: `GET /api/files`
- **Auth**: JWT required
- **Response**:
  ```json
  {
    "files": [
      {
        "id": "uuid",
        "fileName": "document.pdf",
        "fileSize": 1024000,
        "uploadedAt": "2024-11-13T10:00:00Z",
        "uploaderName": "John Doe",
        "uploaderEmail": "john@example.com",
        "requestTitle": "Q4 Materials",
        "requestCode": "abc12345"
      }
    ]
  }
  ```

### Download File
- **Endpoint**: `GET /api/files/:fileId`
- **Auth**: JWT required
- **Rate Limit**: 10 downloads/min/IP
- **Response**: File binary stream
- **Security**: 
  - Verifies user owns the request
  - Path traversal protection
  - File existence check

---

## Projects (Authenticated)

### List Projects
- **Endpoint**: `GET /api/projects`
- **Auth**: JWT required
- **Query Params**: `status`, `visibility`
- **Response**:
  ```json
  {
    "success": true,
    "projects": {
      "owned": [
        {
          "id": "uuid",
          "title": "Brand Redesign",
          "description": "...",
          "projectType": "review",
          "status": "active",
          "visibility": "private",
          "collaboratorCount": 3,
          "pendingReviews": 2,
          "fileCount": 5,
          "dueDate": "2024-12-31",
          "createdAt": "2024-11-01"
        }
      ],
      "collaborating": [...]
    },
    "stats": {
      "owned_projects": 5,
      "collaborating_projects": 3,
      "active_projects": 6,
      "completed_projects": 2,
      "total_projects": 8
    }
  }
  ```

### Create Project
- **Endpoint**: `POST /api/projects`
- **Auth**: JWT required
- **Request Body**:
  ```json
  {
    "title": "Brand Redesign",
    "description": "Annual brand refresh project",
    "project_type": "review",
    "visibility": "private",
    "due_date": "2024-12-31",
    "settings": {
      "require_approval": true,
      "email_notifications": true
    }
  }
  ```
- **Response**: Created project object

### Get Project Details
- **Endpoint**: `GET /api/projects/:projectId`
- **Auth**: JWT required
- **Response**: Project with collaborators, files, reviews

### Update Project
- **Endpoint**: `PUT /api/projects/:projectId`
- **Auth**: JWT required
- **Response**: Updated project object

### Delete Project
- **Endpoint**: `DELETE /api/projects/:projectId`
- **Auth**: JWT required
- **Response**: `{ success: true }`

---

## Collaborations (Authenticated)

### List Collaborations
- **Endpoint**: `GET /api/collaborations`
- **Auth**: JWT required
- **Query Params**: `status`, `role`, `type=all/owned/member`
- **Response**:
  ```json
  {
    "success": true,
    "collaborations": {
      "owned": [
        {
          "id": "uuid",
          "projectTitle": "Brand Redesign",
          "collaboratorName": "Jane Smith",
          "collaboratorEmail": "jane@example.com",
          "role": "reviewer",
          "status": "active",
          "permissions": {
            "can_view": true,
            "can_edit": false,
            "can_review": true,
            "can_invite": false,
            "can_manage": false
          },
          "invitedAt": "2024-11-01",
          "acceptedAt": "2024-11-02",
          "pendingReviews": 2
        }
      ],
      "member": [...]
    }
  }
  ```

### Invite Collaborator
- **Endpoint**: `POST /api/collaborations`
- **Auth**: JWT required
- **Request Body**:
  ```json
  {
    "project_id": "uuid",
    "email": "collaborator@example.com",
    "role": "reviewer",
    "permissions": {
      "can_view": true,
      "can_review": true
    }
  }
  ```
- **Response**: Created collaboration object with status='pending'

### Accept Collaboration Invite
- **Endpoint**: `PUT /api/collaborations/:collaborationId`
- **Auth**: JWT required
- **Request Body**:
  ```json
  {
    "status": "active"
  }
  ```
- **Response**: Updated collaboration object

### Remove Collaboration
- **Endpoint**: `DELETE /api/collaborations/:collaborationId`
- **Auth**: JWT required
- **Response**: `{ success: true }`

---

## Reviews (Authenticated)

### List Reviews
- **Endpoint**: `GET /api/reviews`
- **Auth**: JWT required
- **Response**:
  ```json
  {
    "success": true,
    "reviews": [
      {
        "id": "uuid",
        "projectId": "uuid",
        "title": "Design Review",
        "reviewerId": "uuid",
        "assignedById": "uuid",
        "status": "pending",
        "priority": "high",
        "feedback": "...",
        "rating": null,
        "dueDate": "2024-11-20",
        "createdAt": "2024-11-13"
      }
    ]
  }
  ```

### Create Review
- **Endpoint**: `POST /api/reviews`
- **Auth**: JWT required
- **Request Body**:
  ```json
  {
    "project_id": "uuid",
    "reviewer_id": "uuid",
    "title": "Design Review",
    "priority": "high",
    "due_date": "2024-11-20"
  }
  ```
- **Response**: Created review object

### Update Review
- **Endpoint**: `PUT /api/reviews/:reviewId`
- **Auth**: JWT required
- **Request Body**:
  ```json
  {
    "status": "approved",
    "feedback": "Looks great! Approved with minor changes needed.",
    "rating": 4
  }
  ```
- **Response**: Updated review object

### Add Review Comment
- **Endpoint**: `POST /api/reviews/:reviewId/comments`
- **Auth**: JWT required
- **Request Body**:
  ```json
  {
    "content": "The logo color needs to match brand guidelines",
    "comment_type": "suggestion",
    "parent_id": null
  }
  ```
- **Response**: Created comment object

### Get Review Comments
- **Endpoint**: `GET /api/reviews/:reviewId/comments`
- **Auth**: JWT required
- **Response**: Array of threaded comments

---

## Activity Log (Authenticated)

### List Activity
- **Endpoint**: `GET /api/activity`
- **Auth**: JWT required
- **Query Params**: `action`, `resource_type`, `limit`, `offset`, `date_from`, `date_to`
- **Response**:
  ```json
  {
    "activity": [
      {
        "id": "uuid",
        "action": "file_uploaded",
        "resourceType": "upload",
        "resourceId": "uuid",
        "actor": {
          "id": "uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "metadata": {
          "fileName": "document.pdf",
          "fileSize": 1024000
        },
        "createdAt": "2024-11-13T10:00:00Z"
      }
    ],
    "total": 42
  }
  ```

---

## Statistics & Analytics (Authenticated)

### Get User Stats
- **Endpoint**: `GET /api/stats`
- **Auth**: JWT required
- **Response**:
  ```json
  {
    "totalRequests": 5,
    "totalUploads": 23,
    "totalFileSize": 5242880,
    "averageResponseTime": "3.5 hours",
    "activeRequests": 2,
    "expiredRequests": 3,
    "completedRequests": 5
  }
  ```

### Get Analytics
- **Endpoint**: `GET /api/analytics`
- **Auth**: JWT required
- **Query Params**: `period` (day, week, month, year), `metric` (uploads, files, requests)
- **Response**:
  ```json
  {
    "period": "month",
    "metric": "uploads",
    "data": [
      {
        "date": "2024-11-01",
        "count": 5,
        "fileSize": 1048576
      },
      {
        "date": "2024-11-02",
        "count": 3,
        "fileSize": 524288
      }
    ]
  }
  ```

---

## Error Responses

### Format
```json
{
  "error": "Descriptive error message",
  "details": "Additional details (development only)",
  "code": "ERROR_CODE"
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing/invalid JWT)
- `403` - Forbidden (insufficient permissions or plan limit)
- `404` - Not found
- `429` - Too many requests (rate limited)
- `500` - Server error

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Common Request Headers

### All Authenticated Requests
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### CORS Origins (Allowed)
```
https://swayfiles.com
https://www.swayfiles.com
http://localhost:3001 (dev)
http://localhost:5173 (dev)
```

---

## Authentication Token

### JWT Token Structure
```javascript
{
  userId: "uuid",
  email: "user@example.com",
  iat: 1234567890,
  exp: 1237159690  // 30 days from issue
}
```

### How to Use
1. Receive token from login/signup response
2. Store token in localStorage or session
3. Include in all authenticated requests:
   ```
   Authorization: Bearer eyJhbGc...
   ```
4. Token expires after 30 days (re-login required)

---

## Plan Limits

### Free Plan
- Max active requests: 20
- File upload: 50MB per file
- Storage: 1GB total
- Rate limits: Standard per-endpoint limits

### Pro Plan
- Max active requests: Unlimited
- File upload: 50MB per file
- Custom branding: Enabled
- Custom domains: Enabled
- Team members: Up to 5 (Business plan)

### Business Plan
- All Pro features
- Up to 5 team members
- Advanced analytics
- Priority support

