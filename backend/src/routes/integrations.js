const express = require('express')
const router = express.Router()
const pool = require('../db/pool')
const { authenticateToken } = require('../middleware/auth')

// Get all integrations for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId

    const result = await pool.query(
      `SELECT id, user_id, provider, auto_sync, sync_folder, last_sync_at, is_active, created_at, updated_at
       FROM integrations
       WHERE user_id = $1`,
      [userId]
    )

    res.json({ integrations: result.rows })
  } catch (error) {
    console.error('Error fetching integrations:', error)
    res.status(500).json({ error: 'Failed to fetch integrations' })
  }
})

// Get integration by provider
router.get('/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params
    const userId = req.userId

    if (!['dropbox', 'google_drive'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' })
    }

    const result = await pool.query(
      `SELECT id, user_id, provider, auto_sync, sync_folder, last_sync_at, is_active, created_at, updated_at
       FROM integrations
       WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    )

    if (result.rows.length === 0) {
      return res.json({ integration: null })
    }

    res.json({ integration: result.rows[0] })
  } catch (error) {
    console.error('Error fetching integration:', error)
    res.status(500).json({ error: 'Failed to fetch integration' })
  }
})

// Connect an integration (simplified - in production would use OAuth)
router.post('/:provider/connect', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params
    const { auto_sync, sync_folder } = req.body
    const userId = req.userId

    if (!['dropbox', 'google_drive'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' })
    }

    // Check user's plan (Business required)
    const userResult = await pool.query(
      'SELECT plan FROM users WHERE id = $1',
      [userId]
    )

    const userPlan = userResult.rows[0]?.plan?.toLowerCase()
    if (userPlan !== 'business') {
      return res.status(403).json({ error: 'Business plan required for cloud integrations' })
    }

    // TODO: In production, implement actual OAuth flow for Dropbox/Google Drive
    // For now, we'll create a mock integration
    const mockAccessToken = `mock_token_${Date.now()}`

    // Upsert integration
    const result = await pool.query(
      `INSERT INTO integrations (user_id, provider, access_token, auto_sync, sync_folder, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (user_id, provider)
       DO UPDATE SET
         auto_sync = EXCLUDED.auto_sync,
         sync_folder = EXCLUDED.sync_folder,
         is_active = true,
         updated_at = NOW()
       RETURNING id, user_id, provider, auto_sync, sync_folder, is_active, created_at, updated_at`,
      [
        userId,
        provider,
        mockAccessToken,
        auto_sync !== undefined ? auto_sync : true,
        sync_folder || '/Sway Files'
      ]
    )

    res.json({
      message: `${provider === 'dropbox' ? 'Dropbox' : 'Google Drive'} connected successfully`,
      integration: result.rows[0]
    })
  } catch (error) {
    console.error('Error connecting integration:', error)
    res.status(500).json({ error: 'Failed to connect integration' })
  }
})

// Disconnect an integration
router.post('/:provider/disconnect', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params
    const userId = req.userId

    const result = await pool.query(
      'DELETE FROM integrations WHERE user_id = $1 AND provider = $2 RETURNING provider',
      [userId, provider]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    res.json({ message: 'Integration disconnected successfully' })
  } catch (error) {
    console.error('Error disconnecting integration:', error)
    res.status(500).json({ error: 'Failed to disconnect integration' })
  }
})

// Update integration settings
router.patch('/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params
    const { auto_sync, sync_folder } = req.body
    const userId = req.userId

    const result = await pool.query(
      `UPDATE integrations
       SET auto_sync = COALESCE($1, auto_sync),
           sync_folder = COALESCE($2, sync_folder),
           updated_at = NOW()
       WHERE user_id = $3 AND provider = $4
       RETURNING id, user_id, provider, auto_sync, sync_folder, is_active, updated_at`,
      [auto_sync, sync_folder, userId, provider]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    res.json({
      message: 'Integration settings updated successfully',
      integration: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating integration:', error)
    res.status(500).json({ error: 'Failed to update integration' })
  }
})

// Trigger manual sync
router.post('/:provider/sync', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params
    const userId = req.userId

    // Check if integration exists and is active
    const integrationResult = await pool.query(
      'SELECT id, is_active FROM integrations WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    )

    if (integrationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    if (!integrationResult.rows[0].is_active) {
      return res.status(400).json({ error: 'Integration is not active' })
    }

    // TODO: In production, implement actual file sync logic here
    // For now, just update the last_sync_at timestamp
    const result = await pool.query(
      `UPDATE integrations
       SET last_sync_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $1 AND provider = $2
       RETURNING id, provider, last_sync_at`,
      [userId, provider]
    )

    res.json({
      message: 'Sync completed successfully',
      integration: result.rows[0]
    })
  } catch (error) {
    console.error('Error syncing integration:', error)
    res.status(500).json({ error: 'Failed to sync integration' })
  }
})

module.exports = router
