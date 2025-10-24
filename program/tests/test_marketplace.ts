import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram } from "@solana/web3.js";
import { assert, expect } from "chai";
import { setupTestAccounts, TestAccounts } from "./setup";

describe("Marketplace Initialization", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
  });

  it("Initializes the marketplace", async () => {
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
