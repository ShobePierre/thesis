/**
 * Database Connection Test
 * Usage: node backend/test-db.js
 */

const db = require('./config/db');

console.log('Testing database connection...\n');

// Test 1: Check if database is connected
db.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Database connection successful!\n');

  // Test 2: Check if super admin exists
  db.query('SELECT user_id, username, email, role_id FROM users WHERE role_id = 1', (err, results) => {
    if (err) {
      console.error('❌ Query failed:', err.message);
      process.exit(1);
    }

    if (results.length === 0) {
      console.log('❌ No super admin user found!');
      console.log('\n📋 Run this SQL to create a super admin:\n');
      console.log(`INSERT INTO users (role_id, username, email, password, created_at, updated_at)`);
      console.log(`VALUES (1, 'superadmin', 'admin@example.com', '$2b$10$jDe4B4.DSsnCE0oz1VDsUetUyVR/QrfUSLqy6E0vpWUfUSG2piG7S', NOW(), NOW());\n`);
    } else {
      console.log('✅ Super admin user found:');
      results.forEach(user => {
        console.log(`   - ID: ${user.user_id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role_id}`);
      });
    }

    // Test 3: Check all users
    db.query('SELECT COUNT(*) as total FROM users', (err, results) => {
      if (err) {
        console.error('❌ Query failed:', err.message);
        process.exit(1);
      }
      console.log(`\n📊 Total users in database: ${results[0].total}`);
      process.exit(0);
    });
  });
});
