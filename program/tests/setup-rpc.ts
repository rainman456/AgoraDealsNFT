import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  Connection,
  LAMPORTS_PER_SOL,
  Commitment 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Helper to convert u32 to little-endian bytes (4 bytes)
export function u32ToLeBytes(num: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(num, 0);
  return buffer;
}

// Helper to convert u64 to little-endian bytes (8 bytes)
export function u64ToLeBytes(num: number | BN): Buffer {
  const bn = typeof num === 'number' ? new BN(num) : num;
  return bn.toArrayLike(Buffer, 'le', 8);
}

// Re-export for convenience
export { BN, PublicKey, Keypair, LAMPORTS_PER_SOL };
export { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID };

// Constants
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Test accounts interface
export interface TestAccounts {
  marketplaceAuthority: Keypair;
  merchant1: Keypair;
  merchant2: Keypair;
  user1: Keypair;
  user2: Keypair;
  marketplacePDA: PublicKey;
  merchant1PDA: PublicKey;
  merchant2PDA: PublicKey;
}

// Get RPC URL based on environment
export function getRpcUrl(): string {
  // Priority: ALCHEMY_RPC_URL > ANCHOR_PROVIDER_URL > PUBLIC_RPC_URL > default
  return (
    process.env.ALCHEMY_RPC_URL ||
    process.env.ANCHOR_PROVIDER_URL ||
    process.env.PUBLIC_RPC_URL ||
    "https://api.devnet.solana.com"
  );
}

// Create optimized connection
export function createConnection(commitment: Commitment = "confirmed"): Connection {
  const rpcUrl = getRpcUrl();
  
  console.log(`🔗 Using RPC: ${rpcUrl.substring(0, 50)}...`);
  
  return new Connection(rpcUrl, {
    commitment,
    confirmTransactionInitialTimeout: 60000, // 60 seconds
    disableRetryOnRateLimit: false, // Allow retries
    httpHeaders: {
      "Content-Type": "application/json",
    },
  });
}

// Helper: Confirm tx via HTTP polling (no WS)
export async function confirmTransactionPolling(
  connection: Connection,
  signature: string,
  commitment: Commitment = "confirmed",
  timeoutMs: number = 120000
): Promise<void> {
  console.log(`🔄 Polling for tx confirmation: ${signature.substring(0, 10)}...`);
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
      if (status?.value?.confirmationStatus === commitment || status?.value?.confirmationStatus === 'finalized') {
        console.log(`✅ Tx confirmed: ${signature}`);
        return;
      }
    } catch (err) {
      // Ignore polling errors; retry
    }
    await wait(2000); // Poll every 2s
  }
  throw new Error(`Confirmation timeout after ${timeoutMs / 1000}s for ${signature}`);
}

// Helper function: Airdrop SOL with retry logic using direct RPC fetch
export async function airdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 1,  // Helius/Devnet limit: 1 SOL max per request/project/day
  maxRetries: number = 3
): Promise<void> {
  const minRequired = amount * LAMPORTS_PER_SOL;
  let currentBalance = await connection.getBalance(publicKey);
  console.log(`Current balance for ${publicKey.toString().substring(0, 8)}...: ${currentBalance / LAMPORTS_PER_SOL} SOL`);
  if (currentBalance >= minRequired) {
    console.log(`✅ Sufficient balance, skipping airdrop for ${publicKey.toString().substring(0, 8)}...`);
    return;
  }

  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`💰 Requesting ${amount} SOL airdrop for ${publicKey.toString().substring(0, 8)}... (attempt ${retries + 1})`);
      
      // Direct fetch to RPC for requestAirdrop (HTTP-only)
      const rpcUrl = getRpcUrl();
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "requestAirdrop",
          "params": [
            publicKey.toString(),
            amount * LAMPORTS_PER_SOL
          ],
          "id": Math.random().toString(36).substring(7)  // Random ID
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const body = await response.json();
      if (body.error) {
        throw new Error(`RPC Error: ${body.error.message}`);
      }
      
      const signature = body.result;
      if (!signature) {
        throw new Error('No signature returned from airdrop request');
      }
      
      console.log(`Airdrop signature: ${signature}`);
      
      // Use HTTP polling for confirmation
      await confirmTransactionPolling(connection, signature);
      
      currentBalance = await connection.getBalance(publicKey);
      console.log(`New balance: ${currentBalance / LAMPORTS_PER_SOL} SOL`);
      if (currentBalance >= minRequired) {
        console.log(`✅ Airdrop successful: ${amount} SOL`);
        return;
      } else {
        console.log(`⚠️ Balance still low after airdrop; may be partial. Retrying...`);
      }
    } catch (error: any) {
      console.error(`Airdrop error: ${error.message}`);
      retries++;
      
      if (error.message?.includes("403") || error.message?.includes("rate limit") || error.message?.includes("1 SOL per project")) {
        const backoffMs = Math.min(30000 * retries, 60000);  // 30s+, up to 1 min for faucet cooldown
        console.log(`⚠️ Faucet limit hit (1 SOL/project/day). Waiting ${backoffMs / 1000}s before retry ${retries}/${maxRetries}...`);
        await wait(backoffMs);
      } else if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
        const backoffMs = Math.min(10000 * retries, 30000);  // 10s, 20s, up to 30s
        console.log(`⚠️ Rate limited, waiting ${backoffMs / 1000}s before retry ${retries}/${maxRetries}...`);
        await wait(backoffMs);
      } else if (retries >= maxRetries) {
        console.error(`❌ Airdrop failed after ${maxRetries} attempts for ${publicKey.toString()}.`);
        console.error(`Manual step: Fund via Helius faucet https://faucet.helius.xyz — paste address, request 1 SOL (daily limit applies). Re-run.`);
        throw error;
      } else {
        console.log(`⚠️ Retrying after 10s...`);
        await wait(10000 * retries);
      }
    }
  }
}

