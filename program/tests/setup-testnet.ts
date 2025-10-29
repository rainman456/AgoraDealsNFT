import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { 
  PublicKey, 
  Keypair, 
  Connection,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

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

// Network URLs
export const NETWORK_URLS = {
  localnet: "http://127.0.0.1:8899",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

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

// ============================================
// NETWORK DETECTION
// ============================================

// Detect network type
export function getNetworkType(connection: Connection): "localnet" | "devnet" | "testnet" | "mainnet" {
  const endpoint = connection.rpcEndpoint;
  if (endpoint.includes("testnet")) return "testnet";
  if (endpoint.includes("devnet")) return "devnet";
  if (endpoint.includes("mainnet")) return "mainnet";
  return "localnet";
}

// Check if public network (not local)
export function isPublicNetwork(connection: Connection): boolean {
  return getNetworkType(connection) !== "localnet";
}

// ============================================
// FILE SYSTEM HELPERS
// ============================================

// Load wallet from filesystem
export function loadWallet(walletPath?: string): Keypair {
  const pathToWallet = walletPath || `${process.env.HOME}/.config/solana/id.json`;
  
  if (!fs.existsSync(pathToWallet)) {
    throw new Error(`Wallet not found at ${pathToWallet}`);
  }
  
  const walletData = JSON.parse(fs.readFileSync(pathToWallet, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(walletData));
}

// Load or create persistent keypair (for public networks)
export function loadOrCreateKeypair(filename: string, network: string): Keypair {
  const keypairPath = path.join(__dirname, "..", `.${network}-keys`, filename);
  
  // Create directory if it doesn't exist
  const dir = path.dirname(keypairPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing or create new
  if (fs.existsSync(keypairPath)) {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    return Keypair.fromSecretKey(new Uint8Array(keypairData));
  } else {
    const keypair = Keypair.generate();
    fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
    console.log(`   ✓ Created new keypair: ${filename}`);
    return keypair;
  }
}

// ============================================
// AIRDROP FUNCTION WITH RETRY LOGIC
// ============================================

export async function airdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 10
): Promise<void> {
  const network = getNetworkType(connection);
  
  // For public networks, limit amount and add retry logic
  if (network !== "localnet") {
    amount = Math.min(amount, 1); // Max 1 SOL per request on public networks
    console.log(`   Requesting ${amount} SOL for ${publicKey.toString().slice(0, 12)}...`);
  }
  
  // Testnet is more reliable, give it more retries
  const maxRetries = network === "testnet" ? 5 : network === "devnet" ? 3 : 2;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const signature = await connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );
      
      // Use confirmed commitment for faster response
      await connection.confirmTransaction(signature, "confirmed");
      
      if (network !== "localnet") {
        console.log(`   ✅ Airdrop successful (${amount} SOL)`);
      }
      return; // Success!
      
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      
      // Handle rate limits
      if (error.message.includes("airdrop request limit") || 
          error.message.includes("rate limit")) {
        console.log(`   ⚠️  Rate limited`);
        
        if (network === "testnet" && !isLastAttempt) {
          const waitTime = 5000;
          console.log(`   💡 Retrying in ${waitTime/1000}s... (attempt ${attempt}/${maxRetries})`);
          await wait(waitTime);
          continue;
        } else {
          console.log(`   👉 Use: https://faucet.solana.com/ (select ${network})`);
          return; // Don't throw, let tests continue
        }
      }
      
      // Handle transient errors (common on public networks)
      if (error.message.includes("Internal error") || 
          error.message.includes("429") ||
          error.message.includes("blockhash") ||
          error.message.includes("timeout")) {
        
        if (!isLastAttempt) {
          const backoff = Math.min(2000 * attempt, 10000);
          console.log(`   ⚠️  Network error (attempt ${attempt}/${maxRetries}), retrying in ${backoff/1000}s...`);
          await wait(backoff);
          continue;
        }
      }
      
      // Last attempt failed
      if (isLastAttempt) {
        console.log(`   ❌ Airdrop failed after ${maxRetries} attempts`);
        if (network === "devnet") {
          console.log(`   💡 Try testnet instead (more reliable):`);
          console.log(`      npm run testnet:setup && npm run testnet:deploy`);
        }
        console.log(`   🔧 Manual funding options:`);
        console.log(`      1. solana airdrop 1 ${publicKey.toString()} --url ${network}`);
        console.log(`      2. https://faucet.solana.com/ (select ${network})`);
        return; // Don't throw, let tests continue with existing balance
      }
    }
  }
}

// ============================================
// CORE HELPER FUNCTIONS
// ============================================

export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function getExpiryTimestamp(daysFromNow: number = 7): BN {
  return new BN(getCurrentTimestamp() + daysFromNow * 24 * 60 * 60);
}

