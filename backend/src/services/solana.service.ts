import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { getSolanaConfig } from '../config/solana';
import { logger } from '../utils/logger';
import BN from 'bn.js';

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export class SolanaService {
  private get config() {
    return getSolanaConfig();
  }
  
  // Expose program for direct access
  get program() {
    return this.config.program;
  }

  /**
   * Initialize the marketplace
   */
  async initializeMarketplace() {
    try {
      const [marketplacePDA] = this.config.getMarketplacePDA();

      const tx = await this.config.program.methods
        .initialize()
        .accounts({
          marketplace: marketplacePDA,
          authority: this.config.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Marketplace initialized: ${tx}`);
      return { signature: tx, marketplace: marketplacePDA.toString() };
    } catch (error) {
      logger.error('Failed to initialize marketplace:', error);
      throw error;
    }
  }

  /**
   * Register a merchant
   */
  async registerMerchant(
    authority: PublicKey,
    name: string,
    category: string,
    latitude?: number,
    longitude?: number
  ) {
    try {
      const [merchantPDA] = this.config.getMerchantPDA(authority);
      const [marketplacePDA] = this.config.getMarketplacePDA();

      const tx = await this.config.program.methods
        .registerMerchant(name, category, latitude ?? null, longitude ?? null)
        .accounts({
          merchant: merchantPDA,
          marketplace: marketplacePDA,
          authority: authority,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Merchant registered: ${tx}`);
      return { signature: tx, merchant: merchantPDA.toString() };
    } catch (error) {
      logger.error('Failed to register merchant:', error);
      throw error;
    }
  }

  /**
   * Create a promotion
   */
  async createPromotion(
    merchantAuthority: PublicKey,
    promotionId: number,
    discountPercentage: number,
    maxSupply: number,
    expiryTimestamp: number,
    category: string,
    description: string,
    price: number,
    merchantKeypair?: Keypair
  ) {
    try {
      const [merchantPDA] = this.config.getMerchantPDA(merchantAuthority);
      const [promotionPDA] = this.config.getPromotionPDA(merchantPDA, promotionId);

      const txBuilder = this.config.program.methods
        .createPromotion(
          discountPercentage,
          maxSupply,
          new BN(expiryTimestamp),
          category,
          description,
          new BN(price)
        )
        .accounts({
          promotion: promotionPDA,
          merchant: merchantPDA,
          authority: merchantAuthority,
          systemProgram: SystemProgram.programId,
        } as any);

      const tx = merchantKeypair
        ? await txBuilder.signers([merchantKeypair]).rpc()
        : await txBuilder.rpc();

      logger.info(`Promotion created: ${tx}`);
      return { signature: tx, promotion: promotionPDA.toString() };
    } catch (error) {
      logger.error('Failed to create promotion:', error);
      throw error;
    }
  }

  /**
   * Mint a coupon NFT
   */
  async mintCoupon(
    promotionPDA: PublicKey,
    recipientPubkey: PublicKey,
    merchantAuthority: PublicKey,
    couponId: number,
    merchantKeypair?: Keypair
  ) {
    try {
      const promotion = await this.config.program.account.promotion.fetch(promotionPDA);
      const [merchantPDA] = this.config.getMerchantPDA(merchantAuthority);
      const [marketplacePDA] = this.config.getMarketplacePDA();
      const [couponPDA] = this.config.getCouponPDA(promotionPDA, promotion.currentSupply);
      const [userStatsPDA] = this.config.getUserStatsPDA(recipientPubkey);

      // Generate new mint keypair
      const nftMint = Keypair.generate();

      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        nftMint.publicKey,
        recipientPubkey
      );

      // Derive metadata PDA
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      // Derive master edition PDA
      const [masterEditionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.publicKey.toBuffer(),
          Buffer.from('edition'),
        ],
        METADATA_PROGRAM_ID
      );

      const payer = merchantKeypair?.publicKey || this.config.wallet.publicKey;
      const signers = merchantKeypair ? [nftMint, merchantKeypair] : [nftMint];

      const tx = await this.config.program.methods
        .mintCoupon(new BN(couponId))
        .accounts({
          coupon: couponPDA,
          nftMint: nftMint.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          marketplace: marketplacePDA,
          recipient: recipientPubkey,
          userStats: userStatsPDA,
          payer: payer,
          authority: merchantAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .signers(signers)
        .rpc();

      logger.info(`Coupon minted: ${tx}`);
      return {
        signature: tx,
        coupon: couponPDA.toString(),
        mint: nftMint.publicKey.toString(),
      };
    } catch (error) {
      logger.error('Failed to mint coupon:', error);
      throw error;
    }
  }

  /**
   * Redeem a coupon
   */
  async redeemCoupon(
    couponPDA: PublicKey,
    userPubkey: PublicKey,
    merchantAuthority: PublicKey,
    merchantKeypair?: Keypair
  ) {
    try {
      const coupon = await this.config.program.account.coupon.fetch(couponPDA);
      const [merchantPDA] = this.config.getMerchantPDA(merchantAuthority);
      const [userStatsPDA] = this.config.getUserStatsPDA(userPubkey);

      if (!coupon.mint) {
        throw new Error('Coupon does not have an associated NFT mint');
      }

      const nftMint = coupon.mint;
      const tokenAccount = await getAssociatedTokenAddress(nftMint, userPubkey);

      const txBuilder = this.config.program.methods
        .redeemCoupon()
        .accounts({
          coupon: couponPDA,
          nftMint: nftMint,
          tokenAccount: tokenAccount,
          merchant: merchantPDA,
          userStats: userStatsPDA,
          user: userPubkey,
          merchantAuthority: merchantAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any);

      const tx = merchantKeypair
        ? await txBuilder.signers([merchantKeypair]).rpc()
        : await txBuilder.rpc();

      logger.info(`Coupon redeemed: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to redeem coupon:', error);
      throw error;
    }
  }

  /**
   * List coupon for sale
   */
  async listCouponForSale(
    couponPDA: PublicKey,
    sellerPubkey: PublicKey,
    price: number
  ) {
    try {
      const [listingPDA] = this.config.getListingPDA(couponPDA);
      const [userStatsPDA] = this.config.getUserStatsPDA(sellerPubkey);

      const tx = await this.config.program.methods
        .listForSale(new BN(price))
        .accounts({
          listing: listingPDA,
          coupon: couponPDA,
          userStats: userStatsPDA,
          seller: sellerPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Coupon listed for sale: ${tx}`);
      return { signature: tx, listing: listingPDA.toString() };
    } catch (error) {
      logger.error('Failed to list coupon:', error);
      throw error;
    }
  }

  /**
   * Buy a listed coupon
   */
  async buyCouponListing(
    listingPDA: PublicKey,
    buyerPubkey: PublicKey
  ) {
    try {
      const listing = await this.config.program.account.listing.fetch(listingPDA);
      const [marketplacePDA] = this.config.getMarketplacePDA();
      const marketplace = await this.config.program.account.marketplace.fetch(marketplacePDA);

      const tx = await this.config.program.methods
        .buyListing()
        .accounts({
          listing: listingPDA,
          coupon: listing.coupon,
          marketplace: marketplacePDA,
          seller: listing.seller,
          buyer: buyerPubkey,
          marketplaceAuthority: marketplace.authority,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Coupon purchased: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to buy coupon:', error);
      throw error;
    }
  }

  /**
   * Cancel listing
   */
  async cancelListing(
    listingPDA: PublicKey,
    sellerPubkey: PublicKey
  ) {
    try {
      const tx = await this.config.program.methods
        .cancelListing()
        .accounts({
          listing: listingPDA,
          seller: sellerPubkey,
        } as any)
        .rpc();

      logger.info(`Listing cancelled: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to cancel listing:', error);
      throw error;
    }
  }

  /**
   * Rate a promotion
   */
  async ratePromotion(
    promotionPDA: PublicKey,
    userPubkey: PublicKey,
    stars: number,
    userKeypair?: Keypair
  ) {
    try {
      const [ratingPDA] = this.config.getRatingPDA(userPubkey, promotionPDA);
      const [userStatsPDA] = this.config.getUserStatsPDA(userPubkey);

      const txBuilder = this.config.program.methods
        .ratePromotion(stars)
        .accounts({
          rating: ratingPDA,
          promotion: promotionPDA,
          userStats: userStatsPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        } as any);

      const tx = userKeypair
        ? await txBuilder.signers([userKeypair]).rpc()
        : await txBuilder.rpc();

      logger.info(`Promotion rated: ${tx}`);
      return { signature: tx, rating: ratingPDA.toString() };
    } catch (error) {
      logger.error('Failed to rate promotion:', error);
      throw error;
    }
  }

  /**
   * Add comment to promotion
   */
  async addComment(
    promotionPDA: PublicKey,
    userPubkey: PublicKey,
    merchantPDA: PublicKey,
    content: string,
    _commentId: number,
    parentComment?: PublicKey,
    userKeypair?: Keypair
  ) {
    try {
      const [commentPDA] = this.config.getCommentPDA(userPubkey, promotionPDA);
      const [userStatsPDA] = this.config.getUserStatsPDA(userPubkey);

      const txBuilder = this.config.program.methods
        .addComment(content, parentComment ?? null)
        .accounts({
          comment: commentPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          userStats: userStatsPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        } as any);

      const tx = userKeypair
        ? await txBuilder.signers([userKeypair]).rpc()
        : await txBuilder.rpc();

      logger.info(`Comment added: ${tx}`);
      return { signature: tx, comment: commentPDA.toString() };
    } catch (error) {
      logger.error('Failed to add comment:', error);
      throw error;
    }
  }

  /**
   * Like a comment
   */
  async likeComment(
    commentPDA: PublicKey,
    userPubkey: PublicKey
  ) {
    try {
      const [commentLikePDA] = this.config.getCommentLikePDA(userPubkey, commentPDA);

      const tx = await this.config.program.methods
        .likeComment()
        .accounts({
          commentLike: commentLikePDA,
          comment: commentPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Comment liked: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to like comment:', error);
      throw error;
    }
  }

  /**
   * Update external deal
   */
  async updateExternalDeal(
    externalId: string,
    title: string,
    description: string,
    originalPrice: number,
    discountedPrice: number,
    category: string,
    imageUrl: string,
    affiliateUrl: string,
    expiryTimestamp: number
  ) {
    try {
      const [externalDealPDA] = this.config.getExternalDealPDA(externalId);

      const tx = await this.config.program.methods
        .updateExternalDeal(
          externalId,
          title,
          description,
          new BN(originalPrice),
          new BN(discountedPrice),
          category,
          imageUrl,
          affiliateUrl,
          new BN(expiryTimestamp)
        )
        .accounts({
          externalDeal: externalDealPDA,
          payer: this.config.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`External deal updated: ${tx}`);
      return { signature: tx, deal: externalDealPDA.toString() };
    } catch (error) {
      logger.error('Failed to update external deal:', error);
      throw error;
    }
  }

  /**
   * Generate redemption ticket
   */
  async generateRedemptionTicket(
    couponPDA: PublicKey,
    userPubkey: PublicKey,
    nonce: number,
    latitude?: number,
    longitude?: number
  ) {
    try {
      const [ticketPDA] = this.config.getRedemptionTicketPDA(couponPDA, userPubkey, nonce);

      const tx = await this.config.program.methods
        .generateRedemptionTicket(new BN(nonce), latitude ?? null, longitude ?? null)
        .accounts({
          ticket: ticketPDA,
          coupon: couponPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      const ticket = await this.config.program.account.redemptionTicket.fetch(ticketPDA);

      logger.info(`Redemption ticket generated: ${tx}`);
      return {
        signature: tx,
        ticket: ticketPDA.toString(),
        ticketHash: Buffer.from(ticket.ticketHash).toString('hex'),
        expiresAt: ticket.expiresAt.toNumber(),
      };
    } catch (error) {
      logger.error('Failed to generate redemption ticket:', error);
      throw error;
    }
  }

  /**
   * Verify and redeem ticket
   */
  async verifyAndRedeemTicket(
    ticketPDA: PublicKey,
    couponPDA: PublicKey,
    merchantAuthority: PublicKey,
    nonce: number,
    userPubkey: PublicKey,
    expectedHash: number[]
  ) {
    try {
      const ticket = await this.config.program.account.redemptionTicket.fetch(ticketPDA);
      const coupon = await this.config.program.account.coupon.fetch(couponPDA);
      const [merchantPDA] = this.config.getMerchantPDA(merchantAuthority);
      const [userStatsPDA] = this.config.getUserStatsPDA(ticket.user);
      const [ticketPDA] = this.config.getRedemptionTicketPDA(couponPDA, userPubkey, nonce);


      if (!coupon.mint) {
        throw new Error('Coupon does not have an associated NFT mint');
      }

      const nftMint = coupon.mint;
      const tokenAccount = await getAssociatedTokenAddress(nftMint, ticket.user);

      const tx = await this.config.program.methods
        .verifyAndRedeemTicket(expectedHash)
        .accounts({
          ticket: ticketPDA,
          coupon: couponPDA,
          nftMint: nftMint,
          tokenAccount: tokenAccount,
          merchant: merchantPDA,
          userStats: userStatsPDA,
          user: userPubkey,
          merchantAuthority: merchantAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Ticket verified and redeemed: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to verify and redeem ticket:', error);
      throw error;
    }
  }

  /**
   * Cancel redemption ticket
   */
  async cancelRedemptionTicket(
    ticketPDA: PublicKey,
    userPubkey: PublicKey
  ) {
    try {
      const tx = await this.config.program.methods
        .cancelRedemptionTicket()
        .accounts({
          ticket: ticketPDA,
          user: userPubkey,
        } as any)
        .rpc();

      logger.info(`Redemption ticket cancelled: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to cancel redemption ticket:', error);
      throw error;
    }
  }

  /**
   * Create group deal
   */
  async createGroupDeal(
    promotionPDA: PublicKey,
    merchantAuthority: PublicKey,
    dealId: number,
    targetParticipants: number,
    maxParticipants: number,
    basePrice: number,
    discountTiers: Array<{ minParticipants: number; discountPercentage: number }>,
    durationSeconds: number
  ) {
    try {
      const [merchantPDA] = this.config.getMerchantPDA(merchantAuthority);
      const [groupDealPDA] = this.config.getGroupDealPDA(promotionPDA, dealId);
      const [escrowVaultPDA] = this.config.getGroupEscrowPDA(groupDealPDA);

      const tx = await this.config.program.methods
        .createGroupDeal(
          new BN(dealId),
          targetParticipants,
          maxParticipants,
          new BN(basePrice),
          discountTiers,
          new BN(durationSeconds)
        )
        .accounts({
          groupDeal: groupDealPDA,
          escrowVault: escrowVaultPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          organizer: merchantAuthority,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Group deal created: ${tx}`);
      return { signature: tx, groupDeal: groupDealPDA.toString() };
    } catch (error) {
      logger.error('Failed to create group deal:', error);
      throw error;
    }
  }

  /**
   * Join group deal
   */
  async joinGroupDeal(
    groupDealPDA: PublicKey,
    userPubkey: PublicKey
  ) {
    try {
      const [participantPDA] = this.config.getGroupParticipantPDA(groupDealPDA, userPubkey);
      const [escrowVaultPDA] = this.config.getGroupEscrowPDA(groupDealPDA);
      const [userStatsPDA] = this.config.getUserStatsPDA(userPubkey);

      const tx = await this.config.program.methods
        .joinGroupDeal()
        .accounts({
          participant: participantPDA,
          groupDeal: groupDealPDA,
          escrowVault: escrowVaultPDA,
          userStats: userStatsPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Joined group deal: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to join group deal:', error);
      throw error;
    }
  }

  /**
   * Finalize group deal
   */
  async finalizeGroupDeal(
    groupDealPDA: PublicKey,
    merchantAuthority: PublicKey
  ) {
    try {
      const groupDeal = await this.config.program.account.groupDeal.fetch(groupDealPDA);
      const [merchantPDA] = this.config.getMerchantPDA(merchantAuthority);
      const [marketplacePDA] = this.config.getMarketplacePDA();
      const [escrowVaultPDA] = this.config.getGroupEscrowPDA(groupDealPDA);

      const tx = await this.config.program.methods
        .finalizeGroupDeal()
        .accounts({
          groupDeal: groupDealPDA,
          promotion: groupDeal.promotion,
          merchant: merchantPDA,
          marketplace: marketplacePDA,
          escrowVault: escrowVaultPDA,
          merchantAuthority: merchantAuthority,
          authority: this.config.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Group deal finalized: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to finalize group deal:', error);
      throw error;
    }
  }

  /**
   * Refund group deal participant
   */
  async refundGroupDeal(
    groupDealPDA: PublicKey,
    userPubkey: PublicKey
  ) {
    try {
      const [participantPDA] = this.config.getGroupParticipantPDA(groupDealPDA, userPubkey);
      const [escrowVaultPDA] = this.config.getGroupEscrowPDA(groupDealPDA);

      const tx = await this.config.program.methods
        .refundGroupDeal()
        .accounts({
          groupDeal: groupDealPDA,
          participant: participantPDA,
          escrowVault: escrowVaultPDA,
          user: userPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Group deal refunded: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to refund group deal:', error);
      throw error;
    }
  }

  /**
   * Mint group coupon
   */
  async mintGroupCoupon(
    groupDealPDA: PublicKey,
    participantPDA: PublicKey,
    couponId: number
  ) {
    try {
      const groupDeal = await this.config.program.account.groupDeal.fetch(groupDealPDA);
      const participant = await this.config.program.account.groupParticipant.fetch(participantPDA);
      const [couponPDA] = this.config.getGroupCouponPDA(groupDealPDA, participant.user);

      const tx = await this.config.program.methods
        .mintGroupCoupon(new BN(couponId))
        .accounts({
          coupon: couponPDA,
          groupDeal: groupDealPDA,
          participant: participantPDA,
          promotion: groupDeal.promotion,
          payer: this.config.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Group coupon minted: ${tx}`);
      return { signature: tx, coupon: couponPDA.toString() };
    } catch (error) {
      logger.error('Failed to mint group coupon:', error);
      throw error;
    }
  }

  /**
   * Create auction
   */
  async createAuction(
    couponPDA: PublicKey,
    sellerPubkey: PublicKey,
    auctionId: number,
    auctionType: { english?: {} } | { dutch?: {} } | { sealedBid?: {} },
    startingPrice: number,
    reservePrice: number,
    durationSeconds: number,
    autoExtend: boolean,
    minBidIncrement: number
  ) {
    try {
      const [auctionPDA] = this.config.getAuctionPDA(couponPDA, auctionId);
      const [userStatsPDA] = this.config.getUserStatsPDA(sellerPubkey);

      const tx = await this.config.program.methods
        .createAuction(
          new BN(auctionId),
          auctionType as any,
          new BN(startingPrice),
          new BN(reservePrice),
          new BN(durationSeconds),
          autoExtend,
          new BN(minBidIncrement)
        )
        .accounts({
          auction: auctionPDA,
          coupon: couponPDA,
          userStats: userStatsPDA,
          seller: sellerPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Auction created: ${tx}`);
      return { signature: tx, auction: auctionPDA.toString() };
    } catch (error) {
      logger.error('Failed to create auction:', error);
      throw error;
    }
  }

  /**
   * Place bid on auction
   */
  async placeBid(
    auctionPDA: PublicKey,
    bidderPubkey: PublicKey,
    bidAmount: number,
    previousBidder?: PublicKey
  ) {
    try {
      const auction = await this.config.program.account.couponAuction.fetch(auctionPDA);
      const [bidPDA] = this.config.getBidPDA(auctionPDA, bidderPubkey, auction.bidCount);
      const [escrowPDA] = this.config.getAuctionEscrowPDA(auctionPDA);
      const [userStatsPDA] = this.config.getUserStatsPDA(bidderPubkey);

      const tx = await this.config.program.methods
        .placeBid(new BN(bidAmount))
        .accounts({
          bid: bidPDA,
          auction: auctionPDA,
          escrow: escrowPDA,
          previousBidder: previousBidder || bidderPubkey,
          userStats: userStatsPDA,
          bidder: bidderPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Bid placed: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to place bid:', error);
      throw error;
    }
  }

  /**
   * Buy dutch auction
   */
  async buyDutchAuction(
    auctionPDA: PublicKey,
    buyerPubkey: PublicKey
  ) {
    try {
      const auction = await this.config.program.account.couponAuction.fetch(auctionPDA);
      const [marketplacePDA] = this.config.getMarketplacePDA();
      const marketplace = await this.config.program.account.marketplace.fetch(marketplacePDA);
      const [userStatsPDA] = this.config.getUserStatsPDA(buyerPubkey);

      const tx = await this.config.program.methods
        .buyDutchAuction()
        .accounts({
          auction: auctionPDA,
          coupon: auction.coupon,
          marketplace: marketplacePDA,
          seller: auction.seller,
          marketplaceAuthority: marketplace.authority,
          userStats: userStatsPDA,
          buyer: buyerPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Dutch auction purchased: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to buy dutch auction:', error);
      throw error;
    }
  }

  /**
   * Finalize auction
   */
  async finalizeAuction(
    auctionPDA: PublicKey,
    authorityPubkey: PublicKey
  ) {
    try {
      const auction = await this.config.program.account.couponAuction.fetch(auctionPDA);
      const [marketplacePDA] = this.config.getMarketplacePDA();
      const marketplace = await this.config.program.account.marketplace.fetch(marketplacePDA);
      const [escrowPDA] = this.config.getAuctionEscrowPDA(auctionPDA);
      
      if (!auction.highestBidder) {
        throw new Error('No bids placed on auction');
      }

      const [winnerStatsPDA] = this.config.getUserStatsPDA(auction.highestBidder);

      const tx = await this.config.program.methods
        .finalizeAuction()
        .accounts({
          auction: auctionPDA,
          coupon: auction.coupon,
          marketplace: marketplacePDA,
          escrow: escrowPDA,
          seller: auction.seller,
          winner: auction.highestBidder,
          marketplaceAuthority: marketplace.authority,
          winnerStats: winnerStatsPDA,
          authority: authorityPubkey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Auction finalized: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to finalize auction:', error);
      throw error;
    }
  }

  /**
   * Cancel auction
   */
  async cancelAuction(
    auctionPDA: PublicKey,
    sellerPubkey: PublicKey
  ) {
    try {
      const tx = await this.config.program.methods
        .cancelAuction()
        .accounts({
          auction: auctionPDA,
          seller: sellerPubkey,
        } as any)
        .rpc();

      logger.info(`Auction cancelled: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to cancel auction:', error);
      throw error;
    }
  }

  /**
   * Initialize staking pool
   */
  async initializeStaking(
    rewardRatePerDay: number,
    minStakeDuration: number
  ) {
    try {
      const [stakingPoolPDA] = this.config.getStakingPoolPDA();

      const tx = await this.config.program.methods
        .initializeStaking(new BN(rewardRatePerDay), new BN(minStakeDuration))
        .accounts({
          stakingPool: stakingPoolPDA,
          authority: this.config.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Staking pool initialized: ${tx}`);
      return { signature: tx, stakingPool: stakingPoolPDA.toString() };
    } catch (error) {
      logger.error('Failed to initialize staking:', error);
      throw error;
    }
  }

  /**
   * Stake coupon
   */
  async stakeCoupon(
    couponPDA: PublicKey,
    userPubkey: PublicKey,
    durationDays: number
  ) {
    try {
      const coupon = await this.config.program.account.coupon.fetch(couponPDA);
      const [stakeAccountPDA] = this.config.getStakeAccountPDA(couponPDA, userPubkey);
      const [stakingPoolPDA] = this.config.getStakingPoolPDA();

      if (!coupon.mint) {
        throw new Error('Coupon does not have an associated NFT mint');
      }

      const nftMint = coupon.mint;
      const userTokenAccount = await getAssociatedTokenAddress(nftMint, userPubkey);
      const [stakeVaultPDA] = this.config.getStakeVaultPDA(nftMint);

      const tx = await this.config.program.methods
        .stakeCoupon(new BN(durationDays))
        .accounts({
          stakeAccount: stakeAccountPDA,
          stakingPool: stakingPoolPDA,
          coupon: couponPDA,
          nftMint: nftMint,
          userTokenAccount: userTokenAccount,
          stakeVault: stakeVaultPDA,
          user: userPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Coupon staked: ${tx}`);
      return { signature: tx, stakeAccount: stakeAccountPDA.toString() };
    } catch (error) {
      logger.error('Failed to stake coupon:', error);
      throw error;
    }
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(
    couponPDA: PublicKey,
    userPubkey: PublicKey,
    rewardPoolPubkey: PublicKey
  ) {
    try {
      const coupon = await this.config.program.account.coupon.fetch(couponPDA);
      const [stakeAccountPDA] = this.config.getStakeAccountPDA(couponPDA, userPubkey);
      const [stakingPoolPDA] = this.config.getStakingPoolPDA();

      if (!coupon.mint) {
        throw new Error('Coupon does not have an associated NFT mint');
      }

      const nftMint = coupon.mint;
      const [stakeVaultPDA] = this.config.getStakeVaultPDA(nftMint);
      const userTokenAccount = await getAssociatedTokenAddress(nftMint, userPubkey);

      const tx = await this.config.program.methods
        .claimRewards()
        .accounts({
          stakeAccount: stakeAccountPDA,
          stakingPool: stakingPoolPDA,
          nftMint: nftMint,
          stakeVault: stakeVaultPDA,
          userTokenAccount: userTokenAccount,
          user: userPubkey,
          rewardPool: rewardPoolPubkey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      logger.info(`Rewards claimed: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to claim rewards:', error);
      throw error;
    }
  }

  /**
   * Transfer coupon
   */
  async transferCoupon(
    couponPDA: PublicKey,
    newOwner: PublicKey,
    fromAuthority: PublicKey
  ) {
    try {
      const tx = await this.config.program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPDA,
          newOwner: newOwner,
          fromAuthority: fromAuthority,
        } as any)
        .rpc();

      logger.info(`Coupon transferred: ${tx}`);
      return { signature: tx };
    } catch (error) {
      logger.error('Failed to transfer coupon:', error);
      throw error;
    }
  }

  /**
   * Mint badge
   */
  async mintBadge(
    userPubkey: PublicKey,
    badgeType: { firstPurchase?: {} } | { tenRedemptions?: {} } | { fiftyRedemptions?: {} } | { topReviewer?: {} } | { earlyAdopter?: {} } | { merchantPartner?: {} } | { communityModerator?: {} }
  ) {
    try {
      const nftMint = Keypair.generate();
      
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const [masterEditionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.publicKey.toBuffer(),
          Buffer.from('edition'),
        ],
        METADATA_PROGRAM_ID
      );

      // Badge NFT PDA - needs proper derivation based on contract
      const [badgeNftPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('badge'), userPubkey.toBuffer(), nftMint.publicKey.toBuffer()],
        this.config.programId
      );

      const tx = await this.config.program.methods
        .mintBadge(badgeType as any)
        .accounts({
          badgeNft: badgeNftPDA,
          mint: nftMint.publicKey,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          user: userPubkey,
          authority: this.config.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .signers([nftMint])
        .rpc();

      logger.info(`Badge minted: ${tx}`);
      return { signature: tx, badge: badgeNftPDA.toString(), mint: nftMint.publicKey.toString() };
    } catch (error) {
      logger.error('Failed to mint badge:', error);
      throw error;
    }
  }

  /**
   * Auto award badge
   */
  async autoAwardBadge(
    userPubkey: PublicKey,
    badgeType: { firstPurchase?: {} } | { tenRedemptions?: {} } | { fiftyRedemptions?: {} } | { topReviewer?: {} } | { earlyAdopter?: {} } | { merchantPartner?: {} } | { communityModerator?: {} }
  ) {
    try {
      const nftMint = Keypair.generate();
      const [userStatsPDA] = this.config.getUserStatsPDA(userPubkey);
      
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const [masterEditionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.publicKey.toBuffer(),
          Buffer.from('edition'),
        ],
        METADATA_PROGRAM_ID
      );

      const [badgeNftPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('badge'), userPubkey.toBuffer(), nftMint.publicKey.toBuffer()],
        this.config.programId
      );

      const tx = await this.config.program.methods
        .autoAwardBadge(badgeType as any)
        .accounts({
          badgeNft: badgeNftPDA,
          userStats: userStatsPDA,
          user: userPubkey,
          mint: nftMint.publicKey,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          payer: this.config.wallet.publicKey,
          authority: this.config.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .signers([nftMint])
        .rpc();

      logger.info(`Badge auto-awarded: ${tx}`);
      return { signature: tx, badge: badgeNftPDA.toString() };
    } catch (error) {
      logger.error('Failed to auto award badge:', error);
      throw error;
    }
  }

  /**
   * Fetch marketplace data
   */
  async getMarketplace() {
    const [marketplacePDA] = this.config.getMarketplacePDA();
    return await this.config.program.account.marketplace.fetch(marketplacePDA);
  }

  /**
   * Fetch merchant data
   */
  async getMerchant(authority: PublicKey) {
    const [merchantPDA] = this.config.getMerchantPDA(authority);
    return await this.config.program.account.merchant.fetch(merchantPDA);
  }

  /**
   * Fetch promotion data
   */
  async getPromotion(promotionPDA: PublicKey) {
    return await this.config.program.account.promotion.fetch(promotionPDA);
  }

  /**
   * Fetch coupon data
   */
  async getCoupon(couponPDA: PublicKey) {
    return await this.config.program.account.coupon.fetch(couponPDA);
  }

  /**
   * Fetch user stats
   */
  async getUserStats(userPubkey: PublicKey) {
    const [userStatsPDA] = this.config.getUserStatsPDA(userPubkey);
    return await this.config.program.account.userStats.fetch(userStatsPDA);
  }

  /**
   * Fetch all promotions
   */
  async getAllPromotions() {
    return await this.config.program.account.promotion.all();
  }

  /**
   * Fetch all coupons for a user
   */
  async getUserCoupons(userPubkey: PublicKey) {
    return await this.config.program.account.coupon.all([
      {
        memcmp: {
          offset: 8 + 8 + 32, // Skip discriminator, id, and promotion pubkey
          bytes: userPubkey.toBase58(),
        },
      },
    ]);
  }

  /**
   * Fetch all listings
   */
  async getAllListings() {
    return await this.config.program.account.listing.all();
  }

  /**
   * Fetch external deals
   */
  async getExternalDeals() {
    return await this.config.program.account.externalDeal.all();
  }

  /**
   * Fetch all group deals
   */
  async getAllGroupDeals() {
    return await this.config.program.account.groupDeal.all();
  }

  /**
   * Fetch all auctions
   */
  async getAllAuctions() {
    return await this.config.program.account.couponAuction.all();
  }
}

export const solanaService = new SolanaService();
