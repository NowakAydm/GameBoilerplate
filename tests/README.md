# GameBoilerplate Test Suite

This directory contains a comprehensive, organized testing suite for the GameBoilerplate project with clear separation between different types of tests.

## 📁 Test Structure

```
tests/
├── unit/                    # Unit tests (fast, isolated)
│   ├── shared/             # Shared package unit tests
│   │   ├── engine/         # Game engine components
│   │   │   ├── ActionSystem.test.ts
│   │   │   ├── GameEngine.test.ts
│   │   │   └── types.test.ts
│   │   ├── index.test.ts   # Main shared package tests
│   │   ├── actionSchemas.test.ts
│   │   ├── example.test.ts
│   │   └── README.md
│   └── server/             # Server unit tests
│       └── index.test.ts
├── integration/            # Integration tests (component interaction)
│   └── admin/              # Admin dashboard integration tests
│       ├── admin-dashboard.jest.test.js
│       ├── admin-dashboard.test.js
│       ├── admin-mock-server.jest.test.js
│       ├── admin-routes.test.js
│       ├── admin-simple.jest.test.js
│       ├── charts-analytics.jest.test.js
│       ├── charts-analytics.test.js
│       ├── metrics-service.test.js
│       └── user-management.test.js
├── e2e/                    # End-to-end tests (full user workflows)
│   ├── visual-regression.test.ts
│   ├── smoke.test.ts
│   └── playwright.config.ts
├── config/                 # Test configurations
│   ├── jest.config.js      # Main Jest config
│   ├── jest.unit.config.js # Unit test config
│   ├── jest.integration.config.js # Integration test config
│   ├── jest.setup.js       # Test setup and globals
│   ├── .babelrc           # Babel configuration
│   └── tsconfig.json      # TypeScript configuration
└── utils/                  # Test utilities and helpers
    ├── mock-server.js
    ├── mock-server.enhanced.js
    ├── run-all-tests.js
    └── test-admin.js
```

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Unit tests only (fast)
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests
npm run test:e2e

# All unit and integration tests
npm run test:all
```

### Run Specific Component Tests
```bash
# Shared package tests
npm run test:shared

# Admin dashboard tests
npm run test:admin
```

### Development Workflow
```bash
# Watch mode for active development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🎯 Test Categories

### Unit Tests (`/unit`)
- **Purpose**: Test individual components in isolation
- **Speed**: Very fast (< 5 seconds)
- **Dependencies**: None (mocked)
- **Coverage**: Shared package, server components
- **Run with**: `npm run test:unit`

### Integration Tests (`/integration`)
- **Purpose**: Test component interactions and workflows
- **Speed**: Moderate (5-30 seconds)
- **Dependencies**: May require mock servers
- **Coverage**: Admin dashboard, API endpoints, user flows
- **Run with**: `npm run test:integration`

### End-to-End Tests (`/e2e`)
- **Purpose**: Test complete user workflows
- **Speed**: Slow (30+ seconds)
- **Dependencies**: Full application stack
- **Coverage**: Visual regression, smoke tests
- **Run with**: `npm run test:e2e`

## 🔧 Configuration

### Jest Configurations
- **jest.config.js**: Main configuration for all tests
- **jest.unit.config.js**: Optimized for fast unit tests
- **jest.integration.config.js**: Setup for integration tests

### Playwright Configuration
- **playwright.config.ts**: E2E test configuration in `/e2e` directory

## 📊 Test Coverage

### Unit Tests Coverage
- **Shared Package**: 81 tests covering schemas, engine, types
- **Game Engine**: Complete lifecycle and entity management
- **Action System**: Action registration, execution, cooldowns
- **Type Validation**: Interface and structure validation

### Integration Tests Coverage
- **Admin Dashboard**: Component rendering and interactions
- **Charts & Analytics**: Data visualization and metrics
- **User Management**: Role-based filtering and operations
- **API Routes**: Endpoint testing and authentication
- **Real-time Features**: Live user session monitoring

### E2E Tests Coverage
- **Visual Regression**: UI consistency across updates
- **Smoke Tests**: Critical path functionality
- **Cross-browser Testing**: Compatibility verification

## 🛠️ Adding New Tests

### Unit Test
```javascript
// tests/unit/[component]/feature.test.ts
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Test implementation
  });
});
```

### Integration Test
```javascript
// tests/integration/[feature]/workflow.test.js
describe('Feature Integration', () => {
  beforeAll(async () => {
    // Setup mock server or dependencies
  });
  
  it('should handle complete workflow', async () => {
    // Test implementation
  });
});
```

### E2E Test
```typescript
// tests/e2e/user-flow.test.ts
import { test, expect } from '@playwright/test';

test('user can complete workflow', async ({ page }) => {
  // Test implementation
});
```

## 🚨 Prerequisites

### For Unit Tests
- No additional setup required

### For Integration Tests
- Server may need to be running: `npm run dev:server`
- Admin user credentials: `admin@example.com` / `admin123`

### For E2E Tests
- Full application stack running
- All services available on expected ports

## 📈 Performance Guidelines

- **Unit Tests**: Should complete in < 5 seconds total
- **Integration Tests**: Should complete in < 30 seconds total
- **E2E Tests**: Budget 1-5 minutes depending on scope

## 🔍 Debugging Tests

### Debug Unit Tests
```bash
npm run test:unit -- --verbose --no-coverage
```

### Debug Integration Tests
```bash
npm run test:integration -- --verbose --detectOpenHandles
```

### Debug E2E Tests
```bash
npm run test:e2e -- --debug --headed
```

## 📝 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, specific test descriptions
3. **Fast Feedback**: Keep unit tests fast and focused
4. **Real Scenarios**: Integration tests should mirror real usage
5. **Visual Validation**: Use E2E tests for UI consistency
6. **Coverage Goals**: Aim for 80%+ unit test coverage
7. **Documentation**: Update this README when adding new test types

## 🏃‍♂️ CI/CD Integration

Tests are organized to support different CI/CD stages:
- **PR Checks**: Unit tests (fast feedback)
- **Integration Builds**: Unit + Integration tests
- **Release Pipeline**: Full test suite including E2E

---

*Last updated: July 31, 2025*

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
