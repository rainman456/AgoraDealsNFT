# Cura - User-Owned Discount & Rewards Marketplace

## Overview
Cura is a user-owned discount and rewards marketplace that aggregates real-world deals and wraps each promotion as a transferable NFT (on Solana blockchain) to enable verifiable ownership, resale, and cross-platform use.

## Project Structure
```
.
├── frontend/          # React + Vite frontend
│   ├── components/    # Reusable UI components
│   ├── pages/         # Application pages
│   ├── lib/          # API client and utilities
│   └── contexts/     # React contexts (Auth, etc.)
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── routes/     # API route definitions
│   │   ├── controllers/# Request handlers
│   │   ├── models/     # MongoDB/Mongoose models
│   │   ├── services/   # Business logic
│   │   └── config/     # Configuration files
```

## Technology Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (requires external connection)
- **Blockchain**: Solana (Devnet)
- **Package Manager**: pnpm (frontend), npm (backend)

## API Integration Status

### ✅ Fully Integrated Backend APIs

#### 1. Authentication & User Management
- **Routes**: `/api/v1/auth/*`
- **Endpoints**:
  - `POST /auth/register/user` - User registration
  - `POST /auth/register/merchant` - Merchant registration
  - `GET /auth/user/:walletAddress` - Get user by wallet
  - `GET /auth/merchant/:walletAddress` - Get merchant by wallet
- **Frontend Integration**: `authAPI` in `lib/api.ts`, used by `AuthContext`

#### 2. Promotions (Deals/Coupons)
- **Routes**: `/api/v1/promotions/*`
- **Endpoints**:
  - `GET /promotions` - List all promotions
  - `GET /promotions/:id` - Get promotion details
  - `POST /promotions` - Create new promotion
  - `PUT /promotions/:id` - Update promotion
  - `DELETE /promotions/:id` - Delete promotion
  - `PATCH /promotions/:id/pause` - Pause promotion
  - `PATCH /promotions/:id/resume` - Resume promotion
  - `GET /promotions/:id/comments` - Get comments
  - `POST /promotions/:id/comments` - Add comment
  - `GET /promotions/:id/ratings` - Get ratings
  - `POST /promotions/:id/ratings` - Add rating
- **Frontend Integration**: Used in Home, Deals, DealDetail, Profile, MerchantDashboard pages

#### 3. Coupons (NFTs)
- **Routes**: `/api/v1/coupons/*`
- **Endpoints**:
  - `GET /coupons` - List coupons
  - `POST /coupons/mint` - Mint new coupon
  - `GET /coupons/user/:walletAddress` - Get user's coupons
  - `GET /coupons/:id` - Get coupon details
  - `POST /coupons/transfer` - Transfer coupon ownership
- **Frontend Integration**: Used in MyDeals, Wallet, Profile, DealDetail pages

#### 4. Redemption System
- **Routes**: `/api/v1/redemption/*`, `/api/v1/redemption-tickets/*`
- **Endpoints**:
  - `POST /redemption-tickets/generate` - Generate redemption ticket
  - `POST /redemption-tickets/verify-and-redeem` - Verify and redeem ticket
  - `POST /redemption-tickets/:id/cancel` - Cancel ticket
  - `GET /redemption-tickets/user/:address` - Get user tickets
  - `GET /redemption-tickets/merchant/:address` - Get merchant tickets
- **Frontend Integration**: Used in Redemption, RedemptionTickets, RedemptionConsole pages

#### 5. Marketplace & Listings
- **Routes**: `/api/v1/listings/*`
- **Endpoints**:
  - `GET /listings` - List marketplace items
  - `GET /listings/:id` - Get listing details
  - `POST /listings` - Create listing
  - `PATCH /listings/:id/deactivate` - Deactivate listing
  - `DELETE /listings/:id` - Delete listing
- **Frontend Integration**: Used in Marketplace page

#### 6. Auctions
- **Routes**: `/api/v1/auctions/*`
- **Endpoints**:
  - `GET /auctions` - List auctions
  - `GET /auctions/:id` - Get auction details
  - `POST /auctions/create` - Create auction
  - `POST /auctions/:id/bid` - Place bid
  - `POST /auctions/:id/settle` - Settle auction
- **Frontend Integration**: Used in Auctions, AuctionsEnhanced pages

#### 7. Group Deals
- **Routes**: `/api/v1/group-deals/*`
- **Endpoints**:
  - `GET /group-deals` - List group deals
  - `GET /group-deals/:id` - Get group deal details
  - `POST /group-deals/create` - Create group deal
  - `POST /group-deals/:id/join` - Join group deal
  - `POST /group-deals/:id/finalize` - Finalize group deal
- **Frontend Integration**: Used in GroupDeals page

#### 8. Social Features
- **Routes**: `/api/v1/social/*`
- **Endpoints**:
  - `POST /social/share` - Track share event
  - `POST /social/view` - Track view event
  - `GET /social/trending` - Get trending items
  - `GET /social/popular` - Get popular items by category
  - `POST /social/rate` - Rate item
  - `GET /social/feed` - Get personalized feed
- **Frontend Integration**: Used in Social, Home pages

