import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { expect } from "chai";
import {
  setupTest,
  createMerchant,
  createPromotion,
  airdropSol,
} from "./setup";

describe("Advanced Integration Tests", () => {
  let program: Program<DiscountPlatform>;
  let provider: anchor.AnchorProvider;
  let platformState: anchor.web3.PublicKey;
  let merchant: anchor.web3.Keypair;
  let merchantAccount: anchor.web3.PublicKey;
  let promotion: anchor.web3.PublicKey;
  let user1: anchor.web3.Keypair;
  let user2: anchor.web3.Keypair;
  let user3: anchor.web3.Keypair;

  before(async () => {
    const setup = await setupTest();
    program = setup.program;
    provider = setup.provider;
    platformState = setup.platformState;

    merchant = anchor.web3.Keypair.generate();
    await airdropSol(provider, merchant.publicKey, 10);
    merchantAccount = await createMerchant(program, merchant, "Integration Merchant");

    promotion = await createPromotion(
      program,
      merchant,
      merchantAccount,
      "Integration Promo",
      50,
      100
    );

    user1 = anchor.web3.Keypair.generate();
    user2 = anchor.web3.Keypair.generate();
    user3 = anchor.web3.Keypair.generate();
    await airdropSol(provider, user1.publicKey, 10);
    await airdropSol(provider, user2.publicKey, 10);
    await airdropSol(provider, user3.publicKey, 10);
  });

  it("Complete group deal workflow: create, join, finalize, mint, redeem with ticket", async () => {
    // Create group deal
    const dealId = new anchor.BN(Date.now());
    const [groupDeal] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const basePrice = new anchor.BN(500_000_000);

    await program.methods
      .createGroupDeal(dealId, deadline, 2, 5, basePrice, [
        { participantCount: 2, discountBps: 1000 },
      ])
      .accounts({
        promotion,
        groupDeal,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // Users join
    const [escrowVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_escrow"), groupDeal.toBuffer()],
      program.programId
    );

    const [participant1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_participant"), groupDeal.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .joinGroupDeal()
      .accounts({
        groupDeal,
        participant: participant1,
        escrowVault,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const [participant2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_participant"), groupDeal.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .joinGroupDeal()
      .accounts({
        groupDeal,
        participant: participant2,
        escrowVault,
        user: user2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    // Finalize deal
    await program.methods
      .finalizeGroupDeal()
      .accounts({
        groupDeal,
        promotion,
        merchantAccount,
        escrowVault,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // Mint coupon
    const couponId = new anchor.BN(Date.now());
    const [coupon] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("coupon"), promotion.toBuffer(), user1.publicKey.toBuffer(), couponId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .mintGroupDealCoupon(couponId)
      .accounts({
        groupDeal,
        participant: participant1,
        promotion,
        coupon,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Generate redemption ticket
    const ticketNonce = new anchor.BN(Date.now());
    const [ticket] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption_ticket"), coupon.toBuffer(), ticketNonce.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const ticketExpiry = new anchor.BN(now + 3600);
    const secretHash = Array.from(Buffer.from("test_secret_hash_32_bytes_long!!"));

    await program.methods
      .generateRedemptionTicket(ticketNonce, secretHash, ticketExpiry, null)
      .accounts({
        coupon,
        ticket,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Verify and redeem with ticket
    const [userStats] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .verifyAndRedeemTicket(secretHash)
      .accounts({
        ticket,
        coupon,
        promotion,
        merchantAccount,
        userStats,
        user: user1.publicKey,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const couponAccount = await program.account.coupon.fetch(coupon);
    expect(couponAccount.isRedeemed).to.be.true;

    const ticketAccount = await program.account.redemptionTicket.fetch(ticket);
    expect(ticketAccount.isRedeemed).to.be.true;
  });

  it("Auction winner redeems coupon via redemption ticket", async () => {
    // Create auction
    const auctionId = new anchor.BN(Date.now());
    const [auction] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion.toBuffer(), auctionId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now);
    const endTime = new anchor.BN(now + 2);
    const startingPrice = new anchor.BN(500_000_000);

    await program.methods
      .createAuction(
        auctionId,
        { english: {} },
        startTime,
        endTime,
        startingPrice,
        new anchor.BN(0),
        new anchor.BN(0)
      )
      .accounts({
        promotion,
        auction,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // Place bid
    const [escrowVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction_escrow"), auction.toBuffer()],
      program.programId
    );

    const [bid] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bid"), auction.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .placeBid(new anchor.BN(600_000_000))
      .accounts({
        auction,
        bid,
        escrowVault,
        bidder: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Finalize auction
    const couponId = new anchor.BN(Date.now());
    const [coupon] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("coupon"), promotion.toBuffer(), user1.publicKey.toBuffer(), couponId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .finalizeAuction(couponId)
      .accounts({
        auction,
        promotion,
        merchantAccount,
        coupon,
        escrowVault,
        winner: user1.publicKey,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // Generate redemption ticket
    const ticketNonce = new anchor.BN(Date.now());
    const [ticket] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption_ticket"), coupon.toBuffer(), ticketNonce.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const ticketExpiry = new anchor.BN(now + 3600);
    const secretHash = Array.from(Buffer.from("auction_secret_hash_32_bytes!!"));

    await program.methods
      .generateRedemptionTicket(ticketNonce, secretHash, ticketExpiry, null)
      .accounts({
        coupon,
        ticket,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Redeem
    const [userStats] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user_stats"), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .verifyAndRedeemTicket(secretHash)
      .accounts({
        ticket,
        coupon,
        promotion,
        merchantAccount,
        userStats,
        user: user1.publicKey,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const couponAccount = await program.account.coupon.fetch(coupon);
    expect(couponAccount.isRedeemed).to.be.true;
  });

  it("Multiple group deals with same promotion", async () => {
    const deal1Id = new anchor.BN(Date.now());
    const deal2Id = new anchor.BN(Date.now() + 1);

    const [groupDeal1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), deal1Id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [groupDeal2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), deal2Id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const basePrice = new anchor.BN(300_000_000);

    // Create both deals
    await program.methods
      .createGroupDeal(deal1Id, deadline, 1, 3, basePrice, [])
      .accounts({
        promotion,
        groupDeal: groupDeal1,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    await program.methods
      .createGroupDeal(deal2Id, deadline, 1, 3, basePrice, [])
      .accounts({
        promotion,
        groupDeal: groupDeal2,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const deal1Account = await program.account.groupDeal.fetch(groupDeal1);
    const deal2Account = await program.account.groupDeal.fetch(groupDeal2);

    expect(deal1Account.promotion.toString()).to.equal(promotion.toString());
    expect(deal2Account.promotion.toString()).to.equal(promotion.toString());
    expect(deal1Account.dealId.toNumber()).to.not.equal(deal2Account.dealId.toNumber());
  });

  it("Multiple auctions with same promotion", async () => {
    const auction1Id = new anchor.BN(Date.now());
    const auction2Id = new anchor.BN(Date.now() + 1);

    const [auction1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion.toBuffer(), auction1Id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [auction2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion.toBuffer(), auction2Id.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now);
    const endTime = new anchor.BN(now + 3600);
    const startingPrice = new anchor.BN(500_000_000);

    await program.methods
      .createAuction(
        auction1Id,
        { english: {} },
        startTime,
        endTime,
        startingPrice,
        new anchor.BN(0),
        new anchor.BN(0)
      )
      .accounts({
        promotion,
        auction: auction1,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    await program.methods
      .createAuction(
        auction2Id,
        { dutch: {} },
        startTime,
        endTime,
        new anchor.BN(1_000_000_000),
        new anchor.BN(500_000_000),
        new anchor.BN(0)
      )
      .accounts({
        promotion,
        auction: auction2,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const auction1Account = await program.account.couponAuction.fetch(auction1);
    const auction2Account = await program.account.couponAuction.fetch(auction2);

    expect(auction1Account.promotion.toString()).to.equal(promotion.toString());
    expect(auction2Account.promotion.toString()).to.equal(promotion.toString());
  });

  it("User participates in group deal and bids on auction simultaneously", async () => {
    // Create group deal
    const dealId = new anchor.BN(Date.now());
    const [groupDeal] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const basePrice = new anchor.BN(200_000_000);

    await program.methods
      .createGroupDeal(dealId, deadline, 1, 3, basePrice, [])
      .accounts({
        promotion,
        groupDeal,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // Create auction
    const auctionId = new anchor.BN(Date.now());
    const [auction] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion.toBuffer(), auctionId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createAuction(
        auctionId,
        { english: {} },
        new anchor.BN(now),
        new anchor.BN(now + 3600),
        new anchor.BN(300_000_000),
        new anchor.BN(0),
        new anchor.BN(0)
      )
      .accounts({
        promotion,
        auction,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // User joins group deal
    const [groupEscrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_escrow"), groupDeal.toBuffer()],
      program.programId
    );

    const [participant] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_participant"), groupDeal.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinGroupDeal()
      .accounts({
        groupDeal,
        participant,
        escrowVault: groupEscrow,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // User bids on auction
    const [auctionEscrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction_escrow"), auction.toBuffer()],
      program.programId
    );

    const [bid] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bid"), auction.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .placeBid(new anchor.BN(400_000_000))
      .accounts({
        auction,
        bid,
        escrowVault: auctionEscrow,
        bidder: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const participantAccount = await program.account.groupParticipant.fetch(participant);
    expect(participantAccount.user.toString()).to.equal(user1.publicKey.toString());

    const bidAccount = await program.account.bid.fetch(bid);
    expect(bidAccount.bidder.toString()).to.equal(user1.publicKey.toString());
  });

  it("Redemption ticket with geolocation verification", async () => {
    // Create and mint coupon first
    const couponId = new anchor.BN(Date.now());
    const [coupon] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("coupon"), promotion.toBuffer(), user1.publicKey.toBuffer(), couponId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    // Assuming we have a way to mint a regular coupon for testing
    // For this test, we'll create via group deal
    const dealId = new anchor.BN(Date.now());
    const [groupDeal] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createGroupDeal(
        dealId,
        new anchor.BN(now + 86400),
        1,
        3,
        new anchor.BN(100_000_000),
        []
      )
      .accounts({
        promotion,
        groupDeal,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const [escrowVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_escrow"), groupDeal.toBuffer()],
      program.programId
    );

    const [participant] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_participant"), groupDeal.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinGroupDeal()
      .accounts({
        groupDeal,
        participant,
        escrowVault,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .finalizeGroupDeal()
      .accounts({
        groupDeal,
        promotion,
        merchantAccount,
        escrowVault,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    await program.methods
      .mintGroupDealCoupon(couponId)
      .accounts({
        groupDeal,
        participant,
        promotion,
        coupon,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Generate ticket with location
    const ticketNonce = new anchor.BN(Date.now());
    const [ticket] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption_ticket"), coupon.toBuffer(), ticketNonce.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const ticketExpiry = new anchor.BN(now + 3600);
    const secretHash = Array.from(Buffer.from("geo_secret_hash_32_bytes_long!!"));
    const location = {
      latitude: 40750000, // 40.75 degrees * 1e6
      longitude: -73980000, // -73.98 degrees * 1e6
      radiusMeters: 100,
    };

    await program.methods
      .generateRedemptionTicket(ticketNonce, secretHash, ticketExpiry, location)
      .accounts({
        coupon,
        ticket,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const ticketAccount = await program.account.redemptionTicket.fetch(ticket);
    expect(ticketAccount.location).to.not.be.null;
    if (ticketAccount.location) {
      expect(ticketAccount.location.latitude).to.equal(40750000);
      expect(ticketAccount.location.longitude).to.equal(-73980000);
      expect(ticketAccount.location.radiusMeters).to.equal(100);
    }
  });

  it("Failed group deal refund followed by successful auction participation", async () => {
    // Create group deal that will fail
    const dealId = new anchor.BN(Date.now());
    const [groupDeal] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 2);
    const basePrice = new anchor.BN(200_000_000);

    await program.methods
      .createGroupDeal(dealId, deadline, 5, 10, basePrice, [])
      .accounts({
        promotion,
        groupDeal,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const [groupEscrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_escrow"), groupDeal.toBuffer()],
      program.programId
    );

    const [participant] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_participant"), groupDeal.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinGroupDeal()
      .accounts({
        groupDeal,
        participant,
        escrowVault: groupEscrow,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Refund
    await program.methods
      .refundGroupDeal()
      .accounts({
        groupDeal,
        participant,
        escrowVault: groupEscrow,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Now participate in auction
    const auctionId = new anchor.BN(Date.now());
    const [auction] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion.toBuffer(), auctionId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createAuction(
        auctionId,
        { english: {} },
        new anchor.BN(now),
        new anchor.BN(now + 3600),
        new anchor.BN(300_000_000),
        new anchor.BN(0),
        new anchor.BN(0)
      )
      .accounts({
        promotion,
        auction,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const [auctionEscrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction_escrow"), auction.toBuffer()],
      program.programId
    );

    const [bid] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bid"), auction.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .placeBid(new anchor.BN(400_000_000))
      .accounts({
        auction,
        bid,
        escrowVault: auctionEscrow,
        bidder: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const bidAccount = await program.account.bid.fetch(bid);
    expect(bidAccount.bidder.toString()).to.equal(user1.publicKey.toString());
  });

  it("Merchant creates multiple promotions with different deal types", async () => {
    const promotion2 = await createPromotion(
      program,
      merchant,
      merchantAccount,
      "Multi-Type Promo",
      30,
      50
    );

    // Create group deal on first promotion
    const dealId = new anchor.BN(Date.now());
    const [groupDeal] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createGroupDeal(
        dealId,
        new anchor.BN(now + 86400),
        1,
        3,
        new anchor.BN(100_000_000),
        []
      )
      .accounts({
        promotion,
        groupDeal,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // Create auction on second promotion
    const auctionId = new anchor.BN(Date.now());
    const [auction] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion2.toBuffer(), auctionId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createAuction(
        auctionId,
        { dutch: {} },
        new anchor.BN(now),
        new anchor.BN(now + 3600),
        new anchor.BN(1_000_000_000),
        new anchor.BN(500_000_000),
        new anchor.BN(0)
      )
      .accounts({
        promotion: promotion2,
        auction,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const dealAccount = await program.account.groupDeal.fetch(groupDeal);
    const auctionAccount = await program.account.couponAuction.fetch(auction);

    expect(dealAccount.promotion.toString()).to.equal(promotion.toString());
    expect(auctionAccount.promotion.toString()).to.equal(promotion2.toString());
  });

  it("Concurrent redemption tickets for different coupons", async () => {
    // Create two coupons via group deals
    const dealId1 = new anchor.BN(Date.now());
    const dealId2 = new anchor.BN(Date.now() + 1);

    const [groupDeal1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId1.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [groupDeal2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId2.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const basePrice = new anchor.BN(100_000_000);

    // Create both deals
    await program.methods
      .createGroupDeal(dealId1, deadline, 1, 3, basePrice, [])
      .accounts({
        promotion,
        groupDeal: groupDeal1,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    await program.methods
      .createGroupDeal(dealId2, deadline, 1, 3, basePrice, [])
      .accounts({
        promotion,
        groupDeal: groupDeal2,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // User joins both
    const [escrow1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_escrow"), groupDeal1.toBuffer()],
      program.programId
    );

    const [escrow2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_escrow"), groupDeal2.toBuffer()],
      program.programId
    );

    const [participant1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_participant"), groupDeal1.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    const [participant2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_participant"), groupDeal2.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinGroupDeal()
      .accounts({
        groupDeal: groupDeal1,
        participant: participant1,
        escrowVault: escrow1,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .joinGroupDeal()
      .accounts({
        groupDeal: groupDeal2,
        participant: participant2,
        escrowVault: escrow2,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Finalize both
    await program.methods
      .finalizeGroupDeal()
      .accounts({
        groupDeal: groupDeal1,
        promotion,
        merchantAccount,
        escrowVault: escrow1,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    await program.methods
      .finalizeGroupDeal()
      .accounts({
        groupDeal: groupDeal2,
        promotion,
        merchantAccount,
        escrowVault: escrow2,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    // Mint both coupons
    const couponId1 = new anchor.BN(Date.now());
    const couponId2 = new anchor.BN(Date.now() + 1);

    const [coupon1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("coupon"), promotion.toBuffer(), user1.publicKey.toBuffer(), couponId1.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [coupon2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("coupon"), promotion.toBuffer(), user1.publicKey.toBuffer(), couponId2.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .mintGroupDealCoupon(couponId1)
      .accounts({
        groupDeal: groupDeal1,
        participant: participant1,
        promotion,
        coupon: coupon1,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .mintGroupDealCoupon(couponId2)
      .accounts({
        groupDeal: groupDeal2,
        participant: participant2,
        promotion,
        coupon: coupon2,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Generate tickets for both
    const ticketNonce1 = new anchor.BN(Date.now());
    const ticketNonce2 = new anchor.BN(Date.now() + 1);

    const [ticket1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption_ticket"), coupon1.toBuffer(), ticketNonce1.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const [ticket2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption_ticket"), coupon2.toBuffer(), ticketNonce2.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const ticketExpiry = new anchor.BN(now + 3600);
    const secretHash1 = Array.from(Buffer.from("secret1_hash_32_bytes_long_here!"));
    const secretHash2 = Array.from(Buffer.from("secret2_hash_32_bytes_long_here!"));

    await program.methods
      .generateRedemptionTicket(ticketNonce1, secretHash1, ticketExpiry, null)
      .accounts({
        coupon: coupon1,
        ticket: ticket1,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .generateRedemptionTicket(ticketNonce2, secretHash2, ticketExpiry, null)
      .accounts({
        coupon: coupon2,
        ticket: ticket2,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const ticket1Account = await program.account.redemptionTicket.fetch(ticket1);
    const ticket2Account = await program.account.redemptionTicket.fetch(ticket2);

    expect(ticket1Account.coupon.toString()).to.equal(coupon1.toString());
    expect(ticket2Account.coupon.toString()).to.equal(coupon2.toString());
    expect(ticket1Account.isRedeemed).to.be.false;
    expect(ticket2Account.isRedeemed).to.be.false;
  });

  it("Dutch auction buy followed by redemption ticket generation", async () => {
    const auctionId = new anchor.BN(Date.now());
    const [auction] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion.toBuffer(), auctionId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createAuction(
        auctionId,
        { dutch: {} },
        new anchor.BN(now),
        new anchor.BN(now + 3600),
        new anchor.BN(2_000_000_000),
        new anchor.BN(500_000_000),
        new anchor.BN(0)
      )
      .accounts({
        promotion,
        auction,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const [escrowVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction_escrow"), auction.toBuffer()],
      program.programId
    );

    const couponId = new anchor.BN(Date.now());
    const [coupon] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("coupon"), promotion.toBuffer(), user1.publicKey.toBuffer(), couponId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .buyDutchAuction(couponId)
      .accounts({
        auction,
        promotion,
        merchantAccount,
        coupon,
        escrowVault,
        buyer: user1.publicKey,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    // Generate redemption ticket
    const ticketNonce = new anchor.BN(Date.now());
    const [ticket] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("redemption_ticket"), coupon.toBuffer(), ticketNonce.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const ticketExpiry = new anchor.BN(now + 3600);
    const secretHash = Array.from(Buffer.from("dutch_secret_hash_32_bytes_long!"));

    await program.methods
      .generateRedemptionTicket(ticketNonce, secretHash, ticketExpiry, null)
      .accounts({
        coupon,
        ticket,
        user: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const ticketAccount = await program.account.redemptionTicket.fetch(ticket);
    expect(ticketAccount.coupon.toString()).to.equal(coupon.toString());
    expect(ticketAccount.user.toString()).to.equal(user1.publicKey.toString());
  });

  it("Sealed bid auction with multiple bidders and winner redemption", async () => {
    const auctionId = new anchor.BN(Date.now());
    const [auction] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction"), promotion.toBuffer(), auctionId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    await program.methods
      .createAuction(
        auctionId,
        { sealedBid: {} },
        new anchor.BN(now),
        new anchor.BN(now + 2),
        new anchor.BN(500_000_000),
        new anchor.BN(400_000_000),
        new anchor.BN(0)
      )
      .accounts({
        promotion,
        auction,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const [escrowVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("auction_escrow"), auction.toBuffer()],
      program.programId
    );

    // Three users bid
    const [bid1] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bid"), auction.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .placeBid(new anchor.BN(600_000_000))
      .accounts({
        auction,
        bid: bid1,
        escrowVault,
        bidder: user1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user1])
      .rpc();

    const [bid2] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bid"), auction.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .placeBid(new anchor.BN(800_000_000))
      .accounts({
        auction,
        bid: bid2,
        escrowVault,
        bidder: user2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user2])
      .rpc();

    const [bid3] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bid"), auction.toBuffer(), user3.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .placeBid(new anchor.BN(700_000_000))
      .accounts({
        auction,
        bid: bid3,
        escrowVault,
        bidder: user3.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user3])
      .rpc();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Finalize with highest bidder (user2)
    const couponId = new anchor.BN(Date.now());
    const [coupon] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("coupon"), promotion.toBuffer(), user2.publicKey.toBuffer(), couponId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .finalizeAuction(couponId)
      .accounts({
        auction,
        promotion,
        merchantAccount,
        coupon,
        escrowVault,
        winner: user2.publicKey,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const auctionAccount = await program.account.couponAuction.fetch(auction);
    expect(auctionAccount.winner.toString()).to.equal(user2.publicKey.toString());
    expect(auctionAccount.isFinalized).to.be.true;

    const couponAccount = await program.account.coupon.fetch(coupon);
    expect(couponAccount.owner.toString()).to.equal(user2.publicKey.toString());
  });

  it("Group deal with tiered discounts reaching highest tier", async () => {
    const dealId = new anchor.BN(Date.now());
    const [groupDeal] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_deal"), promotion.toBuffer(), dealId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const deadline = new anchor.BN(now + 86400);
    const basePrice = new anchor.BN(1_000_000_000);

    const tiers = [
      { participantCount: 2, discountBps: 1000 },
      { participantCount: 3, discountBps: 2000 },
      { participantCount: 4, discountBps: 3000 },
    ];

    await program.methods
      .createGroupDeal(dealId, deadline, 2, 10, basePrice, tiers)
      .accounts({
        promotion,
        groupDeal,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const [escrowVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("group_escrow"), groupDeal.toBuffer()],
      program.programId
    );

    // Create additional user for 4th participant
    const user4 = anchor.web3.Keypair.generate();
    await airdropSol(provider, user4.publicKey, 5);

    // All 4 users join
    const users = [user1, user2, user3, user4];
    for (const user of users) {
      const [participant] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("group_participant"), groupDeal.toBuffer(), user.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .joinGroupDeal()
        .accounts({
          groupDeal,
          participant,
          escrowVault,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();
    }

    const dealAccount = await program.account.groupDeal.fetch(groupDeal);
    expect(dealAccount.currentParticipants).to.equal(4);

    // Finalize and verify highest tier discount applied
    await program.methods
      .finalizeGroupDeal()
      .accounts({
        groupDeal,
        promotion,
        merchantAccount,
        escrowVault,
        merchant: merchant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([merchant])
      .rpc();

    const finalDeal = await program.account.groupDeal.fetch(groupDeal);
    expect(finalDeal.isFinalized).to.be.true;
  });
});
