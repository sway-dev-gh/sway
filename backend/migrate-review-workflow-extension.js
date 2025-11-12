const fs = require('fs');
const path = require('path');
const pool = require('./src/db/pool');

// Read migration file
const migrationPath = path.join(__dirname, 'migrations/016_review_workflow_extension.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

async function migrateReviewWorkflowExtension() {
  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();

    console.log('🚀 Running review workflow extension migration...');
    await client.query(migration);

    console.log('✅ Review workflow extension migration completed successfully!');
    console.log('📊 Enhanced existing tables:');
    console.log('  - projects (added workspace_type, workflow_template, default_reviewers, auto_assign_reviewers, external_access_enabled)');
    console.log('  - file_sections (added section_status, assigned_reviewers, is_required_for_approval, position fields)');
    console.log('🆕 New tables created:');
    console.log('  - file_workflow_states');
    console.log('  - section_reviews');
    console.log('  - section_comments');
    console.log('  - file_versions');
    console.log('  - external_access_tokens');
    console.log('  - workflow_rules');
    console.log('  - review_analytics');
    console.log('🔧 Added comprehensive indexing and triggers for performance');

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateReviewWorkflowExtension();