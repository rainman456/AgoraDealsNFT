# AgoraDeals

A Web3-powered marketplace for discovering deals, earning loyalty rewards, and redeeming NFT-based coupons.


> **Hackathon Submission**: Turning everyday discount coupons into tradeable NFTs on Solana.

[![Demo Video](https://img.shields.io/badge/Demo-Watch%20Video-red)](YOUR_YOUTUBE_LINK)
[![Setup Guide](https://img.shields.io/badge/Docs-Setup%20Guide-blue)](./SETUP.md)
[![API Docs](https://img.shields.io/badge/API-Documentation-green)](./API_DOCUMENTATION.md)

## The Challenge

We've all been there: you snag a great deal on Groupon or a similar site, only to find the coupon stuck in your email inbox, non-transferable, and at the mercy of a central authority. No way to resell it if plans change, no proof of true ownership, and certainly no vibrant secondary market. It's frustrating—and it locks value away from users who could otherwise share, trade, or even collaborate on group buys.

## How We're Fixing It

AgoraDeals flips the script with a decentralized platform that's built for real-world utility. Coupons become NFTs you can own outright, trade on a marketplace, or gift to friends. Redemption happens on-chain for tamper-proof verification, and we've layered in features like group deals with escalating discounts, a reputation system to reward active users, and location-aware discovery to surface nearby steals. It's a fluid economy where deals aren't just consumed—they circulate.

## Under the Hood

Our stack keeps things lean and scalable:

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │ ───► │   Backend   │ ───► │   Solana     │      │  External   │
│  (Next.js)  │ ◄─── │  (Node.js)  │ ◄─── │  Smart       │      │  APIs       │
│             │      │   + MongoDB │      │  Contracts   │      │  (Deals)    │
└─────────────┘      └─────────────┘      └──────────────┘      └─────────────┘
```

## See It in Action

**[Watch the 4-minute demo on YouTube](YOUR_LINK)**

We walk through the essentials:
- [00:00] The problem and our approach
- [00:30] Merchants setting up a new deal
- [01:30] Users browsing and grabbing a coupon
- [02:30] The QR code redemption magic (our standout feature)
- [03:30] Marketplace trading and group deals
- [04:00] A peek at the tech backbone

## Get Started Locally

### What You'll Need
- Node.js 18 or later
- Solana CLI 1.18+
- Anchor 0.29+
- MongoDB 6.0+

### Five-Minute Setup
Fire it up with these steps:

```bash
# 1. Grab the code
git clone https://github.com/yourusername/agoradeals
cd agoradeals

# 2. Launch MongoDB
mongod --dbpath ~/data/db

# 3. Spin up a local Solana validator
cd anchor
solana-test-validator --reset

# 4. Build and deploy the contracts
anchor build
anchor deploy

# 5. Boot the frontend
cd ../frontend
npm install
npm run dev
```

For the deep dive, check **[the full setup guide](./SETUP.md)** or **[our video tutorial](YOUR_LINK)**.

## What We've Built

### Key Features
We've nailed the core loop and then some:
- **NFT Coupon Creation**: Using Metaplex standards and SPL tokens for seamless minting.
- **QR Redemption**: Time-bound tickets with crypto-backed proofs—no more fakes.
- **Marketplace Trading**: List for fixed prices, run auctions, or just browse.
- **Group Buys**: Pool funds via escrow for bigger discounts as more join.
- **User Rep**: Climb from Bronze to Diamond tiers, snag NFT badges along the way.
- **Community Vibes**: Rate, comment, and like to build trust.
- **Local Focus**: Deals pop up based on your spot on the map.
- **Merchant Tools**: A dashboard for crafting deals and tracking performance.

### Tech Breakdown
- **Contracts**: Rust via Anchor.
- **Front End**: Next.js 14 with the App Router.
- **Data Layer**: MongoDB for user profiles and indexing.
- **Wallets**: Plug-and-play with Phantom, Backpack, or Solflare.
- **Storage**: Local files for now, wired for S3.
- **APIs**: Clean REST routes handled in Next.js.

## Tackling the Tough Web3 Bits

Building on Solana meant confronting real hurdles head-on. Here's how we did it.

### 1. Making Coupons Feel Like NFTs
**The Hurdle**: Coupons need metadata like expiry dates and discount details, but they have to be truly unique and transferable.

**Our Take**: We leaned on Metaplex for metadata (discounts, merchants, etc.) and SPL for transfers. URIs point to IPFS for longevity. It's straightforward ownership without the fluff.

Peek at the code in [`anchor/programs/agoradeals/src/instructions/mint_coupon.rs`](anchor/programs/agoradeals/src/instructions/mint_coupon.rs).

### 2. Redemption Without the Middleman
**The Hurdle**: How do you confirm a coupon's used without trusting a server?

**Our Take**: A two-part on-chain dance—user generates a short-lived QR hash, merchant scans and burns the NFT. Five-minute expiry kills replay risks.

Details in [`anchor/programs/agoradeals/src/instructions/redemption_tickets.rs`](anchor/programs/agoradeals/src/instructions/redemption_tickets.rs).

### 3. Hiding the Web3 Plumbing
**The Hurdle**: Crypto UX can scare off everyday shoppers.

**Our Take**: Ditch the jargon—"Your Account" instead of "Wallet." We added email sign-ins that spin up embedded wallets, tossed in gasless redemptions for starters, and prepped fiat ramps.

See it live in [`frontend/src/contexts/WalletContext.tsx`](frontend/src/contexts/WalletContext.tsx).

### 4. Easy Wins for Merchants
**The Hurdle**: Small shops shouldn't need a PhD in blockchain to list deals.

**Our Take**: A step-by-step wizard with templates for common spots like eateries or spas. CSV uploads for bulk, and it all hides the chain under the hood.

Core logic in [`frontend/src/app/merchant/create/page.tsx`](frontend/src/app/merchant/create/page.tsx).

### 5. Keeping the Marketplace Buzzing
**The Hurdle**: Without liquidity, trading's a ghost town.

**Our Take**: Options for fixed sales or auctions (English, Dutch, sealed). Escrow locks in safety, with a modest 2.5% cut to keep things running.

Implementation via [`anchor/programs/agoradeals/src/instructions/auctions.rs`](anchor/programs/agoradeals/src/instructions/auctions.rs).

## File Layout
```
agoradeals/
├── anchor/                    # Solana programs
│   ├── programs/
│   │   └── agoradeals/
│   │       ├── src/
│   │       │   ├── instructions/   # 18 handlers for the heavy lifting
│   │       │   ├── state/          # Account definitions
│   │       │   ├── events.rs       # 13 event flavors
│   │       │   └── lib.rs
│   │       └── Cargo.toml
│   └── tests/                # 15 solid test suites
│
└── frontend/                  # The user-facing app
    ├── src/
    │   ├── app/              # Routes and APIs
    │   │   ├── api/          # 70+ endpoints
    │   │   ├── deals/
    │   │   ├── merchant/
    │   │   └── wallet/
    │   ├── components/       # UI building blocks
    │   ├── lib/              # Helpers for Solana and DB
    │   ├── models/           # 15 schemas for Mongo
    │   └── contexts/         # React state magic
    └── public/
        └── uploads/          # Temp file spot
```

## Hook Into the API

Our public endpoints live at `/api/v1/*`. Try fetching nearby deals:

```bash
curl http://localhost:3000/api/deals?lat=6.5244&lng=3.3792&radius=5000
```

You'll get something like:
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

Everything's covered in **[the API docs](./API_DOCUMENTATION.md)**—70+ routes, fully spec'd out.

## Testing It Out

### Automated Checks
```bash
cd anchor
anchor test
# All 15 green!
```

### Hands-On Flow
We've vetted the end-to-end:
- [x] Sign up and link a wallet
- [x] Merchant setup
- [x] Mint a promo NFT
- [x] Snag and redeem a coupon
- [x] QR scan and burn
- [x] Marketplace list and buy
- [x] Group deal join
- [x] Badge unlocks

Full rundown in **[DEMO.md](./DEMO.md)**.

## Tech Snapshot

### Contracts
- Rust with Anchor 0.29
- 18 instructions (e.g., mint, redeem)
- 15 account types
- 13 events for transparency
- 15 tests, all passing
- Security basics: PDAs, checks, validations

### Backend
- MongoDB across 15 collections
- 70+ REST paths
- Local storage (S3 on deck)
- Polling for updates (WebSockets next)

### Frontend
- Next.js 14 App Router
- Tailwind + shadcn for styling
- Context and SWR for state
- Wallet Adapter for seamless connects

## What Sets Us Apart

1. **QR Redemption**: A fresh, secure way to close the loop on-chain.
2. **Group Dynamics**: Escrow-powered pooling with discount ramps.
3. **Rep as NFTs**: Gamify loyalty with verifiable badges.
4. **Geo Smarts**: On-chain location proofs for hyper-local finds.
5. **Auction Variety**: From classic English to sealed bids.
6. **Stake for Perks**: Lock in coupons, earn extras.

## Next Steps

After the hackathon:
- [ ] Test proper on Devnet
- [ ] Go live on mainnet
- [ ] Build a React Native mobile version
- [ ] Link up with Magic Eden and Tensor
- [ ] Onboard 10 real merchants
- [ ] Pull in travel APIs like Skyscanner
- [ ] Add Ethereum and Polygon bridges


## License

MIT—grab it [here](LICENSE).


---

**Crafted with passion for the Solana Hackathon 2025**

[🎥 Demo](YOUR_LINK) | [📖 Setup](./SETUP.md) | [🔗 APIs](./API_DOCUMENTATION.md)
