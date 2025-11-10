import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import type { DiscountPlatform } from '../idl/discount_platform';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SolanaConfig {
  private static instance: SolanaConfig;
  public connection: Connection;
  public programId: PublicKey;
  public program: Program<DiscountPlatform>;
  public provider: AnchorProvider;
  public wallet: Wallet;

  private constructor() {
    // Initialize connection
    const rpcUrl = process.env.ANCHOR_PROVIDER_URL || process.env.SOLANA_RPC_URL || 'http://localhost:8899';
    this.connection = new Connection(rpcUrl, 'confirmed');

    // Initialize wallet
    const walletPath = process.env.ANCHOR_WALLET;
    let keypair: Keypair;
    
    if (walletPath && fs.existsSync(walletPath)) {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    } else if (process.env.WALLET_PRIVATE_KEY) {
      const privateKeyArray = JSON.parse(process.env.WALLET_PRIVATE_KEY);
      keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } else {
      throw new Error('No wallet found. Set ANCHOR_WALLET or WALLET_PRIVATE_KEY');
    }

    this.wallet = new Wallet(keypair);

    // Initialize provider
    this.provider = new AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: 'confirmed' }
    );
    anchor.setProvider(this.provider);

    // Load IDL
    const idlPath = path.join(__dirname, '../idl/discount_platform.json');
    if (!fs.existsSync(idlPath)) {
      throw new Error(`IDL file not found at ${idlPath}. Run 'anchor build' and copy the IDL.`);
    }

    try {
      const idlContent = fs.readFileSync(idlPath, 'utf-8');
      const rawIdl = JSON.parse(idlContent);
      
      // Detect IDL format and extract program address
      let programAddress: string;
      let idlName: string;
      let idlVersion: string;
      
      // New format (Anchor 0.30+): has address at root and metadata nested
      if (rawIdl.address) {
        console.log('Detected new Anchor IDL format (0.30+)');
        programAddress = rawIdl.address;
        idlName = rawIdl.metadata?.name || 'discount_platform';
        idlVersion = rawIdl.metadata?.version || '0.1.0';
        
        // For new format, the Program constructor will read the address from the IDL
        // So we don't need to modify the IDL structure
      } 
      // Old format (Anchor 0.29): may have metadata.address or programId field
      else if (rawIdl.metadata?.address) {
        console.log('Detected old Anchor IDL format (0.29) with metadata.address');
        programAddress = rawIdl.metadata.address;
        idlName = rawIdl.name || 'discount_platform';
        idlVersion = rawIdl.version || '0.1.0';
      }
      else {
        // Fallback to environment variable
        const envProgramId = process.env.PROGRAM_ID;
        if (!envProgramId) {
          throw new Error(
            'Could not find program address in IDL and PROGRAM_ID not set in environment. ' +
            'Please set PROGRAM_ID in your .env file.'
          );
        }
        console.log('Using PROGRAM_ID from environment');
        programAddress = envProgramId;
        idlName = rawIdl.name || 'discount_platform';
        idlVersion = rawIdl.version || '0.1.0';
      }
      
      // Validate program address
      try {
        this.programId = new PublicKey(programAddress);
      } catch (error) {
        throw new Error(`Invalid program address: ${programAddress}`);
      }
      
      // Validate IDL structure
      if (!rawIdl.instructions || !Array.isArray(rawIdl.instructions)) {
        throw new Error('IDL is missing instructions array. Please ensure your Anchor program is properly built.');
      }
      
      if (!rawIdl.accounts || !Array.isArray(rawIdl.accounts)) {
        throw new Error('IDL is missing accounts array. Please ensure your Anchor program is properly built.');
      }

      console.log(`Loaded IDL: ${idlName} v${idlVersion}`);
      console.log(`- Instructions: ${rawIdl.instructions.length}`);
      console.log(`- Accounts: ${rawIdl.accounts.length}`);
      console.log(`- Program ID: ${this.programId.toString()}`);

      // Create program
      // The new Anchor version (0.30+) can infer the program ID from the IDL
      // but we can still pass it explicitly for compatibility
      try {
        this.program = new Program(
          rawIdl as anchor.Idl,
          this.provider
        ) as Program<DiscountPlatform>;
        
        // Verify the program ID matches
        if (this.program.programId.toString() !== this.programId.toString()) {
          console.warn(`⚠️  Program ID mismatch detected:`);
          console.warn(`   Expected: ${this.programId.toString()}`);
          console.warn(`   Got:      ${this.program.programId.toString()}`);
          console.warn(`   Using program ID from IDL...`);
          this.programId = this.program.programId;
        }
      } catch (error: any) {
        throw new Error(`Failed to create Program instance: ${error.message}`);
      }

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in IDL file at ${idlPath}: ${error.message}`);
      }
      throw error;
    }
  }

  public static getInstance(): SolanaConfig {
    if (!SolanaConfig.instance) {
      SolanaConfig.instance = new SolanaConfig();
    }
    return SolanaConfig.instance;
  }

  public getMarketplacePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace')],
      this.programId
    );
  }

  public getMerchantPDA(authority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('merchant'), authority.toBuffer()],
      this.programId
    );
  }

  public getPromotionPDA(merchant: PublicKey, totalCouponsCreated: number): [PublicKey, number] {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(totalCouponsCreated));
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('promotion'),
        merchant.toBuffer(),
        buffer
      ],
      this.programId
    );
  }

  public getCouponPDA(promotion: PublicKey, currentSupply: number): [PublicKey, number] {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(currentSupply);
    return PublicKey.findProgramAddressSync(
      [Buffer.from('coupon'), promotion.toBuffer(), buffer],
      this.programId
    );
  }

  public getListingPDA(coupon: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('listing'), coupon.toBuffer()],
      this.programId
    );
  }

  public getExternalDealPDA(externalId: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('external_deal'), Buffer.from(externalId)],
      this.programId
    );
  }

  public getRatingPDA(user: PublicKey, promotion: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('rating'), user.toBuffer(), promotion.toBuffer()],
      this.programId
    );
  }

  public getCommentPDA(user: PublicKey, promotion: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('comment'), user.toBuffer(), promotion.toBuffer()],
      this.programId
    );
  }

  public getUserStatsPDA(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_stats'), user.toBuffer()],
      this.programId
    );
  }

  public getBadgePDA(user: PublicKey, badgeType: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('badge'), user.toBuffer(), Buffer.from(badgeType)],
      this.programId
    );
  }

  public getStakingAccountPDA(user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('staking'), user.toBuffer()],
      this.programId
    );
  }

  public getGroupDealPDA(merchant: PublicKey, dealId: number): [PublicKey, number] {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(dealId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('group_deal'), merchant.toBuffer(), buffer],
      this.programId
    );
  }

  public getAuctionPDA(merchant: PublicKey, auctionId: number): [PublicKey, number] {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(auctionId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('auction'), merchant.toBuffer(), buffer],
      this.programId
    );
  }

  public getCommentLikePDA(user: PublicKey, comment: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('comment_like'), user.toBuffer(), comment.toBuffer()],
    this.programId
  );
}

  public getRedemptionTicketPDA(coupon: PublicKey, user: PublicKey, nonce: number): [PublicKey, number] {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(nonce));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('ticket'), coupon.toBuffer(), user.toBuffer(), buffer],
    this.programId
  );
}

public getStakingPoolPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('staking_pool')],
    this.programId
  );
}

public getStakeAccountPDA(coupon: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('stake'), coupon.toBuffer(), user.toBuffer()],
    this.programId
  );
}

public getStakeVaultPDA(nftMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('stake_vault'), nftMint.toBuffer()],
    this.programId
  );
}

public getGroupParticipantPDA(groupDeal: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('participant'), groupDeal.toBuffer(), user.toBuffer()],
    this.programId
  );
}

public getGroupEscrowPDA(groupDeal: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('group_escrow'), groupDeal.toBuffer()],
    this.programId
  );
}

public getGroupCouponPDA(groupDeal: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('group_coupon'), groupDeal.toBuffer(), user.toBuffer()],
    this.programId
  );
}

public getAuctionEscrowPDA(auction: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('auction_escrow'), auction.toBuffer()],
    this.programId
  );
}

public getBidPDA(auction: PublicKey, bidder: PublicKey, bidCount: number): [PublicKey, number] {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(bidCount);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bid'), auction.toBuffer(), bidder.toBuffer(), buffer],
    this.programId
  );
}
}

// Export singleton getter
export const getSolanaConfig = () => SolanaConfig.getInstance();