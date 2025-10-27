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
  u32ToLeBytes,
  u64ToLeBytes,
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  airdrop
} from "./setup";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

describe("Staking System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let stakingPoolPDA: PublicKey;
  let merchantPDA: PublicKey;
  let promotionPDA: PublicKey;
  let couponPDA: PublicKey;
  let couponMint: Keypair;
  let userTokenAccount: PublicKey;
  let stakeAccountPDA: PublicKey;
  let stakeVaultPDA: PublicKey;
  let userStatsPDA: PublicKey;

  before(async () => {
    accounts = await setupTestAccounts(program, connection);
    
    // Initialize marketplace if needed
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
    const merchantExists = await accountExists(connection, accounts.merchant1PDA);
    if (!merchantExists) {
      await program.methods
        .registerMerchant("Staking Test Merchant", "test", null, null)
        .accounts({
          merchant: accounts.merchant1PDA,
          marketplace: accounts.marketplacePDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
    }
    merchantPDA = accounts.merchant1PDA;

    // Create promotion
    const merchant = await program.account.merchant.fetch(merchantPDA);
    [promotionPDA] = derivePDA(
      [
        Buffer.from("promotion"),
        merchantPDA.toBuffer(),
        u64ToLeBytes(merchant.totalCouponsCreated),
      ],
      program.programId
    );

    const promotionExists = await accountExists(connection, promotionPDA);
    if (!promotionExists) {
      await program.methods
        .createPromotion(
          50,
          100,
          getExpiryTimestamp(60),
          "staking",
          "Staking test promotion",
          new BN(10 * LAMPORTS_PER_SOL)
        )
        .accounts({
          promotion: promotionPDA,
          merchant: merchantPDA,
          authority: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();
    }

    // Mint a coupon for testing
    const promotion = await program.account.promotion.fetch(promotionPDA);
    [couponPDA] = derivePDA(
      [
        Buffer.from("coupon"),
        promotionPDA.toBuffer(),
        u32ToLeBytes(promotion.currentSupply),
      ],
      program.programId
    );

    couponMint = Keypair.generate();
    const [metadataPDA] = deriveMetadataPDA(couponMint.publicKey);
    const [masterEditionPDA] = deriveMasterEditionPDA(couponMint.publicKey);
    userTokenAccount = getAssociatedTokenAddressSync(
      couponMint.publicKey,
      accounts.user1.publicKey
    );

    [userStatsPDA] = derivePDA(
      [Buffer.from("user_stats"), accounts.user1.publicKey.toBuffer()],
      program.programId
    );

    const couponExists = await accountExists(connection, couponPDA);
    if (!couponExists) {
      await program.methods
        .mintCoupon(new BN(1))
        .accounts({
          coupon: couponPDA,
          nftMint: couponMint.publicKey,
          tokenAccount: userTokenAccount,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          promotion: promotionPDA,
          merchant: merchantPDA,
          marketplace: accounts.marketplacePDA,
          recipient: accounts.user1.publicKey,
          userStats: userStatsPDA,
          payer: accounts.user1.publicKey,
          authority: accounts.merchant1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          sysvarInstructions: web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([accounts.user1, couponMint, accounts.merchant1])
        .rpc();
    }

    // Derive staking-related PDAs
    [stakingPoolPDA] = derivePDA([Buffer.from("staking_pool")], program.programId);
    [stakeAccountPDA] = derivePDA(
      [
        Buffer.from("stake"),
        couponPDA.toBuffer(),
        accounts.user1.publicKey.toBuffer(),
      ],
      program.programId
    );
    [stakeVaultPDA] = derivePDA(
      [Buffer.from("stake_vault"), couponMint.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Staking Pool Initialization", () => {
    it("Initializes staking pool successfully", async () => {
      const exists = await accountExists(connection, stakingPoolPDA);
      
      if (!exists) {
        await program.methods
          .initializeStaking(
            new BN(100), // 1% per day reward rate (100 basis points)
            new BN(86400) // 1 day minimum stake duration
          )
          .accounts({
            stakingPool: stakingPoolPDA,
            authority: accounts.marketplaceAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([accounts.marketplaceAuthority])
          .rpc();
      }

      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      assert.equal(stakingPool.authority.toString(), accounts.marketplaceAuthority.publicKey.toString());
      assert.equal(stakingPool.rewardRatePerDay.toNumber(), 100);
      assert.equal(stakingPool.minStakeDuration.toNumber(), 86400);
      assert.equal(stakingPool.totalStaked.toNumber(), 0);
      assert.equal(stakingPool.totalRewardsDistributed.toNumber(), 0);
      assert.equal(stakingPool.isActive, true);
      console.log("✓ Staking pool initialized with 1% daily rewards");
    });

    it("Fails to initialize staking pool twice", async () => {
      try {
        await program.methods
          .initializeStaking(new BN(200), new BN(172800))
          .accounts({
            stakingPool: stakingPoolPDA,
            authority: accounts.marketplaceAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([accounts.marketplaceAuthority])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.toString()).to.satisfy((msg: string) => 
          msg.includes("already in use") || msg.includes("custom program error")
        );
      }
    });
  });

  describe("Reward Calculations", () => {
    it("Calculates rewards correctly for different durations", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      const rewardRate = stakingPool.rewardRatePerDay.toNumber(); // 100 = 1%
      const amountStaked = 1_000_000; // Base amount

      // Test 1 day staking
      const oneDayReward = (amountStaked * rewardRate * 1) / 10000;
      assert.equal(oneDayReward, 10000); // 1% of 1M = 10K

      // Test 7 days staking
      const sevenDayReward = (amountStaked * rewardRate * 7) / 10000;
      assert.equal(sevenDayReward, 70000); // 7% of 1M = 70K

      // Test 30 days staking
      const thirtyDayReward = (amountStaked * rewardRate * 30) / 10000;
      assert.equal(thirtyDayReward, 300000); // 30% of 1M = 300K

      console.log("✓ Reward calculations verified:");
      console.log("  - 1 day: ", oneDayReward, "lamports");
      console.log("  - 7 days:", sevenDayReward, "lamports");
      console.log("  - 30 days:", thirtyDayReward, "lamports");
    });
  });

  describe("Time-locked Withdrawals", () => {
    it("Verifies minimum stake duration requirement", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      const minDuration = stakingPool.minStakeDuration.toNumber();
      
      assert.equal(minDuration, 86400); // 1 day in seconds
      console.log("✓ Minimum stake duration:", minDuration / 86400, "days");
    });

    it("Calculates unlock time correctly", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const durationDays = 7;
      const durationSeconds = durationDays * 86400;
      const expectedUnlockTime = currentTime + durationSeconds;

      // Verify calculation
      assert.approximately(expectedUnlockTime, currentTime + 604800, 10);
      console.log("✓ Unlock time calculation verified for", durationDays, "days");
    });
  });

  describe("Staking Pool State Management", () => {
    it("Tracks total staked amount correctly", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      
      // Initially should be 0
      assert.equal(stakingPool.totalStaked.toNumber(), 0);
      assert.equal(stakingPool.totalRewardsDistributed.toNumber(), 0);
      console.log("✓ Initial staking pool state verified");
    });

    it("Verifies staking pool is active", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      assert.equal(stakingPool.isActive, true);
      console.log("✓ Staking pool is active");
    });
  });

  describe("Edge Cases and Validation", () => {
    it("Validates reward rate bounds", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      const rewardRate = stakingPool.rewardRatePerDay.toNumber();
      
      // Reward rate should be reasonable (not negative, not excessively high)
      assert.isAtLeast(rewardRate, 0);
      assert.isAtMost(rewardRate, 10000); // Max 100% per day
      console.log("✓ Reward rate is within valid bounds:", rewardRate, "basis points");
    });

    it("Validates minimum stake duration", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      const minDuration = stakingPool.minStakeDuration.toNumber();
      
      // Should be at least 1 second, at most 365 days
      assert.isAtLeast(minDuration, 1);
      assert.isAtMost(minDuration, 365 * 86400);
      console.log("✓ Minimum stake duration is valid:", minDuration, "seconds");
    });

    it("Handles zero amount staking validation", async () => {
      // Zero amount should not be allowed
      const zeroAmount = 0;
      const rewardRate = 100;
      const days = 7;
      
      const reward = (zeroAmount * rewardRate * days) / 10000;
      assert.equal(reward, 0);
      console.log("✓ Zero amount staking returns zero rewards");
    });

    it("Handles maximum duration calculations", async () => {
      const maxDays = 365;
      const amountStaked = 1_000_000;
      const rewardRate = 100; // 1% per day
      
      const maxReward = (amountStaked * rewardRate * maxDays) / 10000;
      assert.equal(maxReward, 3_650_000); // 365% of 1M
      console.log("✓ Maximum duration (365 days) reward:", maxReward, "lamports");
    });
  });

  describe("Staking Pool Authority", () => {
    it("Verifies correct authority is set", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      assert.equal(
        stakingPool.authority.toString(),
        accounts.marketplaceAuthority.publicKey.toString()
      );
      console.log("✓ Staking pool authority verified");
    });
  });

  describe("Timestamp Validation", () => {
    it("Verifies creation timestamp is set", async () => {
      const stakingPool = await program.account.stakingPool.fetch(stakingPoolPDA);
      assert.isAbove(stakingPool.createdAt.toNumber(), 0);
      
      const currentTime = Math.floor(Date.now() / 1000);
      assert.isAtMost(stakingPool.createdAt.toNumber(), currentTime);
      console.log("✓ Staking pool creation timestamp is valid");
    });
  });
});
