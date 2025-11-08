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

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '005_add_request_type_designs.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Running migration: 005_add_request_type_designs.sql')

    await pool.query(sql)

    console.log('✓ Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('✗ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
