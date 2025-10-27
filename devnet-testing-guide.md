# 🧪 Complete Devnet Testing Guide

## 📋 Prerequisites Checklist

Before testing on devnet, ensure you have:

```bash
# Check Solana CLI version
solana --version
# Should be >= 1.17.0

# Check Anchor CLI version
anchor --version
# Should be >= 0.29.0

# Check your current cluster
solana config get
```

---

## 🔧 Step 1: Configure for Devnet

### 1.1 Update Anchor.toml

Your `Anchor.toml` looks good! Just update the provider cluster:

```toml
[provider]
cluster = "Devnet"  # Change from "Localnet" to "Devnet"
wallet = "~/.config/solana/id.json"
```

### 1.2 Switch Solana CLI to Devnet

```bash
# Set devnet cluster
solana config set --url https://api.devnet.solana.com

# Verify the change
solana config get

# Expected output:
# RPC URL: https://api.devnet.solana.com
# WebSocket URL: wss://api.devnet.solana.com/
# Keypair Path: /home/user/.config/solana/id.json
# Commitment: confirmed
```

### 1.3 Check/Create Wallet

```bash
# Check if you have a wallet
ls ~/.config/solana/id.json

# If not, create one
solana-keygen new --outfile ~/.config/solana/id.json

# Get your public key
solana address

# Check balance
solana balance
```

---

## 💰 Step 2: Fund Your Devnet Wallet

### Option 1: Using CLI (Recommended)

```bash
# Request 2 SOL airdrop
solana airdrop 2

# Check balance
solana balance

# If rate limited, wait 24 hours or use faucet below
```

### Option 2: Using Web Faucet

Visit: https://faucet.solana.com/

1. Enter your wallet address: `solana address`
2. Request devnet SOL
3. Verify: `solana balance`

### Option 3: Multiple Airdrops Script

```bash
#!/bin/bash
# airdrop.sh - Request multiple airdrops

for i in {1..5}; do
  echo "Requesting airdrop $i..."
  solana airdrop 1
  sleep 2
done

solana balance
```

```bash
chmod +x airdrop.sh
./airdrop.sh
```

**You need at least 5-10 SOL for testing** (deployment + transactions)

---

## 🚀 Step 3: Build Your Program

```bash
# Clean previous builds
anchor clean

# Build the program
anchor build

# This generates:
# - target/deploy/discount_platform.so (program binary)
# - target/idl/discount_platform.json (IDL)
# - target/types/discount_platform.ts (TypeScript types)
```

### Verify Build

```bash
# Check program binary size
ls -lh target/deploy/discount_platform.so

# Should be under 200KB ideally
# If larger, optimize in Cargo.toml (already done in your config)
```

---

## 📤 Step 4: Deploy to Devnet

### 4.1 Get Program ID

```bash
# Your program ID from Anchor.toml
solana address -k target/deploy/discount_platform-keypair.json

# Should match: 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3
```

### 4.2 Check Deployment Cost

```bash
# Calculate deployment cost
solana program show 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3

# If not deployed yet, estimate:
solana rent <program_size_bytes>
```

### 4.3 Deploy

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Expected output:
# Deploying cluster: https://api.devnet.solana.com
# Upgrade authority: <your_wallet>
# Deploying program "discount_platform"...
# Program Id: 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3
# Deploy success
```

### 4.4 Verify Deployment

```bash
# Check program exists
solana program show 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3

# Expected output:
# Program Id: 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: <address>
# Authority: <your_wallet>
# Last Deployed In Slot: <slot_number>
# Data Length: <bytes>
# Balance: <SOL>
```

---

## 🧪 Step 5: Run Tests on Devnet

### 5.1 Create Test Configuration

Create `tests/config.ts`:

```typescript
// tests/config.ts
import { Connection, Keypair } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import fs from 'fs';

export function getProvider(cluster: string = 'devnet') {
  const connection = new Connection(
    cluster === 'devnet' 
      ? 'https://api.devnet.solana.com'
      : 'http://127.0.0.1:8899',
    'confirmed'
  );

  const walletPath = process.env.ANCHOR_WALLET || 
    `${process.env.HOME}/.config/solana/id.json`;
  
  const walletKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf-8')))
  );

  const wallet = new Wallet(walletKeypair);
  
  return new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
}

export const DEVNET_PROGRAM_ID = '9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3';
```

### 5.2 Update Test File

Create/Update `tests/discount_platform.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from "@solana/spl-token";
import { assert } from "chai";
import { DiscountPlatform } from "../target/types/discount_platform";
import { getProvider, DEVNET_PROGRAM_ID } from "./config";

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const SYSVAR_INSTRUCTIONS_ID = new PublicKey('Sysvar1nstructions1111111111111111111111111');

