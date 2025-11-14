// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { applySecurity } = require('./middleware/security')
const { errorHandler, notFoundHandler, healthCheck, validateEnvironment, setupGlobalErrorHandlers } = require('./middleware/errorHandler')
const { encryptSensitiveFields, decryptSensitiveFields } = require('./middleware/encryption')
const RealtimeService = require('./services/realtimeService')

const authRoutes = require('./routes/auth')
const guestRoutes = require('./routes/guest')
const requestRoutes = require('./routes/requests')
const uploadRoutes = require('./routes/uploads')
const fileRoutes = require('./routes/files')
const statsRoutes = require('./routes/stats')
const stripeRoutes = require('./routes/stripe')
const billingRoutes = require('./routes/billing')
const adminRoutes = require('./routes/admin')
const analyticsRoutes = require('./routes/analytics')
const userRoutes = require('./routes/user')
const automationRoutes = require('./routes/automation')
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
const notificationRoutes = require('./routes/notifications')
const pool = require('./db/pool')

// Enhanced authentication and security services
const keyRotationService = require('./services/keyRotation')
const enhancedAuthService = require('./services/enhancedAuth')
const rateLimitingService = require('./services/rateLimiting')

// Import rate limiting middleware
const {
  initializeRateLimiting,
  intelligentRateLimiter,
  authRateLimit,
  adminRateLimit,
  uploadRateLimit,
  guestRateLimit
} = require('./middleware/rateLimiting')

// Validate environment and setup global error handlers
validateEnvironment()
setupGlobalErrorHandlers()

// Initialize enhanced authentication system (async)
const initializeSecurityServices = async () => {
  try {
    console.log('🔐 Initializing Enhanced Security Services...')

    // Initialize key rotation service
    await keyRotationService.initialize()
    console.log('✓ Key Rotation Service initialized')

    // Initialize enhanced authentication service
    await enhancedAuthService.initialize()
    console.log('✓ Enhanced Authentication Service initialized')

    console.log('🛡️ Security services fully operational')
  } catch (error) {
    console.error('❌ Failed to initialize security services:', error)
    console.error('Server will continue with fallback authentication')
  }
}

// Start security services initialization (don't block server startup)
initializeSecurityServices().catch(console.error)

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5001

// Apply comprehensive security middleware (includes CORS, headers, rate limiting, etc.)
applySecurity(app)

// SECURITY FIX: Removed emergency CORS middleware - using centralized security system

// Setup Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ["https://swayfiles.com", "https://www.swayfiles.com"]
      : ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
})

// Initialize real-time collaboration service
let realtimeService
try {
  realtimeService = new RealtimeService(io)
  console.log('✓ Real-time collaboration service initialized')
} catch (error) {
  console.error('❌ Failed to initialize real-time service:', error)
}

// Make real-time service available to routes
app.use((req, res, next) => {
  req.realtime = realtimeService
  next()
})

// Dynamic JSON parsing with size limits based on endpoint
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next() // Skip JSON parsing for webhook
  } else {
    // Set size limits based on endpoint
    let sizeLimit = '1mb'; // Default limit

    if (req.originalUrl.includes('/upload') || req.originalUrl.includes('/files')) {
      sizeLimit = '100mb'; // Large limit for file uploads
    } else if (req.originalUrl.includes('/projects') || req.originalUrl.includes('/collaborations')) {
      sizeLimit = '10mb';  // Medium limit for project data
    }

    // Apply JSON parsing with size limit
    express.json({
      limit: sizeLimit,
      strict: true,
      verify: (req, res, buf, encoding) => {
        // Log large payloads for monitoring
        if (buf.length > 1024 * 1024) { // Log if > 1MB
          console.log(`⚠️ Large JSON payload: ${(buf.length / 1024 / 1024).toFixed(2)}MB from ${req.ip} to ${req.originalUrl}`)
        }
      }
    })(req, res, (err) => {
      if (err) {
        next(err)
      } else {
        // Also apply URL-encoded parsing with same size limit
        express.urlencoded({
          limit: sizeLimit,
          extended: true,
          parameterLimit: 1000, // Limit number of parameters
          verify: (req, res, buf, encoding) => {
            if (buf.length > 1024 * 1024) {
              console.log(`⚠️ Large URL-encoded payload: ${(buf.length / 1024 / 1024).toFixed(2)}MB from ${req.ip} to ${req.originalUrl}`)
            }
          }
        })(req, res, next)
      }
    })
  }
})

// Add database pool to request for billing routes
app.use('/api/billing', (req, res, next) => {
  req.db = pool
  next()
})

// Apply rate limiting initialization to all routes
app.use(initializeRateLimiting)

