#!/usr/bin/env node
/**
 * EMERGENCY MIGRATION - Direct production database connection
 * Runs all collaboration migrations immediately
 */

const { Pool } = require('pg')

// Direct production database connection
const pool = new Pool({
  connectionString: "postgresql://sway:RGWuF5FX9KYBcBnDBe1NBym6H4myzNpL@dpg-d472qsuuk2gs73fi3olg-a/sway_c8c1",
  ssl: { rejectUnauthorized: false }
})

async function runEmergencyMigration() {
  try {
    console.log('🚨 EMERGENCY MIGRATION STARTING...')
    console.log('🔌 Connecting to production database...')

    // Test connection first
    const testResult = await pool.query('SELECT NOW() as now')
    console.log(`✅ Connected at: ${testResult.rows[0].now}`)

    console.log('🚀 Running collaboration migrations...')

    // Complete collaboration platform SQL
    const sql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          project_type VARCHAR(50) DEFAULT 'review',
          status VARCHAR(50) DEFAULT 'active',
          visibility VARCHAR(50) DEFAULT 'private',
          settings JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS collaborations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL,
          collaborator_id UUID NOT NULL,
          role VARCHAR(50) DEFAULT 'viewer',
          status VARCHAR(50) DEFAULT 'active',
          permissions JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reviews (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL,
          reviewer_id UUID NOT NULL,
          assignee_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          priority VARCHAR(50) DEFAULT 'medium',
          due_date TIMESTAMP WITH TIME ZONE,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS review_comments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          review_id UUID NOT NULL,
          user_id UUID NOT NULL,
          content TEXT NOT NULL,
          comment_type VARCHAR(50) DEFAULT 'general',
          parent_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS team_invitations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL,
          inviter_id UUID NOT NULL,
          invitee_email VARCHAR(255) NOT NULL,
          invitee_id UUID,
          role VARCHAR(50) DEFAULT 'viewer',
          status VARCHAR(50) DEFAULT 'pending',
          expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activity_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          project_id UUID,
          action_type VARCHAR(100) NOT NULL,
          action_details JSONB DEFAULT '{}'::jsonb,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS project_files (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          project_id UUID NOT NULL,
          file_request_id UUID,
          filename VARCHAR(255) NOT NULL,
          original_filename VARCHAR(255),
          file_size BIGINT,
          file_type VARCHAR(100),
          storage_path TEXT,
          upload_status VARCHAR(50) DEFAULT 'pending',
          uploaded_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notification_subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          project_id UUID,
          subscription_type VARCHAR(100) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          preferences JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Execute the migration
    await pool.query(sql)

    console.log('')
    console.log('🔥🔥🔥 COLLABORATION PLATFORM IS NOW LIVE! 🔥🔥🔥')
    console.log('🌎 swayfiles.com collaboration features deployed!')
    console.log('📋 Database tables created:')
    console.log('   ✅ projects')
    console.log('   ✅ collaborations')
    console.log('   ✅ reviews')
    console.log('   ✅ review_comments')
    console.log('   ✅ team_invitations')
    console.log('   ✅ activity_log')
    console.log('   ✅ project_files')
    console.log('   ✅ notification_subscriptions')
    console.log('')
    console.log('🎯 EVERYTHING IS NOW DIALED TF IN!')

  } catch (error) {
    console.error('❌ EMERGENCY MIGRATION FAILED:', error.message)
    console.error('Full error:', error)
  } finally {
    await pool.end()
    console.log('\n🔌 Database connection closed')
  }
}

// Run the migration
runEmergencyMigration()