describe("Discount Platform - Devnet Tests", () => {
  const provider = getProvider(process.env.CLUSTER || 'devnet');
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const authority = provider.wallet.publicKey;

  let marketplacePDA: PublicKey;
  let merchantPDA: PublicKey;
  let promotionPDA: PublicKey;
  let couponPDA: PublicKey;

  console.log("🔑 Authority:", authority.toString());
  console.log("📋 Program ID:", program.programId.toString());
  console.log("🌐 Cluster:", provider.connection.rpcEndpoint);

  it("Initialize Marketplace", async () => {
    [marketplacePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      program.programId
    );

    console.log("📦 Marketplace PDA:", marketplacePDA.toString());

    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          marketplace: marketplacePDA,
          authority: authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Initialize tx:", tx);

      // Verify marketplace account
      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      assert.equal(marketplace.authority.toString(), authority.toString());
      assert.equal(marketplace.feeBasisPoints, 250);
      
      console.log("✅ Marketplace initialized successfully");
    } catch (error: any) {
      if (error.message?.includes("already in use")) {
        console.log("ℹ️  Marketplace already initialized");
      } else {
        throw error;
      }
    }
  });

  it("Register Merchant", async () => {
    [merchantPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("merchant"), authority.toBuffer()],
      program.programId
    );

    console.log("🏪 Merchant PDA:", merchantPDA.toString());

    try {
      const tx = await program.methods
        .registerMerchant(
          "Test Coffee Shop",
          "Food & Beverage",
          40.7128,  // NYC latitude
          -74.0060  // NYC longitude
        )
        .accounts({
          merchant: merchantPDA,
          marketplace: marketplacePDA,
          authority: authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ Register merchant tx:", tx);

      // Verify merchant account
      const merchant = await program.account.merchant.fetch(merchantPDA);
      assert.equal(merchant.name, "Test Coffee Shop");
      assert.equal(merchant.category, "Food & Beverage");
      
      console.log("✅ Merchant registered successfully");
    } catch (error: any) {
      if (error.message?.includes("already in use")) {
        console.log("ℹ️  Merchant already registered");
      } else {
        throw error;
      }
    }
  });

  it("Create Promotion", async () => {
    const merchant = await program.account.merchant.fetch(merchantPDA);
    
    [promotionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("promotion"),
        merchantPDA.toBuffer(),
        Buffer.from(merchant.totalCouponsCreated.toArrayLike(Buffer, 'le', 8))
      ],
      program.programId
    );

    console.log("🎫 Promotion PDA:", promotionPDA.toString());

    const expiryTimestamp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

    const tx = await program.methods
      .createPromotion(
        50,  // 50% discount
        100, // max supply
        new anchor.BN(expiryTimestamp),
        "Food & Beverage",
        "50% off all drinks this month!",
        new anchor.BN(1_000_000) // 0.001 SOL
      )
      .accounts({
        promotion: promotionPDA,
        merchant: merchantPDA,
        authority: authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Create promotion tx:", tx);

    // Verify promotion
    const promotion = await program.account.promotion.fetch(promotionPDA);
    assert.equal(promotion.discountPercentage, 50);
    assert.equal(promotion.maxSupply, 100);
    
    console.log("✅ Promotion created successfully");
  });

  it("Mint Coupon NFT", async () => {
    const promotion = await program.account.promotion.fetch(promotionPDA);
    
    [couponPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(promotion.currentSupply.toArrayLike(Buffer, 'le', 4))
      ],
      program.programId
    );

    const nftMint = Keypair.generate();
    const recipient = authority;

    const tokenAccount = await getAssociatedTokenAddress(
      nftMint.publicKey,
      recipient
    );

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.publicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    );

    const [masterEdition] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        nftMint.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      METADATA_PROGRAM_ID
    );

    console.log("🎨 NFT Mint:", nftMint.publicKey.toString());
    console.log("💎 Coupon PDA:", couponPDA.toString());

    const tx = await program.methods
      .mintCoupon(new anchor.BN(Date.now()))
      .accounts({
        coupon: couponPDA,
        nftMint: nftMint.publicKey,
        tokenAccount: tokenAccount,
        metadata: metadata,
        masterEdition: masterEdition,
        promotion: promotionPDA,
        merchant: merchantPDA,
        marketplace: marketplacePDA,
        recipient: recipient,
        payer: authority,
        authority: authority,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([nftMint])
      .rpc();

    console.log("✅ Mint coupon tx:", tx);

    // Verify coupon
    const coupon = await program.account.coupon.fetch(couponPDA);
    assert.equal(coupon.owner.toString(), recipient.toString());
    assert.equal(coupon.isRedeemed, false);
    
    console.log("✅ Coupon NFT minted successfully");
  });

  it("List Coupon for Sale", async () => {
    const [listingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("listing"), couponPDA.toBuffer()],
      program.programId
    );

    console.log("📋 Listing PDA:", listingPDA.toString());

    const tx = await program.methods
      .listForSale(new anchor.BN(2_000_000)) // 0.002 SOL
      .accounts({
        listing: listingPDA,
        coupon: couponPDA,
        seller: authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ List coupon tx:", tx);

    // Verify listing
    const listing = await program.account.listing.fetch(listingPDA);
    assert.equal(listing.isActive, true);
    assert.equal(listing.price.toNumber(), 2_000_000);
    
    console.log("✅ Coupon listed for sale successfully");
  });

  it("Rate Promotion", async () => {
    const [ratingPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("rating"),
        authority.toBuffer(),
        promotionPDA.toBuffer()
      ],
      program.programId
    );

    console.log("⭐ Rating PDA:", ratingPDA.toString());

    const tx = await program.methods
      .ratePromotion(5) // 5 stars
      .accounts({
        rating: ratingPDA,
        promotion: promotionPDA,
        user: authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✅ Rate promotion tx:", tx);

    // Verify rating
    const rating = await program.account.rating.fetch(ratingPDA);
    assert.equal(rating.stars, 5);
    
    console.log("✅ Promotion rated successfully");
  });
});
```

### 5.3 Run Tests on Devnet

```bash
# Set cluster to devnet
export CLUSTER=devnet

# Run tests
ANCHOR_PROVIDER_URL="https://api.devnet.solana.com" \
ANCHOR_WALLET="$HOME/.config/solana/id.json" \
anchor test --skip-deploy --skip-local-validator

# Or with custom RPC (faster)
ANCHOR_PROVIDER_URL="https://devnet.helius-rpc.com/?api-key=YOUR_KEY" \
anchor test --skip-deploy --skip-local-validator
```

### 5.4 Watch Test Output

Expected output:
```
🔑 Authority: 7xK8p9...
📋 Program ID: 9P3wW4X...
🌐 Cluster: https://api.devnet.solana.com

  Discount Platform - Devnet Tests
    ✅ Initialize Marketplace (2.5s)
    ✅ Register Merchant (1.8s)
    ✅ Create Promotion (2.1s)
    ✅ Mint Coupon NFT (3.2s)
    ✅ List Coupon for Sale (1.5s)
    ✅ Rate Promotion (1.3s)

  6 passing (13s)
```

---

## 🔍 Step 6: Verify on Solana Explorer

### View Your Transactions

After each test, visit:
```
https://explorer.solana.com/address/9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3?cluster=devnet
```

### View Specific Accounts

```bash
# View marketplace account
solana account <marketplace_pda> --url devnet --output json

# View merchant account
solana account <merchant_pda> --url devnet --output json
```

---

## 🐛 Troubleshooting

### Issue: "Insufficient funds"

```bash
# Check balance
solana balance

# Request more SOL
solana airdrop 2

# Or use multiple faucets
```

### Issue: "Transaction simulation failed"

```bash
# Increase compute units in test
const tx = await program.methods
  .mintCoupon(...)
  .accounts({...})
  .preInstructions([
    anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
      units: 400_000
    })
  ])
  .rpc();
