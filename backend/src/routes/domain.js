const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')
const crypto = require('crypto')

// Get custom domain for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, user_id, domain, verification_status, is_active, created_at, verified_at, updated_at
       FROM custom_domains
       WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.json({ domain: null })
    }

    res.json({ domain: result.rows[0] })
  } catch (error) {
    console.error('Error fetching custom domain:', error)
    res.status(500).json({ error: 'Failed to fetch custom domain' })
  }
})

// Add or update custom domain
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { domain } = req.body
    const userId = req.userId

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' })
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain format' })
    }

    // Check user's plan (Business required) - bypass for admins
    if (!req.isAdmin) {
      const userResult = await pool.query(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )

      const userPlan = userResult.rows[0]?.plan?.toLowerCase()
      if (userPlan !== 'business') {
        return res.status(403).json({ error: 'Business plan required for custom domain' })
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Upsert custom domain
    const result = await pool.query(
      `INSERT INTO custom_domains (user_id, domain, verification_token, verification_status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (user_id)
       DO UPDATE SET
         domain = EXCLUDED.domain,
         verification_token = EXCLUDED.verification_token,
         verification_status = 'pending',
         is_active = false,
         updated_at = NOW()
       RETURNING id, user_id, domain, verification_status, verification_token, is_active, created_at, updated_at`,
      [userId, domain.toLowerCase(), verificationToken]
    )

    res.json({
      message: 'Domain added successfully. Please verify DNS configuration.',
      domain: result.rows[0]
    })
  } catch (error) {
    console.error('Error adding custom domain:', error)
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Domain already in use by another user' })
    }
    res.status(500).json({ error: 'Failed to add custom domain' })
  }
})

// Verify domain
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const domainResult = await pool.query(
      'SELECT id, domain, verification_token FROM custom_domains WHERE user_id = $1',
      [userId]
    )

    if (domainResult.rows.length === 0) {
      return res.status(404).json({ error: 'No domain found for verification' })
    }

    const { id, domain } = domainResult.rows[0]

    // TODO: In production, implement actual DNS verification here
    // For now, we'll just mark it as verified
    const result = await pool.query(
      `UPDATE custom_domains
       SET verification_status = 'verified',
           is_active = true,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, domain, verification_status, is_active, verified_at, updated_at`,
      [id]
    )

    res.json({
      message: 'Domain verified successfully',
      domain: result.rows[0]
    })
  } catch (error) {
    console.error('Error verifying domain:', error)
    res.status(500).json({ error: 'Failed to verify domain' })
  }
})

// Remove custom domain
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      'DELETE FROM custom_domains WHERE user_id = $1 RETURNING domain',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No domain found to remove' })
    }

    res.json({ message: 'Domain removed successfully' })
  } catch (error) {
    console.error('Error removing custom domain:', error)
    res.status(500).json({ error: 'Failed to remove custom domain' })
  }
})

module.exports = router
