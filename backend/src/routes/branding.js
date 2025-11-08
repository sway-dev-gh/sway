const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get branding settings for the authenticated user
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, user_id, remove_branding, logo_url, primary_color, created_at, updated_at
       FROM branding_settings
       WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        settings: {
          remove_branding: false,
          logo_url: null,
          primary_color: '#000000'
        }
      })
    }

    res.json({ settings: result.rows[0] })
  } catch (error) {
    console.error('Error fetching branding settings:', error)
    res.status(500).json({ error: 'Failed to fetch branding settings' })
  }
})

// Save or update branding settings
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const { remove_branding, logo_url, primary_color } = req.body
    const userId = req.userId

    // Check user's plan (Pro or Business required) - bypass for admins
    if (!req.isAdmin) {
      const userResult = await pool.query(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )

      const userPlan = userResult.rows[0]?.plan?.toLowerCase()
      if (userPlan !== 'pro' && userPlan !== 'business') {
        return res.status(403).json({ error: 'Pro or Business plan required for custom branding' })
      }
    }

    // Upsert branding settings
    const result = await pool.query(
      `INSERT INTO branding_settings (user_id, remove_branding, logo_url, primary_color)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET
         remove_branding = EXCLUDED.remove_branding,
         logo_url = EXCLUDED.logo_url,
         primary_color = EXCLUDED.primary_color,
         updated_at = NOW()
       RETURNING id, user_id, remove_branding, logo_url, primary_color, created_at, updated_at`,
      [
        userId,
        remove_branding !== undefined ? remove_branding : false,
        logo_url || null,
        primary_color || '#000000'
      ]
    )

    res.json({
      message: 'Branding settings saved successfully',
      settings: result.rows[0]
    })
  } catch (error) {
    console.error('Error saving branding settings:', error)
    res.status(500).json({ error: 'Failed to save branding settings' })
  }
})

module.exports = router
