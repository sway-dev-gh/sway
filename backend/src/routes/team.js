const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const rateLimit = require('express-rate-limit')
const crypto = require('crypto')

// Rate limiting for team operations
const teamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: { error: 'Too many team requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Rate limiting for invitations (more restrictive)
const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 invitations per hour
  message: { error: 'Too many invitations sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Helper function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper function to log activity
const logActivity = async (userId, action, resourceType, resourceId, metadata = {}) => {
  try {
    await pool.query(
      `INSERT INTO activity_log (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, resourceType, resourceId, JSON.stringify(metadata)]
    )
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

// =====================================================
// GET /api/team - Get user's team members and collaborations
// =====================================================
router.get('/', authenticateToken, teamLimiter, async (req, res) => {
  try {
    const userId = req.userId

    // Get team members from collaborations where user is owner
    const teamMembersQuery = `
      SELECT DISTINCT
        c.collaborator_id as id,
        u.email,
        u.name,
        c.role,
        c.status,
        c.permissions,
        c.invited_at,
        c.accepted_at,
        c.last_activity_at,
        COUNT(DISTINCT p.id) as active_projects,
        COUNT(DISTINCT r.id) as pending_reviews
      FROM collaborations c
      JOIN users u ON c.collaborator_id = u.id
      LEFT JOIN projects p ON c.project_id = p.id AND p.status = 'active'
      LEFT JOIN reviews r ON r.reviewer_id = c.collaborator_id AND r.status = 'pending'
      WHERE c.owner_id = $1 AND c.status = 'active'
      GROUP BY c.collaborator_id, u.email, u.name, c.role, c.status, c.permissions, c.invited_at, c.accepted_at, c.last_activity_at
      ORDER BY c.last_activity_at DESC
    `

    const teamResult = await pool.query(teamMembersQuery, [userId])

    // Get pending invitations
    const invitationsQuery = `
      SELECT
        id,
        email,
        role,
        message,
        status,
        expires_at,
        created_at
      FROM team_invitations
      WHERE inviter_id = $1 AND status = 'pending' AND expires_at > NOW()
      ORDER BY created_at DESC
    `

    const invitationsResult = await pool.query(invitationsQuery, [userId])

    // Get teams where this user is a member (invited by others)
    const memberOfQuery = `
      SELECT DISTINCT
        c.owner_id as team_owner_id,
        u.email as team_owner_email,
        u.name as team_owner_name,
        c.role as my_role,
        c.permissions as my_permissions,
        COUNT(DISTINCT p.id) as team_projects
      FROM collaborations c
      JOIN users u ON c.owner_id = u.id
      LEFT JOIN projects p ON c.project_id = p.id AND p.status = 'active'
      WHERE c.collaborator_id = $1 AND c.status = 'active'
      GROUP BY c.owner_id, u.email, u.name, c.role, c.permissions
      ORDER BY u.name
    `

    const memberOfResult = await pool.query(memberOfQuery, [userId])

    res.json({
      success: true,
      team: teamResult.rows,
      pending_invitations: invitationsResult.rows,
      member_of_teams: memberOfResult.rows,
      stats: {
        total_team_members: teamResult.rows.length,
        pending_invitations: invitationsResult.rows.length,
        teams_member_of: memberOfResult.rows.length
      }
    })

    // Log activity
    await logActivity(userId, 'team_accessed', 'team', userId)

  } catch (error) {
    console.error('Get team error:', error)
    res.status(500).json({
      error: 'Failed to fetch team information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/team/invite - Invite new team member
// =====================================================
router.post('/invite', authenticateToken, inviteLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const { email, role = 'viewer', project_id, message, permissions } = req.body

    // Input validation
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email address is required' })
    }

    if (!['viewer', 'editor', 'reviewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be viewer, editor, or reviewer' })
    }

    // Check if user exists and get their info
    const inviterQuery = await pool.query('SELECT email, name, plan FROM users WHERE id = $1', [userId])
    const inviter = inviterQuery.rows[0]

    // Check if trying to invite themselves
    if (email.toLowerCase() === inviter.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot invite yourself' })
    }

    // Check if user already has pending invitation
    const existingInvitationQuery = `
      SELECT id FROM team_invitations
      WHERE inviter_id = $1 AND email = $2 AND status = 'pending' AND expires_at > NOW()
    `
    const existingInvitation = await pool.query(existingInvitationQuery, [userId, email.toLowerCase()])

    if (existingInvitation.rows.length > 0) {
      return res.status(400).json({ error: 'Invitation already sent to this email address' })
    }

    // Check if user is already a team member
    const existingMemberQuery = `
      SELECT c.id FROM collaborations c
      JOIN users u ON c.collaborator_id = u.id
      WHERE c.owner_id = $1 AND u.email = $2 AND c.status = 'active'
    `
    const existingMember = await pool.query(existingMemberQuery, [userId, email.toLowerCase()])

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'This person is already a team member' })
    }

    // Validate project if specified
    let projectTitle = null
    if (project_id) {
      const projectQuery = await pool.query(
        'SELECT title FROM projects WHERE id = $1 AND user_id = $2',
        [project_id, userId]
      )

      if (projectQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found or access denied' })
      }

      projectTitle = projectQuery.rows[0].title
    }

    // Set default permissions based on role
    const defaultPermissions = {
      viewer: { can_view: true, can_edit: false, can_review: false, can_invite: false },
      editor: { can_view: true, can_edit: true, can_review: false, can_invite: false },
      reviewer: { can_view: true, can_edit: false, can_review: true, can_invite: false }
    }

    const finalPermissions = permissions || defaultPermissions[role]

    // Generate secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex')

    // Create invitation
    const insertQuery = `
      INSERT INTO team_invitations
      (inviter_id, project_id, email, role, permissions, invitation_token, message, status, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW() + INTERVAL '7 days')
      RETURNING id, expires_at
    `

    const insertResult = await pool.query(insertQuery, [
      userId,
      project_id || null,
      email.toLowerCase(),
      role,
      JSON.stringify(finalPermissions),
      invitationToken,
      message || `${inviter.name || inviter.email} invited you to collaborate${projectTitle ? ` on "${projectTitle}"` : ''}`
    ])

    const invitation = insertResult.rows[0]

    // Log activity
    await logActivity(userId, 'team_invitation_sent', 'invitation', invitation.id, {
      invited_email: email,
      role: role,
      project_id: project_id,
      project_title: projectTitle
    })

    res.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: email,
        role: role,
        permissions: finalPermissions,
        project_title: projectTitle,
        expires_at: invitation.expires_at,
        invitation_url: `${req.get('origin') || 'https://swayfiles.com'}/invite/${invitationToken}`
      },
      message: 'Team invitation sent successfully'
    })

  } catch (error) {
    console.error('Invite team member error:', error)
    res.status(500).json({
      error: 'Failed to send invitation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// GET /api/team/invitations - Get user's pending invitations (received)
// =====================================================
router.get('/invitations', authenticateToken, teamLimiter, async (req, res) => {
  try {
    const userEmail = req.userEmail

    const query = `
      SELECT
        ti.id,
        ti.invitation_token,
        ti.role,
        ti.permissions,
        ti.message,
        ti.expires_at,
        ti.created_at,
        u.name as inviter_name,
        u.email as inviter_email,
        p.title as project_title,
        p.description as project_description
      FROM team_invitations ti
      JOIN users u ON ti.inviter_id = u.id
      LEFT JOIN projects p ON ti.project_id = p.id
      WHERE ti.email = $1 AND ti.status = 'pending' AND ti.expires_at > NOW()
      ORDER BY ti.created_at DESC
    `

    const result = await pool.query(query, [userEmail.toLowerCase()])

    res.json({
      success: true,
      invitations: result.rows
    })

  } catch (error) {
    console.error('Get invitations error:', error)
    res.status(500).json({
      error: 'Failed to fetch invitations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// POST /api/team/accept-invitation - Accept team invitation
// =====================================================
router.post('/accept-invitation', authenticateToken, teamLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const userEmail = req.userEmail
    const { invitation_token } = req.body

    if (!invitation_token) {
      return res.status(400).json({ error: 'Invitation token is required' })
    }

    // Get invitation details
    const invitationQuery = `
      SELECT * FROM team_invitations
      WHERE invitation_token = $1 AND email = $2 AND status = 'pending' AND expires_at > NOW()
    `

    const invitationResult = await pool.query(invitationQuery, [invitation_token, userEmail.toLowerCase()])

    if (invitationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid, expired, or already used invitation' })
    }

    const invitation = invitationResult.rows[0]

    // Create collaboration
    const collaborationQuery = `
      INSERT INTO collaborations
      (owner_id, collaborator_id, project_id, role, permissions, status, invited_at, accepted_at, last_activity_at)
      VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), NOW())
      RETURNING id
    `

    const collaborationResult = await pool.query(collaborationQuery, [
      invitation.inviter_id,
      userId,
      invitation.project_id,
      invitation.role,
      invitation.permissions,
      invitation.created_at
    ])

    // Mark invitation as accepted
    await pool.query(
      'UPDATE team_invitations SET status = $1, accepted_at = NOW() WHERE id = $2',
      ['accepted', invitation.id]
    )

    // Log activity
    await logActivity(userId, 'team_invitation_accepted', 'collaboration', collaborationResult.rows[0].id, {
      inviter_id: invitation.inviter_id,
      role: invitation.role,
      project_id: invitation.project_id
    })

    res.json({
      success: true,
      message: 'Invitation accepted successfully',
      collaboration_id: collaborationResult.rows[0].id
    })

  } catch (error) {
    console.error('Accept invitation error:', error)
    res.status(500).json({
      error: 'Failed to accept invitation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// =====================================================
// DELETE /api/team/:memberId - Remove team member
// =====================================================
router.delete('/:memberId', authenticateToken, teamLimiter, async (req, res) => {
  try {
    const userId = req.userId
    const memberId = req.params.memberId

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(memberId)) {
      return res.status(400).json({ error: 'Invalid member ID format' })
    }

    // Check if collaboration exists and user owns it
    const collaborationQuery = `
      SELECT id FROM collaborations
      WHERE owner_id = $1 AND collaborator_id = $2 AND status = 'active'
    `

    const collaborationResult = await pool.query(collaborationQuery, [userId, memberId])

    if (collaborationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team member not found or access denied' })
    }

    // Update collaboration status to ended
    await pool.query(
      'UPDATE collaborations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['ended', collaborationResult.rows[0].id]
    )

    // Log activity
    await logActivity(userId, 'team_member_removed', 'collaboration', collaborationResult.rows[0].id, {
      removed_user_id: memberId
    })

    res.json({
      success: true,
      message: 'Team member removed successfully'
    })

  } catch (error) {
    console.error('Remove team member error:', error)
    res.status(500).json({
      error: 'Failed to remove team member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router