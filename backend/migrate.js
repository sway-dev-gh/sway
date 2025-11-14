#!/usr/bin/env node

/**
 * Unified Migration CLI
 * Replaces all the chaos: deploy-migrations.js, emergency-migrate.js, etc.
 *
 * Usage:
 *   node migrate.js status          # Show migration status
 *   node migrate.js run             # Run all pending migrations
 *   node migrate.js rollback        # Rollback last migration (dangerous)
 *   node migrate.js --help          # Show help
 */

const MigrationManager = require('./src/db/migrationManager')

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'status'

  const migrationManager = new MigrationManager()

  try {
    switch (command) {
      case 'status':
        await showStatus(migrationManager)
        break

      case 'run':
        await runMigrations(migrationManager)
        break

      case 'rollback':
        await rollbackMigration(migrationManager)
        break

      case '--help':
      case 'help':
        showHelp()
        break

      default:
        console.error(`❌ Unknown command: ${command}`)
        showHelp()
        process.exit(1)
    }

    process.exit(0)

  } catch (error) {
    console.error('❌ Migration command failed:', error.message)
    process.exit(1)
  }
}

async function showStatus(migrationManager) {
  console.log('📊 Migration Status')
  console.log('==================')

  const status = await migrationManager.getStatus()

  console.log(`Total migrations: ${status.total}`)
  console.log(`Executed: ${status.executed}`)
  console.log(`Pending: ${status.pending}`)
  console.log('')

  if (status.migrations.executed.length > 0) {
    console.log('✅ Executed Migrations:')
    status.migrations.executed.forEach(migration => {
      const date = new Date(migration.executed_at).toLocaleDateString()
      console.log(`  ${migration.version} - ${migration.name} (${date})`)
    })
    console.log('')
  }

  if (status.migrations.pending.length > 0) {
    console.log('⏳ Pending Migrations:')
    status.migrations.pending.forEach(migration => {
      console.log(`  ${migration.version} - ${migration.name}`)
    })
    console.log('')
    console.log(`💡 Run 'node migrate.js run' to execute pending migrations`)
  } else {
    console.log('🎉 All migrations are up to date!')
  }
}

async function runMigrations(migrationManager) {
  console.log('🚀 Running Migrations')
  console.log('====================')

  const result = await migrationManager.runMigrations()

  if (result.executed === 0) {
    console.log('✅ All migrations were already up to date')
  } else {
    console.log(`🎉 Successfully executed ${result.executed} migrations`)
  }
}

async function rollbackMigration(migrationManager) {
  console.log('⚠️  Rolling Back Last Migration')
  console.log('===============================')
  console.log('WARNING: This is a dangerous operation!')

  try {
    await migrationManager.rollbackLast()
  } catch (error) {
    console.error('❌ Rollback failed:', error.message)
    throw error
  }
}

function showHelp() {
  console.log(`
🗃️  Unified Migration Manager

USAGE:
  node migrate.js <command>

COMMANDS:
  status     Show current migration status (default)
  run        Execute all pending migrations
  rollback   Rollback last migration (dangerous!)
  help       Show this help message

EXAMPLES:
  node migrate.js                  # Show status
  node migrate.js status           # Show detailed status
  node migrate.js run              # Run all pending migrations

MIGRATION FILE FORMAT:
  - Use format: 001_description.sql or 20231114_description.sql
  - Only numbered migrations will be processed
  - Files must be in /migrations directory

SAFETY:
  - All migrations run in transactions
  - Failed migrations are recorded
  - Checksums prevent accidental re-execution
  - Status tracking prevents conflicts

This replaces all old migration scripts:
  ❌ deploy-migrations.js
  ❌ emergency-migrate.js
  ❌ migrate-review-workflow.js
  ❌ run-migration.js
  ❌ run-production-migrations.js
  ❌ run-single-migration.js
  ❌ And 2 more...
`)
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Migration interrupted by user')
  process.exit(130)
})

process.on('SIGTERM', () => {
  console.log('\n⏹️  Migration terminated')
  process.exit(143)
})

// Run the CLI
main().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
