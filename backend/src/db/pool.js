require('dotenv').config()
const { Pool } = require('pg')

// SECURITY FIX: Proper SSL configuration for managed databases
const getSSLConfig = () => {
  if (process.env.NODE_ENV !== 'production') {
    return false // No SSL for development
  }

  // For managed databases (Render, etc.) that use self-signed certs
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')) {
    return {
      rejectUnauthorized: false // Accept self-signed certs from managed providers
    }
  }

  // Production SSL with proper certificate validation for custom databases
  return {
    rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false',
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
