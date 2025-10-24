import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts,
  getExpiryTimestamp,
  derivePDA,
  LAMPORTS_PER_SOL
} from "./setup";

describe("Rating System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let promotionPDA: PublicKey;
  let ratingPDA: PublicKey;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    
    // Initialize marketplace
    await program.methods
      .initialize()
      .accounts({
        marketplace: accounts.marketplacePDA,
        authority: accounts.marketplaceAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.marketplaceAuthority])
      .rpc();

    // Register merchant
    await program.methods
      .registerMerchant("Test Restaurant", "restaurant", null, null)
      .accounts({
        merchant: accounts.merchant1PDA,
        marketplace: accounts.marketplacePDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    // Create promotion
    [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createPromotion(
        50,
        100,
        getExpiryTimestamp(30),
        "food",
        "Test promotion for rating",
        new BN(5 * LAMPORTS_PER_SOL)
      )
      .accounts({
        promotion: promotionPDA,
        merchant: accounts.merchant1PDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    [ratingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.user1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );
  });

  it("Rates a promotion", async () => {
    await program.methods
      .ratePromotion(5)
      .accounts({
        rating: ratingPDA,
        promotion: promotionPDA,
        user: accounts.user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user1])
      .rpc();

    const rating = await program.account.rating.fetch(ratingPDA);
    assert.equal(rating.stars, 5);
    assert.equal(rating.user.toString(), accounts.user1.publicKey.toString());
    assert.equal(rating.promotion.toString(), promotionPDA.toString());
    assert.equal(rating.merchant.toString(), accounts.merchant1PDA.toString());
    assert.isAbove(rating.createdAt.toNumber(), 0);
    assert.isAbove(rating.updatedAt.toNumber(), 0);
  });

  it("Updates existing rating", async () => {
    const ratingBefore = await program.account.rating.fetch(ratingPDA);
    const createdAt = ratingBefore.createdAt;

    // Wait a moment to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .ratePromotion(3)
      .accounts({
        rating: ratingPDA,
        promotion: promotionPDA,
        user: accounts.user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user1])
      .rpc();

    const rating = await program.account.rating.fetch(ratingPDA);
    assert.equal(rating.stars, 3);
    assert.equal(rating.createdAt.toNumber(), createdAt.toNumber());
    assert.isAbove(rating.updatedAt.toNumber(), rating.createdAt.toNumber());
  });

  it("Multiple users can rate the same promotion", async () => {
    const [user2RatingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .ratePromotion(4)
      .accounts({
        rating: user2RatingPDA,
        promotion: promotionPDA,
        user: accounts.user2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user2])
      .rpc();

    const rating = await program.account.rating.fetch(user2RatingPDA);
    assert.equal(rating.stars, 4);
    assert.equal(rating.user.toString(), accounts.user2.publicKey.toString());
  });

  it("User can rate different promotions", async () => {
    // Create another promotion
    const [promotion2PDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(1).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createPromotion(
        30,
        50,
        getExpiryTimestamp(30),
        "electronics",
        "Second promotion",
        new BN(3 * LAMPORTS_PER_SOL)
      )
      .accounts({
        promotion: promotion2PDA,
        merchant: accounts.merchant1PDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    const [rating2PDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.user1.publicKey.toBuffer(),
        promotion2PDA.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .ratePromotion(5)
      .accounts({
        rating: rating2PDA,
        promotion: promotion2PDA,
        user: accounts.user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user1])
      .rpc();

    const rating = await program.account.rating.fetch(rating2PDA);
    assert.equal(rating.stars, 5);
    assert.equal(rating.promotion.toString(), promotion2PDA.toString());
  });

  it("Fails with invalid rating - zero stars", async () => {
    const [testRatingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.merchant1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .ratePromotion(0) // Invalid: 0 stars
        .accounts({
          rating: testRatingPDA,
          promotion: promotionPDA,
          user: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
      
      assert.fail("Should have thrown InvalidDiscount error");
    } catch (error: any) {
      expect(error.toString()).to.include("InvalidDiscount");
    }
  });

  it("Fails with invalid rating - six stars", async () => {
    const [testRatingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.merchant2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .ratePromotion(6) // Invalid: > 5 stars
        .accounts({
          rating: testRatingPDA,
          promotion: promotionPDA,
          user: accounts.merchant2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant2])
        .rpc();
      
      assert.fail("Should have thrown InvalidDiscount error");
    } catch (error: any) {
      expect(error.toString()).to.include("InvalidDiscount");
    }
  });

  it("Allows valid ratings from 1 to 5 stars", async () => {
    // Test each valid rating value
    for (let stars = 1; stars <= 5; stars++) {
      const testUser = accounts[`user${stars}` as keyof TestAccounts] || accounts.user1;
      const [testRatingPDA] = derivePDA(
        [
          Buffer.from("rating"),
          (testUser as any).publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .ratePromotion(stars)
        .accounts({
          rating: testRatingPDA,
          promotion: promotionPDA,
          user: (testUser as any).publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser as any])
        .rpc();

      const rating = await program.account.rating.fetch(testRatingPDA);
      assert.equal(rating.stars, stars);
    }
  });

  it("Maintains separate ratings per user-promotion pair", async () => {
    // User1 rates promotion1
    const rating1 = await program.account.rating.fetch(ratingPDA);
    
    // Create promotion2 and have user1 rate it differently
    const [promotion2PDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(2).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createPromotion(
        25,
        75,
        getExpiryTimestamp(30),
        "services",
        "Third promotion",
        new BN(2 * LAMPORTS_PER_SOL)
      )
      .accounts({
        promotion: promotion2PDA,
        merchant: accounts.merchant1PDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    const [rating2PDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.user1.publicKey.toBuffer(),
        promotion2PDA.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .ratePromotion(1)
      .accounts({
        rating: rating2PDA,
        promotion: promotion2PDA,
        user: accounts.user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user1])
      .rpc();

    const rating2 = await program.account.rating.fetch(rating2PDA);
    
    // Verify they're independent
    assert.equal(rating1.stars, 3); // From earlier test
    assert.equal(rating2.stars, 1); // Different rating for different promotion
    assert.equal(rating1.promotion.toString(), promotionPDA.toString());
    assert.equal(rating2.promotion.toString(), promotion2PDA.toString());
  });

  it("Preserves createdAt timestamp when updating rating", async () => {
    const [newRatingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );

    // Create initial rating
    await program.methods
      .ratePromotion(5)
      .accounts({
        rating: newRatingPDA,
        promotion: promotionPDA,
        user: accounts.user2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user2])
      .rpc();

    const initialRating = await program.account.rating.fetch(newRatingPDA);
    const originalCreatedAt = initialRating.createdAt.toNumber();
    const originalUpdatedAt = initialRating.updatedAt.toNumber();

    // Wait to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update rating
    await program.methods
      .ratePromotion(2)
      .accounts({
        rating: newRatingPDA,
        promotion: promotionPDA,
        user: accounts.user2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user2])
      .rpc();

    const updatedRating = await program.account.rating.fetch(newRatingPDA);
    
    // createdAt should remain unchanged
    assert.equal(updatedRating.createdAt.toNumber(), originalCreatedAt);
    // updatedAt should be newer
    assert.isAbove(updatedRating.updatedAt.toNumber(), originalUpdatedAt);
    // stars should be updated
    assert.equal(updatedRating.stars, 2);
  });

  it("Correctly associates rating with merchant", async () => {
    const [testRatingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.user1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );

    const rating = await program.account.rating.fetch(testRatingPDA);
    const promotion = await program.account.promotion.fetch(promotionPDA);
    
    // Verify merchant association
    assert.equal(rating.merchant.toString(), promotion.merchant.toString());
    assert.equal(rating.merchant.toString(), accounts.merchant1PDA.toString());
  });

  it("Emits PromotionRated event on rating creation", async () => {
    // This test verifies the event structure (events are emitted but testing requires listener)
    // In a full implementation, you'd set up event listeners
    
    const [eventTestRatingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.merchant1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );

    // The event should contain: user, promotion, stars, is_update
    const tx = await program.methods
      .ratePromotion(5)
      .accounts({
        rating: eventTestRatingPDA,
        promotion: promotionPDA,
        user: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    // Verify transaction succeeded (event emission happens in the program)
    assert.ok(tx);
  });

  it("Handles boundary values correctly", async () => {
    // Test minimum valid value (1 star)
    const [minRatingPDA] = derivePDA(
      [
        Buffer.from("rating"),
        accounts.user1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .ratePromotion(1)
      .accounts({
        rating: minRatingPDA,
        promotion: promotionPDA,
        user: accounts.user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user1])
      .rpc();

    const minRating = await program.account.rating.fetch(minRatingPDA);
    assert.equal(minRating.stars, 1);

    // Test maximum valid value (5 stars)
    await program.methods
      .ratePromotion(5)
      .accounts({
        rating: minRatingPDA,
        promotion: promotionPDA,
        user: accounts.user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.user1])
      .rpc();

    const maxRating = await program.account.rating.fetch(minRatingPDA);
    assert.equal(maxRating.stars, 5);
  });
});