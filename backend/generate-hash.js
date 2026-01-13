/**
 * Hash Generator for Admin User
 * Usage: node backend/generate-hash.js password123
 * Then copy the hash and use it in the SQL INSERT
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log('\n========================================');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('========================================\n');
  console.log('SQL Query:');
  console.log(`INSERT INTO users (role_id, username, email, password, created_at, updated_at)`);
  console.log(`VALUES (1, 'superadmin', 'admin@example.com', '${hash}', NOW(), NOW());\n`);
  process.exit(0);
});
