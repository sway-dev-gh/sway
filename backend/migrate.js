const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read schema file
const schemaPath = path.join(__dirname, 'src/db/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Connect to database using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    console.log('Running migration...');
    await client.query(schema);

    console.log('✓ Migration completed successfully!');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
