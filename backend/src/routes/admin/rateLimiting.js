/**
 * Admin Rate Limiting Management Routes
 * Comprehensive monitoring and control of rate limiting system
 */

const express = require('express')
const router = express.Router()
const rateLimitingService = require('../../services/rateLimiting')
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
 * GET /api/admin/rate-limiting/status
 * Get comprehensive rate limiting system status
 */
router.get('/status', requireAdmin, async (req, res) => {
  try {
    const statistics = await rateLimitingService.getStatistics(7) // Last 7 days

    // Get real-time metrics
    const currentMetrics = await pool.query(`
      SELECT
        COUNT(*) as active_violations,
        COUNT(DISTINCT ip_address) as unique_violating_ips
      FROM rate_limit_violations
      WHERE created_at > NOW() - INTERVAL '1 hour'
    `)

    const reputationMetrics = await pool.query(`
      SELECT
        COUNT(*) as total_tracked_ips,
        COUNT(*) FILTER (WHERE trust_score < 0.5) as low_trust_ips,
        COUNT(*) FILTER (WHERE is_blacklisted = true) as blacklisted_ips,
        COUNT(*) FILTER (WHERE is_whitelisted = true) as whitelisted_ips,
        AVG(trust_score) as avg_trust_score
      FROM ip_reputation
    `)

    const systemStatus = {
      service: {
        initialized: rateLimitingService.initialized,
        algorithms: ['sliding_window', 'token_bucket', 'fixed_window', 'adaptive'],
        redisConnected: rateLimitingService.redisClient ? true : false
      },
      realTime: currentMetrics.rows[0],
      reputation: reputationMetrics.rows[0],
      statistics,
      timestamp: new Date().toISOString()
    }

    res.json({
      success: true,
      status: systemStatus
    })
  } catch (error) {
    console.error('Failed to get rate limiting status:', error)
    res.status(500).json({
      error: 'Failed to retrieve rate limiting status',
      code: 'STATUS_ERROR'
    })
  }
})

/**
 * GET /api/admin/rate-limiting/violations
 * Get recent rate limit violations with pagination
 */
