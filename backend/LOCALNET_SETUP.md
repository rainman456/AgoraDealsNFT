# Complete Localnet Setup Guide - Step by Step

This guide will walk you through setting up and testing your backend on **Solana localnet** from scratch.

---

## What is Localnet?

Localnet is a local Solana blockchain running on your computer. It's perfect for:
- ✅ Fast testing (no network delays)
- ✅ Free SOL (unlimited airdrops)
- ✅ Complete control
- ✅ No real money at risk

---

## Part 1: Prerequisites Installation

### Step 1: Install Solana CLI (if not already installed)

```bash
# Check if Solana is installed
solana --version

# If not installed, install it:
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Add to PATH (add this to your ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation
solana --version
```

### Step 2: Install Anchor (if not already installed)

```bash
# Check if Anchor is installed
anchor --version

# If not installed:
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Verify installation
anchor --version
```

---

## Part 2: Start Solana Localnet

### Step 1: Start the Local Validator

Open a **new terminal window** and run:

```bash
# Start localnet (keep this terminal open)
solana-test-validator

# You should see output like:
# Ledger location: test-ledger
# Log: test-ledger/validator.log
# Identity: [PublicKey]
# Genesis Hash: [Hash]
# Version: [Version]
# Shred Version: [Number]
```

**Important:** Keep this terminal window open! The validator must run continuously.

### Step 2: Configure Solana CLI to Use Localnet

In a **new terminal**, run:

```bash
# Set Solana to use localnet
solana config set --url localhost

# Verify configuration
solana config get

# You should see:
# RPC URL: http://localhost:8899
```

### Step 3: Create a Wallet for Testing

```bash
# Create a new wallet (or use existing)
solana-keygen new --outfile ~/.config/solana/localnet-wallet.json

# Set this as your default wallet
solana config set --keypair ~/.config/solana/localnet-wallet.json

# Get your wallet address
solana address

# Airdrop SOL to your wallet (localnet has unlimited SOL!)
solana airdrop 100

# Check balance
solana balance
```

---

## Part 3: Deploy Your Smart Contract to Localnet

### Step 1: Build the Contract

```bash
# Navigate to contracts directory
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/contracts

# Build the contract
anchor build
```

### Step 2: Deploy to Localnet

```bash
# Deploy the program
anchor deploy

# You should see output like:
# Program Id: [YourProgramID]
# 
# Save this Program ID! You'll need it for the backend.
```

### Step 3: Get Your Program ID

```bash
# Get the program ID
solana address -k target/deploy/discount_platform-keypair.json

# Or check Anchor.toml
cat Anchor.toml | grep discount_platform
```

**Copy this Program ID** - you'll need it in the next step!

---

## Part 4: Set Up Backend Environment

### Step 1: Create Wallet Private Key Array

```bash
# Navigate to backend directory
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/backend

# Display your wallet private key as an array
cat ~/.config/solana/localnet-wallet.json
```

You'll see something like:
```json
[123,45,67,89,...]
```

**Copy this entire array** - you'll need it for the `.env` file.

### Step 2: Create .env File

```bash
# Create .env file
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/backend
nano .env
```

Paste this configuration (update the values):

```env
# Server Configuration
NODE_ENV=development
API_PORT=3001

# MongoDB Configuration
# Replace with your actual MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/discount-platform?retryWrites=true&w=majority

# Solana Localnet Configuration
SOLANA_NETWORK=localnet
SOLANA_RPC_URL=http://localhost:8899

# Your deployed program ID (from Step 3 above)
PROGRAM_ID=YourProgramIDFromDeployment

# Your wallet private key array (from Step 1 above)
WALLET_PRIVATE_KEY=[123,45,67,89,...]
```

**Save the file** (Ctrl+O, Enter, Ctrl+X in nano)

### Step 3: Install Backend Dependencies

```bash
# Make sure you're in backend directory
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/backend

# Install dependencies
npm install
```

---

## Part 5: Start and Test the Backend

### Step 1: Start the Backend Server

```bash
# Start in development mode
npm run dev

# You should see:
# ✅ Connected to MongoDB
# 🚀 Server running on http://localhost:3001
# 📡 Solana network: localnet
# 🔗 Program ID: YourProgramID
```

### Step 2: Test the API

Open a **new terminal** and test the endpoints:

#### Test 1: Register a Merchant

```bash
curl -X POST http://localhost:3001/api/v1/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Pizza Shop",
    "category": "Food",
    "description": "Best pizza in localnet",
    "walletAddress": "YOUR_WALLET_ADDRESS_HERE"
  }'
```

Replace `YOUR_WALLET_ADDRESS_HERE` with your wallet address from:
```bash
solana address
```

#### Test 2: Create a Promotion

```bash
curl -X POST http://localhost:3001/api/v1/promotions/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "50% Off Pizza",
    "description": "Half price on all pizzas",
    "discountPercentage": 50,
    "maxSupply": 100,
    "expiryDays": 30,
    "category": "Food",
    "price": 5,
    "walletAddress": "YOUR_WALLET_ADDRESS_HERE"
  }'
```

**Save the promotion ID** from the response!

#### Test 3: Mint a Coupon

```bash
curl -X POST http://localhost:3001/api/v1/coupons/mint \
  -H "Content-Type: application/json" \
  -d '{
    "promotionId": "PROMOTION_ID_FROM_TEST_2",
    "recipientAddress": "YOUR_WALLET_ADDRESS_HERE",
    "walletAddress": "YOUR_WALLET_ADDRESS_HERE"
  }'
```

