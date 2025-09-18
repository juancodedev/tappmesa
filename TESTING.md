# Testing Documentation - Tappmesa

This document describes the comprehensive testing setup for the Tappmesa project.

## 🧪 Testing Framework

The project uses **Vitest** as the testing framework along with **React Testing Library** for component testing.

### Key Dependencies

- `vitest` - Modern, fast testing framework
- `@testing-library/react` - Simple and complete testing utilities for React
- `@testing-library/jest-dom` - Custom DOM element matchers
- `@testing-library/user-event` - Advanced user event simulation
- `jsdom` - DOM environment for Node.js

## 📁 Test Structure

```
src/test/
├── setup.js                     # Global test configuration
├── utils.js                     # Test utilities and mocks
├── utils/
│   ├── tenantUtils.test.js      # Tenant context utility tests
│   └── cartUtils.test.js        # Cart context utility tests
└── context/
    ├── TenantContext.test.jsx   # TenantContext integration tests
    └── CartContext.test.jsx     # CartContext integration tests
```

## 🚀 Available Test Scripts

```bash
# Run tests in watch mode (development)
npm test

# Run all tests once
npm run test:run

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (explicit)
npm run test:watch
```

## 📋 Test Coverage Areas

### ✅ Utility Functions

**Tenant Utilities (`tenantUtils.test.js`)**
- Subdomain extraction from various URL formats
- Table code parsing and validation
- App type detection (landing, admin, tenant, table)
- Support for local development, production, and custom domains

**Cart Utilities (`cartUtils.test.js`)**
- Item total calculations
- Tax calculations (19% Chilean IVA)
- Price formatting (Chilean pesos)
- Cart item creation and management
- Quantity and notes updates

### ✅ Context Providers

**TenantContext (`TenantContext.test.jsx`)**
- Provider initialization and state management
- Subdomain and table code detection
- Supabase integration mocking
- Error handling (tenant not found)
- Branding application (colors, title)
- Hook usage outside provider error handling

**CartContext (`CartContext.test.jsx`)**
- Cart state management (items, totals, taxes)
- Item addition, update, and removal
- LocalStorage persistence
- Temperature-based item differentiation
- Cart UI state (open/closed)

## 🛠 Test Utilities

### Mock Functions

```javascript
import { createMockSupabase, mockTenant, mockProduct } from './test/utils'

// Create mock Supabase client
const mockSupabase = createMockSupabase()

// Use predefined mock data
const tenant = mockTenant  // Sample tenant data
const product = mockProduct  // Sample product data
```

### Location Mocking

```javascript
import { mockLocation } from './test/utils'

// Mock different environments
mockLocation({ hostname: 'cafe-central.tappmesa.local' })
mockLocation({ hostname: 'localhost', search: '?cafe=test-cafe' })
mockLocation({ pathname: '/ABCD1234/menu' })
```

### Test Setup

The `setup.js` file provides:
- Global DOM environment setup
- Window.location mocking
- LocalStorage mocking
- Supabase environment variables
- Document property mocking

## 📊 Running Specific Tests

```bash
# Run specific test file
npm run test:run src/test/utils/cartUtils.test.js

# Run tests with specific pattern
npm run test:run -- --grep "should calculate"

# Run tests in specific directory
npm run test:run src/test/context/
```

## 🐛 Debugging Tests

### Common Issues

1. **Supabase Mock Issues**
   ```javascript
   // Ensure proper mock setup
   vi.mock('../../lib/supabase', () => ({
     supabase: createMockSupabase()
   }))
   ```

2. **LocalStorage Mocking**
   ```javascript
   // Reset localStorage between tests
   beforeEach(() => {
     localStorage.getItem.mockClear()
     localStorage.setItem.mockClear()
   })
   ```

3. **Async Operations**
   ```javascript
   // Always await async operations
   await waitFor(() => {
     expect(screen.getByText('Expected Text')).toBeInTheDocument()
   })
   ```

### Test Environment Variables

Tests automatically use these environment variables:
- `VITE_SUPABASE_URL=http://localhost:54321`
- `VITE_SUPABASE_ANON_KEY=test-anon-key`

## 📈 Test Coverage Goals

- **Utility Functions**: 100% coverage
- **Context Providers**: 90%+ coverage
- **Critical Business Logic**: 100% coverage
- **Error Handling**: 100% coverage

## 🔄 Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Pre-commit hooks (when configured)

## 📚 Writing New Tests

### Test File Naming
- Unit tests: `*.test.js`
- Component tests: `*.test.jsx`
- Integration tests: `*.test.jsx`

### Test Structure
```javascript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup code
  })

  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Test implementation
    })
  })
})
```

### Best Practices

1. **Use descriptive test names**
   ```javascript
   it('should calculate correct total including 19% tax')
   ```

2. **Test both success and error cases**
   ```javascript
   it('should handle invalid input gracefully')
   ```

3. **Mock external dependencies**
   ```javascript
   vi.mock('./external-dependency')
   ```

4. **Clean up after each test**
   ```javascript
   afterEach(() => {
     vi.clearAllMocks()
   })
   ```

## 🎯 Next Steps

- [ ] Add E2E tests with Playwright/Cypress
- [ ] Implement visual regression testing
- [ ] Add performance testing
- [ ] Set up automatic coverage reporting
- [ ] Add component integration tests

---

For questions about testing or to suggest improvements, please open an issue or submit a pull request.