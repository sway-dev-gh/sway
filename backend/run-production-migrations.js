const { Pool } = require('pg')

const pool = new Pool({
  connectionString: "postgresql://sway:RGWuF5FX9KYBcBnDBe1NBym6H4myzNpL@dpg-d472qsuuk2gs73fi3olg-a/sway_c8c1",
  ssl: { rejectUnauthorized: false }
})

async function runMigrations() {
  try {
    console.log('🚀 Connecting to production database...')
    
    // Test connection
    const testResult = await pool.query('SELECT NOW() as now')
    console.log(`✅ Connected: ${testResult.rows[0].now}`)
    
    // Run migrations
    const sql = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_type VARCHAR(50) DEFAULT 'review',
        status VARCHAR(50) DEFAULT 'active',
        visibility VARCHAR(50) DEFAULT 'private',
        settings JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    `
    
    await pool.query(sql)
    console.log('🔥🔥🔥 COLLABORATION PLATFORM IS NOW LIVE!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  } finally {
    await pool.end()
  }
}

runMigrations()
