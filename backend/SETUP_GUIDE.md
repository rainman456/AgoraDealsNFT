# Backend Setup Guide - Prototype Testing

This guide will help you set up and test the backend API for your discount platform prototype.

## Prerequisites Checklist

✅ MongoDB instance deployed and accessible  
✅ Solana smart contract deployed (program ID available)  
✅ Node.js 18+ installed  
✅ Wallet with some SOL for testing (can use devnet/testnet)

---

## Step 1: Environment Configuration

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

Add the following configuration (update with your actual values):

```env
# Server Configuration
NODE_ENV=development
API_PORT=3001

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string_here
# Example: mongodb+srv://username:password@cluster.mongodb.net/discount-platform?retryWrites=true&w=majority

# Solana Configuration
SOLANA_NETWORK=devnet
# Options: devnet, testnet, mainnet-beta
# For prototype, use devnet or testnet

SOLANA_RPC_URL=https://api.devnet.solana.com
# For testnet: https://api.testnet.solana.com
# For mainnet: https://api.mainnet-beta.solana.com

# Your deployed program ID from contracts/target/deploy/
PROGRAM_ID=YourDeployedProgramIDHere

# Wallet Configuration (for backend operations)
# This should be a wallet that has authority to perform operations
WALLET_PRIVATE_KEY=[1,2,3,4,5...]
# This is the array format from your wallet JSON file
# You can get this from: solana-keygen new --outfile wallet.json
# Then read the array from wallet.json
```

---

## Step 2: Install Dependencies

```bash
cd backend
npm install
```

---

## Step 3: Database Setup

The backend will automatically create collections when you start making requests. MongoDB schemas are defined in `backend/src/models/`.

**Key Collections:**
- `merchants` - Merchant profiles
- `promotions` - Discount promotions
- `coupons` - NFT coupons
- `users` - User profiles
- `redemptiontickets` - QR code redemption tickets
- `groupdeals` - Group buying deals
- `auctions` - Coupon auctions
- `marketplacelistings` - Marketplace listings

---

## Step 4: Start the Backend Server

```bash
# Development mode with hot reload
npm run dev

# Or build and run production mode
npm run build
npm start
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:3001
📡 Solana network: devnet
🔗 Program ID: YourProgramID
```

---

## Step 5: Testing the API

### Option A: Using cURL

**1. Register a Merchant:**
```bash
curl -X POST http://localhost:3001/api/v1/merchants/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Merchant",
    "category": "Food",
    "description": "Testing merchant registration",
    "walletAddress": "YourWalletAddressHere"
  }'
```

**2. Create a Promotion:**
```bash
curl -X POST http://localhost:3001/api/v1/promotions/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Promotion",
    "description": "50% off test deal",
    "discountPercentage": 50,
    "maxSupply": 100,
    "expiryDays": 30,
    "category": "Food",
    "price": 5,
    "walletAddress": "YourMerchantWalletAddress"
  }'
```

**3. Mint a Coupon:**
```bash
curl -X POST http://localhost:3001/api/v1/coupons/mint \
  -H "Content-Type: application/json" \
  -d '{
    "promotionId": "PromotionIdFromStep2",
    "recipientAddress": "UserWalletAddress",
    "walletAddress": "MerchantWalletAddress"
  }'
```

### Option B: Using Postman/Insomnia

1. Import the API endpoints from `backend/README_API.md`
2. Create a new environment with:
   - `base_url`: `http://localhost:3001/api/v1`
   - `merchant_wallet`: Your merchant wallet address
   - `user_wallet`: Your user wallet address

### Option C: Using the Test Suite

```bash
cd backend
npm test
```

This will run all integration tests against your local setup.

---

## Step 6: Key Workflows to Test

### Workflow 1: Merchant → Promotion → Coupon → Redemption

```bash
# 1. Register merchant
POST /api/v1/merchants/register

# 2. Create promotion
POST /api/v1/promotions/create

# 3. Mint coupon for user
POST /api/v1/coupons/mint

# 4. Generate redemption ticket
POST /api/v1/redemption-tickets/generate

# 5. Verify and redeem ticket
POST /api/v1/redemption-tickets/verify-and-redeem
```

### Workflow 2: Marketplace Trading

