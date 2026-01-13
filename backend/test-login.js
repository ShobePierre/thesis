/**
 * Password Verification Test
 * Usage: node backend/test-login.js admin@example.com password123
 */

const bcrypt = require('bcryptjs');
const db = require('./config/db');

const email = process.argv[2] || 'admin@example.com';
const testPassword = process.argv[3] || 'password123';

console.log(`\nTesting login for: ${email}\n`);

db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }

  if (results.length === 0) {
    console.error(`❌ User not found with email: ${email}`);
    process.exit(1);
  }

  const user = results[0];
  console.log(`✅ User found:`);
  console.log(`   ID: ${user.user_id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role_id}`);
  console.log(`   Stored Hash: ${user.password.substring(0, 20)}...`);

  console.log(`\nTesting password: "${testPassword}"`);

  try {
    const isMatch = await bcrypt.compare(testPassword, user.password);
    
    if (isMatch) {
      console.log('✅ ✅ ✅ PASSWORD MATCHES! Login should work!\n');
    } else {
      console.log('❌ Password does NOT match stored hash\n');
      console.log('To fix: Generate new hash and update database:');
      console.log('  1. Run: node generate-hash.js password123');
      console.log('  2. Copy the hash');
      console.log('  3. Run SQL: UPDATE users SET password = "NEWHASH" WHERE email = "' + email + '";');
    }
  } catch (err) {
    console.error('❌ Error comparing passwords:', err.message);
  }

  process.exit(0);
});
