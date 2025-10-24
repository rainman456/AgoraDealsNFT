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
  LAMPORTS_PER_SOL
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
    
    // Check if marketplace already exists
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

    // Check if merchant already exists
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
    // Get current merchant state to determine next promotion index
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

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
    
    assert.equal(
      promotion.merchant.toString(),
      accounts.merchant1PDA.toString()
    );
    assert.equal(promotion.discountPercentage, discountPercentage);
    assert.equal(promotion.maxSupply, maxSupply);
    assert.equal(promotion.currentSupply, 0);
    assert.equal(promotion.category, promotionCategory);
    assert.equal(promotion.description, promotionDescription);
    assert.equal(promotion.price.toString(), price.toString());
    assert.equal(promotion.isActive, true);
    
    // Location fields should be initialized to defaults
    assert.equal(promotion.isLocationBased, false);
    assert.equal(promotion.radiusMeters, 0);
    assert.equal(promotion.geoCellId.toNumber(), 0);
  });

  it("Creates multiple promotions for same merchant", async () => {
    for (let i = 0; i < 2; i++) {
      // Get current merchant state for accurate indexing
      const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
      
      const [promotionPDA] = derivePDA(
        [
          Buffer.from("promotion"),
          accounts.merchant1PDA.toBuffer(),
          Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
        ],
        program.programId
      );

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
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();

      const promotion = await program.account.promotion.fetch(promotionPDA);
      assert.equal(promotion.discountPercentage, 25 + (i + 1) * 5);
    }
  });

  it("Fails with invalid discount percentage - zero", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(
          0, // Invalid: 0%
          maxSupply,
          getExpiryTimestamp(30),
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
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.toString()).to.include("InvalidDiscount");
    }
  });

  it("Fails with invalid discount percentage - over 100", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(
          101, // Invalid: > 100
          maxSupply,
          getExpiryTimestamp(30),
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
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.toString()).to.include("InvalidDiscount");
    }
  });

  it("Fails with zero supply", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(
          50,
          0, // Invalid: 0 supply
          getExpiryTimestamp(30),
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
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.toString()).to.include("InvalidSupply");
    }
  });

  it("Fails with expired timestamp", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    const pastTimestamp = new BN(getCurrentTimestamp() - 3600); // 1 hour ago

    try {
      await program.methods
        .createPromotion(
          50,
          maxSupply,
          pastTimestamp,
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
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.toString()).to.include("InvalidExpiry");
    }
  });

  it("Fails with category too long", async () => {
    const longCategory = "A".repeat(31);
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(
          50,
          maxSupply,
          getExpiryTimestamp(30),
          longCategory,
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
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.toString()).to.include("CategoryTooLong");
    }
  });

  it("Fails with description too long", async () => {
    const longDescription = "A".repeat(201);
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(
          50,
          maxSupply,
          getExpiryTimestamp(30),
          promotionCategory,
          longDescription,
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
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.toString()).to.include("DescriptionTooLong");
    }
  });

  it("Fails when non-authority tries to create promotion", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    try {
      await program.methods
        .createPromotion(
          50,
          maxSupply,
          getExpiryTimestamp(30),
          promotionCategory,
          promotionDescription,
          price
        )
        .accounts({
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          authority: accounts.user1.publicKey, // Wrong authority
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      // Will fail due to constraint/signature verification
      expect(error).to.exist;
    }
  });

  it("Handles boundary values - 1% discount", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createPromotion(
        1, // Minimum valid discount
        maxSupply,
        getExpiryTimestamp(30),
        promotionCategory,
        "Minimum discount test",
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
    assert.equal(promotion.discountPercentage, 1);
  });

  it("Handles boundary values - 100% discount", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createPromotion(
        100, // Maximum valid discount
        maxSupply,
        getExpiryTimestamp(30),
        promotionCategory,
        "Maximum discount test",
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
    assert.equal(promotion.discountPercentage, 100);
  });

  it("Handles boundary values - supply of 1", async () => {
    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    const [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        accounts.merchant1PDA.toBuffer(),
        Buffer.from(new BN(merchant.totalCouponsCreated.toNumber()).toArray("le", 8)),
      ],
      program.programId
    );

    await program.methods
      .createPromotion(
        50,
        1, // Minimum supply
        getExpiryTimestamp(30),
        promotionCategory,
        "Limited supply test",
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
    assert.equal(promotion.maxSupply, 1);
  });
});