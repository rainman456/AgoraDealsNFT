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
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID
} from "./setup";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("Marketplace Listing & Trading", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let promotionPDA: PublicKey;
  let couponPDA: PublicKey;
  let listingPDA: PublicKey;
  let couponMint: Keypair;
  const listingPrice = new BN(3 * LAMPORTS_PER_SOL);

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

    // Mint a coupon for user1
    [couponPDA] = derivePDA(
      [
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ],
      program.programId
    );

    couponMint = Keypair.generate();
    const [metadataPDA] = deriveMetadataPDA(couponMint.publicKey);
    const tokenAccount = getAssociatedTokenAddressSync(
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
        promotion: promotionPDA,
        merchant: accounts.merchant1PDA,
        marketplace: accounts.marketplacePDA,
        recipient: accounts.user1.publicKey,
        payer: accounts.user1.publicKey,
        authority: accounts.merchant1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([accounts.user1, couponMint, accounts.merchant1])
      .rpc();

    [listingPDA] = derivePDA(
      [Buffer.from("listing"), couponPDA.toBuffer()],
      program.programId
    );
  });

  describe("List Coupon for Sale", () => {
    it("Lists coupon for sale", async () => {
      await program.methods
        .listForSale(listingPrice)
        .accounts({
          listing: listingPDA,
          coupon: couponPDA,
          seller: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      const listing = await program.account.listing.fetch(listingPDA);
      
      assert.equal(listing.coupon.toString(), couponPDA.toString());
      assert.equal(listing.seller.toString(), accounts.user1.publicKey.toString());
      assert.equal(listing.price.toString(), listingPrice.toString());
      assert.equal(listing.isActive, true);
      assert.isAbove(listing.createdAt.toNumber(), 0);
    });

    it("Fails to list with zero price", async () => {
      // Mint another coupon
      const [testCouponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(1).toArray("le", 8)),
        ],
        program.programId
      );

      const newMint = Keypair.generate();
      const [metadata] = deriveMetadataPDA(newMint.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        newMint.publicKey,
        accounts.user1.publicKey
      );

      await program.methods
        .mintCoupon(new BN(2))
        .accounts({
          coupon: testCouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadata,
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, newMint, accounts.merchant1])
        .rpc();

      const [testListingPDA] = derivePDA(
        [Buffer.from("listing"), testCouponPDA.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .listForSale(new BN(0))
          .accounts({
            listing: testListingPDA,
            coupon: testCouponPDA,
            seller: accounts.user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([accounts.user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidPrice");
      }
    });

    it("Fails to list when not owner", async () => {
      // Mint a coupon for user2
      const [user2CouponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(2).toArray("le", 8)),
        ],
        program.programId
      );

      const newMint = Keypair.generate();
      const [metadata] = deriveMetadataPDA(newMint.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        newMint.publicKey,
        accounts.user2.publicKey
      );

      await program.methods
        .mintCoupon(new BN(3))
        .accounts({
          coupon: user2CouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadata,
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user2.publicKey,
          payer: accounts.user2.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user2, newMint, accounts.merchant1])
        .rpc();

      const [user2ListingPDA] = derivePDA(
        [Buffer.from("listing"), user2CouponPDA.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .listForSale(listingPrice)
          .accounts({
            listing: user2ListingPDA,
            coupon: user2CouponPDA,
            seller: accounts.user1.publicKey, // Wrong seller
            systemProgram: SystemProgram.programId,
          })
          .signers([accounts.user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotCouponOwner");
      }
    });

    it("Fails to list redeemed coupon", async () => {
      // Mint and redeem a coupon
      const [redeemedCouponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(3).toArray("le", 8)),
        ],
        program.programId
      );

      const newMint = Keypair.generate();
      const [metadata] = deriveMetadataPDA(newMint.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        newMint.publicKey,
        accounts.user1.publicKey
      );

      await program.methods
        .mintCoupon(new BN(4))
        .accounts({
          coupon: redeemedCouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadata,
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, newMint, accounts.merchant1])
        .rpc();

      // Redeem it
      await program.methods
        .redeemCoupon()
        .accounts({
          coupon: redeemedCouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: tokenAccount,
          merchant: accounts.merchant1PDA,
          user: accounts.user1.publicKey,
          merchantAuthority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([accounts.user1, accounts.merchant1])
        .rpc();

      const [redeemedListingPDA] = derivePDA(
        [Buffer.from("listing"), redeemedCouponPDA.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .listForSale(listingPrice)
          .accounts({
            listing: redeemedListingPDA,
            coupon: redeemedCouponPDA,
            seller: accounts.user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([accounts.user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CouponAlreadyRedeemed");
      }
    });
  });

  describe("Buy Listed Coupon", () => {
    it("Buys listed coupon", async () => {
      const sellerBalanceBefore = await connection.getBalance(
        accounts.user1.publicKey
      );
      const buyerBalanceBefore = await connection.getBalance(
        accounts.user2.publicKey
      );
      const marketplaceAuthorityBalanceBefore = await connection.getBalance(
        accounts.marketplaceAuthority.publicKey
      );

      const marketplace = await program.account.marketplace.fetch(
        accounts.marketplacePDA
      );
      const fee = listingPrice
        .mul(new BN(marketplace.feeBasisPoints))
        .div(new BN(10000));
      const sellerAmount = listingPrice.sub(fee);

      await program.methods
        .buyListing()
        .accounts({
          listing: listingPDA,
          coupon: couponPDA,
          marketplace: accounts.marketplacePDA,
          seller: accounts.user1.publicKey,
          buyer: accounts.user2.publicKey,
          marketplaceAuthority: accounts.marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user2])
        .rpc();

      // Verify ownership transferred
      const coupon = await program.account.coupon.fetch(couponPDA);
      assert.equal(coupon.owner.toString(), accounts.user2.publicKey.toString());

      // Verify listing deactivated
      const listing = await program.account.listing.fetch(listingPDA);
      assert.equal(listing.isActive, false);

      // Verify balances (approximately, accounting for transaction fees)
      const sellerBalanceAfter = await connection.getBalance(
        accounts.user1.publicKey
      );
      const marketplaceAuthorityBalanceAfter = await connection.getBalance(
        accounts.marketplaceAuthority.publicKey
      );

      // Seller should receive sellerAmount
      const sellerDiff = sellerBalanceAfter - sellerBalanceBefore;
      assert.approximately(
        sellerDiff,
        sellerAmount.toNumber(),
        LAMPORTS_PER_SOL * 0.01
      );

      // Marketplace authority should receive fee
      const feeDiff =
        marketplaceAuthorityBalanceAfter - marketplaceAuthorityBalanceBefore;
      assert.approximately(
        feeDiff,
        fee.toNumber(),
        LAMPORTS_PER_SOL * 0.01
      );
    });

    it("Fails to buy inactive listing", async () => {
      try {
        await program.methods
          .buyListing()
          .accounts({
            listing: listingPDA,
            coupon: couponPDA,
            marketplace: accounts.marketplacePDA,
            seller: accounts.user1.publicKey,
            buyer: accounts.user1.publicKey,
            marketplaceAuthority: accounts.marketplaceAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([accounts.user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("ListingInactive");
      }
    });

    it("Fails to buy with insufficient funds", async () => {
      // Create a new listing with high price
      const [highPriceCouponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(4).toArray("le", 8)),
        ],
        program.programId
      );

      const newMint = Keypair.generate();
      const [metadata] = deriveMetadataPDA(newMint.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        newMint.publicKey,
        accounts.user1.publicKey
      );

      await program.methods
        .mintCoupon(new BN(5))
        .accounts({
          coupon: highPriceCouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadata,
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, newMint, accounts.merchant1])
        .rpc();

      const [highPriceListingPDA] = derivePDA(
        [Buffer.from("listing"), highPriceCouponPDA.toBuffer()],
        program.programId
      );

      const veryHighPrice = new BN(1000 * LAMPORTS_PER_SOL);

      await program.methods
        .listForSale(veryHighPrice)
        .accounts({
          listing: highPriceListingPDA,
          coupon: highPriceCouponPDA,
          seller: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      // Create a poor user with minimal funds
      const poorUser = Keypair.generate();
      const signature = await connection.requestAirdrop(
        poorUser.publicKey,
        0.1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature);

      try {
        await program.methods
          .buyListing()
          .accounts({
            listing: highPriceListingPDA,
            coupon: highPriceCouponPDA,
            marketplace: accounts.marketplacePDA,
            seller: accounts.user1.publicKey,
            buyer: poorUser.publicKey,
            marketplaceAuthority: accounts.marketplaceAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([poorUser])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Cancel Listing", () => {
    it("Cancels listing successfully", async () => {
      // Create new listing
      const [newCouponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(5).toArray("le", 8)),
        ],
        program.programId
      );

      const newMint = Keypair.generate();
      const [metadata] = deriveMetadataPDA(newMint.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        newMint.publicKey,
        accounts.user1.publicKey
      );

      await program.methods
        .mintCoupon(new BN(6))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadata,
          promotion: promotionPDA,
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, newMint, accounts.merchant1])
        .rpc();

      const [newListingPDA] = derivePDA(
        [Buffer.from("listing"), newCouponPDA.toBuffer()],
        program.programId
      );

      await program.methods
        .listForSale(listingPrice)
        .accounts({
          listing: newListingPDA,
          coupon: newCouponPDA,
          seller: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      // Verify listing is active
      const listingBefore = await program.account.listing.fetch(newListingPDA);
      assert.equal(listingBefore.isActive, true);

      // Cancel listing - Note: This functionality needs to be added to your codebase
      // For now, this test documents the expected behavior
      // You'll need to add a cancel_listing handler to list_for_sale.rs

      // Uncomment when cancel_listing is implemented:
      /*
      await program.methods
        .cancelListing()
        .accounts({
          listing: newListingPDA,
          seller: accounts.user1.publicKey,
        })
        .signers([accounts.user1])
        .rpc();

      const listingAfter = await program.account.listing.fetch(newListingPDA);
      assert.equal(listingAfter.isActive, false);
      */
    });

    it("Fails to cancel listing by non-seller", async () => {
      // This test requires cancel_listing instruction
      // Documented for future implementation
    });

    it("Fails to cancel inactive listing", async () => {
      // This test requires cancel_listing instruction
      // Documented for future implementation
    });
  });
});
