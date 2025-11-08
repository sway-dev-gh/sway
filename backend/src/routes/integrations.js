const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get Dropbox integration status
router.get('/dropbox', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, is_active, auto_sync, sync_folder, last_sync_at
       FROM integrations
       WHERE user_id = $1 AND integration_type = 'dropbox'`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.json({ integration: null })
    }

    res.json({ integration: result.rows[0] })
  } catch (error) {
    console.error('Error fetching Dropbox integration:', error)
    res.status(500).json({ error: 'Failed to fetch integration status' })
  }
})

// Connect Dropbox
router.post('/dropbox/connect', authenticateToken, async (req, res) => {
  try {
    const { auto_sync, sync_folder } = req.body
    const userId = req.userId

    // Check user's plan (Business required)
    if (!req.isAdmin) {
      const userResult = await pool.query(
        'SELECT plan FROM users WHERE id = $1',
        [userId]
      )

      const userPlan = userResult.rows[0]?.plan?.toLowerCase()
      if (userPlan !== 'business') {
        return res.status(403).json({ error: 'Business plan required for cloud integrations' })
      }
    }

    // Upsert integration
    const result = await pool.query(
      `INSERT INTO integrations (user_id, integration_type, is_active, auto_sync, sync_folder)
       VALUES ($1, 'dropbox', true, $2, $3)
       ON CONFLICT (user_id, integration_type)
       DO UPDATE SET
         is_active = true,
         auto_sync = EXCLUDED.auto_sync,
         sync_folder = EXCLUDED.sync_folder,
         updated_at = NOW()
       RETURNING id, is_active, auto_sync, sync_folder`,
      [userId, auto_sync !== undefined ? auto_sync : true, sync_folder || '/Sway Files']
    )

    res.json({ integration: result.rows[0] })
  } catch (error) {
    console.error('Error connecting Dropbox:', error)
    res.status(500).json({ error: 'Failed to connect Dropbox' })
  }
})

// Disconnect Dropbox
router.post('/dropbox/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    await pool.query(
      `UPDATE integrations
       SET is_active = false,
           updated_at = NOW()
       WHERE user_id = $1 AND integration_type = 'dropbox'`,
      [userId]
    )

    res.json({ message: 'Dropbox disconnected successfully' })
  } catch (error) {
    console.error('Error disconnecting Dropbox:', error)
    res.status(500).json({ error: 'Failed to disconnect Dropbox' })
  }
})

// Sync now
router.post('/dropbox/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    // Update last sync time
    const result = await pool.query(
      `UPDATE integrations
       SET last_sync_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $1 AND integration_type = 'dropbox' AND is_active = true
       RETURNING id, last_sync_at`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Dropbox is not connected' })
    }

    res.json({ integration: result.rows[0] })
  } catch (error) {
    console.error('Error syncing to Dropbox:', error)
    res.status(500).json({ error: 'Failed to sync files' })
  }
})

// Update integration settings
router.patch('/dropbox', authenticateToken, async (req, res) => {
  try {
    const { auto_sync, sync_folder } = req.body
    const userId = req.userId

    const result = await pool.query(
      `UPDATE integrations
       SET auto_sync = COALESCE($1, auto_sync),
           sync_folder = COALESCE($2, sync_folder),
           updated_at = NOW()
       WHERE user_id = $3 AND integration_type = 'dropbox'
       RETURNING id, auto_sync, sync_folder`,
      [auto_sync, sync_folder, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    res.json({ integration: result.rows[0] })
  } catch (error) {
    console.error('Error updating integration:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

module.exports = router
