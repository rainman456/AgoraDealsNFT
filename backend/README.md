# Discount Platform - Backend API

Node.js Express API server for the discount platform.

## 🏗️ Architecture

```
src/
├── index.ts              # Server entry point
├── app.ts                # Express app setup
├── config/               # Configuration files
│   ├── database.ts       # MongoDB connection
│   └── solana.ts         # Solana connection & program loading
├── controllers/          # API logic
│   ├── merchant.ts       # Merchant operations
│   ├── promotion.ts      # Promotion management
│   ├── coupon.ts         # Coupon operations
│   ├── marketplace.ts    # Marketplace listings
│   └── redemption.ts     # Redemption & QR generation
├── middleware/           # Express middleware
│   ├── auth.ts           # Wallet signature verification
│   └── validation.ts     # Input validation
├── routes/               # API routes
│   ├── merchant.ts       # /api/merchants
│   ├── promotions.ts     # /api/promotions
│   ├── coupons.ts        # /api/coupons
│   └── marketplace.ts    # /api/marketplace
├── services/             # Business logic
│   ├── solana.service.ts      # Smart contract interactions
│   ├── aggregator.service.ts  # External API integration
│   └── redemption.service.ts  # QR & verification
├── models/               # Database schemas
│   ├── merchant.ts       # Merchant model
│   ├── promotion.ts      # Promotion model
│   └── user.ts           # User model
└── utils/                # Utilities
    ├── logger.ts         # Winston logger
    └── qr-generator.ts   # QR code generation
```

## 📋 Features

### API Endpoints

#### Merchants
- `POST /api/merchants/register` - Register new merchant
- `GET /api/merchants/:id` - Get merchant details
- `GET /api/merchants` - List all merchants
- `PUT /api/merchants/:id` - Update merchant info

#### Promotions
- `POST /api/promotions` - Create new promotion
- `GET /api/promotions/:id` - Get promotion details
- `GET /api/promotions` - List promotions (with filters)
- `PUT /api/promotions/:id` - Update promotion
- `DELETE /api/promotions/:id` - Deactivate promotion

#### Coupons
- `POST /api/coupons/mint` - Mint new coupon
- `GET /api/coupons/:id` - Get coupon details
- `GET /api/coupons` - Browse available coupons
- `GET /api/coupons/user/:wallet` - Get user's coupons
- `POST /api/coupons/transfer` - Transfer coupon
- `POST /api/coupons/redeem` - Redeem coupon

#### Marketplace
- `GET /api/marketplace/listings` - Get active listings
- `POST /api/marketplace/list` - List coupon for sale
- `POST /api/marketplace/buy` - Buy listed coupon
- `DELETE /api/marketplace/listing/:id` - Cancel listing

### Services

#### Solana Service
- Smart contract interaction wrapper
- Transaction building and signing
- Account fetching and parsing
- Event listening

#### Aggregator Service
- External API integration (Skyscanner, Booking.com, Shopify)
- Deal fetching and normalization
- Rate limiting and caching
- Error handling

#### Redemption Service
- QR code generation for coupons
- Redemption verification
- On-chain attestation
- Merchant validation

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MongoDB (local or cloud)
- Solana wallet with SOL for transactions

### Installation

```bash
cd packages/backend
npm install
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

### Authentication

All protected endpoints require wallet signature verification:

```typescript
Headers:
  X-Wallet-Address: <wallet_public_key>
  X-Signature: <signed_message>
  X-Message: <original_message>
```

### Request/Response Examples

#### Register Merchant

```bash
POST /api/merchants/register
Content-Type: application/json

{
  "name": "Coffee Shop",
  "category": "Food & Beverage",
  "walletAddress": "ABC123..."
}

Response:
{
  "success": true,
  "data": {
    "merchantId": "...",
    "transactionSignature": "..."
  }
}
```

#### Create Promotion

```bash
POST /api/promotions
Content-Type: application/json

{
  "merchantId": "...",
  "discountPercentage": 20,
  "maxSupply": 100,
  "expiryTimestamp": 1735689600,
  "category": "Food & Beverage",
  "description": "20% off all coffee drinks",
  "price": 1000000
}

Response:
{
  "success": true,
  "data": {
    "promotionId": "...",
    "transactionSignature": "..."
  }
}
```

#### Browse Coupons

```bash
GET /api/coupons?category=Food&minDiscount=10&maxPrice=5000000

Response:
{
  "success": true,
  "data": {
    "coupons": [...],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `MONGODB_URI`: Database connection string
- `RPC_URL`: Solana RPC endpoint
- `PROGRAM_ID`: Deployed smart contract address
- `WALLET_PRIVATE_KEY`: Backend wallet for transactions
- External API keys for deal aggregation

### Database Models

#### Merchant (Off-chain)
- Additional merchant metadata
- Contact information
- Business hours
- Location data
- Images and branding

#### Promotion (Off-chain)
- Extended promotion details
- Images and media
- Terms and conditions
- Target audience

#### User (Off-chain)
- User preferences
- Saved searches
- Ratings and reviews
- Activity history

## 🧪 Testing

Test coverage includes:
- Unit tests for services and utilities
- Integration tests for API endpoints
- Mock Solana interactions
- Database operations

## 📦 Deployment

### Vercel (Serverless)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
# Build image
docker build -t discount-platform-backend .

# Run container
docker run -p 3001:3001 --env-file .env discount-platform-backend
```

### Traditional Server

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name discount-platform-backend
```

## 🔐 Security

- Wallet signature verification for all authenticated endpoints
- Input validation with Joi
- Rate limiting on public endpoints
- CORS configuration
- Environment variable protection
- MongoDB injection prevention

## 📄 License

MIT
