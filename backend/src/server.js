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
const notificationRoutes = require('./routes/notifications')
const templateRoutes = require('./routes/templates')
const statsRoutes = require('./routes/stats')
const stripeRoutes = require('./routes/stripe')

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors({
  origin: ['https://swayfiles.com', 'https://www.swayfiles.com', 'http://localhost:5173'],
  credentials: true
}))

// IMPORTANT: Stripe webhook needs raw body, so this route must come BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/r', uploadRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/stripe', stripeRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'sway-backend' })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server (for Render, Railway, etc.)
app.listen(PORT, () => {
  console.log(`✓ Sway backend running on port ${PORT}`)
})

// Export for Vercel serverless (if needed)
module.exports = app
