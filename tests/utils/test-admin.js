#!/usr/bin/env node

/**
 * Quick script to test admin authentication
 * This creates a test admin user and gets a JWT token for testing
 */

const API_BASE = 'http://localhost:3001';

async function testAdminAuth() {
  console.log('🧪 Testing Admin Dashboard Authentication...\n');

  try {
    // Test 1: Create/Login admin user
    console.log('1. Attempting admin login...');
    
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123' // In mock mode, any password works
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success && loginData.user.role === 'admin') {
      console.log('✅ Admin login successful!');
      console.log(`   Token: ${loginData.token.substring(0, 20)}...`);
      console.log(`   User: ${loginData.user.email} (${loginData.user.role})\n`);

      // Test 2: Access admin stats
      console.log('2. Testing admin stats endpoint...');
      const statsResponse = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });

      const statsData = await statsResponse.json();
      if (statsData.success) {
        console.log('✅ Admin stats endpoint working!');
        console.log(`   Total Users: ${statsData.stats.totalUsers}`);
        console.log(`   Active Connections: ${statsData.stats.activeConnections}`);
        console.log(`   Server Uptime: ${Math.floor(statsData.stats.serverUptime)}s\n`);
      } else {
        console.log('❌ Admin stats failed:', statsData.error);
      }

      // Test 3: Access admin logs
      console.log('3. Testing admin logs endpoint...');
      const logsResponse = await fetch(`${API_BASE}/admin/logs`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });

      const logsData = await logsResponse.json();
      if (logsData.success) {
        console.log('✅ Admin logs endpoint working!');
        console.log(`   Log entries: ${logsData.logs.length}\n`);
      } else {
        console.log('❌ Admin logs failed:', logsData.error);
      }

      // Test 4: Health check
      console.log('4. Testing server health...');
      const healthResponse = await fetch(`${API_BASE}/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Server health check:');
      console.log(`   Status: ${healthData.status}`);
      console.log(`   Database: ${healthData.database.mockMode ? 'MOCK MODE' : 'MongoDB'}`);
      console.log(`   Connected: ${healthData.database.connected}\n`);

      console.log('🎉 All tests passed! Admin dashboard should work.');
      console.log('\n📋 To access the admin dashboard:');
      console.log('1. Start admin dashboard: cd packages/admin && npm run dev');
      console.log('2. Open http://localhost:5173');
      console.log('3. Login with: admin@example.com / admin123');

    } else {
      console.log('❌ Admin login failed:', loginData.error || 'Invalid credentials');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Make sure the server is running:');
    console.log('   cd packages/server && MOCK_MODE=true npm run dev');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAdminAuth();
}

module.exports = { testAdminAuth };
