const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'virtulab_db',
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000,
  enableKeepAlive: true,
});

db.connect(err => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    console.error('Connection Details:');
    console.error('  Host:', process.env.DB_HOST || 'localhost');
    console.error('  User:', process.env.DB_USER || 'root');
    console.error('  Database:', process.env.DB_NAME || 'virtulab_db');
    console.error('  Port:', process.env.DB_PORT || 3306);
    console.error('\n⚠️  Make sure MySQL is running and credentials are correct');
    
    // Retry connection after 5 seconds
    console.log('⏳ Retrying in 5 seconds...');
    setTimeout(() => {
      db.connect(err => {
        if (err) {
          console.error('❌ Retry failed. Please check your MySQL server.');
          process.exit(1);
        }
        console.log('✅ MySQL Connected (after retry)...');
      });
    }, 5000);
  } else {
    console.log('✅ MySQL Connected...');
  }
});

// Handle connection errors
db.on('error', err => {
  console.error('⚠️  Database error:', err.code);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('Database had a fatal error.');
  }
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('Database connection pool error.');
  }
});

module.exports = db;
