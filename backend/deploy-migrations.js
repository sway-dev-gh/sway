#!/usr/bin/env node
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

console.log('🔧 Running Database Schema Fix Migration...')

// Get database configuration
let databaseConfig

if (process.env.DATABASE_URL) {
  console.log('🔗 Using DATABASE_URL for production database...')
  databaseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
      rejectUnauthorized: false
    } : false
  }
} else if (process.env.DB_HOST) {
  console.log('🏠 Using local database parameters...')
  databaseConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: false
  }
} else {
  console.error('❌ No database configuration found!')
  process.exit(1)
}

const pool = new Pool(databaseConfig)

const runMigration = async () => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connected:', result.rows[0].now)

    // Run the critical migration 020 to fix missing columns
    console.log('🔄 Running migration 020_fix_missing_columns.sql...')

    const migrationPath = path.join(__dirname, 'migrations', '020_fix_missing_columns.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    await pool.query(sql)
    console.log('✅ Migration 020 completed successfully!')

    // Verify the schema is now correct
    console.log('🔍 Verifying activity_log table schema...')
    const schemaCheck = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'activity_log'
      ORDER BY ordinal_position;
    `)

    console.log('📋 Current activity_log columns:')
    schemaCheck.rows.forEach(row => {
      console.log('   •', row.column_name + ':', row.data_type)
    })

    const requiredColumns = ['action', 'actor_id', 'target_user_id', 'metadata']
    const existingColumns = schemaCheck.rows.map(row => row.column_name)
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    if (missingColumns.length === 0) {
      console.log('🎉 SUCCESS! All required columns are now present!')
      console.log('✅ Database schema is fixed - authentication should work now!')
    } else {
      console.log('⚠️  Still missing columns:', missingColumns)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  } finally {
    await pool.end()
  }
}

runMigration()
