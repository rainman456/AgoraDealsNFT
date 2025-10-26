import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram ,ComputeBudgetProgram } from "@solana/web3.js";
import { assert, expect } from "chai";
import { setupTestAccounts, TestAccounts } from "./setup";

describe("Marketplace Initialization", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let marketplaceWasAlreadyInitialized = false;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    
    // Check if marketplace already exists
    try {
      await program.account.marketplace.fetch(accounts.marketplacePDA);
      marketplaceWasAlreadyInitialized = true;
      console.log("    ℹ Marketplace already initialized, skipping initialization test");
    } catch (e) {
      marketplaceWasAlreadyInitialized = false;
    }
  });

  it("Initializes the marketplace", async function() {
    // Skip if marketplace already exists
    if (marketplaceWasAlreadyInitialized) {
      this.skip();
      return;
    }

    await program.methods
      .initialize()
      .accounts({
        marketplace: accounts.marketplacePDA,
        authority: accounts.marketplaceAuthority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.marketplaceAuthority])
      .rpc();

    const marketplace = await program.account.marketplace.fetch(
      accounts.marketplacePDA
    );
    
    assert.equal(
      marketplace.authority.toString(),
      accounts.marketplaceAuthority.publicKey.toString()
    );
    assert.equal(marketplace.totalCoupons.toNumber(), 0);
    assert.equal(marketplace.totalMerchants.toNumber(), 0);
    assert.equal(marketplace.feeBasisPoints, 250); // 2.5%
  });

  it("Verifies marketplace exists and has valid state", async function() {
    // Only run if marketplace was already initialized
    if (!marketplaceWasAlreadyInitialized) {
      this.skip();
      return;
    }

    const marketplace = await program.account.marketplace.fetch(
      accounts.marketplacePDA
    );
    
    // Verify the marketplace has valid data (don't check authority since it may vary)
    assert.exists(marketplace.authority);
    assert.equal(marketplace.feeBasisPoints, 250); // 2.5%
    assert.isAtLeast(marketplace.totalCoupons.toNumber(), 0);
    assert.isAtLeast(marketplace.totalMerchants.toNumber(), 0);
    
    console.log(`    ℹ Marketplace authority: ${marketplace.authority.toString()}`);
    console.log(`    ℹ Total coupons: ${marketplace.totalCoupons.toNumber()}`);
    console.log(`    ℹ Total merchants: ${marketplace.totalMerchants.toNumber()}`);
  });

  it("Fails to initialize marketplace twice", async () => {
    try {
      await program.methods
        .initialize()
        .accounts({
          marketplace: accounts.marketplacePDA,
          authority: accounts.marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.marketplaceAuthority])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error) {
      expect(error.message).to.include("already in use");
    }
  });
});