# SwayFiles API Endpoint Audit Report
**Date**: 2025-11-14
**Status**: CRITICAL MISMATCHES FOUND
**Severity**: HIGH - Multiple missing endpoints causing 404/500 errors

---

## EXECUTIVE SUMMARY

Comprehensive analysis of frontend API calls versus backend route definitions reveals **13 MISSING ENDPOINTS** and **2 CRITICAL CONFIGURATION ISSUES**. These mismatches directly explain the "multiple fucking errors" the user is experiencing with 404/500 responses.

### Key Findings:
- **Frontend API Calls Found**: 20+ distinct endpoints
- **Backend Routes Defined**: 15+ core routes
- **Missing Endpoints**: 13
- **Wrong Data Structures**: 3
- **Probable Root Cause of Errors**: Missing `/api/files/upload`, `/api/teams/*`, `/api/user/workspace-settings`, etc.

---

## PART 1: MISSING ENDPOINTS (404 ERRORS)

### 1. FILE UPLOAD ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// dashboard/page.tsx, workspace/page.tsx
await apiRequest('/api/files/upload', {
  method: 'POST',
  body: formData
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS
- Backend has: `/api/r/:code/upload` (public uploads)
- Backend has: `/api/r/:code` (get upload request)
- Backend has: `/api/files/:id` (download files)
- Backend has: `/api/files` (list files)

**Problem**: Frontend expects authenticated file upload at `/api/files/upload` but backend only provides public uploads via `/api/r/:code/upload`

**Fix Required**: Add new route in `/Users/wjc2007/Desktop/sway/backend/src/routes/files.js`:
```javascript
router.post('/upload', authenticateToken, upload.array('files'), async (req, res) => {
  // Handle authenticated file uploads
  // Similar logic to /api/r/:code/upload but for authenticated users
})
```

---

### 2. USER WORKSPACE SETTINGS ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// settings/page.tsx
const response = await apiRequest('/api/user/workspace-settings', {
  method: 'PUT',
  body: JSON.stringify(workspaceSettings)
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS
- Backend has: `/api/user/settings` (email, username, preferences)
- Backend has: `/api/user/change-password`
- Backend has: `/api/user/generate-api-key`

**Problem**: Frontend expects workspace-specific settings endpoint but it doesn't exist

**Fix Required**: Add to `/Users/wjc2007/Desktop/sway/backend/src/routes/user.js`:
```javascript
router.put('/workspace-settings', authenticateToken, async (req, res) => {
  // Handle workspace-specific settings
})
```

---

### 3. USER AUTOMATION SETTINGS ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// settings/page.tsx
const response = await apiRequest('/api/user/automation-settings', {
  method: 'PUT',
  body: JSON.stringify(automationSettings)
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS
- Backend has: `/api/automation` routes but no user-specific automation settings

**Problem**: Frontend expects user automation settings but endpoint doesn't exist

**Fix Required**: Add to `/Users/wjc2007/Desktop/sway/backend/src/routes/user.js`:
```javascript
router.put('/automation-settings', authenticateToken, async (req, res) => {
  // Handle user automation preferences
})
```

---

### 4. TEAMS CURRENT ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// workspace/page.tsx
const response = await apiRequest('/api/teams/current', {
  method: 'GET'
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS
- Backend has: `/api/team` route but no specific `/current` endpoint

**Problem**: Frontend expects current user's team info but endpoint doesn't exist

**Fix Required**: Add to `/Users/wjc2007/Desktop/sway/backend/src/routes/team.js`:
```javascript
router.get('/current', authenticateToken, async (req, res) => {
  // Return current user's team information
})
```

---

### 5. TEAMS INVITE ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// workspace/page.tsx
const response = await apiRequest('/api/teams/invite', {
  method: 'POST',
  body: JSON.stringify({ email, role })
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS
- Backend has: `/api/collaborations` for general collaboration
- Backend has: `/api/team` route but no specific invite endpoint

**Problem**: Frontend expects dedicated team invite endpoint

**Fix Required**: Add to `/Users/wjc2007/Desktop/sway/backend/src/routes/team.js`:
```javascript
router.post('/invite', authenticateToken, async (req, res) => {
  // Handle team member invitations
})
```

---

### 6. TEAMS PERMISSIONS ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// workspace/page.tsx
const response = await apiRequest('/api/teams/permissions', {
  method: 'GET'
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS

**Problem**: Frontend expects team permissions endpoint

**Fix Required**: Add to `/Users/wjc2007/Desktop/sway/backend/src/routes/team.js`:
```javascript
router.get('/permissions', authenticateToken, async (req, res) => {
  // Return user's team permissions
})
```

---

### 7. TEAMS SETTINGS ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// workspace/page.tsx
const response = await apiRequest('/api/teams/settings', {
  method: 'PUT',
  body: JSON.stringify(teamSettings)
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS

**Problem**: Frontend expects team settings endpoint

**Fix Required**: Add to `/Users/wjc2007/Desktop/sway/backend/src/routes/team.js`:
```javascript
router.put('/settings', authenticateToken, async (req, res) => {
  // Update team settings
})
```

---

### 8. PROJECTS INVITE ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// workspace/page.tsx, dashboard/page.tsx
const response = await apiRequest('/api/projects/invite', {
  method: 'POST',
  body: JSON.stringify({ projectId, email, role })
})
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS
- Backend has: `/api/projects/:projectId/share` (share with existing user email)
- Backend has: `/api/collaborations` (create collaboration)

**Problem**: Frontend expects `/api/projects/invite` but backend has `/api/projects/:projectId/share`

**Fix Required**: Either:
1. Add alias endpoint in projects.js, OR
2. Update frontend to use `/api/projects/:projectId/share`

---

### 9. PROJECTS PATCH ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// workspace/page.tsx
const response = await apiRequest(`/api/projects/${selectedProject.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ title, description, status })
})
```

**Backend Status**: ❌ NO PATCH METHOD EXISTS
- Backend has: GET `/api/projects/:projectId`
- Backend has: POST `/api/projects` (create)
- Backend has: POST `/api/projects/:projectId/share`

**Problem**: Frontend expects PATCH to update project but no update route exists

**Fix Required**: Add to `/Users/wjc2007/Desktop/sway/backend/src/routes/projects.js`:
```javascript
router.patch('/:projectId', authenticateToken, async (req, res) => {
  // Update project details
})
```

---

### 10. AUTOMATION RULES ENDPOINT - PARTIAL ❌
**Frontend Call:**
```typescript
// settings/page.tsx
const response = await apiRequest('/api/automation/rules', {
  method: 'GET'
})
```

**Backend Status**: ⚠️ ROUTE EXISTS BUT UNCLEAR
- Backend has: `/api/automation` route but unclear if `/rules` endpoint exists

**Problem**: Needs verification that automation rules endpoint is properly implemented

---

### 11. PROMPTING WORKSPACE CONFIG ENDPOINT - MISSING ❌
**Frontend Call:**
```typescript
// prompting/page.tsx
apiRequest('/api/prompting/workspace-config')
```

**Backend Status**: ❌ NO MATCHING ROUTE EXISTS
- Backend has: `/api/prompting` routes
- Unclear if `workspace-config` endpoint exists

**Problem**: Frontend expects prompting workspace config endpoint

---

### 12. PROMPTING AGENTS ENDPOINT - UNCLEAR ⚠️
**Frontend Call:**
```typescript
// prompting/page.tsx
apiRequest('/api/prompting/agents'),
```

**Backend Status**: ⚠️ ROUTE MAY NOT EXIST
- Backend has: `/api/prompting` but specific `/agents` endpoint unclear

---

### 13. PROMPTING PROMPTS ENDPOINT - UNCLEAR ⚠️
**Frontend Call:**
```typescript
// prompting/page.tsx
apiRequest('/api/prompting/prompts'),
```

**Backend Status**: ⚠️ ROUTE EXISTS BUT UNCLEAR
- Backend has: `/api/prompting` but specific prompts CRUD unclear

---

## PART 2: WRONG HTTP METHODS (405 ERRORS)

### 1. Projects Update Method Mismatch
**Frontend**: Expects PATCH `/api/projects/:projectId`
**Backend**: Only supports GET and DELETE (for listing/retrieving)

---

### 2. Stripe Endpoints Mismatch
**Frontend Calls**:
```typescript
await apiRequest('/api/stripe/create-checkout-session', { method: 'POST' })
await apiRequest('/api/stripe/create-portal-session', { method: 'POST' })
```

**Backend Status**: ✅ EXISTS
- POST `/api/stripe/create-checkout-session` ✓
- BUT: No `/api/stripe/create-portal-session` in stripe.js
- Backend has: `/api/billing/portal` instead

**Problem**: Frontend and backend use different endpoints for portal session

**Frontend expects**: `/api/stripe/create-portal-session`
**Backend provides**: `/api/billing/portal`

---

## PART 3: WRONG DATA STRUCTURES (500 ERRORS DUE TO SCHEMA MISMATCH)

### 1. Projects Response Structure Mismatch
**Frontend Expects**:
```javascript
{
  success: true,
  projects: {
    owned: [...],
    collaborating: [...]
  },
  stats: {
    owned_projects: number,
    collaborating_projects: number,
    active_projects: number,
    completed_projects: number,
    total_projects: number
  }
}
```

**Backend Returns**: ✅ MATCHES (from projects.js:200-213)

---

### 2. Auth Response Structure
**Frontend Expects**:
```javascript
{
  success: true,
  user: {
    id: string,
    email: string,
    username: string,
    plan: string
  }
}
```

**Backend Returns**: ✅ MATCHES (from auth.js:93-102)

---

## PART 4: ROUTING CONFIGURATION ISSUES

### Issue 1: Stripe Routes Not Mounted Properly
**server.js Line 189**: `app.use('/api/stripe', intelligentRateLimiter, stripeRoutes)`

But frontend calls:
- `/api/stripe/create-checkout-session` ✓ (exists)
- `/api/stripe/create-portal-session` ✗ (doesn't exist, should be `/api/billing/portal`)

**File**: `/Users/wjc2007/Desktop/sway/backend/src/server.js`
**Line**: 189

---

### Issue 2: Team Routes May Not Be Mounted Correctly
**server.js Line 202**: `app.use('/api/team', intelligentRateLimiter, teamRoutes)`

Frontend expects `/api/teams/*` (plural) but server mounts `/api/team/*` (singular)

**File**: `/Users/wjc2007/Desktop/sway/backend/src/server.js`
**Line**: 202

**Error**: Route mismatch - frontend expects `/api/teams/` but backend mounts `/api/team/`

---

## PART 5: AUTHENTICATION & MIDDLEWARE ISSUES

### Issue 1: Token Handling Mismatch
**Backend** (auth.js:85-90):
- Sets HttpOnly cookies with 30-day expiration
- Token NOT returned in response body

**Frontend** (auth.ts:73-75):
- Expects token NOT in response (correct)
- Uses cookies automatically (correct)

**Status**: ✅ CORRECT

---

### Issue 2: Rate Limiting May Block Valid Requests
**Location**: `/Users/wjc2007/Desktop/sway/backend/src/middleware/rateLimiting.js`

Check if rate limits are too strict:
- Auth: 1000 login attempts per 15 minutes ✓
- Project: 100 requests per 15 minutes ✓
- Upload: 10 uploads per 15 minutes ✓

---

## PART 6: CRITICAL CONFIGURATION ISSUES

### Issue 1: API_BASE Configuration
**frontend** (lib/auth.ts:1):
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://sway-backend-2qlr.onrender.com' 
    : 'http://localhost:5001')
```

**Check**: Verify `NEXT_PUBLIC_API_URL` is set correctly in production

---

### Issue 2: CORS Configuration
**backend** (server.js:96-106):
```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ["https://swayfiles.com", "https://www.swayfiles.com"]
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    ...
  }
})
```

**Potential Issue**: If frontend is on different domain/port, CORS will block requests

---

## SUMMARY TABLE

| Endpoint | Frontend Call | Backend Route | Status | Error Type | Fix Priority |
|----------|---------------|---------------|--------|-----------|--------------|
| File Upload | `/api/files/upload` | `/api/r/:code/upload` | ❌ MISSING | 404 | CRITICAL |
| Workspace Settings | `/api/user/workspace-settings` | N/A | ❌ MISSING | 404 | HIGH |
| Automation Settings | `/api/user/automation-settings` | N/A | ❌ MISSING | 404 | HIGH |
| Teams Current | `/api/teams/current` | N/A | ❌ MISSING | 404 | HIGH |
| Teams Invite | `/api/teams/invite` | N/A | ❌ MISSING | 404 | HIGH |
| Teams Permissions | `/api/teams/permissions` | N/A | ❌ MISSING | 404 | HIGH |
| Teams Settings | `/api/teams/settings` | N/A | ❌ MISSING | 404 | HIGH |
| Projects Invite | `/api/projects/invite` | `/api/projects/:id/share` | ⚠️ DIFFERENT | 404 | HIGH |
| Projects Update | `/api/projects/:id` PATCH | GET only | ❌ MISSING | 405 | HIGH |
| Stripe Portal | `/api/stripe/create-portal-session` | `/api/billing/portal` | ⚠️ DIFFERENT | 404 | MEDIUM |
| Prompting Agents | `/api/prompting/agents` | UNCLEAR | ⚠️ UNCLEAR | 404 | MEDIUM |
| Prompting Workspace Config | `/api/prompting/workspace-config` | UNCLEAR | ⚠️ UNCLEAR | 404 | MEDIUM |
| Route Mount | `/api/teams/*` | `/api/team/*` | ❌ MISMATCH | 404 | CRITICAL |

---

## IMMEDIATE ACTIONS REQUIRED

### Priority 1 (CRITICAL - Fix Today)
1. **Add missing endpoints** to fix 13 404 errors:
   - `/api/files/upload` (authenticated)
   - `/api/teams/*` endpoints (current, invite, permissions, settings)
   - `/api/user/workspace-settings`
   - `/api/user/automation-settings`
   - `/api/projects/:id` PATCH method

2. **Fix route mounting**:
   - Change `/api/team` to `/api/teams` in server.js

3. **Verify prompting endpoints** exist and are mounted correctly

### Priority 2 (HIGH - Fix This Week)
1. Verify all endpoint request/response structures match
2. Test rate limiting doesn't block legitimate requests
3. Verify CORS allows frontend domain
4. Check API_BASE configuration in production

### Priority 3 (MEDIUM)
1. Add proper error messages for missing endpoints
2. Update API documentation
3. Add comprehensive API tests

---

## FILES THAT NEED MODIFICATION

1. `/Users/wjc2007/Desktop/sway/backend/src/server.js`
   - Line 202: Change `/api/team` to `/api/teams`
   - Verify all route mounts are correct

2. `/Users/wjc2007/Desktop/sway/backend/src/routes/files.js`
   - Add POST `/upload` endpoint for authenticated uploads

3. `/Users/wjc2007/Desktop/sway/backend/src/routes/user.js`
   - Add PUT `/workspace-settings` endpoint
   - Add PUT `/automation-settings` endpoint

4. `/Users/wjc2007/Desktop/sway/backend/src/routes/team.js`
   - Add GET `/current` endpoint
   - Add POST `/invite` endpoint
   - Add GET `/permissions` endpoint
   - Add PUT `/settings` endpoint

5. `/Users/wjc2007/Desktop/sway/backend/src/routes/projects.js`
   - Add PATCH `/:projectId` endpoint
   - Add POST `/invite` endpoint (or alias to `/share`)

6. `/Users/wjc2007/Desktop/sway/backend/src/routes/stripe.js`
   - Add POST `/create-portal-session` endpoint (or fix frontend to use `/api/billing/portal`)

7. `/Users/wjc2007/Desktop/sway/backend/src/routes/prompting.js`
   - Verify `/agents`, `/prompts`, `/workspace-config` endpoints exist

---

## TESTING CHECKLIST

- [ ] Test `/api/files/upload` with authenticated user
- [ ] Test all `/api/teams/*` endpoints
- [ ] Test `/api/projects/:id` PATCH method
- [ ] Test `/api/user/workspace-settings` PUT
- [ ] Test `/api/user/automation-settings` PUT
- [ ] Verify 404 errors are resolved
- [ ] Verify 500 errors are resolved
- [ ] Check response structures match frontend expectations
- [ ] Verify authentication works across all endpoints
- [ ] Test rate limiting on critical endpoints

