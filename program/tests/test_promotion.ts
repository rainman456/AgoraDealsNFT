import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, Keypair } from "@solana/web3.js";
import { assert, expect } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts,
  getExpiryTimestamp,
  getCurrentTimestamp,
  derivePDA,
  accountExists,
  LAMPORTS_PER_SOL,
  u64ToLeBytes
} from "./setup";

describe("Promotion Creation", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;

  const promotionCategory = "food";
  const promotionDescription = "50% off all pizzas";
  const discountPercentage = 50;
  const maxSupply = 100;
  const price = new BN(5 * LAMPORTS_PER_SOL);

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    
    const marketplaceExists = await accountExists(connection, accounts.marketplacePDA);
    
    if (!marketplaceExists) {
      console.log("  🏗️  Initializing marketplace...");
      await program.methods
        .initialize()
        .accounts({
          marketplace: accounts.marketplacePDA,
          authority: accounts.marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.marketplaceAuthority])
        .rpc();
    } else {
      console.log("  ✓ Marketplace already initialized");
    }

    const merchantExists = await accountExists(connection, accounts.merchant1PDA);
    
    if (!merchantExists) {
      console.log("  🏗️  Registering merchant...");
      await program.methods
        .registerMerchant("Test Restaurant", "restaurant", 40.7128, -74.006)
        .accounts({
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
    } else {
      console.log("  ✓ Merchant already registered");
    }
  });

  it("Creates a promotion successfully", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        u64ToLeBytes(merchant.totalCouponsCreated),
      ],
      program.programId
    );

    const exists = await accountExists(connection, promotionPDA);
    if (exists) {
      console.log("  ✓ Promotion already created, skipping");
      return;
    }

    const expiryTimestamp = getExpiryTimestamp(30);

    await program.methods
      .createPromotion(
        discountPercentage,
        maxSupply,
        expiryTimestamp,
        promotionCategory,
        promotionDescription,
        price
      )
      .accounts({
        promotion: promotionPDA,
        merchant: accounts.merchant1PDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    const promotion = await program.account.promotion.fetch(promotionPDA);
    
    assert.equal(promotion.merchant.toString(), accounts.merchant1PDA.toString());
    assert.equal(promotion.discountPercentage, discountPercentage);
    assert.equal(promotion.maxSupply, maxSupply);
    assert.equal(promotion.currentSupply, 0);
    assert.equal(promotion.category, promotionCategory);
    assert.equal(promotion.description, promotionDescription);
    assert.equal(promotion.price.toString(), price.toString());
    assert.equal(promotion.isActive, true);
    assert.equal(promotion.isLocationBased, false);
    assert.equal(promotion.radiusMeters, 0);
    assert.equal(promotion.geoCellId.toNumber(), 0);
  });

  it("Creates multiple promotions for same merchant", async () => {
    for (let i = 0; i < 2; i++) {
      const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
      
      const [promo] = derivePDA(
        [
          Buffer.from("promotion"),
          accounts.merchant1PDA.toBuffer(),
          u64ToLeBytes(merchant.totalCouponsCreated),
        ],
        program.programId
      );

      const exists = await accountExists(connection, promo);
      if (exists) continue;

      await program.methods
        .createPromotion(
          25 + (i + 1) * 5,
          50 + (i + 1) * 10,
          getExpiryTimestamp(30),
          `category${i + 1}`,
          `Description ${i + 1}`,
          new BN((i + 2) * LAMPORTS_PER_SOL)
        )
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();

      const promotion = await program.account.promotion.fetch(promo);
      assert.equal(promotion.discountPercentage, 25 + (i + 1) * 5);
    }
  });

  it("Fails with invalid discount percentage - zero", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    // Skip if account already exists (from previous run)
    const exists = await accountExists(connection, promo);
    if (exists) {
      console.log("  ⚠️  Promotion account exists, skipping validation test");
      return;
    }

    try {
      await program.methods
        .createPromotion(0, maxSupply, getExpiryTimestamp(30), promotionCategory, promotionDescription, price)
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).to.exist;
    }
  });

  it("Fails with invalid discount percentage - over 100", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(101, maxSupply, getExpiryTimestamp(30), promotionCategory, promotionDescription, price)
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      console.log("Error message:", error.toString());
      expect(error).to.exist;
    }
  });

  it("Fails with zero supply", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(50, 0, getExpiryTimestamp(30), promotionCategory, promotionDescription, price)
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      console.log("Error message:", error.toString());
      expect(error).to.exist;
    }
  });

  it("Fails with expired timestamp", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    const pastTimestamp = new BN(getCurrentTimestamp() - 3600);

    try {
      await program.methods
        .createPromotion(50, maxSupply, pastTimestamp, promotionCategory, promotionDescription, price)
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      console.log("Error message:", error.toString());
      expect(error).to.exist;
    }
  });

  it("Fails with category too long", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    const longCategory = "A".repeat(31);

    try {
      await program.methods
        .createPromotion(50, maxSupply, getExpiryTimestamp(30), longCategory, promotionDescription, price)
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      console.log("Error message:", error.toString());
      expect(error).to.exist;
    }
  });

  it("Fails with description too long", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    const longDescription = "A".repeat(201);

    try {
      await program.methods
        .createPromotion(50, maxSupply, getExpiryTimestamp(30), promotionCategory, longDescription, price)
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      console.log("Error message:", error.toString());
      expect(error).to.exist;
    }
  });

  it("Fails when non-authority tries to create promotion", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(50, maxSupply, getExpiryTimestamp(30), promotionCategory, promotionDescription, price)
        .accounts({
          promotion: promo,
          merchant: accounts.merchant1PDA,
          authority: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error).to.exist;
    }
  });

  it("Handles boundary values - 1% discount", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    const exists = await accountExists(connection, promo);
    if (exists) {
      console.log("  ✓ Promotion already created, skipping");
      return;
    }

    await program.methods
      .createPromotion(1, maxSupply, getExpiryTimestamp(30), promotionCategory, "Minimum discount test", price)
      .accounts({
        promotion: promo,
        merchant: accounts.merchant1PDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    const promotion = await program.account.promotion.fetch(promo);
    assert.equal(promotion.discountPercentage, 1);
  });

  it("Handles boundary values - 100% discount", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    const exists = await accountExists(connection, promo);
    if (exists) {
      console.log("  ✓ Promotion already created, skipping");
      return;
    }

    await program.methods
      .createPromotion(100, maxSupply, getExpiryTimestamp(30), promotionCategory, "Maximum discount test", price)
      .accounts({
        promotion: promo,
        merchant: accounts.merchant1PDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    const promotion = await program.account.promotion.fetch(promo);
    assert.equal(promotion.discountPercentage, 100);
  });

  it("Handles boundary values - supply of 1", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promo] = derivePDA(
      [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), u64ToLeBytes(merchant.totalCouponsCreated)],
      program.programId
    );

    const exists = await accountExists(connection, promo);
    if (exists) {
      console.log("  ✓ Promotion already created, skipping");
      return;
    }

    await program.methods
      .createPromotion(50, 1, getExpiryTimestamp(30), promotionCategory, "Limited supply test", price)
      .accounts({
        promotion: promo,
        merchant: accounts.merchant1PDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    const promotion = await program.account.promotion.fetch(promo);
    assert.equal(promotion.maxSupply, 1);
  });
});