import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { IDL } from '../idl/discount_platform';
import type { DiscountPlatform } from '../idl/discount_platform';

export class SolanaConfig {
  private static instance: SolanaConfig;
  public connection: Connection;
  public programId: PublicKey;
  public program: Program<DiscountPlatform>;
  public provider: AnchorProvider;
  public wallet: Wallet;

  private constructor() {
    const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
    const programIdStr = process.env.PROGRAM_ID || 'kCBLrJxrFgB7yf8R8tMKZmsyaRDRq8YmdJSG9yjrSNe';
    
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.programId = new PublicKey(programIdStr);

    // Initialize wallet from private key
    const privateKeyStr = process.env.WALLET_PRIVATE_KEY;
    if (!privateKeyStr) {
      throw new Error('WALLET_PRIVATE_KEY not set in environment');
    }
    
    const privateKeyArray = JSON.parse(privateKeyStr);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyArray));
    this.wallet = new Wallet(keypair);

    // Create provider
    this.provider = new AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: 'confirmed' }
    );

    // Initialize program
    this.program = new Program<DiscountPlatform>(
      IDL,
      this.provider
    );
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

  public getRedemptionTicketPDA(coupon: PublicKey, user: PublicKey, nonce: number): [PublicKey, number] {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(nonce));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ticket'), coupon.toBuffer(), user.toBuffer(), buffer],
      this.programId
    );
  }

  public getAuctionPDA(coupon: PublicKey, auctionId: number): [PublicKey, number] {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(auctionId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('auction'), coupon.toBuffer(), buffer],
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

  public getGroupDealPDA(promotion: PublicKey, dealId: number): [PublicKey, number] {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(dealId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('group_deal'), promotion.toBuffer(), buffer],
      this.programId
    );
  }

  public getGroupEscrowPDA(groupDeal: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('group_escrow'), groupDeal.toBuffer()],
      this.programId
    );
  }

  public getGroupParticipantPDA(groupDeal: PublicKey, user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('participant'), groupDeal.toBuffer(), user.toBuffer()],
      this.programId
    );
  }

  public getGroupCouponPDA(groupDeal: PublicKey, user: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('group_coupon'), groupDeal.toBuffer(), user.toBuffer()],
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

  public getCommentLikePDA(user: PublicKey, comment: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('comment_like'), user.toBuffer(), comment.toBuffer()],
      this.programId
    );
  }
}

export const getSolanaConfig = () => SolanaConfig.getInstance();
