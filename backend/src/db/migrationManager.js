/**
 * Unified Migration Management System
 * Replaces the chaos of 8+ different migration scripts
 */

const pool = require('./pool')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

class MigrationManager {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../migrations')
    this.tableName = 'schema_migrations'
  }

  // Initialize migrations table
  async initializeMigrationsTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          checksum VARCHAR(64) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          execution_time_ms INTEGER,
          status VARCHAR(20) DEFAULT 'completed'
        );

        CREATE INDEX IF NOT EXISTS idx_migrations_version ON ${this.tableName}(version);
        CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON ${this.tableName}(executed_at);
      `)
      console.log('✓ Migrations table initialized')
    } catch (error) {
      console.error('❌ Failed to initialize migrations table:', error)
      throw error
    }
  }

  // Get checksum for migration content
  getChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  // Parse migration filename to extract version and name
  parseMigrationFile(filename) {
    // Handle both numbered (001_name.sql) and timestamped (20231114_name.sql) formats
    const match = filename.match(/^(\d{3,}_|\d{8}_)(.+)\.sql$/)
    if (!match) {
      throw new Error(`Invalid migration filename format: ${filename}`)
    }

    const version = match[1].replace('_', '')
    const name = match[2].replace(/_/g, ' ')

    return { version, name, filename }
  }

  // Get all migration files
  getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .filter(file => {
          // Only include properly numbered migrations, skip ad-hoc ones
          return /^\d{3,}_/.test(file) || /^\d{8}_/.test(file)
        })
        .sort()

      return files.map(file => {
        const filepath = path.join(this.migrationsPath, file)
        const content = fs.readFileSync(filepath, 'utf8')
        const { version, name } = this.parseMigrationFile(file)

        return {
          filename: file,
          filepath,
          version,
          name,
          content,
          checksum: this.getChecksum(content)
        }
      })
    } catch (error) {
      console.error('❌ Failed to read migration files:', error)
      throw error
    }
  }

  // Get executed migrations from database
  async getExecutedMigrations() {
    try {
      const result = await pool.query(`
        SELECT version, name, checksum, executed_at, status
        FROM ${this.tableName}
        ORDER BY executed_at
      `)
      return result.rows
    } catch (error) {
      console.error('❌ Failed to get executed migrations:', error)
      throw error
    }
  }

  // Get pending migrations
  async getPendingMigrations() {
    const allMigrations = this.getMigrationFiles()
    const executedMigrations = await this.getExecutedMigrations()
    const executedVersions = new Set(executedMigrations.map(m => m.version))

    return allMigrations.filter(migration => !executedVersions.has(migration.version))
  }

  // Execute a single migration
  async executeMigration(migration) {
    const startTime = Date.now()

    try {
      console.log(`🔄 Executing migration: ${migration.version} - ${migration.name}`)

      // Begin transaction
      await pool.query('BEGIN')

      // Execute migration content
      await pool.query(migration.content)

      // Record migration
      await pool.query(`
        INSERT INTO ${this.tableName} (version, name, checksum, execution_time_ms)
        VALUES ($1, $2, $3, $4)
      `, [
        migration.version,
        migration.name,
        migration.checksum,
        Date.now() - startTime
      ])

      // Commit transaction
      await pool.query('COMMIT')

      console.log(`✅ Migration completed: ${migration.version} (${Date.now() - startTime}ms)`)

      return { success: true, executionTime: Date.now() - startTime }

    } catch (error) {
      // Rollback on error
      await pool.query('ROLLBACK')

      console.error(`❌ Migration failed: ${migration.version}`, error)

      // Record failure
      try {
        await pool.query(`
          INSERT INTO ${this.tableName} (version, name, checksum, execution_time_ms, status)
          VALUES ($1, $2, $3, $4, 'failed')
        `, [
          migration.version,
          migration.name,
          migration.checksum,
          Date.now() - startTime
        ])
      } catch (recordError) {
        console.error('Failed to record migration failure:', recordError)
      }

      throw error
    }
  }

  // Run all pending migrations
  async runMigrations() {
    try {
      await this.initializeMigrationsTable()

      const pendingMigrations = await this.getPendingMigrations()

      if (pendingMigrations.length === 0) {
        console.log('✅ All migrations are up to date')
        return { executed: 0, total: 0 }
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations`)

      let executed = 0
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration)
        executed++
      }

      console.log(`🎉 Successfully executed ${executed} migrations`)
      return { executed, total: pendingMigrations.length }

    } catch (error) {
      console.error('❌ Migration run failed:', error)
      throw error
    }
  }

  // Get migration status
  async getStatus() {
    try {
      await this.initializeMigrationsTable()

      const allMigrations = this.getMigrationFiles()
      const executedMigrations = await this.getExecutedMigrations()
      const pendingMigrations = await this.getPendingMigrations()

      return {
        total: allMigrations.length,
        executed: executedMigrations.length,
        pending: pendingMigrations.length,
        migrations: {
          executed: executedMigrations,
          pending: pendingMigrations.map(m => ({
            version: m.version,
            name: m.name,
            filename: m.filename
          }))
        }
      }
    } catch (error) {
      console.error('❌ Failed to get migration status:', error)
      throw error
    }
  }

  // Rollback last migration (dangerous!)
  async rollbackLast() {
    try {
      const lastMigration = await pool.query(`
        SELECT version, name FROM ${this.tableName}
        WHERE status = 'completed'
        ORDER BY executed_at DESC
        LIMIT 1
      `)

      if (lastMigration.rows.length === 0) {
        throw new Error('No migrations to rollback')
      }

      const migration = lastMigration.rows[0]

      // This is dangerous - would need rollback scripts
      console.warn(`⚠️ Rollback requested for: ${migration.version} - ${migration.name}`)
      console.warn('⚠️ Rollback functionality requires rollback scripts which are not implemented')
      throw new Error('Rollback functionality not implemented for safety')

    } catch (error) {
      console.error('❌ Rollback failed:', error)
      throw error
    }
  }
}

module.exports = MigrationManager