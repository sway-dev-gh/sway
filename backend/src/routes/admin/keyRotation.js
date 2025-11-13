/**
 * Admin Key Rotation Management Routes
 * Secure administrative interface for key rotation operations
 */

const express = require('express')
const router = express.Router()
const keyRotationService = require('../../services/keyRotation')
const enhancedAuthService = require('../../services/enhancedAuth')
const pool = require('../../db/pool')

// Middleware to ensure admin authentication
const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    })
  }
  next()
}

/**
 * GET /api/admin/key-rotation/status
 * Get current key rotation status
 */
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const status = await keyRotationService.getRotationStatus()
    const authStats = await enhancedAuthService.getAuthStats()

    res.json({
      success: true,
      keyRotation: status,
      authenticationStats: authStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to get key rotation status:', error)
    res.status(500).json({
      error: 'Failed to retrieve key rotation status',
      code: 'STATUS_ERROR'
    })
  }
})

/**
 * POST /api/admin/key-rotation/rotate/:keyType
 * Force rotation of a specific key type
 */
router.post('/rotate/:keyType', requireAdmin, async (req, res) => {
  try {
    const { keyType } = req.params
    const { reason = 'manual_rotation' } = req.body

    // Validate key type
    const validKeyTypes = Object.values(keyRotationService.keyTypes)
    if (!validKeyTypes.includes(keyType)) {
      return res.status(400).json({
        error: 'Invalid key type',
        validTypes: validKeyTypes,
        code: 'INVALID_KEY_TYPE'
      })
    }

    console.log(`🔑 Admin ${req.userEmail} initiating ${keyType} rotation...`)

    const newKeyId = await keyRotationService.rotateKey(keyType)

    // Log the admin action
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, resource_type, resource_id, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'admin_key_rotation',
      req.userId,
      'encryption_key',
      newKeyId,
      JSON.stringify({
        keyType,
        reason,
        triggeredBy: req.userEmail,
        timestamp: new Date().toISOString(),
        ip: req.ip
      }),
      'medium'
    ])

    res.json({
      success: true,
      message: `${keyType} key rotated successfully`,
      newKeyId,
      rotatedBy: req.userEmail,
      reason
    })
  } catch (error) {
    console.error('Key rotation failed:', error)
    res.status(500).json({
      error: 'Key rotation failed',
      message: error.message,
      code: 'ROTATION_ERROR'
    })
  }
})

/**
 * POST /api/admin/key-rotation/emergency/:keyType
 * Emergency key rotation (security incident response)
 */
router.post('/emergency/:keyType', requireAdmin, async (req, res) => {
  try {
    const { keyType } = req.params
    const { reason, securityIncident } = req.body

    if (!reason) {
      return res.status(400).json({
        error: 'Reason required for emergency rotation',
        code: 'REASON_REQUIRED'
      })
    }

    // Validate key type
    const validKeyTypes = Object.values(keyRotationService.keyTypes)
    if (!validKeyTypes.includes(keyType)) {
      return res.status(400).json({
        error: 'Invalid key type',
        validTypes: validKeyTypes,
        code: 'INVALID_KEY_TYPE'
      })
    }

    console.log(`🚨 EMERGENCY ROTATION: ${keyType} by ${req.userEmail} - ${reason}`)

    const newKeyId = await keyRotationService.emergencyRotation(keyType, reason)

    // Log critical security event
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, resource_type, resource_id, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'emergency_key_rotation',
      req.userId,
      'encryption_key',
      newKeyId,
      JSON.stringify({
        keyType,
        reason,
        securityIncident: securityIncident || false,
        triggeredBy: req.userEmail,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }),
      'critical'
    ])

    res.json({
      success: true,
      message: `Emergency ${keyType} key rotation completed`,
      newKeyId,
      rotatedBy: req.userEmail,
      reason,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Emergency key rotation failed:', error)
    res.status(500).json({
      error: 'Emergency key rotation failed',
      message: error.message,
      code: 'EMERGENCY_ROTATION_ERROR'
    })
  }
})

/**
 * GET /api/admin/key-rotation/history
 * Get key rotation history and audit trail
 */
router.get('/history', requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0, keyType } = req.query

    let query = `
      SELECT kr.*, ek.key_type, ek.algorithm, ek.status as current_status
      FROM key_rotation_events kr
      LEFT JOIN encryption_keys ek ON ek.key_id = kr.new_key_id
    `
    const params = []

    if (keyType) {
      query += ` WHERE kr.key_type = $${params.length + 1}`
      params.push(keyType)
    }

    query += `
      ORDER BY kr.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `
    params.push(parseInt(limit), parseInt(offset))

    const result = await pool.query(query, params)

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM key_rotation_events'
    if (keyType) {
      countQuery += ' WHERE key_type = $1'
    }
    const countResult = await pool.query(countQuery, keyType ? [keyType] : [])

    res.json({
      success: true,
      history: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    })
  } catch (error) {
    console.error('Failed to get rotation history:', error)
    res.status(500).json({
      error: 'Failed to retrieve rotation history',
      code: 'HISTORY_ERROR'
    })
  }
})

