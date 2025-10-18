/*
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { expect } from "chai";

describe("discount-platform", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const payer = provider.wallet as anchor.Wallet;

  // PDAs
  let marketplacePda: PublicKey;
  let merchantPda: PublicKey;
  let promotionPda: PublicKey;
  let couponPda: PublicKey;
  let listingPda: PublicKey;

  // Test data
  const merchantName = "Test Coffee Shop";
  const merchantCategory = "Food & Beverage";
  const promotionCategory = "Coffee";
  const promotionDescription = "20% off any coffee drink";
  const discountPercentage = 20;
  const maxSupply = 100;
  const price = new anchor.BN(1_000_000); // 0.001 SOL
  const couponId = new anchor.BN(1);

  before(async () => {
    // Derive PDAs
    [marketplacePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace")],
      program.programId
    );

    [merchantPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("merchant"), payer.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Marketplace Initialization", () => {
    it("Initializes the marketplace", async () => {
      const tx = await program.methods
        .initialize()
        .accounts({
          marketplace: marketplacePda,
          authority: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize marketplace signature:", tx);

      // Fetch and verify marketplace account
      const marketplace = await program.account.marketplace.fetch(marketplacePda);
      expect(marketplace.authority.toString()).to.equal(payer.publicKey.toString());
      expect(marketplace.totalCoupons.toNumber()).to.equal(0);
      expect(marketplace.totalMerchants.toNumber()).to.equal(0);
      expect(marketplace.feeBasisPoints).to.equal(250);
    });
  });

  describe("Merchant Registration", () => {
    it("Registers a new merchant", async () => {
      const tx = await program.methods
        .registerMerchant(merchantName, merchantCategory)
        .accounts({
          merchant: merchantPda,
          marketplace: marketplacePda,
          authority: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Register merchant signature:", tx);

      // Fetch and verify merchant account
      const merchant = await program.account.merchant.fetch(merchantPda);
      expect(merchant.authority.toString()).to.equal(payer.publicKey.toString());
      expect(merchant.name).to.equal(merchantName);
      expect(merchant.category).to.equal(merchantCategory);
      expect(merchant.totalCouponsCreated.toNumber()).to.equal(0);
      expect(merchant.totalCouponsRedeemed.toNumber()).to.equal(0);
      expect(merchant.isActive).to.be.true;

      // Verify marketplace updated
      const marketplace = await program.account.marketplace.fetch(marketplacePda);
      expect(marketplace.totalMerchants.toNumber()).to.equal(1);
    });
  });

  describe("Promotion Creation", () => {
    it("Creates a coupon promotion", async () => {
      const expiryTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 24 hours from now

      [promotionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("promotion"),
          merchantPda.toBuffer(),
          new anchor.BN(0).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const tx = await program.methods
        .createCouponPromotion(
          discountPercentage,
          maxSupply,
          expiryTimestamp,
          promotionCategory,
          promotionDescription,
          price
        )
        .accounts({
          promotion: promotionPda,
          merchant: merchantPda,
          authority: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Create promotion signature:", tx);

      // Fetch and verify promotion account
      const promotion = await program.account.promotion.fetch(promotionPda);
      expect(promotion.merchant.toString()).to.equal(merchantPda.toString());
      expect(promotion.discountPercentage).to.equal(discountPercentage);
      expect(promotion.maxSupply).to.equal(maxSupply);
      expect(promotion.currentSupply).to.equal(0);
      expect(promotion.category).to.equal(promotionCategory);
      expect(promotion.description).to.equal(promotionDescription);
      expect(promotion.price.toString()).to.equal(price.toString());
      expect(promotion.isActive).to.be.true;
    });

    it("Fails to create promotion with invalid discount percentage", async () => {
      const expiryTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      const [invalidPromotionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("promotion"),
          merchantPda.toBuffer(),
          new anchor.BN(1).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createCouponPromotion(
            150, // Invalid: > 100
            maxSupply,
            expiryTimestamp,
            promotionCategory,
            "Invalid discount",
            price
          )
          .accounts({
            promotion: invalidPromotionPda,
            merchant: merchantPda,
            authority: payer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });

    it("Fails to create promotion with expired timestamp", async () => {
      const expiredTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) - 3600); // 1 hour ago

      const [expiredPromotionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("promotion"),
          merchantPda.toBuffer(),
          new anchor.BN(2).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createCouponPromotion(
            discountPercentage,
            maxSupply,
            expiredTimestamp,
            promotionCategory,
            "Expired promotion",
            price
          )
          .accounts({
            promotion: expiredPromotionPda,
            merchant: merchantPda,
            authority: payer.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Regular Coupon Minting", () => {
    it("Mints a regular coupon", async () => {
      [couponPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("coupon"),
          promotionPda.toBuffer(),
          couponId.toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      const tx = await program.methods
        .mintCoupon(couponId)
        .accounts({
          coupon: couponPda,
          promotion: promotionPda,
          merchant: merchantPda,
          marketplace: marketplacePda,
          recipient: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Mint coupon signature:", tx);

      // Fetch and verify coupon account
      const coupon = await program.account.coupon.fetch(couponPda);
      expect(coupon.id.toString()).to.equal(couponId.toString());
      expect(coupon.promotion.toString()).to.equal(promotionPda.toString());
      expect(coupon.owner.toString()).to.equal(payer.publicKey.toString());
      expect(coupon.merchant.toString()).to.equal(merchantPda.toString());
      expect(coupon.discountPercentage).to.equal(discountPercentage);
      expect(coupon.isRedeemed).to.be.false;

      // Verify promotion updated
      const promotion = await program.account.promotion.fetch(promotionPda);
      expect(promotion.currentSupply).to.equal(1);

      // Verify merchant updated
      const merchant = await program.account.merchant.fetch(merchantPda);
      expect(merchant.totalCouponsCreated.toNumber()).to.equal(1);

      // Verify marketplace updated
      const marketplace = await program.account.marketplace.fetch(marketplacePda);
      expect(marketplace.totalCoupons.toNumber()).to.equal(1);
    });
  });

  describe("Coupon Transfer", () => {
    it("Transfers a coupon to a new owner", async () => {
      const newOwner = Keypair.generate();

      const tx = await program.methods
        .transferCoupon()
        .accounts({
          coupon: couponPda,
          newOwner: newOwner.publicKey,
          fromAuthority: payer.publicKey,
        })
        .rpc();

      console.log("Transfer coupon signature:", tx);

      // Fetch and verify coupon owner updated
      const coupon = await program.account.coupon.fetch(couponPda);
      expect(coupon.owner.toString()).to.equal(newOwner.publicKey.toString());
    });
  });

  describe("Coupon Redemption", () => {
    let redemptionCouponPda: PublicKey;

    before(async () => {
      // Mint a new coupon for redemption test
      const redemptionCouponId = new anchor.BN(2);
      [redemptionCouponPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("coupon"),
          promotionPda.toBuffer(),
          redemptionCouponId.toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      await program.methods
        .mintCoupon(redemptionCouponId)
        .accounts({
          coupon: redemptionCouponPda,
          promotion: promotionPda,
          merchant: merchantPda,
          marketplace: marketplacePda,
          recipient: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("Redeems a coupon", async () => {
      const tx = await program.methods
        .redeemCoupon()
        .accounts({
          coupon: redemptionCouponPda,
          merchant: merchantPda,
          user: payer.publicKey,
          merchantAuthority: payer.publicKey,
        })
        .rpc();

      console.log("Redeem coupon signature:", tx);

      // Fetch and verify coupon is redeemed
      const coupon = await program.account.coupon.fetch(redemptionCouponPda);
      expect(coupon.isRedeemed).to.be.true;
      expect(coupon.redeemedAt.toNumber()).to.be.greaterThan(0);

      // Verify merchant stats updated
      const merchant = await program.account.merchant.fetch(merchantPda);
      expect(merchant.totalCouponsRedeemed.toNumber()).to.equal(1);
    });
  });

  describe("Coupon Listing and Buying", () => {
    let listingCouponPda: PublicKey;
    let buyer: Keypair;

    before(async () => {
      // Mint a new coupon for listing test
      const listingCouponId = new anchor.BN(3);
      [listingCouponPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("coupon"),
          promotionPda.toBuffer(),
          listingCouponId.toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      await program.methods
        .mintCoupon(listingCouponId)
        .accounts({
          coupon: listingCouponPda,
          promotion: promotionPda,
          merchant: merchantPda,
          marketplace: marketplacePda,
          recipient: payer.publicKey,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      buyer = Keypair.generate();
      // Airdrop SOL to buyer
      const airdropSig = await provider.connection.requestAirdrop(
        buyer.publicKey,
        2 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);
    });

    it("Lists a coupon for sale", async () => {
      [listingPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("listing"), listingCouponPda.toBuffer()],
        program.programId
      );

      const listPrice = new anchor.BN(2_000_000); // 0.002 SOL

      const tx = await program.methods
        .listCouponForSale(listPrice)
        .accounts({
          listing: listingPda,
          coupon: listingCouponPda,
          seller: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("List coupon signature:", tx);

      // Fetch and verify listing created
      const listing = await program.account.listing.fetch(listingPda);
      expect(listing.coupon.toString()).to.equal(listingCouponPda.toString());
      expect(listing.seller.toString()).to.equal(payer.publicKey.toString());
      expect(listing.price.toString()).to.equal(listPrice.toString());
      expect(listing.isActive).to.be.true;
    });

    it("Buys a listed coupon", async () => {
      const tx = await program.methods
        .buyListedCoupon()
        .accounts({
          listing: listingPda,
          coupon: listingCouponPda,
          marketplace: marketplacePda,
          seller: payer.publicKey,
          buyer: buyer.publicKey,
          marketplaceAuthority: payer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      console.log("Buy coupon signature:", tx);

      // Fetch and verify coupon ownership transferred
      const coupon = await program.account.coupon.fetch(listingCouponPda);
      expect(coupon.owner.toString()).to.equal(buyer.publicKey.toString());

      // Fetch and verify listing deactivated
      const listing = await program.account.listing.fetch(listingPda);
      expect(listing.isActive).to.be.false;
    });
  });

  describe("NFT Coupon Minting", () => {
    let nftMintKeypair: Keypair;
    let nftCouponPda: PublicKey;
    let metadataPda: PublicKey;
    let masterEditionPda: PublicKey;
    let tokenAccount: PublicKey;

    const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    before(async () => {
      nftMintKeypair = Keypair.generate();

      const nftCouponId = new anchor.BN(100);
      [nftCouponPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("coupon"),
          promotionPda.toBuffer(),
          nftCouponId.toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      // Derive metadata PDA
      [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMintKeypair.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      // Derive master edition PDA
      [masterEditionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        METADATA_PROGRAM_ID
      );

      // Get associated token account
      tokenAccount = await getAssociatedTokenAddress(
        nftMintKeypair.publicKey,
        payer.publicKey
      );
    });

    it("Mints an NFT coupon with metadata and master edition", async () => {
      const nftCouponId = new anchor.BN(100);
      const name = "Coffee Discount NFT";
      const symbol = "COFFEE";
      const uri = "https://example.com/metadata.json";

      const tx = await program.methods
        .mintCouponNft(nftCouponId, name, symbol, uri)
        .accounts({
          coupon: nftCouponPda,
          promotion: promotionPda,
          merchant: merchantPda,
          marketplace: marketplacePda,
          mint: nftMintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
          recipient: payer.publicKey,
          payer: payer.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
        })
        .signers([nftMintKeypair])
        .rpc();

      console.log("Mint NFT coupon signature:", tx);

      // Fetch and verify coupon account
      const coupon = await program.account.coupon.fetch(nftCouponPda);
      expect(coupon.id.toString()).to.equal(nftCouponId.toString());
      expect(coupon.promotion.toString()).to.equal(promotionPda.toString());
      expect(coupon.owner.toString()).to.equal(payer.publicKey.toString());
      expect(coupon.merchant.toString()).to.equal(merchantPda.toString());
      expect(coupon.mint.toString()).to.equal(nftMintKeypair.publicKey.toString());
      expect(coupon.isRedeemed).to.be.false;

      // Verify token account exists and has 1 token
      const tokenAccountInfo = await provider.connection.getTokenAccountBalance(tokenAccount);
      expect(tokenAccountInfo.value.amount).to.equal("1");
    });
  });

  describe("NFT Coupon Redemption with Burn", () => {
    let nftMintKeypair: Keypair;
    let nftCouponPda: PublicKey;
    let metadataPda: PublicKey;
    let masterEditionPda: PublicKey;
    let tokenAccount: PublicKey;

    const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    before(async () => {
      nftMintKeypair = Keypair.generate();

      const nftCouponId = new anchor.BN(101);
      [nftCouponPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("coupon"),
          promotionPda.toBuffer(),
          nftCouponId.toArrayLike(Buffer, "le", 4),
        ],
        program.programId
      );

      [metadataPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMintKeypair.publicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      [masterEditionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        METADATA_PROGRAM_ID
      );

      tokenAccount = await getAssociatedTokenAddress(
        nftMintKeypair.publicKey,
        payer.publicKey
      );

      // Mint NFT coupon first
      await program.methods
        .mintCouponNft(
          nftCouponId,
          "Redeemable Coffee NFT",
          "RCOFFEE",
          "https://example.com/redeemable.json"
        )
        .accounts({
          coupon: nftCouponPda,
          promotion: promotionPda,
          merchant: merchantPda,
          marketplace: marketplacePda,
          mint: nftMintKeypair.publicKey,
          tokenAccount: tokenAccount,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
          recipient: payer.publicKey,
          payer: payer.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
        })
        .signers([nftMintKeypair])
        .rpc();
    });

    it("Redeems NFT coupon and burns the token", async () => {
      // Generate redemption code from mint address (as per program logic)
      const redemptionCode = Array.from(
        anchor.utils.sha256.hash(nftMintKeypair.publicKey.toBuffer())
      );

      const tx = await program.methods
        .redeemCouponNft(redemptionCode)
        .accounts({
          coupon: nftCouponPda,
          merchant: merchantPda,
          mint: nftMintKeypair.publicKey,
          tokenAccount: tokenAccount,
          user: payer.publicKey,
          merchantAuthority: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Redeem NFT coupon signature:", tx);

      // Fetch and verify coupon is redeemed
      const coupon = await program.account.coupon.fetch(nftCouponPda);
      expect(coupon.isRedeemed).to.be.true;
      expect(coupon.redeemedAt.toNumber()).to.be.greaterThan(0);

      // Verify token was burned (balance should be 0)
      const tokenAccountInfo = await provider.connection.getTokenAccountBalance(tokenAccount);
      expect(tokenAccountInfo.value.amount).to.equal("0");

      // Verify merchant stats updated
      const merchant = await program.account.merchant.fetch(merchantPda);
      expect(merchant.totalCouponsRedeemed.toNumber()).to.be.greaterThan(1);
    });
  });

  describe("Access Control", () => {
    it("Prevents unauthorized user from creating promotion", async () => {
      const unauthorizedUser = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      const [unauthorizedPromotionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("promotion"),
          merchantPda.toBuffer(),
          new anchor.BN(99).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const expiryTimestamp = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);

      try {
        await program.methods
          .createCouponPromotion(
            discountPercentage,
            maxSupply,
            expiryTimestamp,
            promotionCategory,
            "Unauthorized promotion",
            price
          )
          .accounts({
            promotion: unauthorizedPromotionPda,
            merchant: merchantPda,
            authority: unauthorizedUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([unauthorizedUser])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });
});
*/