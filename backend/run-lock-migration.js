const db = require('./config/db');

const migration = `
ALTER TABLE users ADD COLUMN is_locked BOOLEAN DEFAULT FALSE AFTER profile_picture;
ALTER TABLE users ADD COLUMN locked_at DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN locked_reason VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD INDEX idx_is_locked (is_locked);
`;

const queries = migration.split(';').filter(q => q.trim());

let completed = 0;
queries.forEach((query, index) => {
  db.query(query, (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log(`✓ Column already exists (query ${index + 1})`);
      } else {
        console.error(`✗ Error in query ${index + 1}:`, err.message);
        process.exit(1);
      }
    } else {
      console.log(`✓ Query ${index + 1} executed successfully`);
    }
    
    completed++;
    if (completed === queries.length) {
      console.log('\n✓ Migration completed successfully!');
      process.exit(0);
    }
  });
});