#### 9. User Statistics & Badges
- **Routes**: `/api/v1/user-stats/*`, `/api/v1/badges/*`
- **Endpoints**:
  - `GET /user-stats/:address` - Get user stats
  - `GET /user-stats/leaderboard` - Get leaderboard
  - `GET /badges/types` - Get badge types
  - `POST /badges/mint` - Mint badge
  - `GET /badges/user/:address` - Get user badges
  - `POST /badges/auto-award` - Auto-award badges
- **Frontend Integration**: Used in UserStats, Profile pages

#### 10. Staking System
- **Routes**: `/api/v1/staking/*`
- **Endpoints**:
  - `GET /staking/pool` - Get staking pool info
  - `POST /staking/stake` - Stake coupon
  - `POST /staking/claim` - Claim rewards
  - `GET /staking/user/:address` - Get user stakes
  - `GET /staking/coupon/:id` - Get coupon stake info
- **Frontend Integration**: Used in Staking, Profile pages

#### 11. External Deals Integration
- **Routes**: `/api/v1/external/*`, `/api/v1/external-deals/*`
- **Endpoints**:
  - `POST /external/sync-flights` - Sync flight deals
  - `POST /external/sync-hotels` - Sync hotel deals
  - `GET /external/deals` - Get external deals
  - `GET /external-deals` - List external deals
  - `GET /external-deals/:id` - Get external deal details
- **Frontend Integration**: Used in ExternalDeals page

#### 12. Merchant Dashboard
- **Routes**: `/api/v1/merchant-dashboard/*`
- **Endpoints**:
  - `GET /merchant-dashboard/:address/analytics` - Get merchant analytics
  - `GET /merchant-dashboard/:address/recent-activity` - Get recent activity
- **Frontend Integration**: Used in MerchantDashboardEnhanced page

#### 13. File Upload
- **Routes**: `/api/v1/upload/*`
- **Endpoints**:
  - `POST /upload/:type` - Upload image (promotions, merchants, coupons)
  - `DELETE /upload/:type/:filename` - Delete image
- **Frontend Integration**: Used in PromotionWizard, MerchantOnboarding pages

## Frontend Pages & Routes

### User-Facing Pages
- `/` - Landing page (Index.tsx)
- `/home` - User home dashboard (Home.tsx)
- `/deals` - Browse all deals (Deals.tsx)
- `/deals/:id` - Deal details (DealDetail.tsx)
- `/my-deals` - User's owned coupons (MyDeals.tsx)
- `/marketplace` - Secondary marketplace (Marketplace.tsx)
- `/auctions` - Live auctions (Auctions.tsx, AuctionsEnhanced.tsx)
- `/group-deals` - Group buying deals (GroupDeals.tsx)
- `/redemption` - Redeem coupons (Redemption.tsx)
- `/redemption-tickets` - View redemption tickets (RedemptionTickets.tsx)
- `/wallet` - Wallet management (Wallet.tsx)
- `/profile` - User profile (Profile.tsx)
- `/stats` - User statistics (UserStats.tsx)
- `/staking` - Stake coupons for rewards (Staking.tsx)
- `/social` - Social feed (Social.tsx)
- `/external-deals` - External platform deals (ExternalDeals.tsx)
- `/user/login` - User login (UserLogin.tsx)
- `/welcome` - Onboarding flow (Onboarding.tsx)

### Merchant-Facing Pages
- `/merchant/login` - Merchant login (MerchantLogin.tsx)
- `/merchant/onboarding` - Merchant onboarding (MerchantOnboarding.tsx)
- `/merchant/dashboard` - Merchant dashboard (MerchantDashboard.tsx)
- `/merchant/analytics` - Enhanced analytics (MerchantDashboardEnhanced.tsx)
- `/merchant/create-deal` - Create promotion (PromotionWizard.tsx)
- `/merchant/redemption` - Redemption console (RedemptionConsole.tsx)

## Environment Configuration

### Frontend (.env)
```
VITE_API_URL=https://<replit-domain>/api/v1
```

### Backend (.env)
```
NODE_ENV=development
API_PORT=3001
MONGODB_URI=<your-mongodb-connection-string>
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=<your-solana-program-id>
```

## Database Setup Required

⚠️ **Important**: This application requires MongoDB. Since Replit doesn't have built-in MongoDB support, you need to:

1. **Option 1: MongoDB Atlas (Recommended)**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string
   - Update `MONGODB_URI` in `backend/.env`

2. **Option 2: Use another MongoDB provider**
   - mLab, DigitalOcean, etc.
   - Update `MONGODB_URI` in `backend/.env`

## Running the Application

The frontend is already configured to run on port 5000 via the workflow system.

To start the backend manually:
```bash
cd backend
npm run dev
```

## Deployment Notes

- Frontend runs on port 5000 (configured for Replit webview)
- Backend runs on port 3001 (localhost only)
- Frontend makes API calls to the backend through the Replit domain
- Database and Solana connections must be properly configured

## Recent Changes
- **2025-11-07**: Initial Replit setup
  - Installed all dependencies (pnpm for frontend, npm for backend)
  - Created Vite config to bind to 0.0.0.0:5000 with host verification bypass
  - Created missing TypeScript config files
  - Set up frontend workflow
  - Documented all API integrations

## Next Steps for Full Functionality

1. **Set up MongoDB connection** (required for backend to work)
2. **Configure Solana** (optional for blockchain features)
3. **Start backend server** (after database setup)
4. **Test all API integrations**
5. **Configure deployment** (when ready for production)
