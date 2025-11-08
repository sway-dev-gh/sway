const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function runMigration() {
  try {
    console.log('Connecting to database...')

    // Run migrations in order
    const migrations = [
      '004_premium_features.sql',
      '005_add_request_type_designs.sql'
    ]

    for (const migration of migrations) {
      const migrationPath = path.join(__dirname, 'migrations', migration)
      const sql = fs.readFileSync(migrationPath, 'utf-8')

      console.log(`Running migration: ${migration}`)

      await pool.query(sql)

      console.log(`✓ ${migration} completed successfully`)
    }

    console.log('\n✓ All migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('✗ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
