# SwayFiles API Endpoint Implementation Guide
## Step-by-Step Fixes for Missing Endpoints

---

## FIX #1: CRITICAL - Change Route Mount from /api/team to /api/teams

**File**: `/Users/wjc2007/Desktop/sway/backend/src/server.js`
**Line**: 202

### Current Code:
```javascript
app.use('/api/team', intelligentRateLimiter, teamRoutes)
```

### Fixed Code:
```javascript
app.use('/api/teams', intelligentRateLimiter, teamRoutes)
```

**Reason**: Frontend calls `/api/teams/*` (plural) but backend mounts `/api/team/*` (singular)

---

## FIX #2: Add Missing File Upload Endpoint

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/files.js`
**Add at end of file (before module.exports)**:

```javascript
// POST /api/files/upload - Upload files for authenticated user
router.post('/upload', authenticateToken, uploadLimiter, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.userId
    const files = req.files

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required' })
    }

    // Validate file uploads
    for (const file of files) {
      const fileValidation = await validateFileUpload(file)
      if (!fileValidation.safe) {
        try {
          fs.unlinkSync(file.path)
        } catch (unlinkError) {
          console.error('[Security] Error deleting malicious file:', unlinkError)
        }

        console.error(`[Security] Blocked malicious upload: ${file.originalname}`, fileValidation.issues)
        return res.status(403).json({
          error: 'File upload blocked for security reasons',
          message: 'Your file was flagged by our security system.',
          details: fileValidation.issues[0],
          fileName: file.originalname
        })
      }
    }

    // Store file metadata for authenticated user
    const uploadRecords = await Promise.all(
      files.map(file => {
        return pool.query(
          `INSERT INTO uploads (uploader_name, uploader_email, file_name, file_size, storage_path)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [req.userEmail, req.userEmail, file.originalname, file.size, file.filename]
        )
      })
    )

    res.json({
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      files: uploadRecords.map(r => ({
        id: r.rows[0].id,
        fileName: files[0].originalname,
        fileSize: files[0].size
      }))
    })

  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload files' })
  }
})
```

---

## FIX #3: Add Missing User Settings Endpoints

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/user.js`
**Add at end of file (before module.exports)**:

```javascript
// PUT /api/user/workspace-settings - Update workspace settings
router.put('/workspace-settings', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { 
      default_project_type,
      workspace_name,
      workspace_description,
      auto_archive_days,
      notification_preferences,
      collaboration_settings
    } = req.body

    // Build dynamic update query
    const updates = []
    const params = []
    let paramCounter = 1

    if (default_project_type !== undefined) {
      updates.push(`preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{default_project_type}', '"${default_project_type}"')`)
    }

    if (workspace_name !== undefined) {
      updates.push(`preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{workspace_name}', $${paramCounter}::jsonb)`)
      params.push(JSON.stringify(workspace_name))
      paramCounter++
    }

    if (notification_preferences !== undefined) {
      updates.push(`preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{notification_preferences}', $${paramCounter}::jsonb)`)
      params.push(JSON.stringify(notification_preferences))
      paramCounter++
    }

    if (collaboration_settings !== undefined) {
      updates.push(`preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{collaboration_settings}', $${paramCounter}::jsonb)`)
      params.push(JSON.stringify(collaboration_settings))
      paramCounter++
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No settings to update' })
    }

    params.push(userId)
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCounter}
      RETURNING id, preferences
    `

    const result = await pool.query(updateQuery, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Workspace settings updated successfully',
      settings: result.rows[0].preferences
    })

  } catch (error) {
    console.error('Update workspace settings error:', error)
    res.status(500).json({ error: 'Failed to update workspace settings' })
  }
})

// PUT /api/user/automation-settings - Update automation preferences
router.put('/automation-settings', authenticateToken, userLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      auto_approve_enabled,
      auto_reject_enabled,
      auto_archive_enabled,
      notification_rules,
      workflow_automation
    } = req.body

    const automationSettings = {
      auto_approve_enabled: auto_approve_enabled !== undefined ? auto_approve_enabled : false,
      auto_reject_enabled: auto_reject_enabled !== undefined ? auto_reject_enabled : false,
      auto_archive_enabled: auto_archive_enabled !== undefined ? auto_archive_enabled : false,
      notification_rules: notification_rules || {},
      workflow_automation: workflow_automation || {}
    }

    const result = await pool.query(
      `UPDATE users 
       SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{automation}', $1::jsonb),
           updated_at = NOW()
       WHERE id = $2
       RETURNING preferences`,
      [JSON.stringify(automationSettings), userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Automation settings updated successfully',
      automation_settings: automationSettings
    })

  } catch (error) {
    console.error('Update automation settings error:', error)
    res.status(500).json({ error: 'Failed to update automation settings' })
  }
})
```

---

## FIX #4: Add Missing Team Endpoints

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/team.js`
**Add at end of file (before module.exports)**:

```javascript
// GET /api/teams/current - Get current user's team info
router.get('/current', authenticateToken, teamLimiter, async (req, res) => {
  try {
    const userId = req.userId

    // Get user info
    const userResult = await pool.query(
      'SELECT id, name, email, plan FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]

    // Get team members this user has collaborated with
    const teamMembersQuery = `
      SELECT DISTINCT
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT c.id) as collaboration_count,
        MAX(c.last_activity_at) as last_activity
      FROM collaborations c
      JOIN users u ON (
        (c.owner_id = u.id AND c.collaborator_id = $1) OR
        (c.collaborator_id = u.id AND c.owner_id = $1)
      )
      WHERE u.id != $1
      GROUP BY u.id, u.name, u.email
      ORDER BY last_activity DESC
    `

    const teamResult = await pool.query(teamMembersQuery, [userId])

    res.json({
      success: true,
      team: {
        owner: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan
        },
        members: teamResult.rows,
        total_members: teamResult.rows.length
      }
    })

  } catch (error) {
    console.error('Get current team error:', error)
    res.status(500).json({ error: 'Failed to fetch team information' })
  }
})

// POST /api/teams/invite - Invite user to team
router.post('/invite', authenticateToken, inviteLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { email, role = 'member', message } = req.body

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    // Check if user exists
    const userQuery = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email not found' })
    }

    const invitedUser = userQuery.rows[0]

    // Check if already collaborated
    const existingQuery = await pool.query(
      `SELECT id FROM collaborations 
       WHERE (owner_id = $1 AND collaborator_id = $2) OR
             (owner_id = $2 AND collaborator_id = $1)`,
      [userId, invitedUser.id]
    )

    if (existingQuery.rows.length > 0) {
      return res.status(400).json({ error: 'Already collaborating with this user' })
    }

    // Log the invitation activity
    await logActivity(userId, 'team_invitation_sent', 'team', userId, {
      invited_email: email,
      invited_user_id: invitedUser.id,
      role,
      message
    })

    await logActivity(invitedUser.id, 'team_invitation_received', 'team', userId, {
      invited_by_email: req.userEmail,
      inviter_id: userId,
      role,
      message
    })

    res.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invited_user: {
        id: invitedUser.id,
        name: invitedUser.name,
        email
      }
    })

  } catch (error) {
    console.error('Team invite error:', error)
    res.status(500).json({ error: 'Failed to send team invitation' })
  }
})