// Helper function: Get current timestamp
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

// Helper function: Get expiry timestamp
export function getExpiryTimestamp(daysFromNow: number = 7): BN {
  return new BN(getCurrentTimestamp() + daysFromNow * 24 * 60 * 60);
}

// Helper function: Derive PDA
export function derivePDA(
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

// Helper function: Derive metadata PDA
export function deriveMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

// Helper function: Derive master edition PDA
export function deriveMasterEditionPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

// Helper function: Check if account exists
export async function accountExists(
  connection: Connection,
  publicKey: PublicKey
): Promise<boolean> {
  try {
    const account = await connection.getAccountInfo(publicKey);
    return account !== null;
  } catch (error) {
    console.error(`Error checking account existence:`, error);
    return false;
  }
}

// Helper function: Setup test accounts with marketplace check
export async function setupTestAccounts(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  console.log("\n🔧 Setting up test accounts...");
  
  // Initialize test accounts
  const marketplaceAuthority = Keypair.generate();
  const merchant1 = Keypair.generate();
  const merchant2 = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  console.log("📋 Generated keypairs:");
  console.log(`   Marketplace: ${marketplaceAuthority.publicKey.toString().substring(0, 8)}...`);
  console.log(`   Merchant1: ${merchant1.publicKey.toString().substring(0, 8)}...`);
  console.log(`   User1: ${user1.publicKey.toString().substring(0, 8)}...`);

  // Airdrop SOL to all accounts sequentially to avoid rate limits
  console.log("\n💰 Requesting airdrops...");
  await airdrop(connection, marketplaceAuthority.publicKey);  // Default 1 SOL
  await wait(15000); // 15s wait between airdrops for faucet cooldown
  await airdrop(connection, merchant1.publicKey);
  await wait(15000);
  await airdrop(connection, merchant2.publicKey);
  await wait(15000);
  await airdrop(connection, user1.publicKey);
  await wait(15000);
  await airdrop(connection, user2.publicKey);

  console.log("✅ All airdrops completed\n");

  // Derive PDAs
  const [marketplacePDA] = derivePDA(
    [Buffer.from("marketplace")], 
    program.programId
  );
  
  const [merchant1PDA] = derivePDA(
    [Buffer.from("merchant"), merchant1.publicKey.toBuffer()],
    program.programId
  );
  
  const [merchant2PDA] = derivePDA(
    [Buffer.from("merchant"), merchant2.publicKey.toBuffer()],
    program.programId
  );

  return {
    marketplaceAuthority,
    merchant1,
    merchant2,
    user1,
    user2,
    marketplacePDA,
    merchant1PDA,
    merchant2PDA,
  };
}

// Helper function: Setup test accounts and initialize marketplace
export async function setupTestAccountsWithMarketplace(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  const accounts = await setupTestAccounts(program, connection);
  
  console.log("🏪 Checking marketplace status...");
  
  // Check if marketplace already exists
  const exists = await accountExists(connection, accounts.marketplacePDA);
  
  if (!exists) {
    console.log("📝 Initializing marketplace...");
    // Initialize marketplace only if it doesn't exist
    try {
      await program.methods
        .initialize()
        .accounts({
          marketplace: accounts.marketplacePDA,
          authority: accounts.marketplaceAuthority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([accounts.marketplaceAuthority])
        .rpc();
      
      console.log("✅ Marketplace initialized");
    } catch (error: any) {
      // Ignore if already initialized
      if (!error.message.includes("already in use")) {
        console.error("❌ Failed to initialize marketplace:", error.message);
        throw error;
      } else {
        console.log("ℹ️  Marketplace already exists");
      }
    }
  } else {
    console.log("ℹ️  Marketplace already exists");
  }
  
  return accounts;
}

// Helper function: Wait for a short time
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function: Get balance
export async function getBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

// Helper function: Log balances
export async function logBalances(
  connection: Connection,
  accounts: { name: string; publicKey: PublicKey }[]
): Promise<void> {
  console.log("\n💰 Account Balances:");
  for (const account of accounts) {
    const balance = await getBalance(connection, account.publicKey);
    console.log(`   ${account.name}: ${balance.toFixed(4)} SOL`);
  }
  console.log();
}