```bash
# 1. User lists coupon for sale
POST /api/v1/marketplace/list

# 2. Another user buys the coupon
POST /api/v1/marketplace/buy

# 3. Check marketplace listings
GET /api/v1/marketplace/listings
```

### Workflow 3: Group Deals

```bash
# 1. Create group deal
POST /api/v1/group-deals/create

# 2. Users join the deal
POST /api/v1/group-deals/:dealId/join

# 3. Check deal progress
GET /api/v1/group-deals/:dealId

# 4. Finalize when target reached
POST /api/v1/group-deals/:dealId/finalize
```

### Workflow 4: Auctions

```bash
# 1. Create auction for a coupon
POST /api/v1/auctions/create

# 2. Users place bids
POST /api/v1/auctions/:auctionId/bid

# 3. Settle auction after expiry
POST /api/v1/auctions/:auctionId/settle
```

---

## Step 7: Monitoring & Debugging

### Check Server Logs
The server logs all requests and blockchain interactions. Watch for:
- ✅ Successful transactions
- ❌ Failed transactions with error messages
- 🔗 Transaction signatures (verify on Solana Explorer)

### Verify on Solana Explorer
For each transaction, copy the signature and check:
- **Devnet:** https://explorer.solana.com/?cluster=devnet
- **Testnet:** https://explorer.solana.com/?cluster=testnet

### MongoDB Monitoring
Check your MongoDB Atlas dashboard to see:
- Collections being created
- Documents being inserted
- Query performance

---

## Step 8: Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:** 
- Verify your `MONGODB_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure network access is configured

### Issue: "Program ID not found"
**Solution:**
- Verify your smart contract is deployed
- Check the program ID matches your deployment
- Ensure you're using the correct network (devnet/testnet)

### Issue: "Insufficient SOL for transaction"
**Solution:**
- Get devnet SOL: `solana airdrop 2 YourWalletAddress --url devnet`
- Or use testnet faucet

### Issue: "Transaction simulation failed"
**Solution:**
- Check smart contract logs
- Verify account ownership
- Ensure all required accounts are passed correctly

---

## Step 9: Integration with Frontend

Once backend is running, update your frontend `.env`:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_SOLANA_NETWORK=devnet
VITE_PROGRAM_ID=YourProgramID
```

The frontend will now communicate with your local backend.

---

## Step 10: Production Deployment Checklist

When ready to deploy:

- [ ] Update `SOLANA_NETWORK` to `mainnet-beta`
- [ ] Update `SOLANA_RPC_URL` to mainnet RPC (consider using Helius, QuickNode, or Alchemy)
- [ ] Secure your `WALLET_PRIVATE_KEY` (use environment variables, not hardcoded)
- [ ] Set up MongoDB production cluster with proper security
- [ ] Enable CORS for your frontend domain only
- [ ] Set up rate limiting and API authentication
- [ ] Configure logging and monitoring (e.g., Sentry, LogRocket)
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy for MongoDB
- [ ] Test all workflows on mainnet with small amounts first

---

## Quick Reference: Essential Commands

```bash
# Start backend
cd backend && npm run dev

# Run tests
cd backend && npm test

# Check MongoDB connection
# (Add this to your code or use MongoDB Compass)

# Get devnet SOL
solana airdrop 2 --url devnet

# Check program deployment
solana program show YourProgramID --url devnet

# View transaction
# Visit: https://explorer.solana.com/tx/SIGNATURE?cluster=devnet
```

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Start the backend server
3. ✅ Test merchant registration
4. ✅ Test promotion creation
5. ✅ Test coupon minting
6. ✅ Test redemption flow
7. ✅ Test marketplace features
8. ✅ Test group deals and auctions
9. ✅ Integrate with frontend
10. ✅ Deploy to production

---

## Support Resources

- **API Documentation:** `backend/README_API.md`
- **Test Examples:** `backend/README_TESTS.md`
- **Solana Docs:** https://docs.solana.com
- **Anchor Docs:** https://www.anchor-lang.com
- **MongoDB Docs:** https://docs.mongodb.com

---

## Questions?

If you encounter issues:
1. Check server logs for error messages
2. Verify environment variables are set correctly
3. Ensure smart contract is deployed and accessible
4. Check MongoDB connection and permissions
5. Verify wallet has sufficient SOL for transactions

Good luck with your prototype! 🚀
