require('dotenv').config()
const { Pool } = require('pg')

// SECURITY FIX: Proper SSL configuration with certificate validation
const getSSLConfig = () => {
  if (process.env.NODE_ENV !== 'production') {
    return false // No SSL for development
  }

  // Production SSL with proper certificate validation
  return {
    rejectUnauthorized: true, // SECURITY: Always verify certificates in production
    ca: process.env.DB_CA_CERT || undefined, // Optional: Custom CA certificate
    cert: process.env.DB_CLIENT_CERT || undefined, // Optional: Client certificate
    key: process.env.DB_CLIENT_KEY || undefined // Optional: Client key
  }
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