// GET /api/teams/permissions - Get user's team permissions
router.get('/permissions', authenticateToken, teamLimiter, async (req, res) => {
  try {
    const userId = req.userId

    // Get user's role and permissions across all teams
    const permissionsQuery = `
      SELECT DISTINCT
        c.project_id,
        c.role,
        c.permissions,
        p.title as project_title,
        p.user_id as project_owner_id
      FROM collaborations c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.collaborator_id = $1
      UNION
      SELECT DISTINCT
        p.id as project_id,
        'owner' as role,
        '{"can_view": true, "can_edit": true, "can_manage": true}'::jsonb as permissions,
        p.title as project_title,
        p.user_id as project_owner_id
      FROM projects p
      WHERE p.user_id = $1
    `

    const result = await pool.query(permissionsQuery, [userId])

    const permissions = result.rows.map(row => ({
      project_id: row.project_id,
      project_title: row.project_title,
      role: row.role,
      permissions: row.permissions,
      is_owner: row.project_owner_id === userId
    }))

    res.json({
      success: true,
      permissions,
      summary: {
        total_projects: permissions.length,
        owned_projects: permissions.filter(p => p.is_owner).length,
        collaborating_in: permissions.filter(p => !p.is_owner).length
      }
    })

  } catch (error) {
    console.error('Get team permissions error:', error)
    res.status(500).json({ error: 'Failed to fetch team permissions' })
  }
})

