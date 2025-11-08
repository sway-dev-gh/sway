const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  try {
    // Check for admin secret key first
    const adminKey = req.headers['x-admin-key']
    if (adminKey && adminKey === process.env.ADMIN_SECRET_KEY) {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
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
