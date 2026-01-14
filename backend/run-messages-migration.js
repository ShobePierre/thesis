const db = require('./config/db');

const migration = `
CREATE TABLE IF NOT EXISTS admin_messages (
  message_id INT(11) NOT NULL AUTO_INCREMENT,
  admin_id INT(11) NOT NULL,
  user_id INT(11) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME DEFAULT NULL,
  PRIMARY KEY (message_id),
  FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
`;

const queries = migration.split(';').filter(q => q.trim());

let completed = 0;
queries.forEach((query, index) => {
  db.query(query, (err, results) => {
    if (err) {
      console.error(`✗ Error in query ${index + 1}:`, err.message);
      process.exit(1);
    } else {
      console.log(`✓ Query ${index + 1} executed successfully`);
    }
    
    completed++;
    if (completed === queries.length) {
      console.log('\n✓ Admin messages table created successfully!');
      process.exit(0);
    }
  });
});
