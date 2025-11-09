const jwt = require('jsonwebtoken')

// CRITICAL SECURITY: Validate JWT_SECRET exists at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set!')
  console.error('Application cannot start without a secure JWT secret.')
  process.exit(1)
}

const authenticateToken = (req, res, next) => {
  try {
    // Check for admin secret key first
    const adminKey = req.headers['x-admin-key']
    if (adminKey && process.env.ADMIN_SECRET_KEY && adminKey === process.env.ADMIN_SECRET_KEY) {
      req.isAdmin = true
      req.userId = 'admin'
      req.userEmail = 'admin@sway.com'
      return next()
    }

    // Get token from cookies or Authorization header
    let token = null

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token
    } else if (req.headers && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '')
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // SECURITY: No fallback secret - will throw if JWT_SECRET missing
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.userEmail = decoded.email
    req.isAdmin = false
    next()
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { authenticateToken }
