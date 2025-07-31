/**
 * Jest Setup for Admin Dashboard Tests
 * Configures global variables, test environment, and mock server
 */

const MockServer = require('./mock-server');

// Mock server instance
let mockServer = null;

// Setup mock server before all tests
beforeAll(async () => {
  mockServer = new MockServer(3001);
  await mockServer.start();
});

// Cleanup mock server after all tests
afterAll(async () => {
  if (mockServer) {
    await mockServer.stop();
  }
});

// Global fetch for Node.js environment
global.fetch = require('node-fetch');

// Browser environment mocks for game engine tests
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16); // ~60fps
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Global test constants
global.API_BASE = 'http://localhost:3001';
global.ADMIN_EMAIL = 'admin@example.com';
global.ADMIN_PASSWORD = 'admin123';

// Admin credentials for mock server
global.ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Test timeout for async operations
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

global.mockConsole = () => {
  console.log = jest.fn();
  console.warn = jest.fn();
};

global.restoreConsole = () => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
};

// Helper function to get admin token (updated for mock server)
global.getAdminToken = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(global.ADMIN_CREDENTIALS)
    });
    
    const data = await response.json();
    if (data.token) {
      return data.token;
    }
    throw new Error('Admin login failed');
  } catch (error) {
    throw new Error(`Could not get admin token: ${error.message}`);
  }
};

// Helper function to check server availability
global.checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Skip tests if server is not available (should not happen with mock server)
global.skipIfServerDown = async () => {
  const isServerUp = await checkServerHealth();
  if (!isServerUp) {
    console.warn('⚠️ Server is not running - skipping integration tests');
    return true;
  }
  return false;
};
