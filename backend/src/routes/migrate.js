const express = require('express')
const router = express.Router()
const pool = require('../db/pool')

// Simple migration endpoint - just visit this URL
router.get('/run-collaboration-migrations', async (req, res) => {
  try {
    console.log('🚀 Running collaboration migrations...')

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

      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          recipient_id UUID NOT NULL,
          sender_id UUID,
          type VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT,
          priority VARCHAR(50) DEFAULT 'normal',
          is_read BOOLEAN DEFAULT false,
          is_dismissed BOOLEAN DEFAULT false,
          action_url TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    await pool.query(sql)

    res.json({
      success: true,
      message: '🔥🔥🔥 COLLABORATION PLATFORM IS NOW LIVE! EVERYTHING IS DIALED TF IN!'
    })

  } catch (error) {
    console.error('Migration error:', error)
    res.json({
      success: false,
      error: error.message,
      message: 'Migration failed but might be because tables already exist'
    })
  }
})

module.exports = router