router.get('/violations', requireAdmin, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      ip,
      endpoint,
      hours = 24,
      severity = 'all'
    } = req.query

    let query = `
      SELECT
        rlv.*,
        ir.trust_score,
        ir.is_blacklisted,
        ir.is_whitelisted,
        u.email as user_email
      FROM rate_limit_violations rlv
      LEFT JOIN ip_reputation ir ON ir.ip_address = rlv.ip_address
      LEFT JOIN users u ON u.id = rlv.user_id
      WHERE rlv.created_at > NOW() - $1::interval
    `

    const params = [`${parseInt(hours)} hours`]

    if (ip) {
      query += ` AND rlv.ip_address = $${params.length + 1}`
      params.push(ip)
    }

    if (endpoint && endpoint !== 'all') {
      query += ` AND rlv.endpoint = $${params.length + 1}`
      params.push(endpoint)
    }

    if (severity !== 'all') {
      if (severity === 'high') {
        query += ` AND rlv.requests_count > rlv.requests_count * 2`
      } else if (severity === 'repeated') {
        query += ` AND rlv.ip_address IN (
          SELECT ip_address FROM rate_limit_violations
          WHERE created_at > NOW() - INTERVAL '1 hour'
          GROUP BY ip_address HAVING COUNT(*) > 5
        )`
      }
    }

    query += `
      ORDER BY rlv.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(parseInt(limit), parseInt(offset))

    const violations = await pool.query(query, params)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) FROM rate_limit_violations
      WHERE created_at > NOW() - $1::interval
    `
    const countParams = [`${parseInt(hours)} hours`]

    if (ip) {
      countQuery += ` AND ip_address = $${countParams.length + 1}`
      countParams.push(ip)
    }

    if (endpoint && endpoint !== 'all') {
      countQuery += ` AND endpoint = $${countParams.length + 1}`
      countParams.push(endpoint)
    }

    const totalCount = await pool.query(countQuery, countParams)

    res.json({
      success: true,
      violations: violations.rows,
      pagination: {
        total: parseInt(totalCount.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(parseInt(totalCount.rows[0].count) / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Failed to get violations:', error)
    res.status(500).json({
      error: 'Failed to retrieve violations',
      code: 'VIOLATIONS_ERROR'
    })
  }
})

/**
 * GET /api/admin/rate-limiting/reputation
 * Get IP reputation data
 */
router.get('/reputation', requireAdmin, async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'trust_score',
      order = 'asc',
      filter = 'all'
    } = req.query

    let query = `
      SELECT
        ir.*,
        (
          SELECT COUNT(*) FROM rate_limit_violations rlv
          WHERE rlv.ip_address = ir.ip_address
          AND rlv.created_at > NOW() - INTERVAL '24 hours'
        ) as recent_violations
      FROM ip_reputation ir
    `

    const params = []

    if (filter === 'low_trust') {
      query += ` WHERE ir.trust_score < 0.5`
    } else if (filter === 'blacklisted') {
      query += ` WHERE ir.is_blacklisted = true`
    } else if (filter === 'whitelisted') {
      query += ` WHERE ir.is_whitelisted = true`
    } else if (filter === 'recent_violations') {
      query += ` WHERE ir.last_violation > NOW() - INTERVAL '24 hours'`
    }

    // Validate orderBy to prevent SQL injection
    const allowedColumns = ['trust_score', 'violation_count', 'last_violation', 'created_at']
    const safeOrderBy = allowedColumns.includes(orderBy) ? orderBy : 'trust_score'
    const safeOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC'

    query += `
      ORDER BY ir.${safeOrderBy} ${safeOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(parseInt(limit), parseInt(offset))

    const reputation = await pool.query(query, params)

    res.json({
      success: true,
      reputation: reputation.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    })
  } catch (error) {
    console.error('Failed to get reputation data:', error)
    res.status(500).json({
      error: 'Failed to retrieve reputation data',
      code: 'REPUTATION_ERROR'
    })
  }
})

/**
 * POST /api/admin/rate-limiting/ip/:ip/whitelist
 * Whitelist an IP address
 */
router.post('/ip/:ip/whitelist', requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params
    const { reason, duration } = req.body

    // Validate IP format
    if (!isValidIP(ip)) {
      return res.status(400).json({
        error: 'Invalid IP address format',
        code: 'INVALID_IP'
      })
    }

    // Update or create IP reputation
    await pool.query(`
      INSERT INTO ip_reputation (ip_address, is_whitelisted, trust_score, notes)
      VALUES ($1, true, 1.00, $2)
      ON CONFLICT (ip_address)
      DO UPDATE SET
        is_whitelisted = true,
        is_blacklisted = false,
        trust_score = 1.00,
        notes = $2,
        updated_at = NOW()
    `, [ip, reason || 'Admin whitelist'])

    // Log admin action
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, ip_address, resource_type, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'admin_ip_whitelist',
      req.userId,
      ip,
      'ip_management',
      JSON.stringify({
        action: 'whitelist',
        reason,
        duration,
        adminEmail: req.userEmail,
        timestamp: new Date().toISOString()
      }),
      'medium'
    ])

    res.json({
      success: true,
      message: `IP ${ip} whitelisted successfully`,
      ip,
      action: 'whitelist',
      reason
    })
  } catch (error) {
    console.error('Failed to whitelist IP:', error)
    res.status(500).json({
      error: 'Failed to whitelist IP',
      code: 'WHITELIST_ERROR'
    })
  }
})

/**
 * POST /api/admin/rate-limiting/ip/:ip/blacklist
 * Blacklist an IP address
 */
router.post('/ip/:ip/blacklist', requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params
    const { reason, severity = 'medium' } = req.body

    if (!reason) {
      return res.status(400).json({
        error: 'Reason required for blacklisting',
        code: 'REASON_REQUIRED'
      })
    }

    if (!isValidIP(ip)) {
      return res.status(400).json({
        error: 'Invalid IP address format',
        code: 'INVALID_IP'
      })
    }

    // Update or create IP reputation
    await pool.query(`
      INSERT INTO ip_reputation (ip_address, is_blacklisted, trust_score, notes)
      VALUES ($1, true, 0.00, $2)
      ON CONFLICT (ip_address)
      DO UPDATE SET
        is_blacklisted = true,
        is_whitelisted = false,
        trust_score = 0.00,
        notes = $2,
        updated_at = NOW()
    `, [ip, reason])

    // Log admin action with high priority
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, ip_address, resource_type, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'admin_ip_blacklist',
      req.userId,
      ip,
      'ip_management',
      JSON.stringify({
        action: 'blacklist',
        reason,
        severity,
        adminEmail: req.userEmail,
        timestamp: new Date().toISOString()
      }),
      'high'
    ])

    res.json({
      success: true,
      message: `IP ${ip} blacklisted successfully`,
      ip,
      action: 'blacklist',
      reason,
      severity
    })
  } catch (error) {
    console.error('Failed to blacklist IP:', error)
    res.status(500).json({
      error: 'Failed to blacklist IP',
      code: 'BLACKLIST_ERROR'
    })
  }
})

/**
 * DELETE /api/admin/rate-limiting/ip/:ip/unlist
 * Remove IP from whitelist/blacklist (reset to neutral)
 */
router.delete('/ip/:ip/unlist', requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params
    const { reason } = req.body

    if (!isValidIP(ip)) {
      return res.status(400).json({
        error: 'Invalid IP address format',
        code: 'INVALID_IP'
      })
    }

    // Reset IP reputation to neutral
    const result = await pool.query(`
      UPDATE ip_reputation
      SET
        is_whitelisted = false,
        is_blacklisted = false,
        trust_score = GREATEST(0.5, trust_score),
        notes = $2,
        updated_at = NOW()
      WHERE ip_address = $1
      RETURNING *
    `, [ip, reason || 'Admin reset'])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'IP not found in reputation system',
        code: 'IP_NOT_FOUND'
      })
    }

    // Log admin action
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, ip_address, resource_type, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'admin_ip_unlist',
      req.userId,
      ip,
      'ip_management',
      JSON.stringify({
        action: 'unlist',
        reason,
        adminEmail: req.userEmail,
        timestamp: new Date().toISOString()
      }),
      'low'
    ])

    res.json({
      success: true,
      message: `IP ${ip} removed from lists`,
      ip,
      action: 'unlist',
      newReputation: result.rows[0]
    })
  } catch (error) {
    console.error('Failed to unlist IP:', error)
    res.status(500).json({
      error: 'Failed to unlist IP',
      code: 'UNLIST_ERROR'
    })
  }
})

/**
 * GET /api/admin/rate-limiting/analytics
 * Get rate limiting analytics and trends
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query

    // Get violation trends over time
    const trendData = await pool.query(`
      SELECT
        DATE(created_at) as date,
        endpoint,
        COUNT(*) as violations,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM rate_limit_violations
      WHERE created_at > NOW() - $1::interval
      GROUP BY DATE(created_at), endpoint
      ORDER BY date DESC, violations DESC
    `, [`${parseInt(days)} days`])

    // Get top violating IPs
    const topViolators = await pool.query(`
      SELECT
        rlv.ip_address,
        COUNT(*) as violation_count,
        COUNT(DISTINCT rlv.endpoint) as endpoints_hit,
        ir.trust_score,
        ir.is_blacklisted,
        ir.country_code
      FROM rate_limit_violations rlv
      LEFT JOIN ip_reputation ir ON ir.ip_address = rlv.ip_address
      WHERE rlv.created_at > NOW() - $1::interval
      GROUP BY rlv.ip_address, ir.trust_score, ir.is_blacklisted, ir.country_code
      ORDER BY violation_count DESC
      LIMIT 20
    `, [`${parseInt(days)} days`])

    // Get endpoint protection effectiveness
    const endpointStats = await pool.query(`
      SELECT
        endpoint,
        COUNT(*) as total_violations,
        AVG(requests_count) as avg_violation_size,
        COUNT(DISTINCT ip_address) as unique_violators,
        MAX(requests_count) as max_burst_size
      FROM rate_limit_violations
      WHERE created_at > NOW() - $1::interval
      GROUP BY endpoint
      ORDER BY total_violations DESC
    `, [`${parseInt(days)} days`])

    res.json({
      success: true,
      analytics: {
        trends: trendData.rows,
        topViolators: topViolators.rows,
        endpointStats: endpointStats.rows
      },
      period: `${days} days`
    })
  } catch (error) {
    console.error('Failed to get analytics:', error)
    res.status(500).json({
      error: 'Failed to retrieve analytics',
      code: 'ANALYTICS_ERROR'
    })
  }
})

/**
 * POST /api/admin/rate-limiting/cleanup
 * Clean up old rate limiting data
 */
router.post('/cleanup', requireAdmin, async (req, res) => {
  try {
    const { olderThanDays = 30 } = req.body

    console.log(`🧹 Admin ${req.userEmail} initiated rate limit cleanup (${olderThanDays} days)...`)

    // Clean violations
    const violationsResult = await pool.query(`
      DELETE FROM rate_limit_violations
      WHERE created_at < NOW() - $1::interval
    `, [`${parseInt(olderThanDays)} days`])

    // Clean old IP reputation entries with no recent activity
    const reputationResult = await pool.query(`
      DELETE FROM ip_reputation
      WHERE
        is_whitelisted = false
        AND is_blacklisted = false
        AND last_violation IS NULL
        AND created_at < NOW() - $1::interval
        AND trust_score > 0.9
    `, [`${parseInt(olderThanDays)} days`])

    // Clean old statistics
    const statsResult = await pool.query(`
      DELETE FROM rate_limit_stats
      WHERE created_at < NOW() - $1::interval
    `, [`${parseInt(olderThanDays * 3)} days`])

    // Log cleanup action
    await pool.query(`
      INSERT INTO security_audit_log (event_type, user_id, resource_type, action_details, risk_level)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      'admin_rate_limit_cleanup',
      req.userId,
      'system',
      JSON.stringify({
        violationsRemoved: violationsResult.rowCount,
        reputationEntriesRemoved: reputationResult.rowCount,
        statsRemoved: statsResult.rowCount,
        olderThanDays,
        adminEmail: req.userEmail,
        timestamp: new Date().toISOString()
      }),
      'low'
    ])

    res.json({
      success: true,
      message: 'Rate limiting data cleanup completed',
      stats: {
        violationsRemoved: violationsResult.rowCount,
        reputationEntriesRemoved: reputationResult.rowCount,
        statsRemoved: statsResult.rowCount
      }
    })
  } catch (error) {
    console.error('Rate limit cleanup failed:', error)
    res.status(500).json({
      error: 'Cleanup failed',
      code: 'CLEANUP_ERROR'
    })
  }
})

/**
 * Validate IP address format
 */
function isValidIP(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

module.exports = router