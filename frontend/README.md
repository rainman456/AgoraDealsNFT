# AgoraDeals Frontend (Test Environment)

This is the test frontend for AgoraDeals, integrated with the backend API.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
Create a `.env` file with:
```
VITE_API_URL=http://localhost:3001/api/v1
```

3. Start the backend server:
```bash
cd ../backend
pnpm install
pnpm dev
```

4. Start the frontend:
```bash
pnpm dev
```

## Backend Integration

The frontend is now fully integrated with the backend API:

### API Client (`lib/api.ts`)
- Configured to connect to backend at `http://localhost:3001/api/v1`
- Automatic wallet address injection in request headers
- Comprehensive API methods for all backend endpoints

### Features Integrated:
- ✅ Authentication (User & Merchant registration)
- ✅ Promotions (Create, List, Details, Rate, Comment)
- ✅ Coupons (Mint, Transfer, List user coupons)
- ✅ Marketplace (List, Buy, Cancel)
- ✅ Auctions (Create, Bid, Settle, List)
- ✅ Group Deals (Create, Join, Finalize, List)
- ✅ Redemption Tickets (Generate, Verify, Cancel)
- ✅ Social Features (Share, View, Trending, Popular, Rate, Feed)
- ✅ Merchant Dashboard (Analytics, Recent Activity)
- ✅ User Stats & Badges
- ✅ Staking (Stake, Unstake, Claim Rewards)
- ✅ External Deals (Flights, Hotels)
- ✅ File Upload

### Pages Updated:
- `Index.tsx` - Loads deals from backend with fallback to mock data
- `DealDetail.tsx` - Fetches individual deal details from backend
- `MerchantDashboard.tsx` - Loads merchant analytics and promotions
- `Profile.tsx` - Fetches user stats, coupons, and badges

### Authentication Flow:
- User registration creates a Solana wallet automatically
- Merchant registration creates wallet and registers on-chain
- Wallet addresses stored in localStorage
- No password-based login (wallet-based authentication)

## Testing Backend Integration

1. Ensure MongoDB is running
2. Ensure Solana localnet is running (if testing on-chain features)
3. Start backend server
4. Start frontend
5. Test user registration to create a wallet
6. Test merchant registration to create merchant account
7. Test creating promotions, minting coupons, etc.

## Fallback Behavior

If backend is unavailable, the app falls back to mock data for:
- Deals listing on homepage
- Deal details page
- Merchant dashboard promotions

This ensures the UI remains functional during development.

## Environment Variables

- `VITE_API_URL` - Backend API base URL (default: http://localhost:3001/api/v1)

## API Documentation

See `backend/README_API.md` for complete API documentation.