---

## Part 6: Verify Everything is Working

### Check 1: Verify Solana Transactions

```bash
# Check recent transactions on your wallet
solana transaction-history YOUR_WALLET_ADDRESS --limit 5

# You should see the transactions from minting coupons, creating promotions, etc.
```

### Check 2: Verify MongoDB Data

Log into your MongoDB Atlas dashboard and check:
- `merchants` collection - should have your test merchant
- `promotions` collection - should have your test promotion
- `coupons` collection - should have your minted coupon

### Check 3: Check Program Accounts

```bash
# List all accounts owned by your program
solana program show YOUR_PROGRAM_ID
```

---

## Part 7: Complete Testing Workflow

Now test the full user journey:

```bash
# 1. Register merchant
curl -X POST http://localhost:3001/api/v1/merchants/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Joe Pizza","category":"Food","walletAddress":"YOUR_WALLET"}'

# 2. Create promotion
curl -X POST http://localhost:3001/api/v1/promotions/create \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Deal","discountPercentage":50,"maxSupply":100,"expiryDays":30,"category":"Food","price":5,"walletAddress":"YOUR_WALLET"}'

# 3. Mint coupon
curl -X POST http://localhost:3001/api/v1/coupons/mint \
  -H "Content-Type: application/json" \
  -d '{"promotionId":"PROMO_ID","recipientAddress":"YOUR_WALLET","walletAddress":"YOUR_WALLET"}'

# 4. Generate redemption ticket
curl -X POST http://localhost:3001/api/v1/redemption-tickets/generate \
  -H "Content-Type: application/json" \
  -d '{"couponId":"COUPON_ID","walletAddress":"YOUR_WALLET","latitude":40.7128,"longitude":-74.0060}'

# 5. Get user's coupons
curl http://localhost:3001/api/v1/coupons/my-coupons?walletAddress=YOUR_WALLET

# 6. List coupon on marketplace
curl -X POST http://localhost:3001/api/v1/marketplace/list \
  -H "Content-Type: application/json" \
  -d '{"couponId":"COUPON_ID","price":10,"walletAddress":"YOUR_WALLET"}'

# 7. Get marketplace listings
curl http://localhost:3001/api/v1/marketplace/listings
```

---

## Part 8: Troubleshooting

### Problem: "Cannot connect to MongoDB"

**Solution:**
```bash
# Check your MongoDB connection string in .env
# Make sure your IP is whitelisted in MongoDB Atlas
# Test connection:
mongosh "YOUR_MONGODB_URI"
```

### Problem: "Localnet validator not running"

**Solution:**
```bash
# Check if validator is running
solana cluster-version

# If not, start it in a separate terminal:
solana-test-validator
```

### Problem: "Program not found"

**Solution:**
```bash
# Redeploy the program
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/contracts
anchor build
anchor deploy

# Update PROGRAM_ID in backend/.env with the new ID
```

### Problem: "Insufficient funds"

**Solution:**
```bash
# Airdrop more SOL (localnet has unlimited!)
solana airdrop 100

# Check balance
solana balance
```

### Problem: "Transaction simulation failed"

**Solution:**
```bash
# Check validator logs
tail -f test-ledger/validator.log

# Check if accounts are initialized properly
# Verify program ID matches in .env and deployment
```

---

## Part 9: Quick Reference Commands

### Terminal 1: Localnet Validator (keep running)
```bash
solana-test-validator
```

### Terminal 2: Backend Server (keep running)
```bash
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/backend
npm run dev
```

### Terminal 3: Testing Commands
```bash
# Get wallet address
solana address

# Check balance
solana balance

# Airdrop SOL
solana airdrop 100

# Check transactions
solana transaction-history $(solana address) --limit 5

# Test API
curl http://localhost:3001/api/v1/merchants
```

---

## Part 10: Next Steps

Once everything is working on localnet:

1. ✅ Test all API endpoints
2. ✅ Verify data in MongoDB
3. ✅ Check Solana transactions
4. ✅ Test the complete user flow
5. ✅ Connect your frontend to the backend
6. ✅ Test frontend + backend integration
7. ✅ When ready, deploy to devnet/testnet
8. ✅ Finally, deploy to mainnet

---

## Summary Checklist

- [ ] Solana CLI installed
- [ ] Anchor installed
- [ ] Localnet validator running (Terminal 1)
- [ ] Wallet created with SOL
- [ ] Smart contract deployed to localnet
- [ ] Program ID copied
- [ ] Backend .env configured
- [ ] MongoDB connection string added
- [ ] Backend server running (Terminal 2)
- [ ] API endpoints tested successfully
- [ ] Data verified in MongoDB
- [ ] Transactions verified on Solana

---

## Need Help?

If you get stuck at any step:

1. **Check the logs:**
   - Backend: Look at terminal running `npm run dev`
   - Validator: `tail -f test-ledger/validator.log`

2. **Verify configuration:**
   - `solana config get` - should show localhost
   - `cat backend/.env` - check all values are correct

3. **Reset and try again:**
   ```bash
   # Stop validator (Ctrl+C in Terminal 1)
   # Remove ledger
   rm -rf test-ledger
   # Start fresh
   solana-test-validator --reset
   ```

Good luck! 🚀
