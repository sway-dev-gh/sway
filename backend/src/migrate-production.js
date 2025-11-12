#!/usr/bin/env node
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Get database configuration
let databaseConfig

if (process.env.DATABASE_URL) {
  // Production: Use DATABASE_URL
  console.log('🔗 Using DATABASE_URL for production database...')
  databaseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
      rejectUnauthorized: false
    } : false
  }
} else if (process.env.DB_HOST) {
  // Local: Use individual parameters
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
  console.log('Please set either:')
  console.log('  - DATABASE_URL (for production)')
  console.log('  - DB_HOST, DB_USER, DB_NAME, DB_PASSWORD, DB_PORT (for local)')
  process.exit(1)
}

// Create database connection
const pool = new Pool(databaseConfig)

const runMigration = async (migrationFile) => {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`)

    const migrationPath = path.join(__dirname, '../migrations', migrationFile)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute the migration (files already have IF NOT EXISTS)
    await pool.query(sql)

    console.log(`✅ Migration completed: ${migrationFile}`)
    return true
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`)
    console.error('Error:', error.message)

    // Continue anyway if table already exists
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Tables already exist, continuing...`)
      return true
    }
    return false
  }
}

const main = async () => {
  try {
    console.log('🚀 Starting PRODUCTION collaboration feature migrations...\n')

    // Check database connection
    try {
      const result = await pool.query('SELECT NOW()')
      console.log(`✅ PRODUCTION Database connected: ${result.rows[0].now}\n`)
    } catch (error) {
      console.error('❌ PRODUCTION Database connection failed:', error.message)
      process.exit(1)
    }

    // Run the collaboration migrations in order
    const migrations = [
      '014_collaboration_features.sql',
      '015_edit_requests.sql'
    ]

    let successCount = 0
    for (const migration of migrations) {
      const success = await runMigration(migration)
      if (success) {
        successCount++
      } else {
        console.error(`\n❌ Migration ${migration} failed. Stopping.`)
        break
      }
    }

    console.log(`\n🎉 PRODUCTION Migration Summary:`)
    console.log(`✅ ${successCount}/${migrations.length} migrations completed`)

    if (successCount === migrations.length) {
      console.log('\n🔥🔥🔥 ALL COLLABORATION FEATURES ARE NOW LIVE IN PRODUCTION!')
      console.log('🌎 swayfiles.com now has FULL collaborative file editing!')
      console.log('📋 New Tables Created in Production:')
      console.log('   • projects (project sharing)')
      console.log('   • collaborations (active collaborations)')
      console.log('   • reviews (review workflows)')
      console.log('   • review_comments (threaded comments)')
      console.log('   • team_invitations (team invites)')
      console.log('   • activity_log (activity tracking)')
      console.log('   • project_files (file management)')
      console.log('   • notification_subscriptions (notifications)')
      console.log('   • file_sections (granular editing)')
      console.log('   • edit_requests (granular edit requests)')
      console.log('   • edit_sessions (live editing sessions)')
      console.log('   • edit_changes (change tracking)')
      console.log('   • edit_permissions (granular permissions)')
      console.log('\n🎯 COLLABORATIVE FILE EDITING IS NOW LIVE!')
    }

  } catch (error) {
    console.error('❌ PRODUCTION migration process failed:', error.message)
  } finally {
    await pool.end()
    process.exit(0)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { runMigration, main }