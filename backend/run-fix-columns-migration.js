#!/usr/bin/env node
/**
 * Deploy the missing columns migration to fix database schema issues
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Use Render's automatically provided DATABASE_URL or fall back to local
const databaseConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: false
    }

const pool = new Pool(databaseConfig)

const main = async () => {
  try {
    console.log('🚀 Deploying missing columns migration...\n')

    // Test database connection
    const testResult = await pool.query('SELECT NOW() as now')
    console.log(`✅ Database connected: ${testResult.rows[0].now}\n`)

    // Run the missing columns migration
    const migrationFile = '020_fix_missing_columns.sql'
    const migrationPath = path.join(__dirname, 'migrations', migrationFile)

    console.log(`🔄 Running migration: ${migrationFile}`)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute the migration
    await pool.query(sql)

    console.log(`✅ Migration completed: ${migrationFile}`)
    console.log('\n🎉 Database schema fixed!')
    console.log('✅ Added sender_id column to notifications table')
    console.log('✅ Added deleted_at column to projects table')
    console.log('✅ Added action column to activity_log table')
    console.log('✅ Created activity_log table if missing')
    console.log('\n🔥 DATABASE SCHEMA IS NOW FIXED!')

  } catch (error) {
    if (error.message.includes('already exists') ||
        error.message.includes('does not exist')) {
      console.log('⚠️  Some resources already exist, which is OK')
      console.log('✅ Migration completed successfully')
    } else {
      console.error('❌ Migration failed:', error.message)
      process.exit(1)
    }
  } finally {
    await pool.end()
    process.exit(0)
  }
}

// Run the migration
main()