// Routes with specific rate limiting
app.use('/api/auth', authRateLimit, authRoutes)
app.use('/api/guest', guestRateLimit, guestRoutes)
app.use('/api/requests', intelligentRateLimiter, requestRoutes)
app.use('/api/r', uploadRateLimit, uploadRoutes)
app.use('/api/files', uploadRateLimit, fileRoutes)
app.use('/api/stats', intelligentRateLimiter, statsRoutes)
app.use('/api/stripe', intelligentRateLimiter, stripeRoutes)
app.use('/api/billing', intelligentRateLimiter, billingRoutes)
app.use('/api/admin', adminRateLimit, adminRoutes)
app.use('/api/analytics', intelligentRateLimiter, analyticsRoutes)
app.use('/api/user', intelligentRateLimiter, userRoutes)
app.use('/api/automation', intelligentRateLimiter, automationRoutes)
// app.use('/api/ai', aiRoutes) // Disabled - no OpenAI API key
app.use('/api/migrate', adminRateLimit, migrateRoutes)

// Collaboration features with intelligent rate limiting
app.use('/api/team', intelligentRateLimiter, teamRoutes)
app.use('/api/projects', intelligentRateLimiter, projectRoutes)
app.use('/api/reviews', intelligentRateLimiter, reviewRoutes)
app.use('/api/reviewers', intelligentRateLimiter, reviewerRoutes)
app.use('/api/collaborations', intelligentRateLimiter, collaborationRoutes)
app.use('/api/activity', intelligentRateLimiter, activityRoutes)
app.use('/api/workflow', intelligentRateLimiter, workflowRoutes)
app.use('/api/notifications', intelligentRateLimiter, notificationRoutes.router)

// Enhanced health check with security monitoring
app.get('/health', healthCheck())

// Root endpoint to prevent 404s
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sway-backend',
    version: '1.0.1',
    message: 'Sway Backend API is running. Use /health for health checks.',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health - Health check',
      '/api/auth - Authentication',
      '/api/requests - File requests',
      '/api/files - File management',
      '/api/stripe - Payment processing'
    ]
  })
})

// Simple migration endpoint - run migrations with ?migrate=true
app.get('/health-migrate', async (req, res) => {
  try {
    const sql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Projects and collaborations tables
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID,
        guest_id UUID,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_type VARCHAR(50) DEFAULT 'review',
        status VARCHAR(50) DEFAULT 'active',
        visibility VARCHAR(50) DEFAULT 'private',
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT projects_owner_check CHECK (
          (user_id IS NOT NULL AND guest_id IS NULL) OR
          (user_id IS NULL AND guest_id IS NOT NULL)
        )
      );

      CREATE TABLE IF NOT EXISTS collaborations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID NOT NULL,
        collaborator_id UUID NOT NULL,
        role VARCHAR(50) DEFAULT 'viewer',
        status VARCHAR(50) DEFAULT 'active',
        permissions JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Guest users table for persistent sessions
      CREATE TABLE IF NOT EXISTS guest_users (
        id SERIAL PRIMARY KEY,
        guest_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
        display_name VARCHAR(255) NOT NULL,
        device_fingerprint VARCHAR(64) UNIQUE NOT NULL,
        session_data JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        converted_user_id UUID NULL,
        converted_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Add guest support to file_requests if column doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'file_requests' AND column_name = 'guest_id'
        ) THEN
          ALTER TABLE file_requests ADD COLUMN guest_id UUID NULL;
          ALTER TABLE file_requests ADD CONSTRAINT file_requests_owner_check CHECK (
            (user_id IS NOT NULL AND guest_id IS NULL) OR
            (user_id IS NULL AND guest_id IS NOT NULL)
          );
        END IF;
      END $$;

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_guest_users_device_fingerprint ON guest_users(device_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_guest_users_guest_id ON guest_users(guest_id);
      CREATE INDEX IF NOT EXISTS idx_projects_guest_id ON projects(guest_id);
      CREATE INDEX IF NOT EXISTS idx_file_requests_guest_id ON file_requests(guest_id);
    `
    await pool.query(sql)
    res.json({
      status: 'ok',
      service: 'sway-backend',
      migration: 'GUEST USER PERSISTENCE IS NOW LIVE! SEAMLESS COLLABORATION ACROSS DEVICES!'
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

// Start server with Socket.IO support
server.listen(PORT, () => {
  console.log(`✓ Sway backend running on port ${PORT} - Collaboration platform ready!`)
  console.log(`🚀 Real-time collaboration enabled via WebSockets`)
})

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🔄 Shutting down gracefully...')
  server.close(() => {
    console.log('✓ Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Export for Vercel serverless (if needed)
module.exports = { app, server, io }
// Force redeploy with Stripe routes - Wed Nov 13 21:44:00 PST 2025
