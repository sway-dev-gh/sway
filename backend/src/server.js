// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const requestRoutes = require('./routes/requests')
const uploadRoutes = require('./routes/uploads')
const fileRoutes = require('./routes/files')
const statsRoutes = require('./routes/stats')
const stripeRoutes = require('./routes/stripe')
const adminRoutes = require('./routes/admin')
const pool = require('./db/pool')

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors({
  origin: ['https://swayfiles.com', 'https://www.swayfiles.com', 'http://localhost:5173'],
  credentials: true
}))

// JSON parsing for all routes EXCEPT Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next() // Skip JSON parsing for webhook
  } else {
    express.json()(req, res, next)
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/r', uploadRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sway-backend' })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Cleanup job: Deactivate expired requests every hour
const cleanupExpiredRequests = async () => {
  try {
    const result = await pool.query(
      'UPDATE file_requests SET is_active = false WHERE expires_at < NOW() AND is_active = true RETURNING id'
    )
    if (result.rowCount > 0) {
      console.log(`✓ Deactivated ${result.rowCount} expired request(s)`)
    }
  } catch (error) {
    console.error('Error cleaning up expired requests:', error)
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredRequests, 60 * 60 * 1000)

// Run cleanup on startup
cleanupExpiredRequests()

// Start server (for Render, Railway, etc.)
app.listen(PORT, () => {
  console.log(`✓ Sway backend running on port ${PORT}`)
})

// Export for Vercel serverless (if needed)
module.exports = app
