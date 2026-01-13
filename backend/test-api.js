/**
 * API Endpoint Test
 * Usage: node backend/test-api.js TOKEN
 * Where TOKEN is a valid JWT token from login
 */

const axios = require('axios');

const token = process.argv[2];

if (!token) {
  console.error('❌ Please provide a JWT token as argument');
  console.log('Usage: node test-api.js YOUR_JWT_TOKEN');
  process.exit(1);
}

const BASE_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

async function testEndpoints() {
  console.log('\n🧪 Testing Super Admin API Endpoints\n');

  try {
    // Test 1: Get Users
    console.log('1️⃣  Testing GET /superadmin/users');
    try {
      const response = await client.get('/superadmin/users');
      console.log('✅ Success:', response.status);
      console.log(`   Found ${response.data.users?.length || 0} users\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.status, err.response?.data?.message || err.message, '\n');
    }

    // Test 2: Get Audit Logs
    console.log('2️⃣  Testing GET /superadmin/audit-logs');
    try {
      const response = await client.get('/superadmin/audit-logs?limit=5');
      console.log('✅ Success:', response.status);
      console.log(`   Found ${response.data.logs?.length || 0} audit logs\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.status, err.response?.data?.message || err.message, '\n');
    }

    // Test 3: Get Config
    console.log('3️⃣  Testing GET /superadmin/config');
    try {
      const response = await client.get('/superadmin/config');
      console.log('✅ Success:', response.status);
      console.log(`   Config keys: ${Object.keys(response.data).join(', ')}\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.status, err.response?.data?.message || err.message, '\n');
    }

    // Test 4: Get Submissions
    console.log('4️⃣  Testing GET /superadmin/submissions');
    try {
      const response = await client.get('/superadmin/submissions');
      console.log('✅ Success:', response.status);
      console.log(`   Found ${response.data.submissions?.length || 0} submissions\n`);
    } catch (err) {
      console.error('❌ Failed:', err.response?.status, err.response?.data?.message || err.message, '\n');
    }

  } catch (err) {
    console.error('Fatal error:', err.message);
  }

  console.log('✅ All tests completed!\n');
  process.exit(0);
}

testEndpoints();
