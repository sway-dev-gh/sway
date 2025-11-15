require('dotenv').config()
const { Pool } = require('pg')

// SECURITY FIX: Secure SSL configuration for all databases
const getSSLConfig = () => {
  if (process.env.NODE_ENV !== 'production') {
    return false // No SSL for development
  }

  // SECURITY: Always validate SSL certificates in production
  // Use environment variable to override only when absolutely necessary
  const rejectUnauthorized = process.env.DB_REJECT_UNAUTHORIZED !== 'false'

  // Production SSL configuration with proper certificate validation
  const sslConfig = {
    rejectUnauthorized: rejectUnauthorized,
    ca: process.env.DB_CA_CERT || undefined,     // Optional: Custom CA certificate
    cert: process.env.DB_CLIENT_CERT || undefined, // Optional: Client certificate
    key: process.env.DB_CLIENT_KEY || undefined    // Optional: Client key
  }

  // Log SSL configuration for security auditing
  console.log(`🔐 Database SSL Configuration:`, {
    rejectUnauthorized: sslConfig.rejectUnauthorized,
    hasCustomCA: !!sslConfig.ca,
    hasClientCert: !!sslConfig.cert,
    environment: process.env.NODE_ENV
  })

  // SECURITY WARNING: Log if SSL validation is disabled
  if (!sslConfig.rejectUnauthorized) {
    console.warn('⚠️  WARNING: Database SSL certificate validation is DISABLED')
    console.warn('   This is a security risk in production environments')
    console.warn('   Set DB_REJECT_UNAUTHORIZED=true to enable validation')
  }

  return sslConfig
}

// Use DATABASE_URL if available (Render/Heroku format), otherwise use individual env vars
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: getSSLConfig()
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sway',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
      ssl: getSSLConfig()
    })

module.exports = pool
