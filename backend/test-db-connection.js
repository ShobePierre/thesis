const mysql = require('mysql2');
require('dotenv').config();

console.log('🔍 Testing MySQL Connection...');
console.log('Parameters:');
console.log('  Host:', process.env.DB_HOST || 'localhost');
console.log('  Port:', process.env.DB_PORT || 3306);
console.log('  User:', process.env.DB_USER || 'root');
console.log('  Database:', process.env.DB_NAME || 'virtulab_db');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'virtulab_db',
  port: process.env.DB_PORT || 3306,
  connectTimeout: 10000,
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection Failed:', err.message);
    console.error('Error Code:', err.code);
    process.exit(1);
  } else {
    console.log('✅ Connection Successful!');
    
    // Test query
    connection.query('SELECT 1', (error, results) => {
      if (error) {
        console.error('❌ Query Failed:', error.message);
      } else {
        console.log('✅ Query Successful!');
        console.log('Results:', results);
      }
      connection.end();
      process.exit(0);
    });
  }
});

// Timeout after 15 seconds
setTimeout(() => {
  console.error('❌ Connection timeout - MySQL not responding');
  process.exit(1);
}, 15000);
