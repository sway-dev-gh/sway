const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token = (req.cookies && req.cookies.token) ||
                  (req.headers && req.headers.authorization && req.headers.authorization.replace('Bearer ', ''))

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.userEmail = decoded.email
    next()
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = { authenticateToken }
