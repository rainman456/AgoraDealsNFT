import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, Keypair, PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts,
  getExpiryTimestamp,
  derivePDA,
  deriveMetadataPDA,
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  airdrop
} from "./setup";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("Integration Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
  });

  describe("Complete User Journey: Register → Create Promotion → Buy → Redeem", () => {
    it("Completes full merchant and user lifecycle", async () => {
      // Step 1: Initialize marketplace
      await program.methods
        .initialize()
        .accounts({
          marketplace: accounts.marketplacePDA,
          authority: accounts.marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.marketplaceAuthority])
        .rpc();

      const marketplaceAfterInit = await program.account.marketplace.fetch(
        accounts.marketplacePDA
      );
      assert.equal(marketplaceAfterInit.totalMerchants.toNumber(), 0);
      assert.equal(marketplaceAfterInit.totalCoupons.toNumber(), 0);

      // Step 2: Merchant registers
      const newMerchant = Keypair.generate();
      await airdrop(connection, newMerchant.publicKey);

      const [newMerchantPDA] = derivePDA(
        [Buffer.from("merchant"), newMerchant.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .registerMerchant("Integration Test Store", "test", 40.7128, -74.006)
        .accounts({
          merchant: newMerchantPDA,
          marketplace: accounts.marketplacePDA,
          authority: newMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newMerchant])
        .rpc();

      const merchantAfterReg = await program.account.merchant.fetch(newMerchantPDA);
      assert.equal(merchantAfterReg.name, "Integration Test Store");
      assert.equal(merchantAfterReg.totalCouponsCreated.toNumber(), 0);

      // Step 3: Merchant creates promotion
      const [newPromotionPDA] = derivePDA(
        [
          Buffer.from("promotion"),
          newMerchantPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      await program.methods
        .createPromotion(
          25,
          10,
          getExpiryTimestamp(30),
          "test",
          "Integration test promotion",
          new BN(1 * LAMPORTS_PER_SOL)
        )
        .accounts({
          promotion: newPromotionPDA,
          merchant: newMerchantPDA,
          authority: newMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newMerchant])
        .rpc();

      const promotionAfterCreate = await program.account.promotion.fetch(
        newPromotionPDA
      );
      assert.equal(promotionAfterCreate.currentSupply, 0);
      assert.equal(promotionAfterCreate.maxSupply, 10);

      // Step 4: User buys coupon
      const newUser = Keypair.generate();
      await airdrop(connection, newUser.publicKey);

      const [newCouponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          newPromotionPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      const newMint = Keypair.generate();
      const [newMetadata] = deriveMetadataPDA(newMint.publicKey);
      const newTokenAccount = getAssociatedTokenAddressSync(
        newMint.publicKey,
        newUser.publicKey
      );

      await program.methods
        .mintCoupon(new BN(1000))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: newTokenAccount,
          metadata: newMetadata,
          promotion: newPromotionPDA,
          merchant: newMerchantPDA,
          marketplace: accounts.marketplacePDA,
          recipient: newUser.publicKey,
          payer: newUser.publicKey,
          authority: newMerchant.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([newUser, newMint, newMerchant])
        .rpc();

      const couponAfterMint = await program.account.coupon.fetch(newCouponPDA);
      assert.equal(couponAfterMint.owner.toString(), newUser.publicKey.toString());
      assert.equal(couponAfterMint.isRedeemed, false);

      // Step 5: User redeems coupon
      await program.methods
        .redeemCoupon()
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          tokenAccount: newTokenAccount,
          merchant: newMerchantPDA,
          user: newUser.publicKey,
          merchantAuthority: newMerchant.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([newUser, newMerchant])
        .rpc();

      // Step 6: Verify final state
      const couponFinal = await program.account.coupon.fetch(newCouponPDA);
      assert.equal(couponFinal.isRedeemed, true);

      const merchantFinal = await program.account.merchant.fetch(newMerchantPDA);
      assert.equal(merchantFinal.totalCouponsCreated.toNumber(), 1);
      assert.equal(merchantFinal.totalCouponsRedeemed.toNumber(), 1);

      const promotionFinal = await program.account.promotion.fetch(newPromotionPDA);
      assert.equal(promotionFinal.currentSupply, 1);

      const marketplaceFinal = await program.account.marketplace.fetch(
        accounts.marketplacePDA
      );
      assert.equal(marketplaceFinal.totalCoupons.toNumber(), 1);
      assert.equal(marketplaceFinal.totalMerchants.toNumber(), 1);
    });
  });

  describe("Complete Marketplace Flow: List → Buy → Verify", () => {
    it("Completes full secondary market transaction", async () => {
      const seller = Keypair.generate();
      const buyer = Keypair.generate();
      await Promise.all([
        airdrop(connection, seller.publicKey, 15),
        airdrop(connection, buyer.publicKey, 15),
      ]);

      const testMerchant = Keypair.generate();
      await airdrop(connection, testMerchant.publicKey);

      const [testMerchantPDA] = derivePDA(
        [Buffer.from("merchant"), testMerchant.publicKey.toBuffer()],
        program.programId
      );

      // Register merchant
      await program.methods
        .registerMerchant("Marketplace Test", "test", null, null)
        .accounts({
          merchant: testMerchantPDA,
          marketplace: accounts.marketplacePDA,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();

      // Create promotion
      const [testPromotionPDA] = derivePDA(
        [
          Buffer.from("promotion"),
          testMerchantPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      await program.methods
        .createPromotion(
          50,
          5,
          getExpiryTimestamp(30),
          "test",
          "Marketplace flow test",
          new BN(2 * LAMPORTS_PER_SOL)
        )
        .accounts({
          promotion: testPromotionPDA,
          merchant: testMerchantPDA,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();

      // Mint coupon for seller
      const [testCouponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          testPromotionPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      const testMint = Keypair.generate();
      const [testMetadata] = deriveMetadataPDA(testMint.publicKey);
      const testTokenAccount = getAssociatedTokenAddressSync(
        testMint.publicKey,
        seller.publicKey
      );

      await program.methods
        .mintCoupon(new BN(2000))
        .accounts({
          coupon: testCouponPDA,
          nftMint: testMint.publicKey,
          tokenAccount: testTokenAccount,
          metadata: testMetadata,
          promotion: testPromotionPDA,
          merchant: testMerchantPDA,
          marketplace: accounts.marketplacePDA,
          recipient: seller.publicKey,
          payer: seller.publicKey,
          authority: testMerchant.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([seller, testMint, testMerchant])
        .rpc();

      // Verify seller owns coupon
      let coupon = await program.account.coupon.fetch(testCouponPDA);
      assert.equal(coupon.owner.toString(), seller.publicKey.toString());

      // List coupon
      const [testListingPDA] = derivePDA(
        [Buffer.from("listing"), testCouponPDA.toBuffer()],
        program.programId
      );

      const salePrice = new BN(1.5 * LAMPORTS_PER_SOL);

      await program.methods
        .listForSale(salePrice)
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          seller: seller.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      const listingAfterCreate = await program.account.listing.fetch(
        testListingPDA
      );
      assert.equal(listingAfterCreate.isActive, true);

      // Buy coupon
      const sellerBalanceBefore = await connection.getBalance(seller.publicKey);
      const buyerBalanceBefore = await connection.getBalance(buyer.publicKey);

      await program.methods
        .buyListing()
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          marketplace: accounts.marketplacePDA,
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          marketplaceAuthority: accounts.marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Verify ownership transferred
      coupon = await program.account.coupon.fetch(testCouponPDA);
      assert.equal(coupon.owner.toString(), buyer.publicKey.toString());

      // Verify listing deactivated
      const listingFinal = await program.account.listing.fetch(testListingPDA);
      assert.equal(listingFinal.isActive, false);

      // Verify payments
      const sellerBalanceAfter = await connection.getBalance(seller.publicKey);
      const marketplace = await program.account.marketplace.fetch(
        accounts.marketplacePDA
      );
      const fee = salePrice
        .mul(new BN(marketplace.feeBasisPoints))
        .div(new BN(10000));
      const sellerAmount = salePrice.sub(fee);

      assert.approximately(
        sellerBalanceAfter - sellerBalanceBefore,
        sellerAmount.toNumber(),
        LAMPORTS_PER_SOL * 0.01
      );
    });
  });

  describe("Multi-User Interaction Flow", () => {
    it("Handles multiple users rating and commenting", async () => {
      const merchant = Keypair.generate();
      await airdrop(connection, merchant.publicKey);

      const [merchantPDA] = derivePDA(
        [Buffer.from("merchant"), merchant.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .registerMerchant("Social Test", "test", null, null)
        .accounts({
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          authority: merchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant])
        .rpc();

      const [promotionPDA] = derivePDA(
        [
          Buffer.from("promotion"),
          merchantPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      await program.methods
        .createPromotion(
          40,
          20,
          getExpiryTimestamp(30),
          "social",
          "Social interaction test",
          new BN(3 * LAMPORTS_PER_SOL)
        )
        .accounts({
          promotion: promotionPDA,
          merchant: merchantPDA,
          authority: merchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant])
        .rpc();

      // Create 3 test users
      const users = await Promise.all(
        [0, 1, 2].map(async () => {
          const user = Keypair.generate();
          await airdrop(connection, user.publicKey);
          return user;
        })
      );

      // Each user rates the promotion
      const ratings = [5, 4, 5];
      for (let i = 0; i < users.length; i++) {
        const [ratingPDA] = derivePDA(
          [
            Buffer.from("rating"),
            users[i].publicKey.toBuffer(),
            promotionPDA.toBuffer(),
          ],
          program.programId
        );

        await program.methods
          .ratePromotion(ratings[i])
          .accounts({
            rating: ratingPDA,
            promotion: promotionPDA,
            user: users[i].publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([users[i]])
          .rpc();

        const rating = await program.account.rating.fetch(ratingPDA);
        assert.equal(rating.stars, ratings[i]);
      }

      // Each user comments
      for (let i = 0; i < users.length; i++) {
        const [commentPDA] = derivePDA(
          [
            Buffer.from("comment"),
            users[i].publicKey.toBuffer(),
            promotionPDA.toBuffer(),
          ],
          program.programId
        );

        await program.methods
          .addComment(`Comment from user ${i}`, null)
          .accounts({
            comment: commentPDA,
            promotion: promotionPDA,
            user: users[i].publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([users[i]])
          .rpc();

        const comment = await program.account.comment.fetch(commentPDA);
        assert.equal(comment.content, `Comment from user ${i}`);
      }

      // Users like each other's comments
      for (let i = 0; i < users.length; i++) {
        const [targetCommentPDA] = derivePDA(
          [
            Buffer.from("comment"),
            users[(i + 1) % users.length].publicKey.toBuffer(),
            promotionPDA.toBuffer(),
          ],
          program.programId
        );

        const [likePDA] = derivePDA(
          [
            Buffer.from("comment_like"),
            users[i].publicKey.toBuffer(),
            targetCommentPDA.toBuffer(),
          ],
          program.programId
        );

        await program.methods
          .likeComment()
          .accounts({
            commentLike: likePDA,
            comment: targetCommentPDA,
            user: users[i].publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([users[i]])
          .rpc();
      }

      // Verify all comments got likes
      for (let i = 0; i < users.length; i++) {
        const [commentPDA] = derivePDA(
          [
            Buffer.from("comment"),
            users[i].publicKey.toBuffer(),
            promotionPDA.toBuffer(),
          ],
          program.programId
        );

        const comment = await program.account.comment.fetch(commentPDA);
        assert.isAtLeast(comment.likes, 1);
      }
    });
  });

  describe("Badge Earning Flow", () => {
    it("User earns badges through platform usage", async () => {
      const dedicatedUser = Keypair.generate();
      await airdrop(connection, dedicatedUser.publicKey, 20);

      const merchant = Keypair.generate();
      await airdrop(connection, merchant.publicKey);

      const [merchantPDA] = derivePDA(
        [Buffer.from("merchant"), merchant.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .registerMerchant("Badge Test Merchant", "test", null, null)
        .accounts({
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          authority: merchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant])
        .rpc();

      const [promotionPDA] = derivePDA(
        [
          Buffer.from("promotion"),
          merchantPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      await program.methods
        .createPromotion(
          35,
          100,
          getExpiryTimestamp(30),
          "badge",
          "Badge earning promotion",
          new BN(1 * LAMPORTS_PER_SOL)
        )
        .accounts({
          promotion: promotionPDA,
          merchant: merchantPDA,
          authority: merchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant])
        .rpc();

      // User makes first purchase
      const [couponPDA] = derivePDA(
        [
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(0).toArray("le", 8)),
        ],
        program.programId
      );

      const mintKeypair = Keypair.generate();
      const [metadataPDA] = deriveMetadataPDA(mintKeypair.publicKey);
      const tokenAccount = getAssociatedTokenAddressSync(
        mintKeypair.publicKey,
        dedicatedUser.publicKey
      );

      await program.methods
        .mintCoupon(new BN(5000))
        .accounts({
          coupon: couponPDA,
          nftMint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          recipient: dedicatedUser.publicKey,
          payer: dedicatedUser.publicKey,
          authority: merchant.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([dedicatedUser, mintKeypair, merchant])
        .rpc();

      // User earns FirstPurchase badge
      const [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          dedicatedUser.publicKey.toBuffer(),
          Buffer.from([0]), // FirstPurchase
        ],
        program.programId
      );

      const badgeMint = Keypair.generate();
      const [badgeMetadata] = deriveMetadataPDA(badgeMint.publicKey);

      await program.methods
        .mintBadge({ firstPurchase: {} })
        .accounts({
          badgeNft: badgePDA,
          mint: badgeMint.publicKey,
          metadata: badgeMetadata,
          user: dedicatedUser.publicKey,
          authority: accounts.marketplaceAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([dedicatedUser, badgeMint, accounts.marketplaceAuthority])
        .rpc();

      const badge = await program.account.badgeNft.fetch(badgePDA);
      assert.equal(badge.user.toString(), dedicatedUser.publicKey.toString());
      assert.deepEqual(badge.badgeType, { firstPurchase: {} });
    });
  });

  describe("External Deal Integration", () => {
    it("Integrates external deals with platform", async () => {
      const oracle = Keypair.generate();
      await airdrop(connection, oracle.publicKey);

      const deals = [
        {
          id: "integration_deal_1",
          title: "Flight Deal NYC-LAX",
          originalPrice: 600,
          discountedPrice: 299,
        },
        {
          id: "integration_deal_2",
          title: "Hotel Deal Paris",
          originalPrice: 300,
          discountedPrice: 199,
        },
        {
          id: "integration_deal_3",
          title: "Rental Car Deal",
          originalPrice: 150,
          discountedPrice: 99,
        },
      ];

      for (const deal of deals) {
        const [dealPDA] = derivePDA(
          [Buffer.from("external_deal"), Buffer.from(deal.id)],
          program.programId
        );

        await program.methods
          .updateExternalDeal(
            deal.id,
            deal.title,
            "Integration test deal",
            new BN(deal.originalPrice * LAMPORTS_PER_SOL),
            new BN(deal.discountedPrice * LAMPORTS_PER_SOL),
            "travel",
            "https://example.com/img.jpg",
            "https://example.com/deal",
            getExpiryTimestamp(14)
          )
          .accounts({
            externalDeal: dealPDA,
            payer: oracle.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([oracle])
          .rpc();

        const externalDeal = await program.account.externalDeal.fetch(dealPDA);
        assert.equal(externalDeal.title, deal.title);
        assert.equal(
          externalDeal.originalPrice.toNumber(),
          deal.originalPrice * LAMPORTS_PER_SOL
        );
      }

      // Verify all deals exist and are accessible
      const allDeals = await Promise.all(
        deals.map(async (deal) => {
          const [dealPDA] = derivePDA(
            [Buffer.from("external_deal"), Buffer.from(deal.id)],
            program.programId
          );
          return program.account.externalDeal.fetch(dealPDA);
        })
      );

      assert.equal(allDeals.length, 3);
      allDeals.forEach((deal, index) => {
        assert.equal(deal.title, deals[index].title);
      });
    });
  });
});
