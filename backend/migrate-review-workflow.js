const fs = require('fs');
const path = require('path');
const pool = require('./src/db/pool');

// Read migration file
const migrationPath = path.join(__dirname, 'migrations/015_review_workflow_system.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

async function migrateReviewWorkflow() {
  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();

    console.log('🚀 Running review workflow migration...');
    await client.query(migration);

    console.log('✅ Review workflow migration completed successfully!');
    console.log('📊 New tables created:');
    console.log('  - file_workflow_states');
    console.log('  - file_sections');
    console.log('  - section_reviews');
    console.log('  - section_comments');
    console.log('  - file_versions');
    console.log('  - external_access_tokens');
    console.log('  - workflow_rules');
    console.log('  - review_analytics');
    console.log('🔧 Enhanced existing projects table with workflow features');

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateReviewWorkflow();