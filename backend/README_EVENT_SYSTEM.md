# Blockchain Event System

## Overview

This backend implements a **blockchain-first architecture** with proper event-driven synchronization between Solana blockchain and MongoDB.

## Architecture

### 1. Event Listener Service (`blockchain-event-listener.service.ts`)

**Purpose**: Subscribe to Solana program logs and emit parsed events.

**Features**:
- WebSocket subscription to program logs
- Real-time event parsing using Anchor's EventParser
- Automatic reconnection with exponential backoff
- Transaction finality verification (confirmed → finalized)
- Reorg detection and handling

**Usage**:
```typescript
import { blockchainEventListener } from './services/blockchain-event-listener.service';

// Start listening
await blockchainEventListener.startListening();

// Listen to specific events
blockchainEventListener.on('CouponMinted', (event) => {
  console.log('Coupon minted:', event.data);
});

// Listen to finalized transactions
blockchainEventListener.on('transaction-finalized', (event) => {
  console.log('Transaction finalized:', event.signature);
});
```

### 2. Event Handlers Service (`event-handlers.service.ts`)

**Purpose**: Process blockchain events and sync to MongoDB.

**Features**:
- Idempotent event processing (prevents duplicate processing)
- Automatic retry logic for failed handlers
- Blockchain as source of truth
- Handles all contract events:
  - `PromotionCreated`
  - `CouponMinted`
  - `CouponTransferred`
  - `CouponRedeemed`
  - `CouponListed`
  - `CouponSold`
  - `ListingCancelled`
  - `PromotionRated`
  - `CommentAdded`
  - `MerchantRegistered`
  - And more...

**Event Flow**:
```
Blockchain Event → Event Listener → Event Handler → MongoDB Update
```

### 3. Blockchain Sync Service (`blockchain-sync.service.ts`)

**Purpose**: Reconcile MongoDB state with blockchain state.

**Features**:
- Sync individual promotions/coupons from blockchain
- Detect and mark orphaned data (exists in DB but not on-chain)
- Full reconciliation (periodic sync of all data)
- Transaction finality verification

**Usage**:
```typescript
import { blockchainSync } from './services/blockchain-sync.service';

// Sync a specific promotion
await blockchainSync.syncPromotion('promotion_address');

// Run full reconciliation
await blockchainSync.reconcileAll();

// Cleanup orphaned data
await blockchainSync.cleanupOrphanedData();
```

### 4. Event Listener Worker (`event-listener.worker.ts`)

**Purpose**: Standalone worker process for continuous event monitoring.

**Features**:
- Runs independently from API server
- Registers all event handlers
- Periodic reconciliation (every 5 minutes)
- Graceful shutdown handling
- Automatic retry on failures

**Running the Worker**:
```bash
# Development
pnpm run worker

# Production
pnpm run worker:build
```

## Blockchain-First Pattern

### Before (❌ Wrong)

```typescript
// Create in MongoDB first
const promotion = await Promotion.create({ ... });

// Then try blockchain (might fail)
try {
  await solanaService.createPromotion(...);
} catch (error) {
  // MongoDB has orphaned data!
}
```

### After (✅ Correct)

```typescript
// Create on blockchain FIRST
let result;
try {
  result = await solanaService.createPromotion(...);
} catch (error) {
  // Fail fast - don't create in DB
  return res.status(500).json({ error: 'Blockchain failed' });
}

// Save to MongoDB AFTER blockchain success
const promotion = await Promotion.create({
  onChainAddress: result.promotion,
  transactionSignature: result.signature,
  ...
});
```

## Event Processing Flow

### 1. Transaction Submitted
```
User/Merchant → API → Blockchain Transaction
```

### 2. Event Emitted
```
Blockchain → Program Logs → Event Listener
```

### 3. Event Parsed
```
Event Listener → EventParser → Typed Event
```

### 4. Event Processed
```
Event Handler → MongoDB Update (Idempotent)
```

### 5. Finality Check (35 seconds later)
```
Event Listener → Check Finality → Emit Finalized Event
```

### 6. Periodic Reconciliation (Every 5 minutes)
```
Worker → Sync Service → Compare Blockchain vs DB → Fix Discrepancies
```

## Data Consistency Guarantees

### 1. Idempotency
- Each event is processed only once (tracked by transaction signature)
- Safe to replay events without duplicates

### 2. Retry Logic
- Failed event handlers automatically retry (max 3 attempts)
- Exponential backoff between retries

### 3. Finality Verification
- Transactions verified after ~35 seconds
- Reorg detection and handling

### 4. Reconciliation
- Periodic sync ensures eventual consistency
- Orphaned data detection and cleanup

### 5. Blockchain as Source of Truth
- All critical operations happen on-chain first
- MongoDB is a cache/index of blockchain state

## Monitoring & Debugging

### Event Listener Status
```typescript
const status = blockchainEventListener.getStatus();
console.log(status);
// {
//   isListening: true,
//   subscriptionId: 12345,
//   reconnectAttempts: 0
// }
```

### Logs
All events are logged with structured data:
```
📡 Blockchain Event: CouponMinted
  signature: 5x7y...
  slot: 123456
  data: { coupon: '...', nft_mint: '...', ... }

✅ Coupon minted in DB: ABC123...

✅ Transaction finalized: 5x7y...
```

### Error Handling
```
⚠️ Potential reorg detected for 5x7y...
  status: confirmed (not finalized)

❌ Max reconnection attempts reached
```

## Production Deployment

### 1. Run API Server
```bash
pnpm run start
```

### 2. Run Event Worker (Separate Process)
```bash
pnpm run worker:build
```



### 3. Process Management (PM2)
```bash
# Install PM2
npm install -g pm2

# Start API server
pm2 start dist/index.js --name "api-server"

# Start event worker
pm2 start dist/workers/event-listener.worker.js --name "event-worker"

# Monitor
pm2 monit

# Logs
pm2 logs event-worker
```

## Migration Guide

### Existing Data Migration

If you have existing data in MongoDB that needs to be synced:

1. **Run Full Reconciliation**:
```bash
tsx src/scripts/reconcile-all.ts
```

2. **Cleanup Orphaned Data**:
```bash
tsx src/scripts/cleanup-orphaned.ts
```

### Controller Updates

All controllers have been updated to use blockchain-first pattern:
- ✅ `PromotionController.create()` - Creates on-chain first
- ✅ `CouponController.mint()` - Mints on-chain first
- ⚠️ Other controllers should follow same pattern

## Troubleshooting

### Event Listener Not Starting
- Check RPC connection: `curl $SOLANA_RPC_URL`
- Verify program ID in IDL matches deployed program
- Check wallet permissions

### Events Not Processing
- Check worker logs: `pm2 logs event-worker`
- Verify event handlers are registered
- Check MongoDB connection

### Data Inconsistencies
- Run reconciliation: `pnpm run worker` (includes periodic reconciliation)
- Check for orphaned data
- Verify transaction finality

### High Memory Usage
- Event cache limited to 10,000 signatures
- Adjust `maxCacheSize` in `event-handlers.service.ts`

## Best Practices

1. **Always use blockchain-first pattern** in controllers
2. **Run event worker in production** for real-time sync
3. **Monitor worker logs** for errors and reorgs
4. **Use dedicated RPC endpoint** for production (not public RPC)
5. **Set up alerts** for worker failures
6. **Run periodic reconciliation** to ensure consistency
7. **Test event handlers** with integration tests
8. **Handle reorgs gracefully** (already implemented)

## Future Enhancements

- [ ] Event replay from specific slot
- [ ] Dead letter queue for failed events
- [ ] Metrics and monitoring dashboard
- [ ] Multi-region event processing
- [ ] Event sourcing for full audit trail
- [ ] GraphQL subscriptions for real-time updates
