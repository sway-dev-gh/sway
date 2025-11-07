require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const requestRoutes = require('./routes/requests')
const uploadRoutes = require('./routes/uploads')
const fileRoutes = require('./routes/files')
const stripeRoutes = require('./routes/stripe')

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3001',
  credentials: true
}))

// IMPORTANT: Stripe webhook needs raw body, so this route must come BEFORE express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeRoutes)

// JSON parsing for all other routes
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/r', uploadRoutes)
app.use('/api/files', fileRoutes)
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

app.listen(PORT, () => {
  console.log(`✓ Sway backend running on port ${PORT}`)
})
