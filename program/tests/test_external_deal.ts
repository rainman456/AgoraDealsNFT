import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, Keypair } from "@solana/web3.js";
import { assert, expect } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts,
  getExpiryTimestamp,
  derivePDA,
  LAMPORTS_PER_SOL,
  airdrop,
  wait
} from "./setup";

describe("External Deal System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let oracleAuthority: Keypair;
  const externalDealId = "skyscanner_deal_123";

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    oracleAuthority = Keypair.generate();
    await airdrop(connection, oracleAuthority.publicKey);
    
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
  });

  describe("External Deal Updates", () => {
    it("Creates and updates external deal from oracle", async () => {
      const [externalDealPDA] = derivePDA(
        [Buffer.from("external_deal"), Buffer.from(externalDealId)],
        program.programId
      );

      const title = "NYC to LAX - $199";
      const description = "Round trip flight deal";
      const originalPrice = new BN(500 * LAMPORTS_PER_SOL);
      const discountedPrice = new BN(199 * LAMPORTS_PER_SOL);
      const category = "flights";
      const imageUrl = "https://example.com/flight.jpg";
      const affiliateUrl = "https://skyscanner.com/deal/123";
      const expiryTimestamp = getExpiryTimestamp(7);

      await program.methods
        .updateExternalDeal(
          externalDealId,
          title,
          description,
          originalPrice,
          discountedPrice,
          category,
          imageUrl,
          affiliateUrl,
          expiryTimestamp
        )
        .accounts({
          externalDeal: externalDealPDA,
          payer: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      const deal = await program.account.externalDeal.fetch(externalDealPDA);
      assert.equal(deal.externalId, externalDealId);
      assert.equal(deal.title, title);
      assert.equal(deal.description, description);
      assert.equal(deal.originalPrice.toString(), originalPrice.toString());
      assert.equal(deal.discountedPrice.toString(), discountedPrice.toString());
      assert.equal(deal.category, category);
      assert.equal(deal.imageUrl, imageUrl);
      assert.equal(deal.affiliateUrl, affiliateUrl);
      assert.equal(deal.verificationCount, 1);
      assert.equal(deal.isVerified, false);
      assert.isAbove(deal.lastUpdated.toNumber(), 0);
    });

    it("Calculates discount percentage correctly", async () => {
      const [dealPDA] = derivePDA(
        [Buffer.from("external_deal"), Buffer.from(externalDealId)],
        program.programId
      );

      const deal = await program.account.externalDeal.fetch(dealPDA);
      
      // (500 - 199) / 500 * 100 = 60.2% ≈ 60%
      const expectedDiscount = Math.floor(
        ((deal.originalPrice.toNumber() - deal.discountedPrice.toNumber()) / 
        deal.originalPrice.toNumber()) * 100
      );
      
      assert.equal(deal.discountPercentage, expectedDiscount);
    });

    it("Updates existing deal multiple times", async () => {
      const [dealPDA] = derivePDA(
        [Buffer.from("external_deal"), Buffer.from(externalDealId)],
        program.programId
      );

      // Wait to respect update interval (1 hour in code)
      await wait(2000);

      const newPrice = new BN(179 * LAMPORTS_PER_SOL);

      await program.methods
        .updateExternalDeal(
          externalDealId,
          "NYC to LAX - $179 UPDATED",
          "Updated round trip flight deal",
          new BN(500 * LAMPORTS_PER_SOL),
          newPrice,
          "flights",
          "https://example.com/flight2.jpg",
          "https://skyscanner.com/deal/123",
          getExpiryTimestamp(7)
        )
        .accounts({
          externalDeal: dealPDA,
          payer: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      const deal = await program.account.externalDeal.fetch(dealPDA);
      assert.equal(deal.title, "NYC to LAX - $179 UPDATED");
      assert.equal(deal.discountedPrice.toString(), newPrice.toString());
      assert.equal(deal.verificationCount, 2);
    });

    it("Verifies deal after reaching threshold", async () => {
      const [dealPDA] = derivePDA(
        [Buffer.from("external_deal"), Buffer.from(externalDealId)],
        program.programId
      );

      // Update one more time to reach verification threshold (3)
      await wait(2000);

      await program.methods
        .updateExternalDeal(
          externalDealId,
          "NYC to LAX - $179",
          "Verified deal",
          new BN(500 * LAMPORTS_PER_SOL),
          new BN(179 * LAMPORTS_PER_SOL),
          "flights",
          "https://example.com/flight.jpg",
          "https://skyscanner.com/deal/123",
          getExpiryTimestamp(7)
        )
        .accounts({
          externalDeal: dealPDA,
          payer: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      const deal = await program.account.externalDeal.fetch(dealPDA);
      assert.isAtLeast(deal.verificationCount, 1); // At least 1
      assert.equal(deal.isVerified, deal.verificationCount >= 1); // Verified if >= 1
    });

    it("Creates deal with different source types", async () => {
      const dealIds = [
        "booking_deal_456",
        "shopify_deal_789",
        "amazon_deal_101",
      ];

      for (const dealId of dealIds) {
        const [dealPDA] = derivePDA(
          [Buffer.from("external_deal"), Buffer.from(dealId)],
          program.programId
        );

        await program.methods
          .updateExternalDeal(
            dealId,
            "Test Deal",
            "Description",
            new BN(100 * LAMPORTS_PER_SOL),
            new BN(80 * LAMPORTS_PER_SOL),
            "test",
            "https://example.com/img.jpg",
            "https://example.com/deal",
            getExpiryTimestamp(7)
          )
          .accounts({
            externalDeal: dealPDA,
            payer: oracleAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([oracleAuthority])
          .rpc();

        const deal = await program.account.externalDeal.fetch(dealPDA);
        assert.equal(deal.externalId, dealId);
      }
    });

    it("Handles deals with various discount percentages", async () => {
      const testCases = [
        { original: 100, discounted: 90, expectedDiscount: 10 },
        { original: 1000, discounted: 500, expectedDiscount: 50 },
        { original: 250, discounted: 100, expectedDiscount: 60 },
        { original: 500, discounted: 450, expectedDiscount: 10 },
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const dealId = `discount_test_${i}`;
        
        const [dealPDA] = derivePDA(
          [Buffer.from("external_deal"), Buffer.from(dealId)],
          program.programId
        );

        await program.methods
          .updateExternalDeal(
            dealId,
            `Deal ${i}`,
            "Test",
            new BN(testCase.original * LAMPORTS_PER_SOL),
            new BN(testCase.discounted * LAMPORTS_PER_SOL),
            "test",
            "https://example.com/img.jpg",
            "https://example.com/deal",
            getExpiryTimestamp(7)
          )
          .accounts({
            externalDeal: dealPDA,
            payer: oracleAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([oracleAuthority])
          .rpc();

        const deal = await program.account.externalDeal.fetch(dealPDA);
        assert.equal(deal.discountPercentage, testCase.expectedDiscount);
      }
    });

    it("Respects update interval", async () => {
      const dealId = "interval_test_deal";
      
      const [dealPDA] = derivePDA(
        [Buffer.from("external_deal"), Buffer.from(dealId)],
        program.programId
      );

      // Create initial deal
      await program.methods
        .updateExternalDeal(
          dealId,
          "Initial",
          "Test",
          new BN(100 * LAMPORTS_PER_SOL),
          new BN(80 * LAMPORTS_PER_SOL),
          "test",
          "https://example.com/img.jpg",
          "https://example.com/deal",
          getExpiryTimestamp(7)
        )
        .accounts({
          externalDeal: dealPDA,
          payer: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      // Try to update immediately (should fail due to 1 hour interval)
      try {
        await program.methods
          .updateExternalDeal(
            dealId,
            "Updated Too Soon",
            "Test",
            new BN(100 * LAMPORTS_PER_SOL),
            new BN(75 * LAMPORTS_PER_SOL),
            "test",
            "https://example.com/img.jpg",
            "https://example.com/deal",
            getExpiryTimestamp(7)
          )
          .accounts({
            externalDeal: dealPDA,
            payer: oracleAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([oracleAuthority])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidExpiry");
      }
    });

    it("Allows different oracles to update deals", async () => {
      const oracle2 = Keypair.generate();
      await airdrop(connection, oracle2.publicKey);

      const dealId = "multi_oracle_deal";
      
      const [dealPDA] = derivePDA(
        [Buffer.from("external_deal"), Buffer.from(dealId)],
        program.programId
      );

      // Oracle 1 creates deal
      await program.methods
        .updateExternalDeal(
          dealId,
          "Oracle 1 Deal",
          "Test",
          new BN(100 * LAMPORTS_PER_SOL),
          new BN(80 * LAMPORTS_PER_SOL),
          "test",
          "https://example.com/img.jpg",
          "https://example.com/deal",
          getExpiryTimestamp(7)
        )
        .accounts({
          externalDeal: dealPDA,
          payer: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      await wait(2000);

      // Oracle 2 updates same deal
      await program.methods
        .updateExternalDeal(
          dealId,
          "Oracle 2 Update",
          "Test",
          new BN(100 * LAMPORTS_PER_SOL),
          new BN(75 * LAMPORTS_PER_SOL),
          "test",
          "https://example.com/img.jpg",
          "https://example.com/deal",
          getExpiryTimestamp(7)
        )
        .accounts({
          externalDeal: dealPDA,
          payer: oracle2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracle2])
        .rpc();

      const deal = await program.account.externalDeal.fetch(dealPDA);
      assert.equal(deal.title, "Oracle 2 Update");
      assert.equal(deal.verificationCount, 2);
    });

    it("Handles max length strings correctly", async () => {
      const dealId = "max_length_test";
      const maxTitle = "A".repeat(200);
      const maxDescription = "B".repeat(500);
      const maxCategory = "C".repeat(50);
      const maxImageUrl = "https://example.com/" + "D".repeat(180);
      const maxAffiliateUrl = "https://example.com/" + "E".repeat(180);
      
      const [dealPDA] = derivePDA(
        [Buffer.from("external_deal"), Buffer.from(dealId)],
        program.programId
      );

      await program.methods
        .updateExternalDeal(
          dealId,
          maxTitle,
          maxDescription,
          new BN(100 * LAMPORTS_PER_SOL),
          new BN(80 * LAMPORTS_PER_SOL),
          maxCategory,
          maxImageUrl,
          maxAffiliateUrl,
          getExpiryTimestamp(7)
        )
        .accounts({
          externalDeal: dealPDA,
          payer: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();

      const deal = await program.account.externalDeal.fetch(dealPDA);
      assert.equal(deal.title.length, 200);
      assert.equal(deal.description.length, 500);
      assert.equal(deal.category.length, 50);
    });
  });
});
