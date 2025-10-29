import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, Keypair, PublicKey } from "@solana/web3.js";
import { assert, expect } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts,
  derivePDA,
  deriveMetadataPDA,
  accountExists,
  LAMPORTS_PER_SOL,
  TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID
} from "./setup-devnet";

describe("Badge System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let badgePDA: PublicKey;
  let badgeMint: Keypair;
  let badgeMetadataPDA: PublicKey;
  let badgeMasterEditionPDA: PublicKey;

  // Helper function to create BadgeType enum variant
  function createBadgeType(variant: string) {
    return { [variant]: {} };
  }

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
  });

  describe("Badge Minting", () => {
    it("Mints a FirstPurchase badge", async () => {
      // Use camelCase for the variant name as Anchor converts it
      const badgeType = { firstPurchase: {} };
      const badgeIndex = 0;

      [badgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user1.publicKey.toBuffer(),
          Buffer.from([badgeIndex]),
        ],
        program.programId
      );

      badgeMint = Keypair.generate();
      [badgeMetadataPDA] = deriveMetadataPDA(badgeMint.publicKey);
      [badgeMasterEditionPDA] = derivePDA(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          badgeMint.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      await program.methods
        .mintBadge(badgeType)
        .accounts({
          badgeNft: badgePDA,
          mint: badgeMint.publicKey,
          metadata: badgeMetadataPDA,
          masterEdition: badgeMasterEditionPDA,
          user: accounts.user1.publicKey,
          authority: accounts.marketplaceAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([accounts.user1, badgeMint, accounts.marketplaceAuthority])
        .rpc();

      const badge = await program.account.badgeNft.fetch(badgePDA);
      assert.equal(badge.user.toString(), accounts.user1.publicKey.toString());
      assert.deepEqual(badge.badgeType, badgeType);
      assert.equal(badge.mint.toString(), badgeMint.publicKey.toString());
    });

    it("Different users can earn the same badge type", async () => {
      const badgeType = { firstPurchase: {} };
      const badgeIndex = 0;

      const [user2BadgePDA] = derivePDA(
        [
          Buffer.from("badge"),
          accounts.user2.publicKey.toBuffer(),
          Buffer.from([badgeIndex]),
        ],
        program.programId
      );

      const user2Mint = Keypair.generate();
      const [user2Metadata] = deriveMetadataPDA(user2Mint.publicKey);
      const [user2MasterEdition] = derivePDA(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          user2Mint.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      await program.methods
        .mintBadge(badgeType)
        .accounts({
          badgeNft: user2BadgePDA,
          mint: user2Mint.publicKey,
          metadata: user2Metadata,
          masterEdition: user2MasterEdition,
          user: accounts.user2.publicKey,
          authority: accounts.marketplaceAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([accounts.user2, user2Mint, accounts.marketplaceAuthority])
        .rpc();

      const badge = await program.account.badgeNft.fetch(user2BadgePDA);
      assert.equal(badge.user.toString(), accounts.user2.publicKey.toString());
    });

    it("Fails to mint same badge twice for same user", async () => {
      const badgeType = { firstPurchase: {} };
      const duplicateMint = Keypair.generate();
      const [duplicateMetadata] = deriveMetadataPDA(duplicateMint.publicKey);
      const [duplicateMasterEdition] = derivePDA(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          duplicateMint.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      try {
        await program.methods
          .mintBadge(badgeType)
          .accounts({
            badgeNft: badgePDA, // Same PDA - will fail
            mint: duplicateMint.publicKey,
            metadata: duplicateMetadata,
            masterEdition: duplicateMasterEdition,
            user: accounts.user1.publicKey,
            authority: accounts.marketplaceAuthority.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          })
          .signers([accounts.user1, duplicateMint, accounts.marketplaceAuthority])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.toString()).to.include("already in use");
      }
    });

    it("Verifies badge metadata is set correctly", async () => {
      const badge = await program.account.badgeNft.fetch(badgePDA);
      
      assert.isNotEmpty(badge.metadataUri);
      assert.equal(badge.mint.toString(), badgeMint.publicKey.toString());
      assert.equal(badge.metadata.toString(), badgeMetadataPDA.toString());
      assert.isAbove(badge.earnedAt.toNumber(), 0);
    });

    it("Mints different badge types for same user", async () => {
      const badgeTypeConfigs = [
        { variant: { tenRedemptions: {} }, index: 1 },
        { variant: { fiftyRedemptions: {} }, index: 2 },
        { variant: { topReviewer: {} }, index: 3 },
      ];

      for (const config of badgeTypeConfigs) {
        const [testBadgePDA] = derivePDA(
          [
            Buffer.from("badge"),
            accounts.user1.publicKey.toBuffer(),
            Buffer.from([config.index]),
          ],
          program.programId
        );

        const testMint = Keypair.generate();
        const [testMetadata] = deriveMetadataPDA(testMint.publicKey);
        const [testMasterEdition] = derivePDA(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            testMint.publicKey.toBuffer(),
            Buffer.from("edition"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );

        await program.methods
          .mintBadge(config.variant)
          .accounts({
            badgeNft: testBadgePDA,
            mint: testMint.publicKey,
            metadata: testMetadata,
            masterEdition: testMasterEdition,
            user: accounts.user1.publicKey,
            authority: accounts.marketplaceAuthority.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          })
          .signers([accounts.user1, testMint, accounts.marketplaceAuthority])
          .rpc();

        const badge = await program.account.badgeNft.fetch(testBadgePDA);
        assert.deepEqual(badge.badgeType, config.variant);
      }
    });

    it("Mints all badge types", async () => {
      const testUser = Keypair.generate();
      const signature = await connection.requestAirdrop(
        testUser.publicKey,
        5 * LAMPORTS_PER_SOL
      );
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        ...latestBlockhash,
      });

      // All badge types - use camelCase for Anchor
      const allBadgeTypes = [
        { variant: { firstPurchase: {} }, index: 0 },
        { variant: { tenRedemptions: {} }, index: 1 },
        { variant: { fiftyRedemptions: {} }, index: 2 },
        { variant: { topReviewer: {} }, index: 3 },
        { variant: { earlyAdopter: {} }, index: 4 },
        { variant: { merchantPartner: {} }, index: 5 },
        { variant: { communityModerator: {} }, index: 6 },
      ];

      for (const config of allBadgeTypes) {
        const [testBadgePDA] = derivePDA(
          [
            Buffer.from("badge"),
            testUser.publicKey.toBuffer(),
            Buffer.from([config.index]),
          ],
          program.programId
        );

        const testMint = Keypair.generate();
        const [testMetadata] = deriveMetadataPDA(testMint.publicKey);
        const [testMasterEdition] = derivePDA(
          [
            Buffer.from("metadata"),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            testMint.publicKey.toBuffer(),
            Buffer.from("edition"),
          ],
          TOKEN_METADATA_PROGRAM_ID
        );

        await program.methods
          .mintBadge(config.variant)
          .accounts({
            badgeNft: testBadgePDA,
            mint: testMint.publicKey,
            metadata: testMetadata,
            masterEdition: testMasterEdition,
            user: testUser.publicKey,
            authority: accounts.marketplaceAuthority.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
          })
          .signers([testUser, testMint, accounts.marketplaceAuthority])
          .rpc();

        const badge = await program.account.badgeNft.fetch(testBadgePDA);
        assert.deepEqual(badge.badgeType, config.variant);
        assert.equal(badge.user.toString(), testUser.publicKey.toString());
      }
    });

    it("Verifies badge NFT mint has correct properties", async () => {
      const badge = await program.account.badgeNft.fetch(badgePDA);
      
      // Verify mint account exists
      const mintAccount = await connection.getAccountInfo(badge.mint);
      assert.isNotNull(mintAccount, "Mint account should exist");
      
      // Verify metadata account exists
      const metadataAccount = await connection.getAccountInfo(badge.metadata);
      assert.isNotNull(metadataAccount, "Metadata account should exist");

      // Verify master edition account exists
      const masterEditionAccount = await connection.getAccountInfo(badgeMasterEditionPDA);
      assert.isNotNull(masterEditionAccount, "Master edition account should exist");
    });

    it("Multiple users can have complete badge collections", async () => {
      const user3 = Keypair.generate();
      const user4 = Keypair.generate();
      
      // Airdrop to both users
      const sig1 = await connection.requestAirdrop(user3.publicKey, 5 * LAMPORTS_PER_SOL);
      const sig2 = await connection.requestAirdrop(user4.publicKey, 5 * LAMPORTS_PER_SOL);
      
      const latestBlockhash = await connection.getLatestBlockhash();
      await Promise.all([
        connection.confirmTransaction({ signature: sig1, ...latestBlockhash }),
        connection.confirmTransaction({ signature: sig2, ...latestBlockhash }),
      ]);

      const users = [user3, user4];
      const badgesToMint = [
        { variant: { firstPurchase: {} }, index: 0 },
        { variant: { tenRedemptions: {} }, index: 1 },
      ];

      for (const user of users) {
        for (const config of badgesToMint) {
          const [userBadgePDA] = derivePDA(
            [
              Buffer.from("badge"),
              user.publicKey.toBuffer(),
              Buffer.from([config.index]),
            ],
            program.programId
          );

          const userMint = Keypair.generate();
          const [userMetadata] = deriveMetadataPDA(userMint.publicKey);
          const [userMasterEdition] = derivePDA(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              userMint.publicKey.toBuffer(),
              Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
          );

          await program.methods
            .mintBadge(config.variant)
            .accounts({
              badgeNft: userBadgePDA,
              mint: userMint.publicKey,
              metadata: userMetadata,
              masterEdition: userMasterEdition,
              user: user.publicKey,
              authority: accounts.marketplaceAuthority.publicKey,
              tokenProgram: TOKEN_PROGRAM_ID,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
              sysvarInstructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
            })
            .signers([user, userMint, accounts.marketplaceAuthority])
            .rpc();

          const badge = await program.account.badgeNft.fetch(userBadgePDA);
          assert.equal(badge.user.toString(), user.publicKey.toString());
          assert.deepEqual(badge.badgeType, config.variant);
        }
      }
    });

    it("Verifies badge timestamps are set correctly", async () => {
      const badge = await program.account.badgeNft.fetch(badgePDA);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Badge should have been earned recently (within last hour)
      assert.isAbove(badge.earnedAt.toNumber(), currentTime - 3600);
      assert.isBelow(badge.earnedAt.toNumber(), currentTime + 60);
    });
  });
});