// PUT /api/teams/settings - Update team settings
router.put('/settings', authenticateToken, teamLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const {
      team_name,
      team_description,
      notification_level,
      collaboration_rules,
      default_role
    } = req.body

    // Store team settings in user preferences (team settings are user-scoped)
    const teamSettings = {
      team_name: team_name || '',
      team_description: team_description || '',
      notification_level: notification_level || 'all',
      collaboration_rules: collaboration_rules || {},
      default_role: default_role || 'member'
    }

    const result = await pool.query(
      `UPDATE users 
       SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{team_settings}', $1::jsonb),
           updated_at = NOW()
       WHERE id = $2
       RETURNING preferences`,
      [JSON.stringify(teamSettings), userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Team settings updated successfully',
      team_settings: teamSettings
    })

  } catch (error) {
    console.error('Update team settings error:', error)
    res.status(500).json({ error: 'Failed to update team settings' })
  }
})
```

---

## FIX #5: Add Missing Project Update and Invite Endpoints

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/projects.js`
**Add at end of file (before module.exports)**:

```javascript
// PATCH /api/projects/:projectId - Update project
router.patch('/:projectId', authenticateToken, projectLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const projectId = req.params.projectId
    const { title, description, status, visibility, settings } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID format' })
    }

    // Verify project ownership
    const projectQuery = await pool.query(
      'SELECT user_id FROM projects WHERE id = $1',
      [projectId]
    )

    if (projectQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (projectQuery.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own projects' })
    }

    // Build update query
    const updates = []
    const params = []
    let paramCounter = 1

    if (title !== undefined) {
      updates.push(`title = $${paramCounter}`)
      params.push(title.trim())
      paramCounter++
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCounter}`)
      params.push(description.trim())
      paramCounter++
    }

    if (status !== undefined) {
      if (!['active', 'completed', 'paused', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' })
      }
      updates.push(`status = $${paramCounter}`)
      params.push(status)
      paramCounter++
    }

    if (visibility !== undefined) {
      if (!['private', 'team', 'public'].includes(visibility)) {
        return res.status(400).json({ error: 'Invalid visibility' })
      }
      updates.push(`visibility = $${paramCounter}`)
      params.push(visibility)
      paramCounter++
    }

    if (settings !== undefined) {
      updates.push(`settings = $${paramCounter}`)
      params.push(JSON.stringify(settings))
      paramCounter++
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push(`updated_at = NOW()`)
    params.push(projectId)

    const updateQuery = `
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `

    const result = await pool.query(updateQuery, params)

    // Log activity
    await logActivity(userId, 'project_updated', 'project', projectId, {
      title: title || 'unchanged',
      status: status || 'unchanged',
      visibility: visibility || 'unchanged'
    })

    res.json({
      success: true,
      project: result.rows[0],
      message: 'Project updated successfully'
    })

  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// POST /api/projects/invite - Invite to project (alias for /projects/:id/share)
router.post('/invite', authenticateToken, projectLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { project_id, email, role = 'viewer', message } = req.body

    if (!project_id || !email) {
      return res.status(400).json({ error: 'Project ID and email are required' })
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    // Verify project ownership
    const projectQuery = await pool.query(
      'SELECT title FROM projects WHERE id = $1 AND user_id = $2',
      [project_id, userId]
    )

    if (projectQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or access denied' })
    }

    const project = projectQuery.rows[0]

    // Check if user exists
    const userQuery = await pool.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email.toLowerCase()]
    )

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email not found' })
    }

    const collaboratorUser = userQuery.rows[0]

    // Check if already shared
    const existingQuery = await pool.query(
      'SELECT id FROM collaborations WHERE project_id = $1 AND collaborator_id = $2',
      [project_id, collaboratorUser.id]
    )

    if (existingQuery.rows.length > 0) {
      return res.status(400).json({ error: 'Project already shared with this user' })
    }

    // Create collaboration
    const permissions = {
      viewer: { can_view: true, can_edit: false, can_review: false },
      editor: { can_view: true, can_edit: true, can_review: false },
      reviewer: { can_view: true, can_edit: false, can_review: true }
    }

    const insertQuery = `
      INSERT INTO collaborations (project_id, owner_id, collaborator_id, role, permissions, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id
    `

    const result = await pool.query(insertQuery, [
      project_id,
      userId,
      collaboratorUser.id,
      role,
      JSON.stringify(permissions[role])
    ])

    // Log activity
    await logActivity(userId, 'project_shared', 'project', project_id, {
      shared_with: email,
      role,
      collaborator_id: collaboratorUser.id
    })

    res.json({
      success: true,
      collaboration_id: result.rows[0].id,
      message: `Project "${project.title}" shared with ${email} as ${role}`
    })

  } catch (error) {
    console.error('Project invite error:', error)
    res.status(500).json({ error: 'Failed to share project' })
  }
})
```

---

## FIX #6: Fix Stripe Portal Endpoint

**Option A: Add endpoint to stripe.js**

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/stripe.js`
**Add before module.exports**:

