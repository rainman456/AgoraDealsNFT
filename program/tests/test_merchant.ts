import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, Keypair } from "@solana/web3.js";
import { assert, expect } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts, 
  airdrop,
  derivePDA,
  accountExists
} from "./setup";

describe("Merchant Registration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;

  const merchantName = "Test Restaurant";
  const merchantCategory = "restaurant";
  const merchantLatitude = 40.7128;
  const merchantLongitude = -74.006;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    
    // Check if marketplace already exists before initializing
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
  });

  it("Registers a merchant with location", async () => {
    await program.methods
      .registerMerchant(
        merchantName,
        merchantCategory,
        merchantLatitude,
        merchantLongitude
      )
      .accounts({
        merchant: accounts.merchant1PDA,
        marketplace: accounts.marketplacePDA,
        authority: accounts.merchant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant1])
      .rpc();

    const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
    
    assert.equal(merchant.name, merchantName);
    assert.equal(merchant.category, merchantCategory);
    assert.equal(merchant.authority.toString(), accounts.merchant1.publicKey.toString());
    assert.equal(merchant.hasPhysicalLocation, true);
    assert.equal(merchant.totalCouponsCreated.toNumber(), 0);
    assert.equal(merchant.isActive, true);

    const lat = merchant.location.latitude / 1_000_000;
    const lon = merchant.location.longitude / 1_000_000;
    assert.approximately(lat, merchantLatitude, 0.000001);
    assert.approximately(lon, merchantLongitude, 0.000001);
  });

  it("Registers a merchant without location", async () => {
    await program.methods
      .registerMerchant("Online Store", "ecommerce", null, null)
      .accounts({
        merchant: accounts.merchant2PDA,
        marketplace: accounts.marketplacePDA,
        authority: accounts.merchant2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([accounts.merchant2])
      .rpc();

    const merchant = await program.account.merchant.fetch(accounts.merchant2PDA);
    assert.equal(merchant.hasPhysicalLocation, false);
  });

  it("Fails with name too long", async () => {
    const longName = "A".repeat(51);
    const testMerchant = Keypair.generate();
    await airdrop(connection, testMerchant.publicKey);

    const [merchantPDA] = derivePDA(
      [Buffer.from("merchant"), testMerchant.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerMerchant(longName, "test", null, null)
        .accounts({
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).to.include("NameTooLong");
    }
  });

  it("Fails with invalid coordinates", async () => {
    const testMerchant = Keypair.generate();
    await airdrop(connection, testMerchant.publicKey);

    const [merchantPDA] = derivePDA(
      [Buffer.from("merchant"), testMerchant.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerMerchant("Test", "test", 91.0, 0.0)
        .accounts({
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();
      
      assert.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).to.include("InvalidCoordinates");
    }
  });
});