# Discount Platform Backend API

Backend REST API for the Solana-based discount platform (Web3 Groupon).

## Features

- **Merchant Management**: Register merchants, manage profiles
- **Promotion System**: Create and manage discount promotions
- **NFT Coupons**: Mint, transfer, and redeem coupon NFTs
- **Marketplace**: List and trade coupons
- **External Deals**: Aggregate deals from Skyscanner, Booking.com, etc.
- **QR Code Redemption**: Generate and verify QR codes for coupon redemption

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Blockchain**: Solana with Anchor
- **Authentication**: Wallet-based authentication

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Solana CLI tools
- Anchor framework

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

```env
# Server
NODE_ENV=development
API_PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/discount-platform

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=your_program_id_here
WALLET_PRIVATE_KEY=your_wallet_private_key_here
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

## API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Endpoints

#### Merchants
- `POST /merchants/register` - Register a new merchant
- `GET /merchants/:merchantId` - Get merchant profile
- `GET /merchants` - List merchants with filters

#### Promotions
- `POST /promotions` - Create a promotion
- `GET /promotions` - List promotions with filters
- `GET /promotions/:promotionId` - Get promotion details
- `POST /promotions/rate` - Rate a promotion
- `POST /promotions/comment` - Add comment to promotion

#### Coupons
- `POST /coupons/mint` - Mint a new coupon
- `GET /coupons/my-coupons` - Get user's coupons
- `GET /coupons/:couponId` - Get coupon details
- `POST /coupons/transfer` - Transfer coupon to another user

#### Marketplace
- `POST /marketplace/list` - List coupon for sale
- `GET /marketplace/listings` - Get all listings
- `POST /marketplace/buy` - Buy a listed coupon
- `POST /marketplace/cancel` - Cancel a listing

#### Redemption
- `POST /redemption/generate-qr` - Generate QR code for redemption
- `POST /redemption/redeem` - Redeem a coupon
- `GET /redemption/:couponId/status` - Check redemption status

#### External Deals
- `POST /external/sync-flights` - Sync flight deals
- `POST /external/sync-hotels` - Sync hotel deals
- `GET /external/deals` - Get all external deals

## Database Schema

### User
```typescript
{
  walletAddress: string (unique)
  username?: string
  email?: string
  totalPurchases: number
  totalRedemptions: number
  reputationScore: number
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  badgesEarned: string[]
  preferences: {
    categories: string[]
    locationEnabled: boolean
    notifications: boolean
  }
}
```

### Merchant
```typescript
{
  walletAddress: string (unique)
  authority: string
  onChainAddress: string (unique)
  name: string
  category: string
  description?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  totalCouponsCreated: number
  totalCouponsRedeemed: number
  isActive: boolean
  averageRating: number
  totalRatings: number
}
```

### Promotion
```typescript
{
  onChainAddress: string (unique)
  merchant: string
  title: string
  description: string
  category: string
  discountPercentage: number
  maxSupply: number
  currentSupply: number
  price: number
  expiryTimestamp: Date
  isActive: boolean
  stats: {
    totalMinted: number
    totalRedeemed: number
    averageRating: number
    totalRatings: number
    totalComments: number
  }
}
```

### Coupon
```typescript
{
  onChainAddress: string (unique)
  couponId: number
  nftMint: string (unique)
  promotion: string
  owner: string
  merchant: string
  discountPercentage: number
  expiryTimestamp: Date
  isRedeemed: boolean
  redeemedAt?: Date
  redemptionCode?: string
  isListed: boolean
  listingPrice?: number
  transferHistory: Array<{
    from: string
    to: string
    timestamp: Date
    transactionSignature: string
  }>
}
```

## Error Handling

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

```bash
# Build the project
npm run build

# Start production server
npm start
```

## License

MIT
