const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'virtulab_db',
      port: 3306,
    });

    console.log('✅ Connected successfully!');

    // Check if column already exists
    console.log('\n📋 Checking if is_correct column exists...');
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM activity_submissions WHERE Field = 'is_correct'"
    );

    if (columns.length > 0) {
      console.log('✅ Column is_correct already exists!');
      return;
    }

    console.log('❌ Column is_correct does not exist, adding it...');

    // Add the column
    await connection.query(
      'ALTER TABLE activity_submissions ADD COLUMN is_correct TINYINT(1) DEFAULT 0 AFTER checkpoint_data'
    );

    console.log('✅ Column is_correct added successfully!');

    // Verify it was added
    const [newColumns] = await connection.query(
      "SHOW COLUMNS FROM activity_submissions WHERE Field = 'is_correct'"
    );

    if (newColumns.length > 0) {
      console.log('✅ Verification successful! Column details:');
      console.log(newColumns[0]);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

runMigration();
