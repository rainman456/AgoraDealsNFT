# AgoraDealsNFT
A Web3-powered marketplace for discovering deals, earning loyalty rewards, and redeeming NFT-based coupons.
# 🎟️ 

> **Hackathon Submission**: Transforming traditional discount coupons into tradeable NFTs on Solana

[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Video-red)](YOUR_YOUTUBE_LINK)
[![Setup Guide](https://img.shields.io/badge/Docs-Setup%20Guide-blue)](./SETUP.md)
[![API Docs](https://img.shields.io/badge/API-Documentation-green)](./API_DOCUMENTATION.md)

## 🎯 Problem Statement

Traditional discount platforms like Groupon trap users with:
- ❌ Non-transferable coupons
- ❌ Centralized control
- ❌ No secondary market
- ❌ Lack of ownership proof

## ✨ Our Solution

DealForge creates a **trustless, transparent, and liquid deal economy** where:
- ✅ Coupons are NFTs (own, trade, gift)
- ✅ On-chain redemption verification
- ✅ Secondary marketplace
- ✅ Group deals with tiered discounts
- ✅ Reputation & badge system
- ✅ Geo-based discovery

## 🏗️ Architecture
```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Next.js   │ ───► │   MongoDB   │      │    Solana    │
│  Frontend   │      │   Database  │      │  Smart       │
│   + API     │ ──────────────────────► │  Contracts   │
└─────────────┘                           └──────────────┘
```

## 🎥 Demo Video

**[Watch 4-minute demo on YouTube](YOUR_LINK)**

### What's Covered:
- [00:00] Problem & Solution Overview
- [00:30] Merchant Dashboard - Create Deal
- [01:30] User Flow - Browse & Purchase
- [02:30] QR Code Redemption (Key Feature!)
- [03:30] Group Deals & Marketplace
- [04:00] Technical Architecture

## 🚀 Quick Start (Local Testing)

### Prerequisites
```bash
Node.js 18+
Solana CLI 1.18+
Anchor 0.29+
MongoDB 6.0+
```

### Setup in 5 Minutes
```bash
# 1. Clone repository
git clone https://github.com/yourusername/dealforge
cd dealforge

# 2. Start MongoDB
mongod --dbpath ~/data/db

# 3. Start Solana local validator
cd anchor
solana-test-validator --reset

# 4. Deploy smart contracts
anchor build
anchor deploy

# 5. Start frontend
cd ../frontend
npm install
npm run dev
```

**[📖 Full Setup Guide](./SETUP.md)** | **[🎬 Video Setup Tutorial](YOUR_LINK)**

## ✅ Implemented Features

### Core Features
- [x] **NFT Coupon Minting** - Metaplex standard, SPL tokens
- [x] **QR Code Redemption** - Time-limited tickets with cryptographic verification
- [x] **Secondary Marketplace** - List, buy, auction coupons
- [x] **Group Deals** - Escrow-based pooled purchases with tiered discounts
- [x] **Reputation System** - 5 tiers (Bronze→Diamond) + NFT badges
- [x] **Social Features** - Comments, ratings, likes
- [x] **Geo Discovery** - Location-based deal finding
- [x] **Merchant Dashboard** - Easy deal creation & analytics

### Technical Implementation
- [x] **Smart Contracts**: Rust + Anchor framework
- [x] **Frontend**: Next.js 14 (App Router)
- [x] **Database**: MongoDB (user data, off-chain indexing)
- [x] **Wallet Integration**: Phantom, Backpack, Solflare
- [x] **File Storage**: Local (prototype) / S3-ready
- [x] **API**: RESTful endpoints (Next.js API routes)

## 🎯 Web3 Integration Challenges Addressed

### 1. NFT Representation
**Challenge**: How to represent coupons as NFTs?

**Solution**:
- Metaplex Token Metadata standard
- Each coupon = unique NFT with metadata (discount %, expiry, merchant)
- SPL Token for ownership transfer
- IPFS-ready metadata URIs

**Code**: [`src/instructions/mint_coupon.rs`](anchor/programs/discount_platform/src/instructions/mint_coupon.rs)

### 2. Redemption Flow
**Challenge**: How to verify redemption without centralization?

**Solution**: 2-Step On-Chain Verification
```
User → Generate Ticket (creates QR with time-limited hash)
     ↓
Merchant → Scans QR → Verifies on-chain → Burns NFT
```

**Key Innovation**: Tickets expire in 5 minutes, preventing replay attacks

**Code**: [`src/instructions/redemption_tickets.rs`](anchor/programs/discount_platform/src/instructions/redemption_tickets.rs)

### 3. Web3 Abstraction
**Challenge**: Make it usable for non-crypto users

**Solution**:
- No crypto jargon in UI ("Your Account" not "Wallet")
- Embedded wallet option (email login → wallet created)
- Gasless transactions for first 5 redemptions
- Fiat on-ramp integration ready

**Code**: [`src/contexts/WalletContext.tsx`](frontend/src/contexts/WalletContext.tsx)

### 4. Merchant Onboarding
**Challenge**: Small businesses need simple NFT creation

**Solution**:
- Wizard-style deal creation (5 steps)
- Pre-made templates (Restaurant, Spa, Travel)
- Bulk import via CSV
- "Create Deal" abstracts all blockchain complexity

**Code**: [`src/app/merchant/create/page.tsx`](frontend/src/app/merchant/create/page.tsx)

### 5. Marketplace Liquidity
**Challenge**: Enable coupon resale

**Solution**:
- Fixed-price listings
- 3 auction types (English, Dutch, Sealed Bid)
- Escrow system prevents scams
- 2.5% marketplace fee for sustainability

**Code**: [`src/instructions/auctions.rs`](anchor/programs/discount_platform/src/instructions/auctions.rs)

## 📁 Project Structure
```
dealforge/
├── anchor/                    # Solana smart contracts
│   ├── programs/
│   │   └── discount_platform/
│   │       ├── src/
│   │       │   ├── instructions/   # 18 instruction handlers
│   │       │   ├── state/          # Account schemas
│   │       │   ├── events.rs       # 13 event types
│   │       │   └── lib.rs
│   │       └── Cargo.toml
│   └── tests/                # 15 comprehensive tests
│
└── frontend/                  # Next.js application
    ├── src/
    │   ├── app/              # Pages + API routes
    │   │   ├── api/          # 70+ REST endpoints
    │   │   ├── deals/
    │   │   ├── merchant/
    │   │   └── wallet/
    │   ├── components/       # Reusable UI components
    │   ├── lib/              # Solana & MongoDB utils
    │   ├── models/           # 15 MongoDB schemas
    │   └── contexts/         # React contexts
    └── public/
        └── uploads/          # Local file storage
```

## 🔌 API Integration

### Public API Available at `/api/v1/*`

**Example: Get Deals Near Me**
```bash
curl http://localhost:3000/api/deals?lat=6.5244&lng=3.3792&radius=5000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deals": [
      {
        "id": "...",
        "title": "50% Off Pizza",
        "merchant": "Pizza Palace",
        "discountPercentage": 50,
        "price": 1500,
        "distance": 1200
      }
    ]
  }
}
```

**[📚 Full API Documentation](./API_DOCUMENTATION.md)** - 70+ endpoints documented

## 🧪 Testing

### Automated Tests
```bash
cd anchor
anchor test
# ✅ 15/15 tests passing
```

### Manual Testing Checklist
- [x] User registration & wallet connection
- [x] Merchant onboarding
- [x] Create promotion (NFT minting)
- [x] Purchase coupon
- [x] Generate redemption QR code
- [x] Merchant verifies & redeems
- [x] List coupon on marketplace
- [x] Buy from marketplace
- [x] Join group deal
- [x] Earn reputation badge

**[📋 Full Test Plan](./DEMO.md)**

## 📊 Technical Highlights

### Smart Contract Stats
- **Language**: Rust
- **Framework**: Anchor 0.29
- **Instructions**: 18 (create_promotion, mint_coupon, redeem, etc.)
- **Accounts**: 15 types (User, Merchant, Coupon, etc.)
- **Events**: 13 emitted events
- **Tests**: 15 passing tests
- **Security**: Proper PDA derivation, authority checks, constraint validation

### Backend Stats
- **Database**: MongoDB (15 collections)
- **API Endpoints**: 70+ RESTful routes
- **File Storage**: Local (S3-ready)
- **Real-time**: Polling (WebSocket-ready)

### Frontend Stats
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Tailwind CSS + shadcn/ui
- **State**: React Context + SWR
- **Wallet**: Solana Wallet Adapter

## 🏆 Innovation Points

1. **QR Code Redemption System** - Novel approach to trustless verification
2. **Group Deals** - DeFi-style escrow with tiered discounts
3. **NFT Badges** - On-chain reputation gamification
4. **Spatial Indexing** - Geo-discovery with on-chain verification
5. **Multi-Auction Types** - English, Dutch, Sealed Bid
6. **Staking Rewards** - Lock coupons for rewards

## 🛣️ Roadmap (Post-Hackathon)

- [ ] Mainnet deployment
- [ ] Mobile app (React Native)
- [ ] Integration with Magic Eden, Tensor
- [ ] Partner with 10 local merchants
- [ ] Travel deals aggregation (Skyscanner API)
- [ ] Cross-chain support (Ethereum, Polygon)

## 👥 Team

**[Your Name]** - Full Stack Developer
- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)

## 📄 License

MIT License - See [LICENSE](LICENSE)

## 🙏 Acknowledgments

- Solana Foundation
- Superteam
- Anchor Framework
- Metaplex

---

**Built with ❤️ for Solana Hackathon 2025**

[🎥 Watch Demo](YOUR_LINK) | [📖 Documentation](./SETUP.md) | [🔗 API Docs](./API_DOCUMENTATION.md)