```

### Issue: "Account already in use"

This is normal if you re-run tests. Either:
1. Use different accounts (generate new keypairs)
2. Skip initialization in subsequent runs
3. Close and recreate accounts

### Issue: "Program not deployed"

```bash
# Verify deployment
solana program show 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3 --url devnet

# Redeploy if needed
anchor deploy --provider.cluster devnet
```

---

## 📊 Monitor Your Program

### Real-time Logs

```bash
# Stream program logs
solana logs 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3 --url devnet
```

### Check Program Size

```bash
# View program details
solana program show 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3 --url devnet
```

---

## 🎯 Next Steps After Testing

1. **Test all instructions** - Create comprehensive test suite
2. **Test edge cases** - Expired coupons, invalid inputs, etc.
3. **Load testing** - Multiple concurrent transactions
4. **Security audit** - Review access controls
5. **Optimize** - Reduce compute units if needed
6. **Document** - API docs and integration guide
7. **Mainnet prep** - Get audit, prepare deployment strategy

---

## 📝 Quick Reference Commands

```bash
# Switch to devnet
solana config set --url https://api.devnet.solana.com

# Get SOL
solana airdrop 2

# Build
anchor build

# Deploy
anchor deploy --provider.cluster devnet

# Test
anchor test --skip-deploy --skip-local-validator

# View logs
solana logs 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3 --url devnet

# Check program
solana program show 9P3wW4XQH7DntMqfEiLqS6SNztihxfenNUSqECh3WTf3 --url devnet
```

You're all set! 🚀
