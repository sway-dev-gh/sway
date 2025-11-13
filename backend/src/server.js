// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const { applySecurity } = require('./middleware/security')
const { errorHandler, notFoundHandler, healthCheck, validateEnvironment, setupGlobalErrorHandlers } = require('./middleware/errorHandler')
const { encryptSensitiveFields, decryptSensitiveFields } = require('./middleware/encryption')

const authRoutes = require('./routes/auth')
const requestRoutes = require('./routes/requests')
const uploadRoutes = require('./routes/uploads')
const fileRoutes = require('./routes/files')
const statsRoutes = require('./routes/stats')
const stripeRoutes = require('./routes/stripe')
const billingRoutes = require('./routes/billing')
const adminRoutes = require('./routes/admin')
const analyticsRoutes = require('./routes/analytics')
// const aiRoutes = require('./routes/ai') // Disabled - no OpenAI API key
const migrateRoutes = require('./routes/migrate')

// Collaboration features
const teamRoutes = require('./routes/team')
const projectRoutes = require('./routes/projects')
const reviewRoutes = require('./routes/reviews')
const reviewerRoutes = require('./routes/reviewers')
const collaborationRoutes = require('./routes/collaborations')
const activityRoutes = require('./routes/activity')
const workflowRoutes = require('./routes/workflow')
const pool = require('./db/pool')

// Validate environment and setup global error handlers
validateEnvironment()
setupGlobalErrorHandlers()

const app = express()
const PORT = process.env.PORT || 5001

// Apply comprehensive security middleware (includes CORS, headers, rate limiting, etc.)
applySecurity(app)

// JSON parsing for all routes EXCEPT Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next() // Skip JSON parsing for webhook
  } else {
    express.json()(req, res, next)
  }
})

// Add database pool to request for billing routes
app.use('/api/billing', (req, res, next) => {
  req.db = pool
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/r', uploadRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/analytics', analyticsRoutes)
// app.use('/api/ai', aiRoutes) // Disabled - no OpenAI API key
app.use('/api/migrate', migrateRoutes)

// Collaboration features
app.use('/api/team', teamRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/reviewers', reviewerRoutes)
app.use('/api/collaborations', collaborationRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/workflow', workflowRoutes)

// Enhanced health check with security monitoring
app.get('/health', healthCheck())

// Simple migration endpoint - run migrations with ?migrate=true
app.get('/health-migrate', async (req, res) => {
  try {
    const sql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE IF NOT EXISTS projects (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id UUID NOT NULL, title VARCHAR(255) NOT NULL, description TEXT, project_type VARCHAR(50) DEFAULT 'review', status VARCHAR(50) DEFAULT 'active', visibility VARCHAR(50) DEFAULT 'private', settings JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS collaborations (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), project_id UUID NOT NULL, collaborator_id UUID NOT NULL, role VARCHAR(50) DEFAULT 'viewer', status VARCHAR(50) DEFAULT 'active', permissions JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
    `
    await pool.query(sql)
    res.json({
      status: 'ok',
      service: 'sway-backend',
      migration: '🔥🔥🔥 COLLABORATION PLATFORM IS NOW LIVE! EVERYTHING IS DIALED TF IN!'
    })
  } catch (error) {
    res.json({
      status: 'ok',
      service: 'sway-backend',
      migration_error: error.message,
      note: 'Migration failed but backend is healthy'
    })
  }
})

// 404 handler for undefined routes (must come before error handler)
app.use(notFoundHandler)

// Comprehensive error handling middleware (must come last)
app.use(errorHandler)

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
  console.log(`✓ Sway backend running on port ${PORT} - Collaboration platform ready!`)
})

// Export for Vercel serverless (if needed)
module.exports = app
// Force redeploy Tue Nov 11 21:13:01 PST 2025
