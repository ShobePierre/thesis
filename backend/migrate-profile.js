const db = require('./config/db');

const sql = `ALTER TABLE users ADD COLUMN profile_picture VARCHAR(255) NULL DEFAULT NULL AFTER password;`;

db.query(sql, (err, result) => {
  if (err) {
    if (err.message.includes('Duplicate column')) {
      console.log('✅ Column profile_picture already exists');
    } else {
      console.error('❌ Error adding column:', err.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Successfully added profile_picture column to users table');
  }
  process.exit(0);
});
