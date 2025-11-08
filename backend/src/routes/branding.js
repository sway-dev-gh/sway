const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get branding settings for authenticated user
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, logo_url, background_color, text_color, accent_color, 
              custom_message, show_watermark, custom_css, elements, 
              created_at, updated_at
       FROM branding_settings
       WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        settings: {
          background_color: '#000000',
          text_color: '#FFFFFF',
          accent_color: '#FFFFFF',
          show_watermark: true,
          elements: []
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
      text_color,
      accent_color,
      custom_message,
      show_watermark,
      custom_css,
      elements
    } = req.body

    const result = await pool.query(
      `INSERT INTO branding_settings (
         user_id, logo_url, background_color, text_color, accent_color,
         custom_message, show_watermark, custom_css, elements
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id)
       DO UPDATE SET
         logo_url = COALESCE(EXCLUDED.logo_url, branding_settings.logo_url),
         background_color = COALESCE(EXCLUDED.background_color, branding_settings.background_color),
         text_color = COALESCE(EXCLUDED.text_color, branding_settings.text_color),
         accent_color = COALESCE(EXCLUDED.accent_color, branding_settings.accent_color),
         custom_message = COALESCE(EXCLUDED.custom_message, branding_settings.custom_message),
         show_watermark = COALESCE(EXCLUDED.show_watermark, branding_settings.show_watermark),
         custom_css = COALESCE(EXCLUDED.custom_css, branding_settings.custom_css),
         elements = COALESCE(EXCLUDED.elements, branding_settings.elements),
         updated_at = NOW()
       RETURNING id, logo_url, background_color, text_color, accent_color,
                 custom_message, show_watermark, custom_css, elements,
                 created_at, updated_at`,
      [
        userId,
        logo_url || null,
        background_color || '#000000',
        text_color || '#FFFFFF',
        accent_color || '#FFFFFF',
        custom_message || null,
        show_watermark !== undefined ? show_watermark : true,
        custom_css || null,
        elements ? JSON.stringify(elements) : '[]'
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