```javascript
// POST /api/stripe/create-portal-session - Create billing portal session
router.post('/create-portal-session', authenticateToken, stripeLimiter, async (req, res) => {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const result = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const stripeCustomerId = result.rows[0].stripe_customer_id

    if (!stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/settings/billing`
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    res.status(500).json({ error: 'Failed to create portal session' })
  }
})
```

**OR Option B: Update frontend to use /api/billing/portal**

**File**: `/Users/wjc2007/Desktop/sway/lib/stripe.ts`
**Change Line 40**:
```typescript
// FROM:
const response = await apiRequest('/api/stripe/create-portal-session', {

// TO:
const response = await apiRequest('/api/billing/portal', {
```

---

## FIX #7: Verify Prompting Endpoints

**File**: `/Users/wjc2007/Desktop/sway/backend/src/routes/prompting.js`

Check that these endpoints exist:
- GET `/agents` - List available AI agents
- GET `/prompts` - List saved prompts
- GET `/workspace-config` - Get workspace configuration
- POST `/prompts` - Create new prompt

If missing, add them to the prompting route file.

---

## VALIDATION CHECKLIST

After implementing all fixes, test each endpoint:

### Phase 1: Route Mounting
- [ ] `GET /api/teams` - Works (route mounted correctly)
- [ ] `GET /api/files` - Works (existing route)
- [ ] `GET /api/projects` - Works (existing route)

### Phase 2: New Endpoints (401 = success, means endpoint exists)
- [ ] `POST /api/files/upload` - Returns 401 or 200
- [ ] `PUT /api/user/workspace-settings` - Returns 401 or 200
- [ ] `PUT /api/user/automation-settings` - Returns 401 or 200
- [ ] `GET /api/teams/current` - Returns 401 or 200
- [ ] `POST /api/teams/invite` - Returns 401 or 200
- [ ] `GET /api/teams/permissions` - Returns 401 or 200
- [ ] `PUT /api/teams/settings` - Returns 401 or 200
- [ ] `PATCH /api/projects/:id` - Returns 401 or 200
- [ ] `POST /api/projects/invite` - Returns 401 or 200
- [ ] `POST /api/stripe/create-portal-session` - Returns 401 or 200

### Phase 3: With Authentication
- [ ] Test each endpoint with valid JWT token
- [ ] Verify response structure matches frontend expectations
- [ ] Check error handling for edge cases

### Phase 4: Frontend Integration
- [ ] Dashboard loads projects without 404
- [ ] Settings page loads without 404
- [ ] File upload works without 404
- [ ] Team invitations work without 404
- [ ] Project updates work without 404

---

## QUICK FIX SUMMARY

1. In `server.js` line 202: Change `/api/team` to `/api/teams`
2. Add POST `/upload` to `files.js`
3. Add PUT `/workspace-settings` and `/automation-settings` to `user.js`
4. Add GET `/current`, POST `/invite`, GET `/permissions`, PUT `/settings` to `team.js`
5. Add PATCH `/:projectId` and POST `/invite` to `projects.js`
6. Add POST `/create-portal-session` to `stripe.js` OR update frontend
7. Verify prompting endpoints exist

