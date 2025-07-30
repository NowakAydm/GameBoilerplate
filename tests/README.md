# Enhanced Admin Dashboard Testing Suite

This directory contains comprehensive unit tests for the enhanced admin dashboard with guest vs registered user analytics functionality.

## Test Coverage

### 🎯 Core Testing Areas
- **Admin Dashboard Frontend Components** - React components with Material-UI
- **Chart Analytics** - Guest vs registered user metrics visualization  
- **User Management** - Role-based filtering and user type analytics
- **MetricsService** - Data collection and processing engine
- **Admin API Routes** - Backend endpoints and authentication
- **Real-time Analytics** - Live user session monitoring
- **Data Consistency** - Cross-component data validation
- **Security & Authorization** - Admin access controls

## Test Files

### Core Test Suites
- `admin-dashboard.test.js` - Frontend dashboard component tests
- `charts-analytics.test.js` - Chart visualization and data tests  
- `user-management.test.js` - User interface and filtering tests
- `metrics-service.test.js` - Backend metrics collection tests
- `admin-routes.test.js` - API endpoint and auth tests

### Test Orchestration
- `run-all-tests.js` - Comprehensive test runner
- `test-admin.js` - Legacy admin authentication tests

### Legacy Testing (Visual Regression)
- `visual-regression.test.ts` - Playwright visual testing
- `playwright.config.ts` - Playwright configuration
- `smoke.test.ts` - Basic functionality tests

### Configuration Files
- `jest.config.js` - Jest testing framework configuration
- `package.json` - Test dependencies and scripts

## Quick Start

### Prerequisites
1. **Server Running**: The backend server must be running for tests to work
   ```bash
   npm run dev:server
   ```

2. **Admin User**: Tests require an admin user with credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

### Running Tests

#### All Test Suites
```bash
# From project root
npm run test:admin

# From tests directory  
node run-all-tests.js
```

#### Individual Test Categories
```bash
# Dashboard frontend tests
npm run test:admin:dashboard

# Chart analytics tests
npm run test:admin:charts

# User management tests  
npm run test:admin:users

# MetricsService tests
npm run test:admin:metrics

# Admin API routes tests
npm run test:admin:routes
```

#### Help and Options
```bash
node run-all-tests.js --help
```

## Test Features

### 🔐 Authentication Testing
- Admin login validation
- JWT token handling
- Authorization checks
- Non-admin access prevention

### 📊 Data Analytics Testing
- Guest vs registered user metrics
- User type percentage calculations
- Session tracking accuracy
- Game action analytics
- Playtime measurements

### 🎨 Frontend Component Testing
- Dashboard component rendering
- Chart data visualization
- User interface interactions
- Real-time data updates

### 🔧 Backend API Testing
- Endpoint response validation
- Data structure verification
- Error handling
- Performance benchmarking
- Concurrent request handling

### 📈 Metrics Validation
- Data consistency across endpoints
- Calculation accuracy
- Edge case handling
- Zero-value scenarios

## Test Output

### Success Example
```
🚀 ENHANCED ADMIN DASHBOARD TEST SUITE
Testing guest vs registered user analytics implementation

✅ Server is running and accessible

============================================================
🧪 RUNNING: ADMIN DASHBOARD TESTS
============================================================
✅ Admin dashboard test passed:
📊 Dashboard Component Tests: All passed
🔐 Authentication: Working
📈 User Metrics: 5 registered, 3 guests (62% vs 38%)
🎯 Analytics Cards: 8 metrics displayed correctly
⚡ Real-time Updates: Functional

✅ Admin Dashboard Tests completed successfully in 1247ms

============================================================
📊 COMPREHENSIVE TEST REPORT  
============================================================

📈 Summary:
   Total Test Suites: 5
   ✅ Passed: 5
   ❌ Failed: 0
   ⏱️  Total Duration: 6543ms (7s)
   📊 Success Rate: 100%
```

### Failure Example
```
❌ User Management Tests failed after 2341ms:
   Error: Admin login failed

⚠️  Action Items:
   • Review failed test outputs above
   • Check server logs for additional context
   • Verify Mock Mode is properly configured
```

## Legacy Visual Regression Testing

This directory also contains example tests and configuration for Playwright, Pixelmatch, and PNG.js for visual regression testing.

### Usage

1. Start your development server (e.g., `npm run dev` in the client package).
2. Run Playwright tests from this directory:

   ```sh
   npx playwright test
   ```

3. On first run, a baseline image will be created in `visual-baseline/`. On subsequent runs, screenshots will be compared to the baseline, and any differences will be output to `visual-diff/`.

### Dependencies

- [Playwright](https://playwright.dev/)
- [Pixelmatch](https://github.com/mapbox/pixelmatch)
- [PNG.js](https://github.com/lukeapage/pngjs)

You may need to install Playwright browsers:

```sh
npx playwright install
```

## Test Data Requirements

### Mock Mode
Tests work with the server's Mock Mode which provides:
- Simulated user data with guest and registered users
- Sample analytics metrics
- Consistent test environment

### Real Data
When connected to a real database, tests validate:
- Actual user registrations
- Live session tracking
- Real-time guest user creation
- Production data accuracy

## Debugging Tests

### Individual Test Execution
```bash
# Run specific test file directly
node admin-dashboard.test.js
node charts-analytics.test.js
node user-management.test.js
```

### Server Health Check
```bash
curl http://localhost:3001/health
```

### Common Issues
1. **Server Not Running**: Start with `npm run dev:server`
2. **Wrong Port**: Verify server is on port 3001
3. **Admin Login Failed**: Check Mock Mode configuration
4. **Database Connection**: Ensure fallback to Mock Mode works

## Performance Benchmarks

### Expected Response Times
- User list endpoint: < 3 seconds
- Metrics calculation: < 3 seconds  
- Chart data generation: < 3 seconds
- Authentication: < 1 second

### Concurrent Request Handling
- Tests validate 5+ simultaneous requests
- Data consistency under load
- Rate limiting behavior

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Admin Dashboard Tests
  run: |
    npm run dev:server &
    sleep 10
    npm run test:admin
```

### Pre-commit Hooks
Add to `.husky/pre-commit`:
```bash
npm run test:admin:routes
```

## Contributing

### Adding New Tests
1. Follow existing test file patterns
2. Include manual test functions
3. Test both success and failure cases
4. Add performance benchmarks
5. Update this README

### Test Structure
```javascript
describe('Feature Tests', () => {
  beforeAll(async () => {
    // Get admin token
  });

  test('should validate feature', async () => {
    // Test implementation
  });
});

async function runFeatureTest() {
  // Manual test function
}
```

## Continuous Improvement

This testing suite will be expanded to include:
- Integration tests for real-time features
- Load testing for scalability
- Visual regression tests
- API contract testing
- Security penetration testing

The tests ensure the enhanced admin dashboard with guest vs registered user analytics works reliably across all scenarios.

## Notes

- Update the URL in `visual-regression.test.ts` to match your local dev server.
- Add more tests as needed for other pages/components.
