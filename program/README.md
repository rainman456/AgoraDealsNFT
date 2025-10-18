# Discount Platform - Smart Contract

Solana Anchor program for a Web3-powered discount marketplace where coupons are NFTs.

## 🏗️ Architecture

This smart contract is built with a modular architecture for maintainability and scalability:

```
src/
├── lib.rs              # Program entry point and instruction routing
├── errors.rs           # Custom error definitions
├── events.rs           # Event definitions for on-chain logging
├── accounts/           # Account structures
│   ├── mod.rs
│   ├── marketplace.rs  # Marketplace state
│   ├── merchant.rs     # Merchant account
│   ├── promotion.rs    # Promotion/deal template
│   ├── coupon.rs       # Individual coupon NFT
│   └── listing.rs      # Marketplace listing
└── instructions/       # Instruction handlers
    ├── mod.rs
    ├── initialize.rs       # Initialize marketplace
    ├── register_merchant.rs # Register merchant
    ├── create_promotion.rs  # Create promotion
    ├── mint_coupon.rs      # Mint coupon NFT
    ├── transfer_coupon.rs  # Transfer coupon
    ├── redeem_coupon.rs    # Redeem coupon
    ├── list_for_sale.rs    # List/cancel listing
    └── buy_listing.rs      # Buy listed coupon
```

## 📋 Features

### Core Functionality

1. **Marketplace Management**
   - Initialize marketplace with configurable fees
   - Track total merchants and coupons
   - Collect marketplace fees on secondary sales

2. **Merchant Operations**
   - Register merchants with name and category
   - Track merchant statistics (coupons created/redeemed)
   - Merchant authority verification

3. **Promotion System**
   - Create promotions with discount %, supply limits, expiry
   - Set pricing for coupons
   - Track current supply vs max supply
   - Activate/deactivate promotions

4. **Coupon NFTs**
   - Mint coupons as on-chain accounts
   - Transfer ownership between users
   - Single-use redemption tracking
   - Expiry validation
   - Prevent double-spending

5. **Secondary Marketplace**
   - List coupons for resale
   - Buy listed coupons with automatic fee distribution
   - Cancel listings
   - Marketplace fee collection

### Security Features

- ✅ Owner verification for transfers and redemptions
- ✅ Merchant authority checks
- ✅ Expiry timestamp validation
- ✅ Single-use redemption enforcement
- ✅ Supply limit enforcement
- ✅ PDA-based account derivation for security

## 🚀 Getting Started

### Prerequisites

- Rust >= 1.70.0
- Solana CLI >= 1.18.0
- Anchor CLI >= 0.31.0

### Installation

```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.1
avm use 0.31.1

# Install dependencies
anchor build
```

### Build

```bash
# Build the program
anchor build

# Get program ID
solana address -k target/deploy/discount_platform-keypair.json
```

### Testing

```bash
# Run all tests
anchor test

# Run tests with logs
anchor test -- --nocapture

# Run specific test
anchor test -- test_name
```

