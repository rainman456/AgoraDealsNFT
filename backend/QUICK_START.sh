#!/bin/bash

# Quick Start Script for Localnet Testing
# This script helps you set up everything step by step

set -e

echo "🚀 Discount Platform - Localnet Quick Start"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check Solana CLI
echo -e "${YELLOW}Step 1: Checking Solana CLI...${NC}"
if command -v solana &> /dev/null; then
    echo -e "${GREEN}✓ Solana CLI found: $(solana --version)${NC}"
else
    echo -e "${RED}✗ Solana CLI not found${NC}"
    echo "Install it with: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi
echo ""

# Step 2: Check Anchor
echo -e "${YELLOW}Step 2: Checking Anchor...${NC}"
if command -v anchor &> /dev/null; then
    echo -e "${GREEN}✓ Anchor found: $(anchor --version)${NC}"
else
    echo -e "${RED}✗ Anchor not found${NC}"
    echo "Install it with: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi
echo ""

# Step 3: Check if validator is running
echo -e "${YELLOW}Step 3: Checking if localnet validator is running...${NC}"
if solana cluster-version &> /dev/null; then
    echo -e "${GREEN}✓ Localnet validator is running${NC}"
else
    echo -e "${RED}✗ Localnet validator is not running${NC}"
    echo ""
    echo "Please start the validator in a separate terminal:"
    echo "  solana-test-validator"
    echo ""
    read -p "Press Enter once the validator is running..."
fi
echo ""

# Step 4: Configure Solana to use localnet
echo -e "${YELLOW}Step 4: Configuring Solana CLI for localnet...${NC}"
solana config set --url localhost
echo -e "${GREEN}✓ Configured to use localnet${NC}"
echo ""

# Step 5: Check/Create wallet
echo -e "${YELLOW}Step 5: Setting up wallet...${NC}"
WALLET_PATH="$HOME/.config/solana/localnet-wallet.json"

if [ -f "$WALLET_PATH" ]; then
    echo -e "${GREEN}✓ Wallet already exists at $WALLET_PATH${NC}"
else
    echo "Creating new wallet..."
    solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase
    echo -e "${GREEN}✓ Wallet created${NC}"
fi

solana config set --keypair "$WALLET_PATH"
WALLET_ADDRESS=$(solana address)
echo -e "${GREEN}✓ Wallet address: $WALLET_ADDRESS${NC}"
echo ""

# Step 6: Airdrop SOL
echo -e "${YELLOW}Step 6: Airdropping SOL...${NC}"
BALANCE=$(solana balance | awk '{print $1}')
if (( $(echo "$BALANCE < 10" | bc -l) )); then
    echo "Current balance: $BALANCE SOL"
    echo "Airdropping 100 SOL..."
    solana airdrop 100
    echo -e "${GREEN}✓ Airdrop complete${NC}"
else
    echo -e "${GREEN}✓ Sufficient balance: $BALANCE SOL${NC}"
fi
echo ""

# Step 7: Build and deploy contract
echo -e "${YELLOW}Step 7: Building and deploying smart contract...${NC}"
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/contracts

echo "Building contract..."
anchor build

echo "Deploying to localnet..."
anchor deploy

PROGRAM_ID=$(solana address -k target/deploy/discount_platform-keypair.json)
echo -e "${GREEN}✓ Contract deployed${NC}"
echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"
echo ""

# Step 8: Get wallet private key
echo -e "${YELLOW}Step 8: Reading wallet private key...${NC}"
WALLET_PRIVATE_KEY=$(cat "$WALLET_PATH")
echo -e "${GREEN}✓ Wallet private key read${NC}"
echo ""

# Step 9: Create .env file
echo -e "${YELLOW}Step 9: Creating backend .env file...${NC}"
cd /workspace/c86db89f-e91e-4b48-8b5d-428ed45c4cfd/backend

cat > .env << EOF
# Server Configuration
NODE_ENV=development
API_PORT=3001

# MongoDB Configuration
# TODO: Replace with your actual MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/discount-platform

# Solana Localnet Configuration
SOLANA_NETWORK=localnet
SOLANA_RPC_URL=http://localhost:8899

# Deployed Program ID
PROGRAM_ID=$PROGRAM_ID

# Wallet Private Key
WALLET_PRIVATE_KEY=$WALLET_PRIVATE_KEY
EOF

echo -e "${GREEN}✓ .env file created${NC}"
echo ""

# Step 10: Install backend dependencies
echo -e "${YELLOW}Step 10: Installing backend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "📝 Important Information:"
echo "  Wallet Address: $WALLET_ADDRESS"
echo "  Program ID: $PROGRAM_ID"
echo "  RPC URL: http://localhost:8899"
echo ""
echo "⚠️  IMPORTANT: Update MongoDB connection string in backend/.env"
echo ""
echo "🚀 Next Steps:"
echo "  1. Update MONGODB_URI in backend/.env with your MongoDB connection string"
echo "  2. Start the backend server:"
echo "     cd backend && npm run dev"
echo "  3. Test the API endpoints (see LOCALNET_SETUP.md for examples)"
echo ""
echo "📚 Documentation:"
echo "  - Full guide: backend/LOCALNET_SETUP.md"
echo "  - API docs: backend/README_API.md"
echo ""
echo "💡 Quick Test:"
echo "  curl -X POST http://localhost:3001/api/v1/merchants/register \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"name\":\"Test Shop\",\"category\":\"Food\",\"walletAddress\":\"$WALLET_ADDRESS\"}'"
echo ""
