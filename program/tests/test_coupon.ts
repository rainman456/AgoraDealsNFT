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
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID
} from "./setup";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("Coupon Operations", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let promotionPDA: PublicKey;
  let couponPDA: PublicKey;
  let couponMint: Keypair;
  let metadataPDA: PublicKey;
  let masterEditionPDA: PublicKey;
  let tokenAccount: PublicKey;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    
    // Check if marketplace already exists
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
        "Test promotion",
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
  });

  describe("Coupon Minting", () => {
    it("Mints a coupon successfully", async () => {
      [couponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      couponMint = Keypair.generate();
      [metadataPDA] = deriveMetadataPDA(couponMint.publicKey);
      [masterEditionPDA] = deriveMasterEditionPDA(couponMint.publicKey);
      tokenAccount = getAssociatedTokenAddressSync(
        couponMint.publicKey,
        accounts.user1.publicKey
      );

      await program.methods
        .mintCoupon(new BN(1))
        .accounts({
          coupon: couponPDA,
          nftMint: couponMint.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, couponMint, accounts.merchant1])
        .rpc();

      const coupon = await program.account.coupon.fetch(couponPDA);
      
      assert.equal(coupon.id.toString(), "1");
      assert.equal(coupon.promotion.toString(), promotionPDA.toString());
      assert.equal(coupon.owner.toString(), accounts.user1.publicKey.toString());
      assert.equal(coupon.merchant.toString(), accounts.merchant1PDA.toString());
      assert.equal(coupon.discountPercentage, 50);
      assert.equal(coupon.isRedeemed, false);
      assert.equal(coupon.mint.toString(), couponMint.publicKey.toString());

      const promotion = await program.account.promotion.fetch(promotionPDA);
      assert.equal(promotion.currentSupply, 1);

      const merchant = await program.account.merchant.fetch(accounts.merchant1PDA);
      assert.equal(merchant.totalCouponsCreated.toNumber(), 1);

      const marketplace = await program.account.marketplace.fetch(accounts.marketplacePDA);
      assert.equal(marketplace.totalCoupons.toNumber(), 1);
    });

    it("Mints multiple coupons", async () => {
      for (let i = 1; i < 5; i++) {
        const [newCouponPDA] = derivePDA(
          [
            Buffer.from("coupon"),
            promotionPDA.toBuffer(),
            Buffer.from(new BN(i).toArray("le", 8)),
          ],
          program.programId
        );

        const newMint = Keypair.generate();
        const [newMetadata] = deriveMetadataPDA(newMint.publicKey);
        const [newMasterEdition] = deriveMasterEditionPDA(newMint.publicKey);
        const newTokenAccount = getAssociatedTokenAddressSync(
          newMint.publicKey,
          accounts.user2.publicKey
        );

        await program.methods
          .mintCoupon(new BN(i + 1))
          .accounts({
            coupon: newCouponPDA,
            nftMint: newMint.publicKey,
            tokenAccount: newTokenAccount,
            metadata: newMetadata,
            masterEdition: newMasterEdition,
            promotion: promotionPDA,
            merchant: accounts.merchant1PDA,
            marketplace: accounts.marketplacePDA,
            recipient: accounts.user2.publicKey,
            payer: accounts.user2.publicKey,
            authority: accounts.merchant1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([accounts.user2, newMint, accounts.merchant1])
          .rpc();
      }

      const promotion = await program.account.promotion.fetch(promotionPDA);
      assert.equal(promotion.currentSupply, 5);
    });

    it("Fails when supply is exhausted", async () => {
      const [limitedPromotionPDA] = derivePDA(
        [
          Buffer.from("promotion"),
          accounts.merchant1PDA.toBuffer(),
          Buffer.from(new BN(1).toArray("le", 8)),
        ],
        program.programId
      );

      await program.methods
        .createPromotion(50, 1, getExpiryTimestamp(30), "test", "Limited supply test", new BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          promotion: limitedPromotionPDA,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();

      const [firstCouponPDA] = derivePDA(
        [Buffer.from("coupon"), limitedPromotionPDA.toBuffer(), Buffer.from(new BN(0).toArray("le", 8))],
        program.programId
      );

      const firstMint = Keypair.generate();
      const [firstMetadata] = deriveMetadataPDA(firstMint.publicKey);
      const [firstMasterEdition] = deriveMasterEditionPDA(firstMint.publicKey);
      const firstTokenAccount = getAssociatedTokenAddressSync(firstMint.publicKey, accounts.user1.publicKey);

      await program.methods
        .mintCoupon(new BN(100))
        .accounts({
          coupon: firstCouponPDA,
          nftMint: firstMint.publicKey,
          tokenAccount: firstTokenAccount,
          metadata: firstMetadata,
          masterEdition: firstMasterEdition,
          promotion: limitedPromotionPDA,
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, firstMint, accounts.merchant1])
        .rpc();

      const [secondCouponPDA] = derivePDA(
        [Buffer.from("coupon"), limitedPromotionPDA.toBuffer(), Buffer.from(new BN(1).toArray("le", 8))],
        program.programId
      );

      const secondMint = Keypair.generate();
      const [secondMetadata] = deriveMetadataPDA(secondMint.publicKey);
      const [secondMasterEdition] = deriveMasterEditionPDA(secondMint.publicKey);
      const secondTokenAccount = getAssociatedTokenAddressSync(secondMint.publicKey, accounts.user1.publicKey);

      try {
        await program.methods
          .mintCoupon(new BN(101))
          .accounts({
            coupon: secondCouponPDA,
            nftMint: secondMint.publicKey,
            tokenAccount: secondTokenAccount,
            metadata: secondMetadata,
            masterEdition: secondMasterEdition,
            promotion: limitedPromotionPDA,
            merchant: accounts.merchant1PDA,
            marketplace: accounts.marketplacePDA,
            recipient: accounts.user1.publicKey,
            payer: accounts.user1.publicKey,
            authority: accounts.merchant1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([accounts.user1, secondMint, accounts.merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.include("SupplyExhausted");
      }
    });

    it("Fails when promotion is expired", async () => {
      const [expiredPromotionPDA] = derivePDA(
        [Buffer.from("promotion"), accounts.merchant1PDA.toBuffer(), Buffer.from(new BN(2).toArray("le", 8))],
        program.programId
      );

      const shortExpiry = new BN(Math.floor(Date.now() / 1000) + 1);

      await program.methods
        .createPromotion(50, 10, shortExpiry, "test", "Expiry test", new BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          promotion: expiredPromotionPDA,
          merchant: accounts.merchant1PDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 2000));

      const [expiredCouponPDA] = derivePDA(
        [Buffer.from("coupon"), expiredPromotionPDA.toBuffer(), Buffer.from(new BN(0).toArray("le", 8))],
        program.programId
      );

      const expiredMint = Keypair.generate();
      const [expiredMetadata] = deriveMetadataPDA(expiredMint.publicKey);
      const [expiredMasterEdition] = deriveMasterEditionPDA(expiredMint.publicKey);
      const expiredTokenAccount = getAssociatedTokenAddressSync(expiredMint.publicKey, accounts.user1.publicKey);

      try {
        await program.methods
          .mintCoupon(new BN(200))
          .accounts({
            coupon: expiredCouponPDA,
            nftMint: expiredMint.publicKey,
            tokenAccount: expiredTokenAccount,
            metadata: expiredMetadata,
            masterEdition: expiredMasterEdition,
            promotion: expiredPromotionPDA,
            merchant: accounts.merchant1PDA,
            marketplace: accounts.marketplacePDA,
            recipient: accounts.user1.publicKey,
            payer: accounts.user1.publicKey,
            authority: accounts.merchant1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([accounts.user1, expiredMint, accounts.merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.include("PromotionExpired");
      }
    });
  });

  describe("Coupon Transfer", () => {
    it("Transfers coupon to another user", async () => {
      const couponBefore = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponBefore.owner.toString(), accounts.user1.publicKey.toString());

      await program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPDA,
          newOwner: accounts.user2.publicKey,
          fromAuthority: accounts.user1.publicKey,
        })
        .signers([accounts.user1])
        .rpc();

      const couponAfter = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponAfter.owner.toString(), accounts.user2.publicKey.toString());
    });

    it("Fails when non-owner tries to transfer", async () => {
      try {
        await program.methods
          .transferCoupon()
          .accounts({
            coupon: couponPDA,
            newOwner: accounts.merchant1.publicKey,
            fromAuthority: accounts.user1.publicKey,
          })
          .signers([accounts.user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.include("NotCouponOwner");
      }
    });

    it("Transfers back to original owner", async () => {
      await program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPDA,
          newOwner: accounts.user1.publicKey,
          fromAuthority: accounts.user2.publicKey,
        })
        .signers([accounts.user2])
        .rpc();

      const coupon = await program.account.coupon.fetch(couponPDA);
      assert.equal(coupon.owner.toString(), accounts.user1.publicKey.toString());
    });
  });

  describe("Coupon Redemption", () => {
    it("Redeems coupon successfully", async () => {
      const couponBefore = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponBefore.isRedeemed, false);

      const merchantBefore = await program.account.merchant.fetch(accounts.merchant1PDA);
      const redeemedCountBefore = merchantBefore.totalCouponsRedeemed.toNumber();

      await program.methods
        .redeemCoupon()
        .accounts({
          coupon: couponPDA,
          nftMint: couponMint.publicKey,
          tokenAccount: tokenAccount,
          merchant: accounts.merchant1PDA,
          user: accounts.user1.publicKey,
          merchantAuthority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([accounts.user1, accounts.merchant1])
        .rpc();

      const couponAfter = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponAfter.isRedeemed, true);
      assert.isAbove(couponAfter.redeemedAt.toNumber(), 0);

      const merchantAfter = await program.account.merchant.fetch(accounts.merchant1PDA);
      assert.equal(merchantAfter.totalCouponsRedeemed.toNumber(), redeemedCountBefore + 1);
    });

    it("Fails to redeem already redeemed coupon", async () => {
      try {
        await program.methods
          .redeemCoupon()
          .accounts({
            coupon: couponPDA,
            nftMint: couponMint.publicKey,
            tokenAccount: tokenAccount,
            merchant: accounts.merchant1PDA,
            user: accounts.user1.publicKey,
            merchantAuthority: accounts.merchant1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([accounts.user1, accounts.merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).to.include("CouponAlreadyRedeemed");
      }
    });
  });
});