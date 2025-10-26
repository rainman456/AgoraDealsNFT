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

// Helper function: Airdrop SOL
export async function airdrop(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 10
): Promise<void> {
  const signature = await connection.requestAirdrop(
    publicKey,
    amount * LAMPORTS_PER_SOL
  );
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    ...latestBlockhash,
  });
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
  const account = await connection.getAccountInfo(publicKey);
  return account !== null;
}

// Helper function: Setup test accounts with marketplace check
export async function setupTestAccounts(
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

// Helper function: Setup test accounts and initialize marketplace
export async function setupTestAccountsWithMarketplace(
  program: Program<any>,
  connection: Connection
): Promise<TestAccounts> {
  const accounts = await setupTestAccounts(program, connection);
  
  // Check if marketplace already exists
  const exists = await accountExists(connection, accounts.marketplacePDA);
  
  if (!exists) {
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
    } catch (error: any) {
      // Ignore if already initialized
      if (!error.message.includes("already in use")) {
        throw error;
      }
    }
  }
  
  return accounts;
}

// Helper function: Wait for a short time
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}