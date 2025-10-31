# Backend Integration Guide

## Overview

This backend implements a **custodial wallet system** for testing on Solana localnet. Each user and merchant gets their own wallet managed by the backend.

## Architecture

```
Frontend → Backend API → Solana Service → Localnet Validator
                ↓
            MongoDB (wallet storage + metadata)
```

## Custodial Wallet System

### How It Works

1. **User/Merchant Registration**
   - Backend generates a new Solana keypair
   - Private key is encrypted (AES-256-GCM) and stored in MongoDB
   - Public key is returned to frontend
   - Localnet SOL is airdropped automatically

2. **Transaction Signing**
   - Frontend sends requests with user/merchant ID
   - Backend retrieves encrypted keypair from database
   - Backend decrypts and uses keypair to sign transactions
   - Transaction is sent to localnet validator

3. **Security**
   - Private keys encrypted at rest
   - Encryption key stored in environment variable
   - Only for testing - NOT for production use

## Setup Instructions

### 1. Environment Configuration

Create `.env` file:

```bash
# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
WALLET_ENCRYPTION_KEY=<generated_key>
MONGODB_URI=mongodb://localhost:27017/discount-platform
RPC_URL=http://127.0.0.1:8899
PROGRAM_ID=<your_deployed_program_id>
WALLET_PRIVATE_KEY=<admin_wallet_private_key>
API_PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 2. Start Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Solana localnet
solana-test-validator

# Terminal 3: Deploy contracts (from contracts directory)
cd contracts
anchor build
anchor deploy
# Copy the program ID to backend .env

# Terminal 4: Seed database
cd backend
pnpm install
pnpm seed

# Terminal 5: Start backend
pnpm dev
```

### 3. Database Seeding

The seed script creates:
- 5 test users with wallets
- 5 merchants with on-chain registration
- Promotions for each merchant
- All with real blockchain transactions

```bash
pnpm seed
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register/user
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "data": {
    "userId": "...",
    "walletAddress": "...",
    "username": "john_doe",
    "tier": "Bronze"
  }
}
```

#### Register Merchant
```http
POST /api/v1/auth/register/merchant
Content-Type: application/json

{
  "name": "Pizza Paradise",
  "category": "Food & Dining",
  "description": "Best pizza in town",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "123 Main St, New York, NY"
  }
}

Response:
{
  "success": true,
  "data": {
    "merchantId": "...",
    "walletAddress": "...",
    "onChainAddress": "...",
    "transactionSignature": "..."
  }
}
```

### Image Upload

```http
POST /api/v1/upload/promotions
Content-Type: multipart/form-data

image: <file>

Response:
{
  "success": true,
  "data": {
    "filename": "1234567890-image.jpg",
    "url": "/uploads/promotions/1234567890-image.jpg",
    "size": 123456,
    "mimetype": "image/jpeg"
  }
}
```

### Promotions

All promotion endpoints now use merchant's wallet automatically:

```http
POST /api/v1/promotions
Content-Type: application/json

{
  "merchantId": "...",  // Backend retrieves merchant's wallet
  "discountPercentage": 25,
  "maxSupply": 100,
  "expiryTimestamp": 1735689600,
  "category": "Food",
  "description": "25% off all pizzas",
  "price": 0.1
}
```

## External Aggregators

### Configuration

The backend supports external deal aggregators:

1. **Skyscanner** - Requires real API key (no sandbox)
2. **Booking.com** - Has sandbox environment
3. **Shopify** - Custom implementation

### Mock Data Fallback

When API keys are not configured, the system automatically returns mock data. This allows full testing without external API access.

```typescript
// Automatically uses mock data if keys not set
const deals = await aggregatorService.getAllExternalDeals();
```

### Getting API Keys

**Booking.com (Recommended for testing)**:
- Register as Managed Affiliate Partner
- Access sandbox: `https://demandapi-sandbox.booking.com/3.1`
- Test properties available (no real bookings)

**Skyscanner**:
- Apply through partnership team
- No sandbox - uses live API only
- Optional for testing

**Shopify**:
- Create partner account
- Optional for testing

## Frontend Integration

### 1. Remove Mock Data

Delete or comment out all mock data in frontend:
- `src/lib/mock-data.ts`
- Any hardcoded arrays in components

### 2. API Client Setup

```typescript
// src/lib/api-client.ts
const API_BASE_URL = 'http://localhost:3001/api/v1';

export async function registerUser(username: string, email: string) {
  const response = await fetch(`${API_BASE_URL}/auth/register/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email }),
  });
  return response.json();
}

export async function getPromotions() {
  const response = await fetch(`${API_BASE_URL}/promotions`);
  return response.json();
}
```

### 3. Store User Wallet

```typescript
// After registration
const { data } = await registerUser('john', 'john@test.com');
localStorage.setItem('walletAddress', data.walletAddress);
localStorage.setItem('userId', data.userId);
```

### 4. Display Transaction Signatures

```typescript
// Show blockchain proof
<p>Transaction: {transactionSignature}</p>
<a href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=custom&customUrl=http://localhost:8899`}>
  View on Explorer
</a>
```

## Testing Workflow

1. **Start all services** (MongoDB, localnet, backend)
2. **Seed database** with test data
3. **Register test user** via frontend
4. **Browse promotions** (from seeded merchants)
5. **Mint coupon** (backend signs with user's wallet)
6. **View transaction** on Solana explorer (localnet)
7. **Redeem coupon** (backend signs with merchant's wallet)

## Key Differences: Test vs Production

| Feature | Test (Custodial) | Production (Non-Custodial) |
|---------|------------------|----------------------------|
| Wallet Control | Backend holds keys | User holds keys (Phantom) |
| Transaction Signing | Backend signs | User signs in browser |
| Onboarding | Email/username | Connect wallet |
| SOL Funding | Auto-airdrop | User provides |
| Security | Encrypted storage | User's responsibility |

## Troubleshooting

### Airdrop Fails
- Ensure localnet is running: `solana-test-validator`
- Check RPC URL: `http://127.0.0.1:8899`

### Transaction Fails
- Check program is deployed: `anchor deploy`
- Verify PROGRAM_ID in .env matches deployed program
- Check wallet has SOL: seed script airdrops automatically

### Database Connection
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in .env

### Encryption Errors
- Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add to .env as WALLET_ENCRYPTION_KEY

## Next Steps

1. ✅ Custodial wallet system implemented
2. ✅ Database seeding with real blockchain data
3. ✅ Image upload system
4. ✅ External aggregator service with mock fallback
5. 🔄 Update all controllers to use per-user wallets
6. 🔄 Remove frontend mock data
7. 🔄 Connect frontend to backend APIs
8. 🔄 Test complete user flow

## Production Migration

When moving to production:
1. Remove custodial wallet system
2. Implement Solana wallet adapter (Phantom, Solflare)
3. Frontend signs all transactions
4. Backend only stores metadata
5. Use devnet/mainnet RPC endpoints
