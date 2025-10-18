/*
import * as anchor from "@coral-xyz/anchor";
import { Program, BN, web3 } from "@coral-xyz/anchor";
import { MyProgram } from "../target/types/my_program";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
} from "@solana/spl-token";
import { assert, expect } from "chai";

describe("Coupon Marketplace", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyProgram as Program<MyProgram>;
  const connection = provider.connection;

  // Test accounts
  let marketplaceAuthority: Keypair;
  let merchant1: Keypair;
  let merchant2: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let oracleAuthority: Keypair;

  // PDAs
  let marketplacePDA: PublicKey;
  let marketplaceBump: number;
  let merchant1PDA: PublicKey;
  let merchant1Bump: number;
  let merchant2PDA: PublicKey;
  let oracleConfigPDA: PublicKey;

  // Test data
  const merchantName = "Test Restaurant";
  const merchantCategory = "restaurant";
  const merchantLatitude = 40.7128;
  const merchantLongitude = -74.006;

  const promotionCategory = "food";
  const promotionDescription = "50% off all pizzas";
  const discountPercentage = 50;
  const maxSupply = 100;
  const price = new BN(5 * LAMPORTS_PER_SOL);
  const radiusMeters = 5000;

  // Helper function: Airdrop SOL
  async function airdrop(publicKey: PublicKey, amount: number = 10) {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
  }

  // Helper function: Get current timestamp
  function getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  // Helper function: Get expiry timestamp (7 days from now)
  function getExpiryTimestamp(daysFromNow: number = 7): BN {
    return new BN(getCurrentTimestamp() + daysFromNow * 24 * 60 * 60);
  }

  // Helper function: Derive PDA
  function derivePDA(seeds: (Buffer | Uint8Array)[]): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  before(async () => {
    // Initialize test accounts
    marketplaceAuthority = Keypair.generate();
    merchant1 = Keypair.generate();
    merchant2 = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();
    oracleAuthority = Keypair.generate();

    // Airdrop SOL to all accounts
    await Promise.all([
      airdrop(marketplaceAuthority.publicKey),
      airdrop(merchant1.publicKey),
      airdrop(merchant2.publicKey),
      airdrop(user1.publicKey),
      airdrop(user2.publicKey),
      airdrop(oracleAuthority.publicKey),
    ]);

    // Derive PDAs
    [marketplacePDA, marketplaceBump] = derivePDA([Buffer.from("marketplace")]);
    [merchant1PDA, merchant1Bump] = derivePDA([
      Buffer.from("merchant"),
      merchant1.publicKey.toBuffer(),
    ]);
    [merchant2PDA] = derivePDA([
      Buffer.from("merchant"),
      merchant2.publicKey.toBuffer(),
    ]);
    [oracleConfigPDA] = derivePDA([Buffer.from("oracle_config")]);
  });

  describe("Marketplace Initialization", () => {
    it("Initializes the marketplace", async () => {
      await program.methods
        .initialize()
        .accounts({
          marketplace: marketplacePDA,
          authority: marketplaceAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([marketplaceAuthority])
        .rpc();

      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      
      assert.equal(
        marketplace.authority.toString(),
        marketplaceAuthority.publicKey.toString()
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
            marketplace: marketplacePDA,
            authority: marketplaceAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([marketplaceAuthority])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("Merchant Registration", () => {
    it("Registers a merchant with location", async () => {
      await program.methods
        .registerMerchant(
          merchantName,
          merchantCategory,
          merchantLatitude,
          merchantLongitude
        )
        .accounts({
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          authority: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      const merchant = await program.account.merchant.fetch(merchant1PDA);
      
      assert.equal(merchant.name, merchantName);
      assert.equal(merchant.category, merchantCategory);
      assert.equal(merchant.authority.toString(), merchant1.publicKey.toString());
      assert.equal(merchant.hasPhysicalLocation, true);
      assert.equal(merchant.totalCouponsCreated.toNumber(), 0);
      assert.equal(merchant.totalCouponsRedeemed.toNumber(), 0);
      assert.equal(merchant.isActive, true);

      // Check location data
      const lat = merchant.location.latitude / 1_000_000;
      const lon = merchant.location.longitude / 1_000_000;
      assert.approximately(lat, merchantLatitude, 0.000001);
      assert.approximately(lon, merchantLongitude, 0.000001);

      // Check marketplace counter updated
      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      assert.equal(marketplace.totalMerchants.toNumber(), 1);
    });

    it("Registers a merchant without location (online only)", async () => {
      await program.methods
        .registerMerchant(
          "Online Store",
          "ecommerce",
          null,
          null
        )
        .accounts({
          merchant: merchant2PDA,
          marketplace: marketplacePDA,
          authority: merchant2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant2])
        .rpc();

      const merchant = await program.account.merchant.fetch(merchant2PDA);
      assert.equal(merchant.hasPhysicalLocation, false);
    });

    it("Fails with name too long", async () => {
      const longName = "A".repeat(51);
      const testMerchant = Keypair.generate();
      await airdrop(testMerchant.publicKey);

      const [merchantPDA] = derivePDA([
        Buffer.from("merchant"),
        testMerchant.publicKey.toBuffer(),
      ]);

      try {
        await program.methods
          .registerMerchant(longName, "test", null, null)
          .accounts({
            merchant: merchantPDA,
            marketplace: marketplacePDA,
            authority: testMerchant.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMerchant])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NameTooLong");
      }
    });

    it("Fails with invalid coordinates", async () => {
      const testMerchant = Keypair.generate();
      await airdrop(testMerchant.publicKey);

      const [merchantPDA] = derivePDA([
        Buffer.from("merchant"),
        testMerchant.publicKey.toBuffer(),
      ]);

      try {
        await program.methods
          .registerMerchant("Test", "test", 91.0, 0.0) // Invalid latitude
          .accounts({
            merchant: merchantPDA,
            marketplace: marketplacePDA,
            authority: testMerchant.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testMerchant])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidCoordinates");
      }
    });
  });

  describe("Promotion Creation", () => {
    let promotionPDA: PublicKey;
    let geoCellPDA: PublicKey;
    const expiryTimestamp = getExpiryTimestamp(30);

    it("Creates a location-based promotion", async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      // Calculate geo cell ID
      const PRECISION = 1_000_000;
      const GRID_SIZE = 100_000;
      const latInt = Math.floor(merchantLatitude * PRECISION);
      const lonInt = Math.floor(merchantLongitude * PRECISION);
      const cellLat = Math.floor(latInt / GRID_SIZE);
      const cellLon = Math.floor(lonInt / GRID_SIZE);
      const geoCellId = new BN(cellLat).shln(32).or(new BN(cellLon));

      [geoCellPDA] = derivePDA([
        Buffer.from("geocell"),
        Buffer.from(geoCellId.toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          discountPercentage,
          maxSupply,
          expiryTimestamp,
          promotionCategory,
          promotionDescription,
          price,
          merchantLatitude,
          merchantLongitude,
          radiusMeters
        )
        .accounts({
          promotion: promotionPDA,
          merchant: merchant1PDA,
          geoCell: geoCellPDA,
          authority: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      const promotion = await program.account.promotion.fetch(promotionPDA);
      
      assert.equal(promotion.merchant.toString(), merchant1PDA.toString());
      assert.equal(promotion.discountPercentage, discountPercentage);
      assert.equal(promotion.maxSupply, maxSupply);
      assert.equal(promotion.currentSupply, 0);
      assert.equal(promotion.category, promotionCategory);
      assert.equal(promotion.description, promotionDescription);
      assert.equal(promotion.price.toString(), price.toString());
      assert.equal(promotion.isActive, true);
      assert.equal(promotion.isLocationBased, true);
      assert.equal(promotion.radiusMeters, radiusMeters);
    });

    it("Fails with invalid discount percentage", async () => {
      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(1).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .createCouponPromotion(
            101, // Invalid: > 100
            maxSupply,
            expiryTimestamp,
            promotionCategory,
            promotionDescription,
            price,
            null,
            null,
            0
          )
          .accounts({
            promotion: testPromotionPDA,
            merchant: merchant1PDA,
            geoCell: null,
            authority: merchant1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidDiscount");
      }
    });

    it("Fails with expired timestamp", async () => {
      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(2).toArray("le", 8)),
      ]);

      const pastTimestamp = new BN(getCurrentTimestamp() - 3600); // 1 hour ago

      try {
        await program.methods
          .createCouponPromotion(
            50,
            maxSupply,
            pastTimestamp,
            promotionCategory,
            promotionDescription,
            price,
            null,
            null,
            0
          )
          .accounts({
            promotion: testPromotionPDA,
            merchant: merchant1PDA,
            geoCell: null,
            authority: merchant1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidExpiry");
      }
    });

    it("Fails when non-authority tries to create promotion", async () => {
      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(3).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .createCouponPromotion(
            50,
            maxSupply,
            expiryTimestamp,
            promotionCategory,
            promotionDescription,
            price,
            null,
            null,
            0
          )
          .accounts({
            promotion: testPromotionPDA,
            merchant: merchant1PDA,
            geoCell: null,
            authority: user1.publicKey, // Wrong authority
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotMerchantAuthority");
      }
    });
  });

  describe("Coupon Minting", () => {
    let promotionPDA: PublicKey;
    let couponPDA: PublicKey;
    let mintKeypair: Keypair;
    let metadataPDA: PublicKey;
    const couponId = new BN(1);

    before(async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Mints a coupon successfully", async () => {
      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)), // current_supply = 0
      ]);

      mintKeypair = Keypair.generate();

      // Derive metadata PDA (Metaplex standard)
      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );
      [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      await program.methods
        .mintCoupon(couponId)
        .accounts({
          coupon: couponPDA,
          nftMint: mintKeypair.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([user1, mintKeypair])
        .rpc();

      const coupon = await program.account.coupon.fetch(couponPDA);
      
      assert.equal(coupon.id.toString(), couponId.toString());
      assert.equal(coupon.promotion.toString(), promotionPDA.toString());
      assert.equal(coupon.owner.toString(), user1.publicKey.toString());
      assert.equal(coupon.merchant.toString(), merchant1PDA.toString());
      assert.equal(coupon.discountPercentage, discountPercentage);
      assert.equal(coupon.isRedeemed, false);

      // Check promotion supply updated
      const promotion = await program.account.promotion.fetch(promotionPDA);
      assert.equal(promotion.currentSupply, 1);

      // Check merchant counter updated
      const merchant = await program.account.merchant.fetch(merchant1PDA);
      assert.equal(merchant.totalCouponsCreated.toNumber(), 1);

      // Check marketplace counter updated
      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      assert.equal(marketplace.totalCoupons.toNumber(), 1);
    });

    it("Mints multiple coupons", async () => {
      for (let i = 1; i < 5; i++) {
        const [newCouponPDA] = derivePDA([
          Buffer.from("coupon"),
          promotionPDA.toBuffer(),
          Buffer.from(new BN(i).toArray("le", 8)),
        ]);

        const newMint = Keypair.generate();

        await program.methods
          .mintCoupon(new BN(i + 1))
          .accounts({
            coupon: newCouponPDA,
            nftMint: newMint.publicKey,
            promotion: promotionPDA,
            merchant: merchant1PDA,
            marketplace: marketplacePDA,
            recipient: user2.publicKey,
            payer: user2.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ),
          })
          .signers([user2, newMint])
          .rpc();
      }

      const promotion = await program.account.promotion.fetch(promotionPDA);
      assert.equal(promotion.currentSupply, 5);
    });

    it("Fails when supply is exhausted", async () => {
      // Create promotion with max_supply = 1
      const [limitedPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(1).toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          50,
          1, // max_supply = 1
          getExpiryTimestamp(30),
          "test",
          "Limited supply test",
          price,
          null,
          null,
          0
        )
        .accounts({
          promotion: limitedPromotionPDA,
          merchant: merchant1PDA,
          geoCell: null,
          authority: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      // Mint first coupon (should succeed)
      const [firstCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        limitedPromotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const firstMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(100))
        .accounts({
          coupon: firstCouponPDA,
          nftMint: firstMint.publicKey,
          promotion: limitedPromotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, firstMint])
        .rpc();

      // Try to mint second coupon (should fail)
      const [secondCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        limitedPromotionPDA.toBuffer(),
        Buffer.from(new BN(1).toArray("le", 8)),
      ]);

      const secondMint = Keypair.generate();

      try {
        await program.methods
          .mintCoupon(new BN(101))
          .accounts({
            coupon: secondCouponPDA,
            nftMint: secondMint.publicKey,
            promotion: limitedPromotionPDA,
            merchant: merchant1PDA,
            marketplace: marketplacePDA,
            recipient: user1.publicKey,
            payer: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ),
          })
          .signers([user1, secondMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("SupplyExhausted");
      }
    });
  });

  describe("Coupon Transfer", () => {
    let couponPDA: PublicKey;

    before(async () => {
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Transfers coupon to another user", async () => {
      const couponBefore = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponBefore.owner.toString(), user1.publicKey.toString());

      await program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPDA,
          newOwner: user2.publicKey,
          fromAuthority: user1.publicKey,
        })
        .signers([user1])
        .rpc();

      const couponAfter = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponAfter.owner.toString(), user2.publicKey.toString());
    });

    it("Fails when non-owner tries to transfer", async () => {
      try {
        await program.methods
          .transferCoupon()
          .accounts({
            coupon: couponPDA,
            newOwner: merchant1.publicKey,
            fromAuthority: user1.publicKey, // No longer owner
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotCouponOwner");
      }
    });

    it("Transfers back to original owner", async () => {
      await program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPDA,
          newOwner: user1.publicKey,
          fromAuthority: user2.publicKey,
        })
        .signers([user2])
        .rpc();

      const coupon = await program.account.coupon.fetch(couponPDA);
      assert.equal(coupon.owner.toString(), user1.publicKey.toString());
    });
  });

  describe("Coupon Redemption", () => {
    let couponPDA: PublicKey;

    before(async () => {
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Redeems coupon successfully", async () => {
      const couponBefore = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponBefore.isRedeemed, false);

      const merchantBefore = await program.account.merchant.fetch(merchant1PDA);
      const redeemedCountBefore = merchantBefore.totalCouponsRedeemed.toNumber();

      await program.methods
        .redeemCoupon()
        .accounts({
          coupon: couponPDA,
          merchant: merchant1PDA,
          user: user1.publicKey,
          merchantAuthority: merchant1.publicKey,
        })
        .signers([user1, merchant1])
        .rpc();

      const couponAfter = await program.account.coupon.fetch(couponPDA);
      assert.equal(couponAfter.isRedeemed, true);
      assert.isAbove(couponAfter.redeemedAt.toNumber(), 0);

      const merchantAfter = await program.account.merchant.fetch(merchant1PDA);
      assert.equal(
        merchantAfter.totalCouponsRedeemed.toNumber(),
        redeemedCountBefore + 1
      );
    });

    it("Fails to redeem already redeemed coupon", async () => {
      try {
        await program.methods
          .redeemCoupon()
          .accounts({
            coupon: couponPDA,
            merchant: merchant1PDA,
            user: user1.publicKey,
            merchantAuthority: merchant1.publicKey,
          })
          .signers([user1, merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CouponAlreadyRedeemed");
      }
    });

    it("Fails when wrong merchant tries to redeem", async () => {
      // Mint a new coupon for user2
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [newCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(5).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(200))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user2.publicKey,
          payer: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user2, newMint])
        .rpc();

      // Try to redeem with wrong merchant
      try {
        await program.methods
          .redeemCoupon()
          .accounts({
            coupon: newCouponPDA,
            merchant: merchant2PDA, // Wrong merchant
            user: user2.publicKey,
            merchantAuthority: merchant2.publicKey,
          })
          .signers([user2, merchant2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("WrongMerchant");
      }
    });
  });

  describe("Coupon Listing & Marketplace", () => {
    let couponPDA: PublicKey;
    let listingPDA: PublicKey;
    const listingPrice = new BN(3 * LAMPORTS_PER_SOL);

    before(async () => {
      // Mint a fresh coupon for user1
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [couponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(6).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(300))
        .accounts({
          coupon: couponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      [listingPDA] = derivePDA([
        Buffer.from("listing"),
        couponPDA.toBuffer(),
      ]);
    });

    it("Lists coupon for sale", async () => {
      await program.methods
        .listCouponForSale(listingPrice)
        .accounts({
          listing: listingPDA,
          coupon: couponPDA,
          seller: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const listing = await program.account.listing.fetch(listingPDA);
      
      assert.equal(listing.coupon.toString(), couponPDA.toString());
      assert.equal(listing.seller.toString(), user1.publicKey.toString());
      assert.equal(listing.price.toString(), listingPrice.toString());
      assert.equal(listing.isActive, true);
    });

    it("Fails to list with zero price", async () => {
      // Mint another coupon
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [testCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(7).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(400))
        .accounts({
          coupon: testCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      const [testListingPDA] = derivePDA([
        Buffer.from("listing"),
        testCouponPDA.toBuffer(),
      ]);

      try {
        await program.methods
          .listCouponForSale(new BN(0))
          .accounts({
            listing: testListingPDA,
            coupon: testCouponPDA,
            seller: user1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidPrice");
      }
    });

    it("Buys listed coupon", async () => {
      const sellerBalanceBefore = await connection.getBalance(user1.publicKey);
      const buyerBalanceBefore = await connection.getBalance(user2.publicKey);
      const marketplaceAuthorityBalanceBefore = await connection.getBalance(
        marketplaceAuthority.publicKey
      );

      const marketplace = await program.account.marketplace.fetch(marketplacePDA);
      const fee = listingPrice.mul(new BN(marketplace.feeBasisPoints)).div(new BN(10000));
      const sellerAmount = listingPrice.sub(fee);

      await program.methods
        .buyListedCoupon()
        .accounts({
          listing: listingPDA,
          coupon: couponPDA,
          marketplace: marketplacePDA,
          seller: user1.publicKey,
          buyer: user2.publicKey,
          marketplaceAuthority: marketplaceAuthority.publicKey,
        })
        .signers([user2])
        .rpc();

      // Verify ownership transferred
      const coupon = await program.account.coupon.fetch(couponPDA);
      assert.equal(coupon.owner.toString(), user2.publicKey.toString());

      // Verify listing deactivated
      const listing = await program.account.listing.fetch(listingPDA);
      assert.equal(listing.isActive, false);

      // Verify balances (approximately, accounting for transaction fees)
      const sellerBalanceAfter = await connection.getBalance(user1.publicKey);
      const marketplaceAuthorityBalanceAfter = await connection.getBalance(
        marketplaceAuthority.publicKey
      );

      // Seller should receive sellerAmount
      const sellerDiff = sellerBalanceAfter - sellerBalanceBefore;
      assert.approximately(sellerDiff, sellerAmount.toNumber(), LAMPORTS_PER_SOL * 0.01);

      // Marketplace authority should receive fee
      const feeDiff = marketplaceAuthorityBalanceAfter - marketplaceAuthorityBalanceBefore;
      assert.approximately(feeDiff, fee.toNumber(), LAMPORTS_PER_SOL * 0.01);
    });

    it("Fails to buy inactive listing", async () => {
      try {
        await program.methods
          .buyListedCoupon()
          .accounts({
            listing: listingPDA,
            coupon: couponPDA,
            marketplace: marketplacePDA,
            seller: user1.publicKey,
            buyer: user1.publicKey,
            marketplaceAuthority: marketplaceAuthority.publicKey,
          })
          .signers([user1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("ListingInactive");
      }
    });

    it("Cancels listing", async () => {
      // Create new listing
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [newCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(8).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(500))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      const [newListingPDA] = derivePDA([
        Buffer.from("listing"),
        newCouponPDA.toBuffer(),
      ]);

      await program.methods
        .listCouponForSale(listingPrice)
        .accounts({
          listing: newListingPDA,
          coupon: newCouponPDA,
          seller: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      // Cancel listing
      await program.methods
        .cancelListing()
        .accounts({
          listing: newListingPDA,
          seller: user1.publicKey,
        })
        .signers([user1])
        .rpc();

      const listing = await program.account.listing.fetch(newListingPDA);
      assert.equal(listing.isActive, false);
    });

    it("Fails to cancel listing by non-seller", async () => {
      const [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const [testCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(9).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(600))
        .accounts({
          coupon: testCouponPDA,
          nftMint: newMint.publicKey,
          promotion: promotionPDA,
          merchant: merchant1PDA,
          marketplace: marketplacePDA,
          recipient: user1.publicKey,
          payer: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([user1, newMint])
        .rpc();

      const [testListingPDA] = derivePDA([
        Buffer.from("listing"),
        testCouponPDA.toBuffer(),
      ]);

      await program.methods
        .listCouponForSale(listingPrice)
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          seller: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      try {
        await program.methods
          .cancelListing()
          .accounts({
            listing: testListingPDA,
            seller: user2.publicKey, // Wrong seller
          })
          .signers([user2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NotListingSeller");
      }
    });
  });

  describe("Rating System", () => {
    let promotionPDA: PublicKey;
    let ratingPDA: PublicKey;
    let ratingStatsPDA: PublicKey;

    before(async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      [ratingPDA] = derivePDA([
        Buffer.from("rating"),
        user1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ]);

      [ratingStatsPDA] = derivePDA([
        Buffer.from("rating_stats"),
        promotionPDA.toBuffer(),
      ]);
    });

    it("Rates a promotion", async () => {
      await program.methods
        .ratePromotion(5)
        .accounts({
          rating: ratingPDA,
          ratingStats: ratingStatsPDA,
          promotion: promotionPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const rating = await program.account.rating.fetch(ratingPDA);
      assert.equal(rating.stars, 5);
      assert.equal(rating.user.toString(), user1.publicKey.toString());
      assert.equal(rating.promotion.toString(), promotionPDA.toString());

      const stats = await program.account.ratingStats.fetch(ratingStatsPDA);
      assert.equal(stats.totalRatings, 1);
      assert.equal(stats.sumStars.toNumber(), 5);
      assert.equal(stats.averageRating, 500); // 5.00 * 100
      assert.deepEqual(stats.distribution, [0, 0, 0, 0, 1]);
    });

    it("Updates existing rating", async () => {
      await program.methods
        .ratePromotion(3)
        .accounts({
          rating: ratingPDA,
          ratingStats: ratingStatsPDA,
          promotion: promotionPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const rating = await program.account.rating.fetch(ratingPDA);
      assert.equal(rating.stars, 3);

      const stats = await program.account.ratingStats.fetch(ratingStatsPDA);
      assert.equal(stats.totalRatings, 1); // Still 1 rating
      assert.equal(stats.sumStars.toNumber(), 3);
      assert.equal(stats.averageRating, 300); // 3.00 * 100
      assert.deepEqual(stats.distribution, [0, 0, 1, 0, 0]);
    });

    it("Calculates average from multiple ratings", async () => {
      const [user2RatingPDA] = derivePDA([
        Buffer.from("rating"),
        user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ]);

      await program.methods
        .ratePromotion(4)
        .accounts({
          rating: user2RatingPDA,
          ratingStats: ratingStatsPDA,
          promotion: promotionPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const stats = await program.account.ratingStats.fetch(ratingStatsPDA);
      assert.equal(stats.totalRatings, 2);
      assert.equal(stats.sumStars.toNumber(), 7); // 3 + 4
      assert.equal(stats.averageRating, 350); // 3.50 * 100
      assert.deepEqual(stats.distribution, [0, 0, 1, 1, 0]);
    });

    it("Fails with invalid rating", async () => {
      const [testRatingPDA] = derivePDA([
        Buffer.from("rating"),
        merchant1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
      ]);

      try {
        await program.methods
          .ratePromotion(6) // Invalid: > 5
          .accounts({
            rating: testRatingPDA,
            ratingStats: ratingStatsPDA,
            promotion: promotionPDA,
            user: merchant1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([merchant1])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("InvalidRating");
      }
    });
  });

  describe("Comment System", () => {
    let promotionPDA: PublicKey;
    let commentPDA: PublicKey;
    let commentLikePDA: PublicKey;
    const commentContent = "Great deal! Highly recommend.";

    before(async () => {
      [promotionPDA] = derivePDA([
        Buffer.from("promotion"),
        merchant1PDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);
    });

    it("Adds a comment", async () => {
      const timestamp = getCurrentTimestamp();
      
      [commentPDA] = derivePDA([
        Buffer.from("comment"),
        user1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      await program.methods
        .addComment(commentContent, null)
        .accounts({
          comment: commentPDA,
          promotion: promotionPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const comment = await program.account.comment.fetch(commentPDA);
      assert.equal(comment.content, commentContent);
      assert.equal(comment.user.toString(), user1.publicKey.toString());
      assert.equal(comment.promotion.toString(), promotionPDA.toString());
      assert.equal(comment.likes, 0);
      assert.equal(comment.isMerchantReply, false);
      assert.isNull(comment.parentComment);
    });

    it("Merchant adds a reply", async () => {
      const timestamp = getCurrentTimestamp() + 1;
      
      const [replyPDA] = derivePDA([
        Buffer.from("comment"),
        merchant1.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      await program.methods
        .addComment("Thank you for your feedback!", commentPDA)
        .accounts({
          comment: replyPDA,
          promotion: promotionPDA,
          user: merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([merchant1])
        .rpc();

      const reply = await program.account.comment.fetch(replyPDA);
      assert.equal(reply.isMerchantReply, true);
      assert.equal(reply.parentComment.toString(), commentPDA.toString());
    });

    it("Likes a comment", async () => {
      [commentLikePDA] = derivePDA([
        Buffer.from("comment_like"),
        user2.publicKey.toBuffer(),
        commentPDA.toBuffer(),
      ]);

      await program.methods
        .likeComment()
        .accounts({
          commentLike: commentLikePDA,
          comment: commentPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const comment = await program.account.comment.fetch(commentPDA);
      assert.equal(comment.likes, 1);

      const like = await program.account.commentLike.fetch(commentLikePDA);
      assert.equal(like.user.toString(), user2.publicKey.toString());
      assert.equal(like.comment.toString(), commentPDA.toString());
    });

    it("Fails to add empty comment", async () => {
      const timestamp = getCurrentTimestamp() + 2;
      
      const [testCommentPDA] = derivePDA([
        Buffer.from("comment"),
        user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .addComment("", null)
          .accounts({
            comment: testCommentPDA,
            promotion: promotionPDA,
            user: user2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CommentEmpty");
      }
    });

    it("Fails to add comment that's too long", async () => {
      const longComment = "A".repeat(501);
      const timestamp = getCurrentTimestamp() + 3;
      
      const [testCommentPDA] = derivePDA([
        Buffer.from("comment"),
        user2.publicKey.toBuffer(),
        promotionPDA.toBuffer(),
        Buffer.from(new BN(timestamp).toArray("le", 8)),
      ]);

      try {
        await program.methods
          .addComment(longComment, null)
          .accounts({
            comment: testCommentPDA,
            promotion: promotionPDA,
            user: user2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("CommentTooLong");
      }
    });
  });

  describe("Reputation & Badge System", () => {
    let userReputationPDA: PublicKey;
    let badgePDA: PublicKey;
    let badgeMint: Keypair;
    let badgeMetadataPDA: PublicKey;

    before(async () => {
      [userReputationPDA] = derivePDA([
        Buffer.from("reputation"),
        user1.publicKey.toBuffer(),
      ]);
    });

    it("Initializes user reputation", async () => {
      await program.methods
        .initializeReputation()
        .accounts({
          userReputation: userReputationPDA,
          user: user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const reputation = await program.account.userReputation.fetch(userReputationPDA);
      assert.equal(reputation.user.toString(), user1.publicKey.toString());
      assert.equal(reputation.totalPurchases, 0);
      assert.equal(reputation.totalRedemptions, 0);
      assert.equal(reputation.reputationScore.toNumber(), 0);
    });

    it("Updates reputation after purchase", async () => {
      // This would be called automatically in mint_coupon
      // For testing, we'll call a helper instruction
      await program.methods
        .updateReputationPurchase()
        .accounts({
          userReputation: userReputationPDA,
          user: user1.publicKey,
        })
        .signers([user1])
        .rpc();

      const reputation = await program.account.userReputation.fetch(userReputationPDA);
      assert.equal(reputation.totalPurchases, 1);
      assert.isAbove(reputation.reputationScore.toNumber(), 0);
    });

    it("Mints achievement badge", async () => {
      // First, ensure user is eligible (has 1+ purchase)
      const reputation = await program.account.userReputation.fetch(userReputationPDA);
      assert.isAtLeast(reputation.totalPurchases, 1);

      const badgeType = 0; // FirstPurchase badge

      [badgePDA] = derivePDA([
        Buffer.from("badge"),
        user1.publicKey.toBuffer(),
        Buffer.from([badgeType]),
      ]);

      badgeMint = Keypair.generate();

      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );

      [badgeMetadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          badgeMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      await program.methods
        .mintBadge(badgeType)
        .accounts({
          badgeNft: badgePDA,
          userReputation: userReputationPDA,
          mint: badgeMint.publicKey,
          metadata: badgeMetadataPDA,
          marketplace: marketplacePDA,
          user: user1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([user1, badgeMint])
        .rpc();

      const badge = await program.account.badgeNft.fetch(badgePDA);
      assert.equal(badge.user.toString(), user1.publicKey.toString());
      assert.equal(badge.badgeType, badgeType);
      assert.equal(badge.mint.toString(), badgeMint.publicKey.toString());

      const reputationAfter = await program.account.userReputation.fetch(userReputationPDA);
      assert.include(reputationAfter.badgesEarned, badgeType);
    });

    it("Fails to mint badge twice", async () => {
      const badgeType = 0; // FirstPurchase badge
      const newMint = Keypair.generate();

      try {
        await program.methods
          .mintBadge(badgeType)
          .accounts({
            badgeNft: badgePDA,
            userReputation: userReputationPDA,
            mint: newMint.publicKey,
            metadata: badgeMetadataPDA,
            marketplace: marketplacePDA,
            user: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: new PublicKey(
              "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            ),
          })
          .signers([user1, newMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("BadgeAlreadyEarned");
      }
    });

    it("Fails to mint badge without meeting requirements", async () => {
      // Try to mint TenRedemptions badge without 10 redemptions
      const badgeType = 1; // TenRedemptions badge

      const [unqualifiedBadgePDA] = derivePDA([
        Buffer.from("badge"),
        user2.publicKey.toBuffer(),
        Buffer.from([badgeType]),
      ]);

      // Initialize reputation for user2
      const [user2ReputationPDA] = derivePDA([
        Buffer.from("reputation"),
        user2.publicKey.toBuffer(),
      ]);

      await program.methods
        .initializeReputation()
        .accounts({
          userReputation: user2ReputationPDA,
          user: user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user2])
        .rpc();

      const newMint = Keypair.generate();

      const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );

      const [metadata] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          newMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      try {
        await program.methods
          .mintBadge(badgeType)
          .accounts({
            badgeNft: unqualifiedBadgePDA,
            userReputation: user2ReputationPDA,
            mint: newMint.publicKey,
            metadata: metadata,
            marketplace: marketplacePDA,
            user: user2.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([user2, newMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("BadgeNotEarned");
      }
    });
  });

  describe("Oracle & External Deals", () => {
    let externalDealPDA: PublicKey;
    const externalDealId = "skyscanner_deal_123";

    before(async () => {
      [externalDealPDA] = derivePDA([
        Buffer.from("external_deal"),
        Buffer.from(externalDealId),
      ]);

      // Initialize oracle config
      await program.methods
        .initializeOracle()
        .accounts({
          oracleConfig: oracleConfigPDA,
          authority: oracleAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleAuthority])
        .rpc();
    });

    it("Updates external deal from oracle", async () => {
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
          oracleConfig: oracleConfigPDA,
          oracleAuthority: oracleAuthority.publicKey,
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
      assert.equal(deal.verificationCount, 1);
      assert.equal(deal.isVerified, false); // Not verified until threshold
    });

    it("Updates deal multiple times for verification", async () => {
      // Update 2 more times to reach verification threshold (assuming threshold is 3)
      for (let i = 0; i < 2; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait to respect update interval

        await program.methods
          .updateExternalDeal(
            externalDealId,
            "NYC to LAX - $199",
            "Round trip flight deal",
            new BN(500 * LAMPORTS_PER_SOL),
            new BN(199 * LAMPORTS_PER_SOL),
            "flights",
            "https://example.com/flight.jpg",
            "https://skyscanner.com/deal/123",
            getExpiryTimestamp(7)
          )
          .accounts({
            externalDeal: externalDealPDA,
            oracleConfig: oracleConfigPDA,
            oracleAuthority: oracleAuthority.publicKey,
            payer: oracleAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([oracleAuthority])
          .rpc();
      }

      const deal = await program.account.externalDeal.fetch(externalDealPDA);
      assert.equal(deal.verificationCount, 3);
      assert.equal(deal.isVerified, true); // Now verified
    });

    it("Fails when unauthorized oracle tries to update", async () => {
      const unauthorizedOracle = Keypair.generate();
      await airdrop(unauthorizedOracle.publicKey);

      try {
        await program.methods
          .updateExternalDeal(
            externalDealId,
            "Fake Deal",
            "This should fail",
            new BN(100),
            new BN(50),
            "test",
            "url",
            "url",
            getExpiryTimestamp(1)
          )
          .accounts({
            externalDeal: externalDealPDA,
            oracleConfig: oracleConfigPDA,
            oracleAuthority: unauthorizedOracle.publicKey,
            payer: unauthorizedOracle.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedOracle])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("UnauthorizedOracle");
      }
    });
  });

  describe("Integration Tests", () => {
    it("Complete user journey: Register → Buy → Redeem", async () => {
      // 1. Merchant registers
      const newMerchant = Keypair.generate();
      await airdrop(newMerchant.publicKey);

      const [newMerchantPDA] = derivePDA([
        Buffer.from("merchant"),
        newMerchant.publicKey.toBuffer(),
      ]);

      await program.methods
        .registerMerchant("Integration Test Store", "test", null, null)
        .accounts({
          merchant: newMerchantPDA,
          marketplace: marketplacePDA,
          authority: newMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newMerchant])
        .rpc();

      // 2. Merchant creates promotion
      const [newPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        newMerchantPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          25,
          10,
          getExpiryTimestamp(30),
          "test",
          "Integration test promotion",
          new BN(1 * LAMPORTS_PER_SOL),
          null,
          null,
          0
        )
        .accounts({
          promotion: newPromotionPDA,
          merchant: newMerchantPDA,
          geoCell: null,
          authority: newMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([newMerchant])
        .rpc();

      // 3. User buys coupon
      const newUser = Keypair.generate();
      await airdrop(newUser.publicKey);

      const [newCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        newPromotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const newMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(1000))
        .accounts({
          coupon: newCouponPDA,
          nftMint: newMint.publicKey,
          promotion: newPromotionPDA,
          merchant: newMerchantPDA,
          marketplace: marketplacePDA,
          recipient: newUser.publicKey,
          payer: newUser.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([newUser, newMint])
        .rpc();

      // 4. User redeems coupon
      await program.methods
        .redeemCoupon()
        .accounts({
          coupon: newCouponPDA,
          merchant: newMerchantPDA,
          user: newUser.publicKey,
          merchantAuthority: newMerchant.publicKey,
        })
        .signers([newUser, newMerchant])
        .rpc();

      // 5. Verify final state
      const coupon = await program.account.coupon.fetch(newCouponPDA);
      assert.equal(coupon.isRedeemed, true);

      const merchant = await program.account.merchant.fetch(newMerchantPDA);
      assert.equal(merchant.totalCouponsCreated.toNumber(), 1);
      assert.equal(merchant.totalCouponsRedeemed.toNumber(), 1);

      const promotion = await program.account.promotion.fetch(newPromotionPDA);
      assert.equal(promotion.currentSupply, 1);
    });

    it("Complete marketplace flow: List → Buy → Verify ownership", async () => {
      // Setup: Create merchant, promotion, and mint coupon
      const seller = Keypair.generate();
      const buyer = Keypair.generate();
      await Promise.all([
        airdrop(seller.publicKey),
        airdrop(buyer.publicKey),
      ]);

      const testMerchant = Keypair.generate();
      await airdrop(testMerchant.publicKey);

      const [testMerchantPDA] = derivePDA([
        Buffer.from("merchant"),
        testMerchant.publicKey.toBuffer(),
      ]);

      await program.methods
        .registerMerchant("Marketplace Test", "test", null, null)
        .accounts({
          merchant: testMerchantPDA,
          marketplace: marketplacePDA,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();

      const [testPromotionPDA] = derivePDA([
        Buffer.from("promotion"),
        testMerchantPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      await program.methods
        .createCouponPromotion(
          50,
          5,
          getExpiryTimestamp(30),
          "test",
          "Marketplace flow test",
          new BN(2 * LAMPORTS_PER_SOL),
          null,
          null,
          0
        )
        .accounts({
          promotion: testPromotionPDA,
          merchant: testMerchantPDA,
          geoCell: null,
          authority: testMerchant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testMerchant])
        .rpc();

      const [testCouponPDA] = derivePDA([
        Buffer.from("coupon"),
        testPromotionPDA.toBuffer(),
        Buffer.from(new BN(0).toArray("le", 8)),
      ]);

      const testMint = Keypair.generate();

      await program.methods
        .mintCoupon(new BN(2000))
        .accounts({
          coupon: testCouponPDA,
          nftMint: testMint.publicKey,
          promotion: testPromotionPDA,
          merchant: testMerchantPDA,
          marketplace: marketplacePDA,
          recipient: seller.publicKey,
          payer: seller.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
        })
        .signers([seller, testMint])
        .rpc();

      // Verify seller owns coupon
      let coupon = await program.account.coupon.fetch(testCouponPDA);
      assert.equal(coupon.owner.toString(), seller.publicKey.toString());

      // List coupon
      const [testListingPDA] = derivePDA([
        Buffer.from("listing"),
        testCouponPDA.toBuffer(),
      ]);

      const salePrice = new BN(1.5 * LAMPORTS_PER_SOL);

      await program.methods
        .listCouponForSale(salePrice)
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          seller: seller.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc();

      // Buy coupon
      await program.methods
        .buyListedCoupon()
        .accounts({
          listing: testListingPDA,
          coupon: testCouponPDA,
          marketplace: marketplacePDA,
          seller: seller.publicKey,
          buyer: buyer.publicKey,
          marketplaceAuthority: marketplaceAuthority.publicKey,
        })
        .signers([buyer])
        .rpc();

      // Verify buyer now owns coupon
      coupon = await program.account.coupon.fetch(testCouponPDA);
      assert.equal(coupon.owner.toString(), buyer.publicKey.toString());

      // Verify listing is inactive
      const listing = await program.account.listing.fetch(testListingPDA);
      assert.equal(listing.isActive, false);
    });
  });
});
*/