/**
 * GET /api/admin/key-rotation/keys
 * List all encryption keys with their status
 */
router.get('/keys', requireAdmin, async (req, res) => {
  try {
    const { status = 'active', keyType } = req.query

    let query = `
      SELECT key_type, key_id, algorithm, key_length, status, created_at, activated_at, expires_at, rotated_at, metadata
      FROM encryption_keys
    `
    const params = []

    const conditions = []
    if (status) {
      conditions.push(`status = $${params.length + 1}`)
      params.push(status)
    }
    if (keyType) {
      conditions.push(`key_type = $${params.length + 1}`)
      params.push(keyType)
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`
    }

    query += ` ORDER BY created_at DESC`

    const result = await pool.query(query, params)

    res.json({
      success: true,
      keys: result.rows.map(row => ({
        ...row,
        // Don't return actual key values to admin interface
        key_value: '[PROTECTED]',
        daysUntilExpiry: row.expires_at
          ? Math.ceil((new Date(row.expires_at) - new Date()) / (24 * 60 * 60 * 1000))
          : null
      }))
    })
  } catch (error) {
    console.error('Failed to get keys list:', error)
    res.status(500).json({
      error: 'Failed to retrieve keys list',
      code: 'KEYS_LIST_ERROR'
    })
  }
})

/**
 * POST /api/admin/key-rotation/revoke/:keyId
 * Revoke a specific key (security incident response)
 */
router.post('/revoke/:keyId', requireAdmin, async (req, res) => {
  try {
    const { keyId } = req.params
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({
        error: 'Reason required for key revocation',
        code: 'REASON_REQUIRED'
      })
    }

    // Update key status to revoked
    const result = await pool.query(`
      UPDATE encryption_keys
      SET status = 'revoked', rotated_at = CURRENT_TIMESTAMP
      WHERE key_id = $1
      RETURNING key_type, algorithm
    `, [keyId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Key not found',
        code: 'KEY_NOT_FOUND'
      })
    }

    const keyData = result.rows[0]

    // Log security event
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, resource_type, resource_id, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'admin_key_revocation',
      req.userId,
      'encryption_key',
      keyId,
      JSON.stringify({
        keyType: keyData.key_type,
        algorithm: keyData.algorithm,
        reason,
        revokedBy: req.userEmail,
        timestamp: new Date().toISOString(),
        ip: req.ip
      }),
      'high'
    ])

    console.log(`🔑 Key ${keyId} revoked by admin ${req.userEmail}: ${reason}`)

    res.json({
      success: true,
      message: 'Key revoked successfully',
      keyId,
      keyType: keyData.key_type,
      revokedBy: req.userEmail,
      reason
    })
  } catch (error) {
    console.error('Key revocation failed:', error)
    res.status(500).json({
      error: 'Key revocation failed',
      message: error.message,
      code: 'REVOCATION_ERROR'
    })
  }
})

/**
 * POST /api/admin/key-rotation/cleanup
 * Clean up expired keys and tokens
 */
router.post('/cleanup', requireAdmin, async (req, res) => {
  try {
    console.log(`🧹 Admin ${req.userEmail} initiated cleanup...`)

    // Clean up key rotation service
    await keyRotationService.cleanupExpiredKeys()

    // Clean up authentication service
    const cleanupStats = {
      expiredTokens: 0,
      expiredSessions: 0,
      expiredRefreshTokens: 0
    }

    // Clean expired token metadata
    const tokenResult = await pool.query(`
      DELETE FROM token_metadata WHERE expires_at < NOW()
    `)
    cleanupStats.expiredTokens = tokenResult.rowCount

    // Clean expired user sessions
    const sessionResult = await pool.query(`
      DELETE FROM user_sessions WHERE expires_at < NOW()
    `)
    cleanupStats.expiredSessions = sessionResult.rowCount

    // Mark expired refresh tokens as revoked
    const refreshResult = await pool.query(`
      UPDATE refresh_tokens
      SET is_revoked = true, revoked_at = NOW()
      WHERE expires_at < NOW() AND is_revoked = false
    `)
    cleanupStats.expiredRefreshTokens = refreshResult.rowCount

    // Log cleanup action
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, resource_type, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'admin_cleanup',
      req.userId,
      'system',
      JSON.stringify({
        cleanupStats,
        triggeredBy: req.userEmail,
        timestamp: new Date().toISOString()
      }),
      'low'
    ])

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      stats: cleanupStats,
      triggeredBy: req.userEmail
    })
  } catch (error) {
    console.error('Cleanup failed:', error)
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message,
      code: 'CLEANUP_ERROR'
    })
  }
})

module.exports = router