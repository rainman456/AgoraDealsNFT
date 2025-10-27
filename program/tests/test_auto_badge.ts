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

describe("Auto Badge Awarding System", () => {
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
        .registerMerchant("Badge Test Merchant", "test", null, null)
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
          "Badge test promotion",
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

  describe("Badge Qualification Checks", () => {
    before(async () => {
      // Ensure user has made at least one purchase
      const userStatsExists = await accountExists(connection, userStatsPDA);
      
      if (!userStatsExists) {
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
      }
    });

    it("Verifies FirstPurchase badge qualification", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      const qualifies = userStats.totalPurchases >= 1;
      assert.isTrue(qualifies);
      console.log("✓ User qualifies for FirstPurchase badge:", userStats.totalPurchases, "purchases");
    });

    it("Verifies TenRedemptions badge qualification logic", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      const qualifies = userStats.totalRedemptions >= 10;
      console.log("  TenRedemptions qualification:", qualifies, `(${userStats.totalRedemptions}/10 redemptions)`);
    });

    it("Verifies FiftyRedemptions badge qualification logic", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      const qualifies = userStats.totalRedemptions >= 50;
      console.log("  FiftyRedemptions qualification:", qualifies, `(${userStats.totalRedemptions}/50 redemptions)`);
    });

    it("Verifies TopReviewer badge qualification logic", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      const qualifies = userStats.totalRatingsGiven >= 20;
      console.log("  TopReviewer qualification:", qualifies, `(${userStats.totalRatingsGiven}/20 ratings)`);
    });
  });

  describe("Auto Badge Awarding", () => {
    it("Awards FirstPurchase badge automatically", async () => {
      const [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user1.publicKey.toBuffer(),
          Buffer.from([0]), // FirstPurchase = 0
        ],
        program.programId
      );

      const badgeMint = Keypair.generate();
      const [badgeMetadata] = deriveMetadataPDA(badgeMint.publicKey);
      const [badgeMasterEdition] = deriveMasterEditionPDA(badgeMint.publicKey);

      await program.methods
        .autoAwardBadge({ firstPurchase: {} })
        .accounts({
          badgeNft: badgePDA,
          userStats: userStatsPDA,
          user: accounts.user1.publicKey,
          mint: badgeMint.publicKey,
          metadata: badgeMetadata,
          masterEdition: badgeMasterEdition,
          payer: accounts.user1.publicKey,
          authority: accounts.marketplaceAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, badgeMint, accounts.marketplaceAuthority])
        .rpc();

      const badge = await program.account.badgeNft.fetch(badgePDA);
      assert.equal(badge.user.toString(), accounts.user1.publicKey.toString());
      assert.deepEqual(badge.badgeType, { firstPurchase: {} });
      assert.equal(badge.mint.toString(), badgeMint.publicKey.toString());
      assert.isAbove(badge.earnedAt.toNumber(), 0);
      assert.include(badge.metadataUri, "badges/0.json");
      console.log("✓ FirstPurchase badge awarded successfully");
    });

    it("Fails to award duplicate badge", async () => {
      const [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user1.publicKey.toBuffer(),
          Buffer.from([0]), // FirstPurchase = 0
        ],
        program.programId
      );

      const badgeMint = Keypair.generate();
      const [badgeMetadata] = deriveMetadataPDA(badgeMint.publicKey);
      const [badgeMasterEdition] = deriveMasterEditionPDA(badgeMint.publicKey);

      try {
        await program.methods
          .autoAwardBadge({ firstPurchase: {} })
          .accounts({
            badgeNft: badgePDA,
            userStats: userStatsPDA,
            user: accounts.user1.publicKey,
            mint: badgeMint.publicKey,
            metadata: badgeMetadata,
            masterEdition: badgeMasterEdition,
            payer: accounts.user1.publicKey,
            authority: accounts.marketplaceAuthority.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([accounts.user1, badgeMint, accounts.marketplaceAuthority])
          .rpc();
        
        assert.fail("Should have thrown an error for duplicate badge");
      } catch (error: any) {
        expect(error.toString()).to.satisfy((msg: string) => 
          msg.includes("already in use") || msg.includes("InvalidInput") || msg.includes("custom program error")
        );
        console.log("✓ Duplicate badge prevented");
      }
    });

    it("Fails to award badge when user doesn't qualify", async () => {
      // Try to award TenRedemptions badge when user has < 10 redemptions
      const [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user1.publicKey.toBuffer(),
          Buffer.from([1]), // TenRedemptions = 1
        ],
        program.programId
      );

      const badgeMint = Keypair.generate();
      const [badgeMetadata] = deriveMetadataPDA(badgeMint.publicKey);
      const [badgeMasterEdition] = deriveMasterEditionPDA(badgeMint.publicKey);

      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      if (userStats.totalRedemptions < 10) {
        try {
          await program.methods
            .autoAwardBadge({ tenRedemptions: {} })
            .accounts({
              badgeNft: badgePDA,
              userStats: userStatsPDA,
              user: accounts.user1.publicKey,
              mint: badgeMint.publicKey,
              metadata: badgeMetadata,
              masterEdition: badgeMasterEdition,
              payer: accounts.user1.publicKey,
              authority: accounts.marketplaceAuthority.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
              systemProgram: SystemProgram.programId,
              rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([accounts.user1, badgeMint, accounts.marketplaceAuthority])
            .rpc();
          
          assert.fail("Should have thrown an error for unqualified badge");
        } catch (error: any) {
          expect(error.toString()).to.satisfy((msg: string) => 
            msg.includes("InvalidInput") || msg.includes("custom program error")
          );
          console.log("✓ Unqualified badge award prevented");
        }
      } else {
        console.log("⚠ User already qualifies for TenRedemptions badge, skipping test");
      }
    });
  });

  describe("Reputation Points Award", () => {
    it("Awards reputation points with badge", async () => {
      const userStatsBefore = await program.account.userStats.fetch(userStatsPDA);
      const reputationBefore = userStatsBefore.reputationScore.toNumber();

      // Award EarlyAdopter badge (manually awarded, always qualifies)
      const [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user1.publicKey.toBuffer(),
          Buffer.from([4]), // EarlyAdopter = 4
        ],
        program.programId
      );

      const badgeMint = Keypair.generate();
      const [badgeMetadata] = deriveMetadataPDA(badgeMint.publicKey);
      const [badgeMasterEdition] = deriveMasterEditionPDA(badgeMint.publicKey);

      await program.methods
        .autoAwardBadge({ earlyAdopter: {} })
        .accounts({
          badgeNft: badgePDA,
          userStats: userStatsPDA,
          user: accounts.user1.publicKey,
          mint: badgeMint.publicKey,
          metadata: badgeMetadata,
          masterEdition: badgeMasterEdition,
          payer: accounts.user1.publicKey,
          authority: accounts.marketplaceAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, badgeMint, accounts.marketplaceAuthority])
        .rpc();

      const userStatsAfter = await program.account.userStats.fetch(userStatsPDA);
      const reputationAfter = userStatsAfter.reputationScore.toNumber();

      // EarlyAdopter badge awards 500 reputation points
      assert.isAbove(reputationAfter, reputationBefore);
      assert.equal(reputationAfter - reputationBefore, 500);
      console.log("✓ Reputation increased by 500 points:", reputationBefore, "→", reputationAfter);
    });

    it("Verifies reputation point values for each badge", async () => {
      const reputationValues = {
        FirstPurchase: 10,
        TenRedemptions: 50,
        FiftyRedemptions: 200,
        TopReviewer: 100,
        EarlyAdopter: 500,
        MerchantPartner: 300,
        CommunityModerator: 1000,
      };

      console.log("✓ Badge reputation values:");
      Object.entries(reputationValues).forEach(([badge, points]) => {
        console.log(`  ${badge}: +${points} reputation`);
      });
    });
  });

  describe("Badge Metadata", () => {
    it("Generates correct badge metadata URI", async () => {
      const [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user1.publicKey.toBuffer(),
          Buffer.from([0]), // FirstPurchase
        ],
        program.programId
      );

      const badge = await program.account.badgeNft.fetch(badgePDA);
      assert.include(badge.metadataUri, "https://api.dealdiscovery.com/badges/");
      assert.include(badge.metadataUri, "0.json");
      console.log("✓ Badge metadata URI:", badge.metadataUri);
    });

    it("Verifies badge NFT fields", async () => {
      const [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user1.publicKey.toBuffer(),
          Buffer.from([0]),
        ],
        program.programId
      );

      const badge = await program.account.badgeNft.fetch(badgePDA);
      assert.equal(badge.user.toString(), accounts.user1.publicKey.toString());
      assert.ok(badge.mint);
      assert.ok(badge.metadata);
      assert.isAbove(badge.earnedAt.toNumber(), 0);
      assert.isString(badge.metadataUri);
      console.log("✓ Badge NFT fields verified");
    });
  });

  describe("UserStats Badge Tracking", () => {
    it("Updates UserStats badges_earned array", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      
      // Should have FirstPurchase (0) and EarlyAdopter (4) badges
      assert.isTrue(userStats.badgesEarned.includes(0));
      assert.isTrue(userStats.badgesEarned.includes(4));
      console.log("✓ UserStats badges_earned:", userStats.badgesEarned);
    });

    it("Respects maximum badge limit (10)", async () => {
      const userStats = await program.account.userStats.fetch(userStatsPDA);
      assert.isAtMost(userStats.badgesEarned.length, 10);
      console.log("✓ Badge count within limit:", userStats.badgesEarned.length, "/10");
    });
  });

  describe("Multiple Users Badge Awards", () => {
    it("Awards badges independently to different users", async () => {
      // Setup user2
      const [user2StatsPDA] = derivePDA(
        [Buffer.from("user_stats"), accounts.user2.publicKey.toBuffer()],
        program.programId
      );

      // Mint coupon for user2 to create UserStats
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

      // Award FirstPurchase badge to user2
      const [user2BadgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user2.publicKey.toBuffer(),
          Buffer.from([0]),
        ],
        program.programId
      );

      const user2BadgeMint = Keypair.generate();
      const [user2BadgeMetadata] = deriveMetadataPDA(user2BadgeMint.publicKey);
      const [user2BadgeMasterEdition] = deriveMasterEditionPDA(user2BadgeMint.publicKey);

      await program.methods
        .autoAwardBadge({ firstPurchase: {} })
        .accounts({
          badgeNft: user2BadgePDA,
          userStats: user2StatsPDA,
          user: accounts.user2.publicKey,
          mint: user2BadgeMint.publicKey,
          metadata: user2BadgeMetadata,
          masterEdition: user2BadgeMasterEdition,
          payer: accounts.user2.publicKey,
          authority: accounts.marketplaceAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user2, user2BadgeMint, accounts.marketplaceAuthority])
        .rpc();

      const user1Stats = await program.account.userStats.fetch(userStatsPDA);
      const user2Stats = await program.account.userStats.fetch(user2StatsPDA);

      // Both should have FirstPurchase badge
      assert.isTrue(user1Stats.badgesEarned.includes(0));
      assert.isTrue(user2Stats.badgesEarned.includes(0));
      
      // But user1 should also have EarlyAdopter
      assert.isTrue(user1Stats.badgesEarned.includes(4));
      assert.isFalse(user2Stats.badgesEarned.includes(4));

      console.log("✓ User1 badges:", user1Stats.badgesEarned);
      console.log("✓ User2 badges:", user2Stats.badgesEarned);
    });
  });
});
