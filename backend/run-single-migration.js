const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
})

async function runMigration() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('Usage: node run-single-migration.js <migration-file>')
    console.error('Example: node run-single-migration.js 013_add_field_requirements.sql')
    process.exit(1)
  }

  try {
    console.log('Connecting to database...')
    console.log(`Running migration: ${migrationFile}`)

    const migrationPath = path.join(__dirname, 'migrations', migrationFile)

    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8')
    await pool.query(sql)

    console.log(`✓ ${migrationFile} completed successfully`)
    process.exit(0)
  } catch (error) {
    console.error('✗ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
