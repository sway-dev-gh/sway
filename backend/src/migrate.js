#!/usr/bin/env node
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const pool = require('./db/pool')

const runMigration = async (migrationFile) => {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`)

    const migrationPath = path.join(__dirname, '../migrations', migrationFile)
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute the migration
    await pool.query(sql)

    console.log(`✅ Migration completed: ${migrationFile}`)
    return true
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`)
    console.error('Error:', error.message)
    return false
  }
}

const main = async () => {
  try {
    console.log('🚀 Starting collaboration feature migrations...\n')

    // Check database connection
    try {
      const result = await pool.query('SELECT NOW()')
      console.log(`✅ Database connected: ${result.rows[0].now}\n`)
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
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

    console.log(`\n🎉 Migration Summary:`)
    console.log(`✅ ${successCount}/${migrations.length} migrations completed`)

    if (successCount === migrations.length) {
      console.log('\n🔥 ALL COLLABORATION FEATURES ARE NOW LIVE!')
      console.log('📋 New Tables Created:')
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
    }

  } catch (error) {
    console.error('❌ Migration process failed:', error.message)
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