export function derivePDA(
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

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

export async function accountExists(
  connection: Connection,
  publicKey: PublicKey
): Promise<boolean> {
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SETUP FUNCTIONS - AUTO-DETECTS NETWORK
// ============================================

export async function setupTestAccounts(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  const network = getNetworkType(connection);

  if (network === "localnet") {
    console.log("🏠 Detected Localnet - generating new keypairs");
    return setupTestAccountsLocal(program, connection);
  } else {
    console.log(`🌐 Detected ${network.toUpperCase()} - using persistent keypairs`);
    return setupTestAccountsPublic(program, connection, network);
  }
}

// LOCAL: Generate new keypairs and airdrop (original behavior)
async function setupTestAccountsLocal(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  const marketplaceAuthority = Keypair.generate();
  const merchant1 = Keypair.generate();
  const merchant2 = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  // Airdrop SOL to all accounts
  await Promise.all([
    airdrop(connection, marketplaceAuthority.publicKey),
    airdrop(connection, merchant1.publicKey),
    airdrop(connection, merchant2.publicKey),
    airdrop(connection, user1.publicKey),
    airdrop(connection, user2.publicKey),
  ]);

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

// PUBLIC NETWORKS: Use wallet + persistent keypairs (testnet/devnet)
async function setupTestAccountsPublic(
  program: Program<any>,
  connection: Connection,
  network: string
): Promise<TestAccounts> {
  console.log(`\n🔧 Setting up ${network} accounts...\n`);
  
  // Use your wallet as marketplace authority
  const marketplaceAuthority = loadWallet();
  console.log(`   Authority: ${marketplaceAuthority.publicKey.toString().slice(0, 12)}...`);
  
  // Load or create persistent test keypairs
  const merchant1 = loadOrCreateKeypair("merchant1.json", network);
  const merchant2 = loadOrCreateKeypair("merchant2.json", network);
  const user1 = loadOrCreateKeypair("user1.json", network);
  const user2 = loadOrCreateKeypair("user2.json", network);
  
  console.log(`   Merchant 1: ${merchant1.publicKey.toString().slice(0, 12)}...`);
  console.log(`   Merchant 2: ${merchant2.publicKey.toString().slice(0, 12)}...`);
  console.log(`   User 1: ${user1.publicKey.toString().slice(0, 12)}...`);
  console.log(`   User 2: ${user2.publicKey.toString().slice(0, 12)}...`);

  // Check balances and fund if needed
  console.log(`\n💰 Checking balances...`);
  const minBalance = 0.3 * LAMPORTS_PER_SOL; // Lowered minimum for public networks
  
  const accountsToFund: Array<[string, Keypair]> = [
    ["Merchant 1", merchant1],
    ["Merchant 2", merchant2],
    ["User 1", user1],
    ["User 2", user2],
  ];
  
  const needsFunding: Array<[string, Keypair]> = [];
  
  for (const [label, keypair] of accountsToFund) {
    const balance = await connection.getBalance(keypair.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    const status = balance >= minBalance ? "✅" : "⚠️ ";
    console.log(`   ${status} ${label}: ${solBalance.toFixed(4)} SOL`);
    
    if (balance < minBalance) {
      needsFunding.push([label, keypair]);
    }
  }
  
  if (needsFunding.length > 0) {
    console.log(`\n💸 Funding ${needsFunding.length} account(s)...`);
    console.log(`   Network: ${network} ${network === "testnet" ? "(recommended)" : ""}\n`);
    
    for (const [label, keypair] of needsFunding) {
      console.log(`   Funding ${label}...`);
      await airdrop(connection, keypair.publicKey, 1);
      
      // Wait between airdrops (testnet handles bursts better)
      const waitTime = network === "testnet" ? 2000 : 3000;
      await wait(waitTime);
    }
    
    // Final balance check
    console.log(`\n💰 Final balances:`);
    let allFunded = true;
    const unfundedAccounts: Array<[string, Keypair]> = [];
    
    for (const [label, keypair] of accountsToFund) {
      const balance = await connection.getBalance(keypair.publicKey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      const status = balance >= minBalance ? "✅" : "❌";
      console.log(`   ${status} ${label}: ${solBalance.toFixed(4)} SOL`);
      
      if (balance < minBalance) {
        allFunded = false;
        unfundedAccounts.push([label, keypair]);
      }
    }
    
    if (!allFunded) {
      console.log(`\n⚠️  ${unfundedAccounts.length} account(s) still need funding!`);
      console.log(`\n🔧 Quick fix - run these commands:\n`);
      
      for (const [label, keypair] of unfundedAccounts) {
        console.log(`   solana airdrop 1 ${keypair.publicKey.toString()} --url ${network}`);
      }
      
      console.log(`\n   Or visit: https://faucet.solana.com/ (select ${network})`);
      
      if (network === "devnet") {
        console.log(`\n💡 Tip: Testnet has better airdrop limits:`);
        console.log(`   npm run testnet:setup && npm run testnet:deploy && npm run testnet:coupon`);
      }
      
      console.log(``);
      throw new Error(`Insufficient funds in ${unfundedAccounts.length} account(s). Please fund manually.`);
    } else {
      console.log(`\n✅ All accounts funded successfully!`);
    }
  } else {
    console.log(`   ✅ All accounts have sufficient balance`);
  }

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

  console.log(`\n📍 PDAs:`);
  console.log(`   Marketplace: ${marketplacePDA.toString().slice(0, 12)}...`);
  console.log(`   Merchant 1: ${merchant1PDA.toString().slice(0, 12)}...`);
  console.log(`   Merchant 2: ${merchant2PDA.toString().slice(0, 12)}...\n`);

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

// ============================================
// SETUP WITH MARKETPLACE INITIALIZATION
// ============================================

export async function setupTestAccountsWithMarketplace(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  const accounts = await setupTestAccounts(program, connection);
  
  // Check if marketplace already exists
  const exists = await accountExists(connection, accounts.marketplacePDA);
  
  if (!exists) {
    const network = getNetworkType(connection);
    console.log("📦 Initializing marketplace...");
    
    try {
      const tx = await program.methods
        .initialize()
        .accounts({
          marketplace: accounts.marketplacePDA,
          authority: accounts.marketplaceAuthority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([accounts.marketplaceAuthority])
        .rpc();
      
      console.log(`✅ Marketplace initialized!`);
      
      if (network !== "localnet") {
        console.log(`   TX: https://explorer.solana.com/tx/${tx}?cluster=${network}`);
      }
      
    } catch (error: any) {
      if (!error.message.includes("already in use")) {
        throw error;
      }
      console.log("ℹ️  Marketplace already initialized");
    }
  } else {
    console.log("✅ Marketplace already exists");
  }
  
  return accounts;
}