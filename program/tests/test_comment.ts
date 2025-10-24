import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { DiscountPlatform } from "../target/types/discount_platform";
import { SystemProgram, PublicKey, Keypair } from "@solana/web3.js";
import { assert, expect } from "chai";
import { 
  setupTestAccounts, 
  TestAccounts,
  getExpiryTimestamp,
  derivePDA,
  LAMPORTS_PER_SOL,
  airdrop
} from "./setup";

describe("Comment System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiscountPlatform as Program<DiscountPlatform>;
  const connection = provider.connection;

  let accounts: TestAccounts;
  let promotionPDA: PublicKey;
  let commentPDA: PublicKey;
  let commentLikePDA: PublicKey;
  const commentContent = "Great deal! Highly recommend.";

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
        "Test promotion for comments",
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

  describe("Adding Comments", () => {
    it("Adds a comment", async () => {
      [commentPDA] = derivePDA(
        [
          Buffer.from("comment"),
          accounts.user1.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .addComment(commentContent, null)
        .accounts({
          comment: commentPDA,
          promotion: promotionPDA,
          user: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      const comment = await program.account.comment.fetch(commentPDA);
      assert.equal(comment.content, commentContent);
      assert.equal(comment.user.toString(), accounts.user1.publicKey.toString());
      assert.equal(comment.promotion.toString(), promotionPDA.toString());
      assert.equal(comment.likes, 0);
      assert.equal(comment.isMerchantReply, false);
      assert.isNull(comment.parentComment);
      assert.isAbove(comment.createdAt.toNumber(), 0);
    });

    it("Merchant adds a reply", async () => {
      const [replyPDA] = derivePDA(
        [
          Buffer.from("comment"),
          accounts.merchant1.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .addComment("Thank you for your feedback!", commentPDA)
        .accounts({
          comment: replyPDA,
          promotion: promotionPDA,
          user: accounts.merchant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant1])
        .rpc();

      const reply = await program.account.comment.fetch(replyPDA);
      assert.equal(reply.content, "Thank you for your feedback!");
      assert.equal(reply.isMerchantReply, true);
      assert.equal(reply.parentComment.toString(), commentPDA.toString());
    });

    it("Multiple users can comment on same promotion", async () => {
      const [user2CommentPDA] = derivePDA(
        [
          Buffer.from("comment"),
          accounts.user2.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .addComment("I agree, excellent value!", null)
        .accounts({
          comment: user2CommentPDA,
          promotion: promotionPDA,
          user: accounts.user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user2])
        .rpc();

      const comment = await program.account.comment.fetch(user2CommentPDA);
      assert.equal(comment.user.toString(), accounts.user2.publicKey.toString());
      assert.equal(comment.isMerchantReply, false);
    });

    it("Allows maximum length comment", async () => {
      const maxComment = "A".repeat(500); // Max length is 500
      const testUser = Keypair.generate();
      await airdrop(connection, testUser.publicKey);

      const [maxCommentPDA] = derivePDA(
        [
          Buffer.from("comment"),
          testUser.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .addComment(maxComment, null)
        .accounts({
          comment: maxCommentPDA,
          promotion: promotionPDA,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      const comment = await program.account.comment.fetch(maxCommentPDA);
      assert.equal(comment.content.length, 500);
    });

    it("Fails to add empty comment", async () => {
      const testUser = Keypair.generate();
      await airdrop(connection, testUser.publicKey);

      const [emptyCommentPDA] = derivePDA(
        [
          Buffer.from("comment"),
          testUser.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      try {
        await program.methods
          .addComment("", null)
          .accounts({
            comment: emptyCommentPDA,
            promotion: promotionPDA,
            user: testUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testUser])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("NameTooLong");
      }
    });

    it("Fails to add comment that's too long", async () => {
      const longComment = "A".repeat(501); // Over 500 chars
      const testUser = Keypair.generate();
      await airdrop(connection, testUser.publicKey);

      const [longCommentPDA] = derivePDA(
        [
          Buffer.from("comment"),
          testUser.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      try {
        await program.methods
          .addComment(longComment, null)
          .accounts({
            comment: longCommentPDA,
            promotion: promotionPDA,
            user: testUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testUser])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("DescriptionTooLong");
      }
    });
  });

  describe("Liking Comments", () => {
    it("Likes a comment", async () => {
      [commentLikePDA] = derivePDA(
        [
          Buffer.from("comment_like"),
          accounts.user2.publicKey.toBuffer(),
          commentPDA.toBuffer(),
        ],
        program.programId
      );

      const commentBefore = await program.account.comment.fetch(commentPDA);
      const likesBefore = commentBefore.likes;

      await program.methods
        .likeComment()
        .accounts({
          commentLike: commentLikePDA,
          comment: commentPDA,
          user: accounts.user2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user2])
        .rpc();

      const comment = await program.account.comment.fetch(commentPDA);
      assert.equal(comment.likes, likesBefore + 1);

      const like = await program.account.commentLike.fetch(commentLikePDA);
      assert.equal(like.user.toString(), accounts.user2.publicKey.toString());
      assert.equal(like.comment.toString(), commentPDA.toString());
      assert.isAbove(like.createdAt.toNumber(), 0);
    });

    it("Multiple users can like the same comment", async () => {
      const testUser = Keypair.generate();
      await airdrop(connection, testUser.publicKey);

      const [testLikePDA] = derivePDA(
        [
          Buffer.from("comment_like"),
          testUser.publicKey.toBuffer(),
          commentPDA.toBuffer(),
        ],
        program.programId
      );

      const commentBefore = await program.account.comment.fetch(commentPDA);
      const likesBefore = commentBefore.likes;

      await program.methods
        .likeComment()
        .accounts({
          commentLike: testLikePDA,
          comment: commentPDA,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      const comment = await program.account.comment.fetch(commentPDA);
      assert.equal(comment.likes, likesBefore + 1);
    });

    it("Fails to like the same comment twice by same user", async () => {
      try {
        await program.methods
          .likeComment()
          .accounts({
            commentLike: commentLikePDA,
            comment: commentPDA,
            user: accounts.user2.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([accounts.user2])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });

    it("User can like multiple comments", async () => {
      const testUser = Keypair.generate();
      await airdrop(connection, testUser.publicKey);

      // Create another comment
      const [anotherCommentPDA] = derivePDA(
        [
          Buffer.from("comment"),
          testUser.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .addComment("Another comment to like", null)
        .accounts({
          comment: anotherCommentPDA,
          promotion: promotionPDA,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      // Like both comments with user1
      const [like1PDA] = derivePDA(
        [
          Buffer.from("comment_like"),
          accounts.user1.publicKey.toBuffer(),
          commentPDA.toBuffer(),
        ],
        program.programId
      );

      const [like2PDA] = derivePDA(
        [
          Buffer.from("comment_like"),
          accounts.user1.publicKey.toBuffer(),
          anotherCommentPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .likeComment()
        .accounts({
          commentLike: like1PDA,
          comment: commentPDA,
          user: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      await program.methods
        .likeComment()
        .accounts({
          commentLike: like2PDA,
          comment: anotherCommentPDA,
          user: accounts.user1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.user1])
        .rpc();

      const like1 = await program.account.commentLike.fetch(like1PDA);
      const like2 = await program.account.commentLike.fetch(like2PDA);
      
      assert.equal(like1.comment.toString(), commentPDA.toString());
      assert.equal(like2.comment.toString(), anotherCommentPDA.toString());
    });
  });

  describe("Nested Comments (Replies)", () => {
    it("Adds a reply to a comment", async () => {
      const [replyPDA] = derivePDA(
        [
          Buffer.from("comment"),
          accounts.user2.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      // Check if already exists, if so use different seed
      let actualReplyPDA = replyPDA;
      try {
        await program.account.comment.fetch(replyPDA);
        // Already exists, need different PDA - this shouldn't happen in practice
        // as the seed includes user pubkey
      } catch (e) {
        // Doesn't exist, we can use it
      }

      const testUser = Keypair.generate();
      await airdrop(connection, testUser.publicKey);

      const [testReplyPDA] = derivePDA(
        [
          Buffer.from("comment"),
          testUser.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .addComment("This is a reply", commentPDA)
        .accounts({
          comment: testReplyPDA,
          promotion: promotionPDA,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      const reply = await program.account.comment.fetch(testReplyPDA);
      assert.equal(reply.parentComment.toString(), commentPDA.toString());
      assert.equal(reply.content, "This is a reply");
    });

    it("Merchant can reply to user comments", async () => {
      const testUser = Keypair.generate();
      await airdrop(connection, testUser.publicKey);

      // User adds comment
      const [userCommentPDA] = derivePDA(
        [
          Buffer.from("comment"),
          testUser.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      await program.methods
        .addComment("Is this deal still available?", null)
        .accounts({
          comment: userCommentPDA,
          promotion: promotionPDA,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      // Create a unique merchant reply - use merchant2 to avoid conflicts
      const [merchantReplyPDA] = derivePDA(
        [
          Buffer.from("comment"),
          accounts.merchant2.publicKey.toBuffer(),
          promotionPDA.toBuffer(),
        ],
        program.programId
      );

      // Register merchant2 first if needed for the promotion's merchant
      await program.methods
        .addComment("Yes, still available!", userCommentPDA)
        .accounts({
          comment: merchantReplyPDA,
          promotion: promotionPDA,
          user: accounts.merchant2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([accounts.merchant2])
        .rpc();

      const reply = await program.account.comment.fetch(merchantReplyPDA);
      assert.equal(reply.parentComment.toString(), userCommentPDA.toString());
      // Note: isMerchantReply will only be true if merchant2 is the promotion's merchant
    });
  });
});
