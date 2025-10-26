# Complete Fix - Clone Metaplex Program

## 🔴 The Problem

```
Error processing Instruction 0: Unsupported program id
```

**Cause**: Your local validator doesn't have the Metaplex Token Metadata program loaded. It only exists on mainnet/devnet.

---

## ✅ Solution: Clone Metaplex from Mainnet

### Step 1: Update `Anchor.toml`

Replace your entire `Anchor.toml` with this:

```toml
[toolchain]
anchor_version = "0.29.0"
solana_version = "1.17.0"

[features]
seeds = false
skip-lint = false

[programs.localnet]
discount_platform = "kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe"

[programs.devnet]
discount_platform = "kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[test]
startup_wait = 10000
shutdown_wait = 2000
upgradeable = false

[test.validator]
url = "https://api.mainnet-beta.solana.com"

# Clone Metaplex Token Metadata Program from mainnet
[[test.validator.clone]]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"

# Clone Token Program
[[test.validator.clone]]
address = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"

# Clone Associated Token Program
[[test.validator.clone]]
address = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
```

### Step 2: Kill Any Running Validators

```bash
killall solana-test-validator
```

### Step 3: Run Tests with `anchor test`

```bash
anchor test
```

**What happens**:
1. Anchor starts a validator
2. **Clones Metaplex from mainnet** (this may take 30-60 seconds first time)
3. Builds your program
4. Deploys it
5. Runs tests
6. Cleans up

---

## 🚀 Alternative: Manual Validator with Cloning

If you prefer manual control:

### Terminal 1 - Start Validator with Cloning:

```bash
solana-test-validator \
  --reset \
  --clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s \
  --clone TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA \
  --clone ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL \
  --url https://api.mainnet-beta.solana.com
```

**Wait for output**:
```
Cloning metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s...
✓ Fetched program from mainnet
Ledger location: test-ledger
```

### Terminal 2 - Deploy and Test:

```bash
anchor build
anchor deploy
npm run test:badge
```

---

## 📋 What Each Clone Does

| Program | Address | Purpose |
|---------|---------|---------|
| **Metaplex Token Metadata** | `metaqb...` | Creates NFT metadata (name, symbol, URI) |
| **Token Program** | `TokenkegQ...` | Manages SPL tokens and mints |
| **Associated Token Program** | `ATokenG...` | Creates associated token accounts |

---

## ⏱️ First Time Setup

**The first time you run with cloning**:
- Downloads programs from mainnet (~100-200MB)
- Takes 30-60 seconds
- Cached for future runs (instant after first time)

**Progress indicators**:
```
Fetching program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
Download complete
```

---

## 🐛 Troubleshooting

### Error: "Failed to fetch program"

**Solution 1**: Check internet connection
```bash
curl -I https://api.mainnet-beta.solana.com
```

**Solution 2**: Use different RPC
```toml
[test.validator]
url = "https://api.metaplex.solana.com"
```

**Solution 3**: Increase timeout
```toml
[test]
startup_wait = 30000  # 30 seconds
```

### Error: "Address not found"

Check the program exists:
```bash
solana program show metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s \
  --url https://api.mainnet-beta.solana.com
```

### Tests Still Fail After Cloning

1. **Verify programs loaded**:
```bash
solana program show metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
```

2. **Check validator logs**:
```bash
solana logs
```

3. **Rebuild and redeploy**:
```bash
anchor clean
anchor build
anchor deploy
```

---

## ✅ Verify Setup

After starting validator with cloning, verify Metaplex is loaded:

```bash
solana program show metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
```

**Expected output**:
```
Program Id: metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: [some address]
Authority: [some address]
Last Deployed In Slot: [some slot]
Data Length: [size] (0x[hex]) bytes
Balance: [amount] SOL
```

---

## 🎯 Complete Working Workflow

```bash
# 1. Update Anchor.toml (add clone sections)
# 2. Kill existing validators
killall solana-test-validator

# 3. Run tests (will auto-clone programs)
anchor test

# OR manual approach:
# Terminal 1
solana-test-validator \
  --reset \
  --clone metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s \
  --url https://api.mainnet-beta.solana.com

# Terminal 2 (wait 30s for cloning to complete)
anchor build
anchor deploy
npm run test:badge
```

---

## 💡 Pro Tips

### 1. Cache Clone Data

Clone data is stored in `test-ledger/`. Keep it to speed up future runs:

```bash
# Don't delete test-ledger between runs
solana-test-validator  # Reuses cached clones
```

### 2. Clone Only What You Need

```toml
# Minimal for your project
[[test.validator.clone]]
address = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
```

### 3. Use Devnet for Faster Cloning

```toml
[test.validator]
url = "https://api.devnet.solana.com"
```

### 4. Test Without Cloning (Simpler Programs)

If you're testing non-NFT features:
```bash
# Don't clone anything
solana-test-validator --reset
npm run test:merchant  # Doesn't need Metaplex
```

---

## 🎉 Expected Result

After proper setup, your badge tests should output:

```
Badge System
  ✓ Marketplace already initialized
  Badge Minting
    ✓ Mints a FirstPurchase badge (892ms)
    ✓ Different users can earn the same badge type (841ms)
    ✓ Fails to mint same badge twice for same user (134ms)
    ✓ Verifies badge metadata is set correctly (89ms)
    ✓ Mints different badge types for same user (2435ms)
    ✓ Mints all badge types (5234ms)
    ✓ Verifies badge NFT mint has correct properties (156ms)
    ✓ Multiple users can have complete badge collections (3821ms)
    ✓ Verifies badge timestamps are set correctly (91ms)

  9 passing (14s)
```

---

## 📝 Summary

**The Fix**: Add program clones to `Anchor.toml` so the validator has Metaplex available.

**Why It Works**: Cloning downloads the actual program from mainnet, making it available locally.

**Trade-off**: First run is slower (30-60s), but subsequent runs are fast.

---

*This ensures your local validator has all the programs your smart contract needs!*