### Deployment

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet-beta
anchor deploy --provider.cluster mainnet-beta
```

## 📚 Program Instructions

### 1. Initialize Marketplace

Initialize the marketplace with authority and fee configuration.

```typescript
await program.methods
  .initialize()
  .accounts({
    marketplace,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 2. Register Merchant

Register a new merchant account.

```typescript
await program.methods
  .registerMerchant("Coffee Shop", "Food & Beverage")
  .accounts({
    merchant,
    marketplace,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 3. Create Promotion

Create a new coupon promotion.

```typescript
await program.methods
  .createCouponPromotion(
    20, // 20% discount
    100, // max supply
    expiryTimestamp,
    "Food & Beverage",
    "20% off all coffee drinks",
    1000000 // price in lamports
  )
  .accounts({
    promotion,
    merchant,
    authority: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 4. Mint Coupon

Mint a coupon NFT from a promotion.

```typescript
await program.methods
  .mintCoupon(new BN(1))
  .accounts({
    coupon,
    promotion,
    merchant,
    marketplace,
    recipient: user.publicKey,
    payer: provider.wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 5. Transfer Coupon

Transfer coupon ownership to another user.

```typescript
await program.methods
  .transferCoupon()
  .accounts({
    coupon,
    newOwner: recipient.publicKey,
    fromAuthority: currentOwner.publicKey,
  })
  .signers([currentOwner])
  .rpc();
```

### 6. Redeem Coupon

Redeem a coupon (requires both user and merchant signatures).

```typescript
await program.methods
  .redeemCoupon()
  .accounts({
    coupon,
    merchant,
    user: user.publicKey,
    merchantAuthority: merchantAuthority.publicKey,
  })
  .signers([user, merchantAuthority])
  .rpc();
```

### 7. List Coupon for Sale

List a coupon on the secondary marketplace.

```typescript
await program.methods
  .listCouponForSale(new BN(2000000)) // price in lamports
  .accounts({
    listing,
    coupon,
    seller: owner.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([owner])
  .rpc();
```

### 8. Buy Listed Coupon

Purchase a listed coupon.

```typescript
await program.methods
  .buyListedCoupon()
  .accounts({
    listing,
    coupon,
    marketplace,
    seller: seller.publicKey,
    buyer: buyer.publicKey,
    marketplaceAuthority: marketplaceAuthority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([buyer])
  .rpc();
```

### 9. Cancel Listing

Cancel an active listing.

```typescript
await program.methods
  .cancelListing()
  .accounts({
    listing,
    seller: seller.publicKey,
  })
  .signers([seller])
  .rpc();
```

## 🔐 Account Structures

### Marketplace
- `authority`: Pubkey - Marketplace authority
- `total_coupons`: u64 - Total coupons minted
- `total_merchants`: u64 - Total registered merchants
- `fee_basis_points`: u16 - Marketplace fee (e.g., 250 = 2.5%)

### Merchant
- `authority`: Pubkey - Merchant authority
- `name`: String (max 50 chars)
- `category`: String (max 30 chars)
- `total_coupons_created`: u64
- `total_coupons_redeemed`: u64
- `is_active`: bool
- `created_at`: i64

### Promotion
- `merchant`: Pubkey
- `discount_percentage`: u8 (1-100)
- `max_supply`: u32
- `current_supply`: u32
- `expiry_timestamp`: i64
- `category`: String (max 30 chars)
- `description`: String (max 200 chars)
- `price`: u64
- `is_active`: bool
- `created_at`: i64

### Coupon
- `id`: u64
- `promotion`: Pubkey
- `owner`: Pubkey
- `merchant`: Pubkey
- `discount_percentage`: u8
- `expiry_timestamp`: i64
- `is_redeemed`: bool
- `redeemed_at`: i64
- `created_at`: i64

### Listing
- `coupon`: Pubkey
- `seller`: Pubkey
- `price`: u64
- `is_active`: bool
- `created_at`: i64

## 📡 Events

The program emits events for all major actions:

- `MarketplaceInitialized`
- `MerchantRegistered`
- `PromotionCreated`
- `CouponMinted`
- `CouponTransferred`
- `CouponRedeemed`
- `CouponListed`
- `CouponSold`
- `ListingCancelled`

## ⚠️ Error Codes

- `NameTooLong`: Name exceeds 50 characters
- `CategoryTooLong`: Category exceeds 30 characters
- `DescriptionTooLong`: Description exceeds 200 characters
- `InvalidDiscount`: Discount not between 1-100%
- `InvalidSupply`: Supply must be > 0
- `InvalidExpiry`: Expiry must be in the future
- `InvalidPrice`: Price must be > 0
- `PromotionInactive`: Promotion is not active
- `SupplyExhausted`: Max supply reached
- `PromotionExpired`: Promotion has expired
- `CouponAlreadyRedeemed`: Coupon already used
- `CouponExpired`: Coupon has expired
- `NotCouponOwner`: Not the coupon owner
- `WrongMerchant`: Wrong merchant for redemption
- `NotMerchantAuthority`: Not authorized merchant
- `NotMarketplaceAuthority`: Not marketplace authority
- `ListingInactive`: Listing is not active
- `WrongCoupon`: Coupon doesn't match listing
- `NotListingSeller`: Not the listing seller

## 🧪 Testing

The test suite covers:

- ✅ Marketplace initialization
- ✅ Merchant registration
- ✅ Promotion creation
- ✅ Coupon minting
- ✅ Coupon transfers
- ✅ Coupon redemption
- ✅ Listing creation and cancellation
- ✅ Secondary market purchases
- ✅ Expiry validation
- ✅ Error cases and edge conditions

## 📄 License

MIT
