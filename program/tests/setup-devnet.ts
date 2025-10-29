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
// DEVNET HELPER FUNCTIONS
// ============================================

// Load wallet from filesystem (for Devnet)
export function loadWallet(walletPath?: string): Keypair {
  const pathToWallet = walletPath || `${process.env.HOME}/.config/solana/id.json`;
  
  if (!fs.existsSync(pathToWallet)) {
    throw new Error(`Wallet not found at ${pathToWallet}`);
  }
  
  const walletData = JSON.parse(fs.readFileSync(pathToWallet, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(walletData));
}

// Load or create persistent keypair (for Devnet)
export function loadOrCreateKeypair(filename: string): Keypair {
  const keypairPath = path.join(__dirname, "..", ".devnet-keys", filename);
  
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
    return keypair;
  }
}

// Detect if running on Devnet
export function isDevnet(connection: Connection): boolean {
  return connection.rpcEndpoint.includes("devnet");
}

// ============================================
// AIRDROP FUNCTIONS (Local & Devnet)
// ============================================

// Helper function: Airdrop SOL (works for both local and devnet)
export async function airdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 10
): Promise<void> {
  const isDevnetCluster = isDevnet(connection);
  
  if (isDevnetCluster) {
    // Devnet: Request smaller amounts and handle rate limits
    amount = Math.min(amount, 2); // Max 2 SOL per request on devnet
  }
  
  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    });
  } catch (error: any) {
    if (error.message.includes("airdrop request limit")) {
      console.log(`⚠️  Rate limited for ${publicKey.toString().slice(0, 8)}...`);
      console.log(`   Get devnet SOL from: https://faucet.solana.com/`);
    } else {
      throw error;
    }
  }
}

// ============================================
// CORE HELPER FUNCTIONS
// ============================================

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
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}

// Helper function: Wait for a short time
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SETUP FUNCTIONS - AUTO-DETECTS LOCAL VS DEVNET
// ============================================

// Helper function: Setup test accounts (Auto-detects local vs devnet)
export async function setupTestAccounts(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  const isDevnetCluster = isDevnet(connection);

  if (isDevnetCluster) {
    console.log("🌐 Detected Devnet - using persistent keypairs");
    return setupTestAccountsDevnet(program, connection);
  } else {
    console.log("🏠 Detected Local - generating new keypairs");
    return setupTestAccountsLocal(program, connection);
  }
}

// LOCAL: Generate new keypairs and airdrop (original behavior)
async function setupTestAccountsLocal(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  // Initialize test accounts
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

// DEVNET: Use your wallet + persistent keypairs
async function setupTestAccountsDevnet(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  console.log("\n🔧 Setting up Devnet accounts...");
  
  // Use your wallet as marketplace authority
  const marketplaceAuthority = loadWallet();
  console.log(`   Authority: ${marketplaceAuthority.publicKey.toString().slice(0, 8)}...`);
  
  // Load or create persistent test keypairs
  const merchant1 = loadOrCreateKeypair("merchant1.json");
  const merchant2 = loadOrCreateKeypair("merchant2.json");
  const user1 = loadOrCreateKeypair("user1.json");
  const user2 = loadOrCreateKeypair("user2.json");
  
  console.log(`   Merchant 1: ${merchant1.publicKey.toString().slice(0, 8)}...`);
  console.log(`   Merchant 2: ${merchant2.publicKey.toString().slice(0, 8)}...`);
  console.log(`   User 1: ${user1.publicKey.toString().slice(0, 8)}...`);
  console.log(`   User 2: ${user2.publicKey.toString().slice(0, 8)}...`);

  // Check balances and fund if needed
  console.log("\n💰 Checking balances...");
  const minBalance = 0.5 * LAMPORTS_PER_SOL;
  
  for (const [label, keypair] of [
    ["Merchant 1", merchant1],
    ["Merchant 2", merchant2],
    ["User 1", user1],
    ["User 2", user2],
  ]) {
    const balance = await connection.getBalance(keypair.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log(`   ${label}: ${solBalance.toFixed(4)} SOL`);
    
    if (balance < minBalance) {
      console.log(`   ⚠️  ${label} needs funding...`);
      await airdrop(connection, keypair.publicKey, 1);
    }
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

  console.log("\n📍 PDAs:");
  console.log(`   Marketplace: ${marketplacePDA.toString().slice(0, 8)}...`);
  console.log(`   Merchant 1: ${merchant1PDA.toString().slice(0, 8)}...`);
  console.log(`   Merchant 2: ${merchant2PDA.toString().slice(0, 8)}...\n`);

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
  
  // Check if marketplace already exists
  const exists = await accountExists(connection, accounts.marketplacePDA);
  
  if (!exists) {
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
      if (isDevnet(connection)) {
        console.log(`   TX: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      }
      
    } catch (error: any) {
      // Ignore if already initialized
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