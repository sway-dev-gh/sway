/**
 * Migration runner for Prompting Agent System
 * Runs the 006_prompting_agent_system.sql migration
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

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
    });

async function runPromptingMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting Prompting Agent System migration...');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', '006_prompting_agent_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await client.query(migrationSQL);

        console.log('✅ Prompting Agent System migration completed successfully!');
        console.log('📊 Created tables:');
        console.log('   - prompting_agents');
        console.log('   - workspace_prompting_config');
        console.log('   - ai_prompts');
        console.log('   - prompting_logs');
        console.log('   - workspace_activity_patterns');
        console.log('   - prompting_agent_permissions');

        // Verify tables were created
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE '%prompt%'
            ORDER BY table_name
        `;

        const result = await client.query(tablesQuery);
        console.log('🔍 Verified prompting tables:', result.rows.map(r => r.table_name));

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Run the migration
runPromptingMigration()
    .then(() => {
        console.log('🎉 Prompting Agent System is ready!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });