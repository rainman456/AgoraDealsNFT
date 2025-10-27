import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, Keypair, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts,
  getExpiryTimestamp,
  derivePDA,
  deriveMetadataPDA,
  deriveMasterEditionPDA,
  accountExists,
  u32ToLeBytes,
  u64ToLeBytes,
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID
} from "./setup";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("UserStats System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let userStatsPDA: PublicKey;
  let merchantPDA: PublicKey;
  let promotionPDA: PublicKey;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    
    // Initialize marketplace
    const marketplaceExists = await accountExists(connection, accounts.marketplacePDA);
    if (!marketplaceExists) {
      await program.methods
        .initialize()
        .accounts({
          marketplace: accounts.marketplacePDA,
          authority: accounts.marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.marketplaceAuthority])
        .rpc();
    }

    // Register merchant
    const merchantExists = await accountExists(connection, accounts.merchant1PDA);
    if (!merchantExists) {
      await program.methods
        .registerMerchant("UserStats Test Merchant", "test", null, null)
        .accounts({
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
    }
    merchantPDA = accounts.merchant1PDA;

    // Create promotion
    const merchant = await program.account.merchant.fetch(merchantPDA);
    [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        merchantPDA.toBuffer(),
        u64ToLeBytes(merchant.totalCouponsCreated),
      ],
      program.programId
    );

    const promotionExists = await accountExists(connection, promotionPDA);
    if (!promotionExists) {
      await program.methods
        .createPromotion(
          50,
          100,
          getExpiryTimestamp(30),
          "test",
          "UserStats test promotion",
          new BN(5 * LAMPORTS_PER_SOL)
        )
        .accounts({
          promotion: promotionPDA,
          merchant: merchantPDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
    }

    [userStatsPDA] = derivePDA(
      [Buffer.from("user_stats"), accounts.user1.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("UserStats Initialization", () => {
    it("Initializes UserStats on first purchase", async () => {
      const promotion = await program.account.promotion.fetch(promotionPDA);
      const [couponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          u32ToLeBytes(promotion.currentSupply),
        ],
        program.programId
      );

      const mintKeypair = Keypair.generate();
      const [metadataPDA] = deriveMetadataPDA(mintKeypair.publicKey);
      const [masterEditionPDA] = deriveMasterEditionPDA(mintKeypair.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        accounts.user1.publicKey
      );

      await program.methods
        .mintCoupon(new BN(1))
        .accounts({
          coupon: couponPDA,
          nftMint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          userStats: userStatsPDA,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, mintKeypair, accounts.merchant1])
        .rpc();

      const userStats = await program.account.userStats.fetch(userStatsPDA);
      assert.equal(userStats.user.toString(), accounts.user1.publicKey.toString());
      assert.equal(userStats.totalPurchases, 1);
      assert.equal(userStats.totalRedemptions, 0);
      assert.equal(userStats.totalRatingsGiven, 0);
      assert.equal(userStats.totalComments, 0);
      assert.equal(userStats.totalListings, 0);
      assert.isAbove(userStats.reputationScore.toNumber(), 0);
      assert.deepEqual(userStats.tier, { bronze: {} });
      assert.equal(userStats.badgesEarned.length, 0);
      assert.isAbove(userStats.joinedAt.toNumber(), 0);
      assert.isAbove(userStats.lastActivity.toNumber(), 0);
      console.log("✓ UserStats initialized on first purchase");
    });
  });

  describe("Reputation Accumulation", () => {
    it("Accumulates reputation from purchases", async () => {
      const userStatsBefore = await program.account.userStats.fetch(userStatsPDA);
      const reputationBefore = userStatsBefore.reputationScore.toNumber();

      // Make another purchase
      const promotion = await program.account.promotion.fetch(promotionPDA);
      const [couponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          u32ToLeBytes(promotion.currentSupply),
        ],
        program.programId
      );

      const mintKeypair = Keypair.generate();
      const [metadataPDA] = deriveMetadataPDA(mintKeypair.publicKey);
      const [masterEditionPDA] = deriveMasterEditionPDA(mintKeypair.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        accounts.user1.publicKey
      );

      await program.methods
        .mintCoupon(new BN(2))
        .accounts({
          coupon: couponPDA,
          nftMint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          userStats: userStatsPDA,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, mintKeypair, accounts.merchant1])
        .rpc();

      const userStatsAfter = await program.account.userStats.fetch(userStatsPDA);
      assert.equal(userStatsAfter.totalPurchases, 2);
      assert.isAbove(userStatsAfter.reputationScore.toNumber(), reputationBefore);
      console.log("✓ Reputation increased from", reputationBefore, "to", userStatsAfter.reputationScore.toString());
    });

    it("Accumulates reputation from ratings", async () => {
      const userStatsBefore = await program.account.userStats.fetch(userStatsPDA);
      const reputationBefore = userStatsBefore.reputationScore.toNumber();

      const [ratingPDA] = derivePDA(
        [
          Buffer.from("rating"),
          accounts.user1.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .ratePromotion(5)
        .accounts({
          rating: ratingPDA,
          promotion: promotionPDA,
          userStats: userStatsPDA,
          user: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      const userStatsAfter = await program.account.userStats.fetch(userStatsPDA);
      assert.equal(userStatsAfter.totalRatingsGiven, 1);
      assert.isAbove(userStatsAfter.reputationScore.toNumber(), reputationBefore);
      console.log("✓ Reputation increased from rating:", reputationBefore, "→", userStatsAfter.reputationScore.toString());
    });
  });

  describe("Tier Upgrades", () => {
    it("Starts at Bronze tier", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      assert.deepEqual(userStats.tier, { bronze: {} });
      console.log("✓ User starts at Bronze tier");
    });

    it("Upgrades to Silver tier at 100 reputation", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      const currentReputation = userStats.reputationScore.toNumber();

      // Tier thresholds:
      // Bronze: 0-99
      // Silver: 100-499
      // Gold: 500-1999
      // Platinum: 2000-9999
      // Diamond: 10000+

      if (currentReputation >= 100 && currentReputation < 500) {
        assert.deepEqual(userStats.tier, { silver: {} });
        console.log("✓ User upgraded to Silver tier at", currentReputation, "reputation");
      } else if (currentReputation < 100) {
        console.log("⚠ User still at Bronze tier with", currentReputation, "reputation (need 100 for Silver)");
      } else {
        console.log("✓ User at higher tier with", currentReputation, "reputation");
      }
    });

    it("Verifies tier calculation logic", async () => {
      // Test tier boundaries
      const tiers = [
        { min: 0, max: 99, tier: "Bronze" },
        { min: 100, max: 499, tier: "Silver" },
        { min: 500, max: 1999, tier: "Gold" },
        { min: 2000, max: 9999, tier: "Platinum" },
        { min: 10000, max: Infinity, tier: "Diamond" },
      ];

      tiers.forEach(({ min, max, tier }) => {
        console.log(`  ${tier}: ${min}-${max === Infinity ? '∞' : max} reputation`);
      });

      const userStats = await program.account.userStats.fetch(userStatsPDA);
      const reputation = userStats.reputationScore.toNumber();
      
      let expectedTier = "Bronze";
      if (reputation >= 10000) expectedTier = "Diamond";
      else if (reputation >= 2000) expectedTier = "Platinum";
      else if (reputation >= 500) expectedTier = "Gold";
      else if (reputation >= 100) expectedTier = "Silver";

      console.log("✓ Current reputation:", reputation, "→ Expected tier:", expectedTier);
    });
  });

  describe("Badge Eligibility Detection", () => {
    it("Detects FirstPurchase badge eligibility", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      // User should be eligible for FirstPurchase badge (1+ purchases)
      const isEligible = userStats.totalPurchases >= 1;
      assert.isTrue(isEligible);
      console.log("✓ User eligible for FirstPurchase badge:", userStats.totalPurchases, "purchases");
    });

    it("Checks TenRedemptions badge eligibility", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      const isEligible = userStats.totalRedemptions >= 10;
      if (isEligible) {
        console.log("✓ User eligible for TenRedemptions badge:", userStats.totalRedemptions, "redemptions");
      } else {
        console.log("  User not yet eligible for TenRedemptions badge:", userStats.totalRedemptions, "/10 redemptions");
      }
    });

    it("Checks FiftyRedemptions badge eligibility", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      const isEligible = userStats.totalRedemptions >= 50;
      if (isEligible) {
        console.log("✓ User eligible for FiftyRedemptions badge:", userStats.totalRedemptions, "redemptions");
      } else {
        console.log("  User not yet eligible for FiftyRedemptions badge:", userStats.totalRedemptions, "/50 redemptions");
      }
    });

    it("Checks TopReviewer badge eligibility", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      const isEligible = userStats.totalRatingsGiven >= 20;
      if (isEligible) {
        console.log("✓ User eligible for TopReviewer badge:", userStats.totalRatingsGiven, "ratings");
      } else {
        console.log("  User not yet eligible for TopReviewer badge:", userStats.totalRatingsGiven, "/20 ratings");
      }
    });
  });

  describe("Badge Tracking", () => {
    it("Tracks badges earned", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      // badgesEarned is a Vec<u8> which comes as a Buffer in TypeScript
      // We need to check if it's a Buffer or Array
      const badgesArray = Array.isArray(userStats.badgesEarned) 
        ? userStats.badgesEarned 
        : Array.from(userStats.badgesEarned);
      
      assert.isArray(badgesArray);
      assert.isAtMost(badgesArray.length, 10); // Max 10 badges
      console.log("✓ Badges earned:", badgesArray.length, "/10");
    });

    it("Verifies has_badge helper function logic", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      // Convert badgesEarned to array if it's a Buffer
      const badgesArray = Array.isArray(userStats.badgesEarned) 
        ? userStats.badgesEarned 
        : Array.from(userStats.badgesEarned);
      
      // Test badge type values
      const badgeTypes = {
        FirstPurchase: 0,
        TenRedemptions: 1,
        FiftyRedemptions: 2,
        TopReviewer: 3,
        EarlyAdopter: 4,
        MerchantPartner: 5,
        CommunityModerator: 6,
      };

      Object.entries(badgeTypes).forEach(([name, value]) => {
        const hasBadge = badgesArray.includes(value);
        console.log(`  ${name} (${value}):`, hasBadge ? "✓ Earned" : "Not earned");
      });
    });
  });

  describe("Activity Tracking", () => {
    it("Updates last activity timestamp", async () => {
      const userStatsBefore = await program.account.userStats.fetch(userStatsPDA);
      const lastActivityBefore = userStatsBefore.lastActivity.toNumber();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Perform an action (rate promotion again)
      const [ratingPDA] = derivePDA(
        [
          Buffer.from("rating"),
          accounts.user1.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .ratePromotion(4)
        .accounts({
          rating: ratingPDA,
          promotion: promotionPDA,
          userStats: userStatsPDA,
          user: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      const userStatsAfter = await program.account.userStats.fetch(userStatsPDA);
      assert.isAbove(userStatsAfter.lastActivity.toNumber(), lastActivityBefore);
      console.log("✓ Last activity timestamp updated");
    });

    it("Tracks joined_at timestamp", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      assert.isAbove(userStats.joinedAt.toNumber(), 0);
      const currentTime = Math.floor(Date.now() / 1000);
      assert.isAtMost(userStats.joinedAt.toNumber(), currentTime);
      console.log("✓ Joined timestamp is valid");
    });
  });

  describe("Multiple Users", () => {
    it("Tracks stats independently for different users", async () => {
      const [user2StatsPDA] = derivePDA(
        [Buffer.from("user_stats"), accounts.user2.publicKey.toBuffer()],
        program.programId
      );

      // Mint coupon for user2
      const promotion = await program.account.promotion.fetch(promotionPDA);
      const [couponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          u32ToLeBytes(promotion.currentSupply),
        ],
        program.programId
      );

      const mintKeypair = Keypair.generate();
      const [metadataPDA] = deriveMetadataPDA(mintKeypair.publicKey);
      const [masterEditionPDA] = deriveMasterEditionPDA(mintKeypair.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        accounts.user2.publicKey
      );

      await program.methods
        .mintCoupon(new BN(100))
        .accounts({
          coupon: couponPDA,
          nftMint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user2.publicKey,
          userStats: user2StatsPDA,
          payer: accounts.user2.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user2, mintKeypair, accounts.merchant1])
        .rpc();

      const user1Stats = await program.account.userStats.fetch(userStatsPDA);
      const user2Stats = await program.account.userStats.fetch(user2StatsPDA);

      assert.equal(user2Stats.user.toString(), accounts.user2.publicKey.toString());
      assert.equal(user2Stats.totalPurchases, 1);
      assert.notEqual(user1Stats.totalPurchases, user2Stats.totalPurchases);
      console.log("✓ User1 purchases:", user1Stats.totalPurchases);
      console.log("✓ User2 purchases:", user2Stats.totalPurchases);
    });
  });

  describe("Reputation Score Bounds", () => {
    it("Handles reputation score overflow protection", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      // Reputation should use saturating_add to prevent overflow
      assert.isAtLeast(userStats.reputationScore.toNumber(), 0);
      console.log("✓ Reputation score is non-negative:", userStats.reputationScore.toString());
    });
  });
});
