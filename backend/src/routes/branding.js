const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get branding settings for authenticated user
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, logo_url, background_color, remove_branding, custom_footer,
              created_at, updated_at
       FROM branding_settings
       WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        settings: {
          background_color: '#FFFFFF',
          remove_branding: true,
          logo_url: null,
          custom_footer: null
        }
      })
    }

    res.json({ settings: result.rows[0] })
  } catch (error) {
    console.error('Error fetching branding settings:', error)
    res.status(500).json({ error: 'Failed to fetch branding settings' })
  }
})

// Update branding settings (upsert)
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const {
      logo_url,
      background_color,
      remove_branding,
      custom_footer
    } = req.body

    // Check user plan - only Pro/Business can use branding (skip for admin)
    if (!req.isAdmin) {
      const userResult = await pool.query(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )

      const userPlan = userResult.rows[0]?.plan?.toLowerCase()

      // Enforce plan check (Pro/Business required)
      if (userPlan !== 'pro' && userPlan !== 'business') {
        return res.status(403).json({ error: 'Pro or Business plan required for custom branding' })
      }
    }

    const result = await pool.query(
      `INSERT INTO branding_settings (
         user_id, logo_url, background_color, remove_branding, custom_footer
       )
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
       DO UPDATE SET
         logo_url = EXCLUDED.logo_url,
         background_color = EXCLUDED.background_color,
         remove_branding = EXCLUDED.remove_branding,
         custom_footer = EXCLUDED.custom_footer,
         updated_at = NOW()
       RETURNING id, logo_url, background_color, remove_branding, custom_footer,
                 created_at, updated_at`,
      [
        userId,
        logo_url || null,
        background_color || '#FFFFFF',
        remove_branding !== undefined ? remove_branding : true,
        custom_footer || null
      ]
    )

    res.json({ settings: result.rows[0] })
  } catch (error) {
    console.error('Error updating branding settings:', error)
    res.status(500).json({ error: 'Failed to update branding settings' })
  }
})

// Delete branding settings (reset to default)
router.delete('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    await pool.query(
      'DELETE FROM branding_settings WHERE user_id = $1',
      [userId]
    )

    res.json({ message: 'Branding settings reset to default' })
  } catch (error) {
    console.error('Error deleting branding settings:', error)
    res.status(500).json({ error: 'Failed to reset branding settings' })
  }
})

module.exports = router
