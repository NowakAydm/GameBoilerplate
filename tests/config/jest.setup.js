/**
 * Jest Setup for Admin Dashboard Tests
 * Configures global variables, test environment, and utilities
 */

// No global mock server - each test file manages its own mock server

// Global fetch for Node.js environment
global.fetch = require('node-fetch');

// Global test constants
global.API_BASE = 'http://localhost:3000';  // Use actual server
global.ADMIN_EMAIL = 'admin@example.com';
global.ADMIN_PASSWORD = 'admin123';

// Mock admin token to avoid server dependency
global.MOCK_ADMIN_TOKEN = 'mock-admin-token-12345';

// Admin credentials for testing
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

// Helper function to get admin token (mocked for unit tests)
global.getAdminToken = async () => {
  // Return mock token to avoid server dependency in unit tests
  return global.MOCK_ADMIN_TOKEN;
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

// Skip tests if server is not available (for integration tests)
global.skipIfServerDown = async () => {
  const isServerUp = await checkServerHealth();
  if (!isServerUp) {
    console.warn('⚠️ Server is not running - skipping integration tests');
    return true;
  }
  return false;
};

// Mock fetch responses for unit tests
global.mockFetch = (responses) => {
  global.fetch = jest.fn((url, options) => {
    // Check for authorization
    const headers = options?.headers || {};
    const authHeader = headers['Authorization'] || headers['authorization'];
    
    // If requesting admin endpoint without proper auth, return 401
    if (url.includes('/admin/') && (!authHeader || authHeader === 'Bearer invalid-token')) {
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
        text: () => Promise.resolve('Unauthorized')
      });
    }
    
    const mockResponse = responses[url] || responses.default;
    return Promise.resolve({
      ok: mockResponse.ok !== false,
      status: mockResponse.status || 200,
      json: () => Promise.resolve(mockResponse.data || {}),
      text: () => Promise.resolve(mockResponse.text || '')
    });
  });
};

// Restore original fetch
global.restoreFetch = () => {
  global.fetch = require('node-fetch');
};
