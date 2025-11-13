const { Pool } = require('pg')
require('dotenv').config()

// Use same configuration as main server pool
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sway',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    })

async function fixAuthDatabase() {
  console.log('🔧 Fixing authentication database schema...')

  try {
    // 1. Ensure users table exists with correct schema
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log('✓ Users table ensured')

    // 2. Add plan column if missing
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';
    `).catch(() => {
      // Column already exists, ignore
    })
    console.log('✓ Plan column ensured')

    // 3. Create index on email for faster auth lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `).catch(() => {
      // Index already exists, ignore
    })
    console.log('✓ Email index ensured')

    // 4. Test auth table functionality
    const testResult = await pool.query('SELECT COUNT(*) FROM users')
    console.log(`✓ Auth database working. User count: ${testResult.rows[0].count}`)

    console.log('🎉 Authentication database fix completed successfully!')

  } catch (error) {
    console.error('❌ Error fixing auth database:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run the fix
fixAuthDatabase()
  .then(() => {
    console.log('Database fix completed. You can now test auth endpoints.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to fix database:', error)
    process.exit(1)
  })