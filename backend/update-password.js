/**
 * Update Superadmin Password
 * Usage: node backend/update-password.js
 */

const db = require('./config/db');

const newHash = '$2b$10$jDe4B4.DSsnCE0oz1VDsUetUyVR/QrfUSLqy6E0vpWUfUSG2piG7S';
const email = 'admin@example.com';

console.log('Updating superadmin password...\n');

db.query('UPDATE users SET password = ? WHERE email = ?', [newHash, email], (err) => {
  if (err) {
    console.error('❌ Error updating password:', err.message);
    process.exit(1);
  }

  console.log('✅ Password updated successfully!\n');
  console.log('Now testing the login...\n');

  // Test the new password
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) {
      console.error('❌ Error fetching user');
      process.exit(1);
    }

    const bcrypt = require('bcryptjs');
    const user = results[0];
    const isMatch = await bcrypt.compare('password123', user.password);

    if (isMatch) {
      console.log('✅ ✅ ✅ SUCCESS!');
      console.log('\nYou can now login with:');
      console.log('  Email: admin@example.com');
      console.log('  Password: password123\n');
    } else {
      console.log('❌ Password still doesn\'t match');
    }

    process.exit(0);
  });
});
