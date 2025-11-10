import { Request, Response } from 'express';
import { Comment } from '../models/comment';
import { Promotion } from '../models/promotion';
import { logger } from '../utils/logger';

export const commentController = {
  // List comments for a promotion
  async list(req: Request, res: Response) {
    try {
      const { promotionId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);

      const comments = await Comment.find({ promotion: promotionId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Comment.countDocuments({ promotion: promotionId });

      res.json({
        comments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Error listing comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  },

  // Create a comment
  async create(req: Request, res: Response) {
    try {
      const { promotionId } = req.params;
      const { content, parentComment } = req.body;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      if (!content || content.length > 500) {
        return res.status(400).json({ error: 'Invalid comment content' });
      }

      // Verify promotion exists
      const promotion = await Promotion.findOne({ onChainAddress: promotionId });
      if (!promotion) {
        return res.status(404).json({ error: 'Promotion not found' });
      }

      const comment = new Comment({
        onChainAddress: `comment${Math.random().toString(36).substring(7)}`,
        user: walletAddress,
        promotion: promotionId,
        content,
        parentComment,
        likes: 0,
        isMerchantReply: false,
      });

      await comment.save();

      // Update promotion stats
      await Promotion.updateOne(
        { onChainAddress: promotionId },
        { $inc: { 'stats.totalComments': 1 } }
      );

      return res.status(201).json(comment);
    } catch (error) {
      logger.error('Error creating comment:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
    }
  },

  // Like a comment
  async like(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      const comment = await Comment.findOne({ onChainAddress: commentId });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Increment likes
      comment.likes += 1;
      await comment.save();

      return res.json(comment);
    } catch (error) {
      logger.error('Error liking comment:', error);
      return res.status(500).json({ error: 'Failed to like comment' });
    }
  },

  // Delete a comment
  async delete(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
      }

      const comment = await Comment.findOne({ onChainAddress: commentId });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Verify ownership
      if (comment.user !== walletAddress) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }

      await Comment.deleteOne({ onChainAddress: commentId });

      // Update promotion stats
      await Promotion.updateOne(
        { onChainAddress: comment.promotion },
        { $inc: { 'stats.totalComments': -1 } }
      );

      return res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      logger.error('Error deleting comment:', error);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }
  },
};
