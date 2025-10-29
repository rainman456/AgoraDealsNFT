#!/bin/bash

# Fund Devnet Test Accounts Script
# This script funds all your test accounts on Devnet

set -e

echo "🚀 Funding Devnet Test Accounts"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEVNET_KEYS_DIR=".devnet-keys"
AMOUNT="1" # SOL per airdrop

# Check if running on devnet
CURRENT_CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
if [[ ! "$CURRENT_CLUSTER" == *"devnet"* ]]; then
    echo -e "${YELLOW}⚠️  Warning: Not configured for devnet!${NC}"
    echo "Current cluster: $CURRENT_CLUSTER"
    echo ""
    echo "Switching to devnet..."
    solana config set --url https://api.devnet.solana.com
    echo ""
fi

# Create keys directory if it doesn't exist
if [ ! -d "$DEVNET_KEYS_DIR" ]; then
    echo "📁 Creating $DEVNET_KEYS_DIR directory..."
    mkdir -p "$DEVNET_KEYS_DIR"
    echo ""
fi

# Function to get public key from keypair file
get_pubkey() {
    local keypair_file=$1
    if [ -f "$keypair_file" ]; then
        solana-keygen pubkey "$keypair_file"
    else
        echo "NOT_FOUND"
    fi
}

# Function to fund an account
fund_account() {
    local name=$1
    local keypair_file=$2
    
    if [ ! -f "$keypair_file" ]; then
        echo -e "${YELLOW}⚠️  $name: Keypair not found (will be created on first test run)${NC}"
        return
    fi
    
    local pubkey=$(get_pubkey "$keypair_file")
    local balance=$(solana balance "$pubkey" --url devnet 2>/dev/null | awk '{print $1}')
    
    echo "💰 $name:"
    echo "   Address: $pubkey"
    echo "   Current Balance: $balance SOL"
    
    if (( $(echo "$balance < 0.5" | bc -l) )); then
        echo "   📤 Requesting airdrop..."
        if solana airdrop "$AMOUNT" "$pubkey" --url devnet 2>/dev/null; then
            new_balance=$(solana balance "$pubkey" --url devnet 2>/dev/null | awk '{print $1}')
            echo -e "   ${GREEN}✅ Success! New balance: $new_balance SOL${NC}"
        else
            echo -e "   ${RED}❌ Airdrop failed (rate limit or network issue)${NC}"
            echo -e "   ${YELLOW}   Manual: solana airdrop 1 $pubkey --url devnet${NC}"
            echo -e "   ${YELLOW}   Or visit: https://faucet.solana.com/${NC}"
        fi
    else
        echo -e "   ${GREEN}✅ Sufficient balance${NC}"
    fi
    echo ""
    sleep 1 # Avoid rate limiting
}

# Fund your main wallet
echo "👤 Main Wallet (Authority):"
MAIN_WALLET=$(solana address)
MAIN_BALANCE=$(solana balance --url devnet | awk '{print $1}')
echo "   Address: $MAIN_WALLET"
echo "   Current Balance: $MAIN_BALANCE SOL"

if (( $(echo "$MAIN_BALANCE < 2.0" | bc -l) )); then
    echo "   📤 Requesting airdrop..."
    if solana airdrop 2 --url devnet 2>/dev/null; then
        NEW_MAIN_BALANCE=$(solana balance --url devnet | awk '{print $1}')
        echo -e "   ${GREEN}✅ Success! New balance: $NEW_MAIN_BALANCE SOL${NC}"
    else
        echo -e "   ${RED}❌ Airdrop failed${NC}"
        echo -e "   ${YELLOW}   Manual: solana airdrop 2 --url devnet${NC}"
    fi
else
    echo -e "   ${GREEN}✅ Sufficient balance${NC}"
fi
echo ""

# Fund test accounts
echo "🧪 Test Accounts:"
echo "=================="
echo ""

fund_account "Merchant 1" "$DEVNET_KEYS_DIR/merchant1.json"
fund_account "Merchant 2" "$DEVNET_KEYS_DIR/merchant2.json"
fund_account "User 1" "$DEVNET_KEYS_DIR/user1.json"
fund_account "User 2" "$DEVNET_KEYS_DIR/user2.json"

echo "================================"
echo -e "${GREEN}✨ Funding complete!${NC}"
echo ""
echo "📝 Summary:"
solana balance --url devnet 2>/dev/null | head -1

if [ -f "$DEVNET_KEYS_DIR/merchant1.json" ]; then
    MERCHANT1_PUBKEY=$(get_pubkey "$DEVNET_KEYS_DIR/merchant1.json")
    echo "Merchant 1: $(solana balance $MERCHANT1_PUBKEY --url devnet 2>/dev/null | awk '{print $1}') SOL"
fi

if [ -f "$DEVNET_KEYS_DIR/merchant2.json" ]; then
    MERCHANT2_PUBKEY=$(get_pubkey "$DEVNET_KEYS_DIR/merchant2.json")
    echo "Merchant 2: $(solana balance $MERCHANT2_PUBKEY --url devnet 2>/dev/null | awk '{print $1}') SOL"
fi

if [ -f "$DEVNET_KEYS_DIR/user1.json" ]; then
    USER1_PUBKEY=$(get_pubkey "$DEVNET_KEYS_DIR/user1.json")
    echo "User 1: $(solana balance $USER1_PUBKEY --url devnet 2>/dev/null | awk '{print $1}') SOL"
fi

if [ -f "$DEVNET_KEYS_DIR/user2.json" ]; then
    USER2_PUBKEY=$(get_pubkey "$DEVNET_KEYS_DIR/user2.json")
    echo "User 2: $(solana balance $USER2_PUBKEY --url devnet 2>/dev/null | awk '{print $1}') SOL"
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Deploy: anchor build && anchor deploy --provider.cluster devnet"
echo "   2. Test: npm run devnet:coupon"
echo ""