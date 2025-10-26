# 🧪 Local Validator Testing Guide

Complete guide for testing the Discount Platform on a local Solana validator.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Starting the Local Validator](#starting-the-local-validator)
- [Building and Deploying](#building-and-deploying)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)
- [Best Practices](#best-practices)

---

## 🔧 Prerequisites

### Required Software

1. **Rust** (v1.70.0 or higher)
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Verify installation
   rustc --version
   cargo --version
   ```

2. **Solana CLI** (v1.18.0 or higher)
   ```bash
   # Install Solana CLI
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   
   # Add to PATH (add to ~/.bashrc or ~/.zshrc)
   export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
   
   # Verify installation
   solana --version
   ```

3. **Anchor** (v0.31.0)
   ```bash
   # Install Anchor Version Manager (avm)
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   
   # Install Anchor 0.31.0
   avm install 0.31.0
   avm use 0.31.0
   
   # Verify installation
   anchor --version
   ```

4. **Node.js** (v18.0.0 or higher) and **Yarn**
   ```bash
   # Install Node.js (using nvm)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   
   # Install Yarn
   npm install -g yarn
   
   # Verify installation
   node --version
   yarn --version
   ```

---

## 🚀 Initial Setup

### 1. Clone and Navigate to Project

```bash
cd /path/to/discount-platform
```

### 2. Install Dependencies

```bash
# Install Node dependencies
yarn install
# or
npm install
```

### 3. Generate Program Keypair

```bash
# Generate a new program keypair (if not exists)
anchor keys list

# If you need to generate new keys
solana-keygen new -o target/deploy/discount_platform-keypair.json

# Update program ID in Anchor.toml and lib.rs
anchor keys sync
```

### 4. Configure Solana CLI for Local Testing

```bash
# Set CLI to use localhost
solana config set --url localhost

# Verify configuration
solana config get

# Expected output:
# Config File: /Users/your-name/.config/solana/cli/config.yml
# RPC URL: http://localhost:8899
# WebSocket URL: ws://localhost:8900/
# Keypair Path: /Users/your-name/.config/solana/id.json
# Commitment: confirmed
```

### 5. Create Test Wallet (if needed)

```bash
# Generate a new test wallet
solana-keygen new -o ~/.config/solana/test-wallet.json

# Set as default
solana config set --keypair ~/.config/solana/test-wallet.json

# Check your public key
solana address
```

---

## 🖥️ Starting the Local Validator

### Method 1: Using Solana Test Validator (Recommended)

```bash
# Start validator in a separate terminal
solana-test-validator

# You should see output like:
# Ledger location: test-ledger
# Log: test-ledger/validator.log
# ⠁ Initializing...
# Identity: [VALIDATOR_PUBKEY]
# Genesis Hash: [HASH]
# Version: [VERSION]
# Shred Version: [NUMBER]
# Gossip Address: 127.0.0.1:1024
# TPU Address: 127.0.0.1:1027
# JSON RPC URL: http://127.0.0.1:8899
# WebSocket PubSub URL: ws://127.0.0.1:8900
```

### Method 2: Using Solana Test Validator with Custom Configuration

```bash
# Start with custom configuration
solana-test-validator \
  --ledger test-ledger \
  --reset \
  --quiet \
  --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s \
    ./deps/metaplex_token_metadata.so

# Flags explained:
# --ledger: Directory for ledger data
# --reset: Reset ledger state on startup
# --quiet: Reduce log verbosity
# --bpf-program: Load external programs (Token Metadata)
```

### Method 3: Start with Anchor (Integrated)

```bash
# Anchor automatically starts validator when testing
anchor test

# Or explicitly start and keep running
anchor localnet
```

### Verify Validator is Running

```bash
# Check validator status
solana cluster-version

# Check validator health
solana ping

# Expected output:
# Submit transaction... confirmed
# Confirmation time: X.XXXs
```

---

## 🔨 Building and Deploying

### 1. Build the Program

```bash
# Clean previous builds
anchor clean

# Build the program
anchor build

# Expected output:
# Compiling discount-platform v1.0.0
# Finished release [optimized] target(s) in XXs
```

### 2. Verify Build

```bash
# Check program size
ls -lh target/deploy/discount_platform.so

# Program should be < 10MB for optimal performance
# If too large, optimize with:
anchor build --verifiable
```

### 3. Airdrop SOL for Deployment

```bash
# Airdrop SOL to your wallet (needed for deployment)
solana airdrop 10

# Check balance
solana balance

# Expected: 10 SOL
```

### 4. Deploy the Program

```bash
# Deploy to local validator
anchor deploy

# Expected output:
# Deploying cluster: http://localhost:8899
# Upgrade authority: [YOUR_PUBKEY]
# Deploying program "discount_platform"...
# Program Id: [PROGRAM_ID]
# Deploy success
```

### 5. Verify Deployment

```bash
# Get program ID
anchor keys list

# Check program account
solana program show [PROGRAM_ID]

# Expected output shows:
# Program Id: [PROGRAM_ID]
# Owner: BPFLoaderUpgradeab1e11111111111111111111111
# ProgramData Address: [ADDRESS]
# Authority: [YOUR_PUBKEY]
# Last Deployed In Slot: [SLOT]
# Data Length: [SIZE] bytes
```

---

## 🧪 Running Tests

### Full Test Suite

```bash
# Run all tests (Anchor handles validator automatically)
anchor test

# What happens:
# 1. Starts local validator
# 2. Builds program
# 3. Deploys program
# 4. Runs all tests
# 5. Shuts down validator
```

### Run Tests on Already Running Validator

```bash
# In terminal 1: Start validator
solana-test-validator --reset

# In terminal 2: Build and deploy
anchor build
anchor deploy

# In terminal 3: Run tests without starting new validator
anchor test --skip-local-validator

# Or use yarn/npm
yarn test
npm test
```

### Run Individual Test Suites

```bash
# Run specific test file
anchor test --skip-local-validator -- tests/merchant.test.ts

# Or using npm scripts
npm run test:merchant
npm run test:promotion
npm run test:coupon
npm run test:marketplace
npm run test:rating
npm run test:comment
npm run test:badge
npm run test:external
npm run test:integration
```

### Run Tests with Detailed Output

```bash
# Verbose output
RUST_LOG=debug anchor test

# Anchor logs
ANCHOR_LOG=true anchor test

# Both combined
RUST_LOG=debug ANCHOR_LOG=true anchor test
```

### Run Tests with Custom Timeout

```bash
# Increase timeout for slow tests
mocha -t 300000 tests/integration.test.ts

# Or modify package.json scripts to include timeout
```

---

## 🔍 Monitoring and Debugging

### 1. View Validator Logs

```bash
# Follow validator logs in real-time
tail -f test-ledger/validator.log

# Or use Solana's log viewer
solana logs
```

### 2. Check Program Logs

```bash
# View program logs (run in separate terminal while testing)
solana logs | grep "Program [PROGRAM_ID]"

# Or for specific program
solana logs [PROGRAM_ID]
```

### 3. Monitor Transactions

```bash
# Watch all transactions
solana confirm -v --url localhost

# Check recent signatures
solana transaction-history [ADDRESS]
```

### 4. Inspect Accounts

```bash
# View account data
solana account [ACCOUNT_ADDRESS]

# View account in JSON format
solana account [ACCOUNT_ADDRESS] --output json-compact
```

### 5. Debug Tests

```javascript
// Add debugging to tests
describe("Debug Test", () => {
  it("prints account data", async () => {
    const account = await program.account.marketplace.fetch(marketplacePDA);
    console.log("Marketplace:", JSON.stringify(account, null, 2));
  });
});
```

---

## 🛠️ Troubleshooting

### Problem 1: "Connection Refused" Error

```bash
# Solution 1: Ensure validator is running
solana-test-validator

# Solution 2: Check if port is in use
lsof -i :8899

# Solution 3: Kill existing processes
pkill -f solana-test-validator

# Solution 4: Reset validator
solana-test-validator --reset
```

### Problem 2: "Program not deployed" Error

```bash
# Solution 1: Deploy program
anchor deploy

# Solution 2: Verify program ID matches
anchor keys list
# Check that program ID in lib.rs matches

# Solution 3: Rebuild and deploy
anchor clean
anchor build
anchor deploy
```

### Problem 3: "Insufficient funds" Error

```bash
# Solution 1: Airdrop more SOL
solana airdrop 10

# Solution 2: Check balance
solana balance

# Solution 3: Increase airdrop in tests
// In setup.ts, increase airdrop amount
await airdrop(connection, publicKey, 20); // Increase from 10 to 20
```

### Problem 4: "Account Already in Use" Error

```bash
# Solution 1: Reset validator
solana-test-validator --reset

# Solution 2: Use different account seeds
// Change seeds in tests to avoid collisions

# Solution 3: Clear test ledger
rm -rf test-ledger
solana-test-validator
```

### Problem 5: "Transaction Timeout" Error

```bash
# Solution 1: Increase commitment level
const connection = new Connection("http://localhost:8899", "confirmed");

# Solution 2: Wait for confirmation
await connection.confirmTransaction(signature, "confirmed");

# Solution 3: Increase test timeout
mocha -t 600000 tests/*.test.ts
```

### Problem 6: "IDL Build Failed" Error

```bash
# Solution: Add anchor-spl/idl-build feature
# In Cargo.toml:
[features]
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

# Then rebuild
anchor clean
anchor build
```

### Problem 7: "Program Failed to Complete" Error

```bash
# Solution 1: Check program logs
solana logs | grep "Program log"

# Solution 2: Increase compute units
// In Rust code, add:
invoke_signed(
    instruction,
    accounts,
    &[],
)?;

# Solution 3: Review account constraints
// Ensure all account constraints are met
```

### Problem 8: Tests Pass but Can't Find Accounts

```bash
# Solution: Check PDA derivation
// Ensure seeds match program:
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("seed"), otherKey.toBuffer()],
  program.programId
);

# Print PDAs for debugging
console.log("Expected PDA:", pda.toString());
```

---

## ⚙️ Advanced Configuration

### Custom Validator Configuration

Create `validator-config.toml`:

```toml
[test_validator]
ledger_path = "test-ledger"
reset = true
quiet = true
slots_per_epoch = 32
faucet_port = 9900

[programs]
# Add external programs
metaplex_token_metadata = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
```

Start with config:
```bash
solana-test-validator --config validator-config.toml
```

### Anchor.toml Configuration

```toml
[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[programs.localnet]
discount_platform = "kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[test]
startup_wait = 10000

[test.validator]
url = "http://127.0.0.1:8899"

[[test.validator.clone]]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"

[[test.validator.account]]
address = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
filename = "deps/spl_token.json"
```

### Environment Variables

Create `.env` file:

```bash
# Network Configuration
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899
ANCHOR_WALLET=~/.config/solana/id.json

# Program Configuration
PROGRAM_ID=kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe

# Test Configuration
TEST_TIMEOUT=300000
AIRDROP_AMOUNT=10

# Logging
RUST_LOG=debug
ANCHOR_LOG=true
```

Load in tests:
```typescript
import dotenv from 'dotenv';
dotenv.config();

const connection = new Connection(
  process.env.ANCHOR_PROVIDER_URL || "http://localhost:8899"
);
```

---

## 📝 Best Practices

### 1. Clean State Between Test Runs

```bash
# Always reset validator for fresh state
solana-test-validator --reset

# Or clean programmatically
before(async () => {
  // Close all accounts before tests
  await cleanupAccounts();
});
```

### 2. Use Descriptive Test Names

```typescript
it("should prevent minting when promotion supply is exhausted", async () => {
  // Test implementation
});
```

### 3. Proper Error Handling

```typescript
try {
  await program.methods.invalidOperation().rpc();
  assert.fail("Should have thrown an error");
} catch (error) {
  expect(error.message).to.include("ExpectedErrorCode");
}
```

### 4. Verify State Changes

```typescript
// Always verify state before and after
const accountBefore = await program.account.merchant.fetch(merchantPDA);
assert.equal(accountBefore.totalCoupons, 0);

await program.methods.mintCoupon().rpc();

const accountAfter = await program.account.merchant.fetch(merchantPDA);
assert.equal(accountAfter.totalCoupons, 1);
```

### 5. Use Helper Functions

```typescript
// Create reusable helpers
async function setupMerchant(name: string): Promise<[PublicKey, Keypair]> {
  const merchant = Keypair.generate();
  const [pda] = derivePDA([Buffer.from("merchant"), merchant.publicKey.toBuffer()]);
  
  await program.methods
    .registerMerchant(name, "category", null, null)
    .accounts({merchant: pda, authority: merchant.publicKey})
    .signers([merchant])
    .rpc();
    
  return [pda, merchant];
}
```

### 6. Parallel Test Execution

```bash
# Run tests in parallel for speed
mocha --parallel tests/**/*.test.ts

# Or configure in package.json
{
  "scripts": {
    "test:parallel": "mocha --parallel tests/**/*.test.ts"
  }
}
```

### 7. Test Coverage

```bash
# Add coverage reporting
npm install --save-dev nyc

# Run with coverage
nyc --reporter=html --reporter=text anchor test

# View coverage report
open coverage/index.html
```

---

## 📊 Performance Tips

### 1. Optimize Validator Startup

```bash
# Use --limit-ledger-size for faster cleanup
solana-test-validator --limit-ledger-size 10000000

# Use --geyser-plugin-config for better performance
solana-test-validator --geyser-plugin-config config.json
```

### 2. Batch Transactions

```typescript
// Instead of multiple RPC calls
for (let i = 0; i < 10; i++) {
  await mintCoupon(i);
}

// Use transaction batching
const txs = await Promise.all([...Array(10)].map((_, i) => mintCoupon(i)));
```

### 3. Reuse Accounts

```typescript
// Setup once, use multiple times
let merchant: Keypair;
let merchantPDA: PublicKey;

before(async () => {
  [merchantPDA, merchant] = await setupMerchant();
});

// Use in all tests
it("test 1", () => { /* use merchant */ });
it("test 2", () => { /* use merchant */ });
```

---

## 🎯 Quick Reference Commands

```bash
# Start validator
solana-test-validator --reset

# Build
anchor build

# Deploy
anchor deploy

# Test everything
anchor test

# Test specific file
anchor test --skip-local-validator -- tests/merchant.test.ts

# Check program
solana program show [PROGRAM_ID]

# View logs
solana logs [PROGRAM_ID]

# Check balance
solana balance

# Airdrop
solana airdrop 10

# Clean
anchor clean && rm -rf test-ledger

# Full reset
pkill -f solana-test-validator && rm -rf test-ledger && solana-test-validator --reset
```

---

## 📚 Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/tests)

---

## ✅ Pre-Test Checklist

Before running tests, ensure:

- [ ] Rust installed and up to date
- [ ] Solana CLI installed (v1.18.0+)
- [ ] Anchor installed (v0.31.0)
- [ ] Node.js installed (v18.0.0+)
- [ ] Dependencies installed (`yarn install`)
- [ ] Validator running (`solana-test-validator`)
- [ ] Program built (`anchor build`)
- [ ] Program deployed (`anchor deploy`)
- [ ] Wallet has SOL (`solana airdrop 10`)
- [ ] Config set to localhost (`solana config get`)

---

## 🚦 Quick Start (TL;DR)

```bash
# 1. Install dependencies (one time)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.0 && avm use 0.31.0

# 2. Setup project
cd discount-platform
yarn install
solana config set --url localhost

# 3. Test
anchor test
```

That's it! 🎉
