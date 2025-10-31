# Backend Test Suite

Comprehensive test suite for all backend controllers, services, and utilities.

## Test Coverage

### Services
- ✅ **Solana Service** - All blockchain interactions (initialize, register, create, mint, transfer, redeem, list, buy, rate, comment, external deals)

### Controllers
- ✅ **Merchant Controller** - Registration, retrieval, listing with filters
- ✅ **Promotion Controller** - Creation, retrieval, listing with filters
- ✅ **Coupon Controller** - Minting, transfer, retrieval, user coupons
- ✅ **Marketplace Controller** - Listing, buying, marketplace queries
- ✅ **Redemption Controller** - QR generation, verification, redemption
- ✅ **External Deals Controller** - Fetching and syncing external deals

### Utilities
- ✅ **Pagination** - Parameter parsing, response formatting
- ✅ **Distance** - Haversine calculation, radius filtering
- ✅ **QR Generator** - QR code generation and verification

## Running Tests

### Run all tests
```bash
cd backend
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- src/__tests__/services/solana.service.test.ts
```

### Run tests in watch mode
```bash
npm test -- --watch
```

## Test Structure

```
backend/src/__tests__/
├── setup.ts                          # Test environment setup
├── utils/
│   ├── mockData.ts                   # Mock data for tests
│   ├── testHelpers.ts                # Test utility functions
│   ├── pagination.test.ts            # Pagination utils tests
│   ├── distance.test.ts              # Distance calculation tests
│   └── qr-generator.test.ts          # QR code tests
├── services/
│   └── solana.service.test.ts        # Solana service tests
└── controllers/
    ├── merchant.controller.test.ts   # Merchant controller tests
    ├── promotion.controller.test.ts  # Promotion controller tests
    ├── coupon.controller.test.ts     # Coupon controller tests
    ├── marketplace.controller.test.ts # Marketplace controller tests
    ├── redemption.controller.test.ts # Redemption controller tests
    └── external.controller.test.ts   # External deals controller tests
```

## Test Features

### Mocking
- Solana blockchain interactions
- MongoDB database operations
- External API calls
- QR code generation

### Validation Testing
- Input validation
- Address validation
- Range validation
- Required field validation

### Error Handling
- Blockchain errors
- Database errors
- API errors
- Validation errors

### Edge Cases
- Missing fields
- Invalid data
- Already processed items
- Expired items
- Permission errors

## Test Statistics

- **Total Test Files**: 10
- **Total Test Suites**: 10
- **Estimated Test Cases**: 100+
- **Coverage Target**: 80%+

## Notes

- Tests use Vitest as the test runner
- All external dependencies are mocked
- Tests run in isolated environment
- No actual blockchain or database connections required
