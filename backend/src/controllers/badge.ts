import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { BADGE_NAMES, BADGE_DESCRIPTIONS } from '../types/badge-enums';

// Badge type enum matching the contract
enum BadgeType {
  FirstPurchase = 0,
  TenRedemptions = 1,
  FiftyRedemptions = 2,
  TopReviewer = 3,
  EarlyAdopter = 4,
  MerchantPartner = 5,
  CommunityModerator = 6,
}

const BADGE_NAMES_BY_INDEX: Record<number, string> = {
  [BadgeType.FirstPurchase]: 'First Purchase',
  [BadgeType.TenRedemptions]: '10 Redemptions',
  [BadgeType.FiftyRedemptions]: '50 Redemptions',
  [BadgeType.TopReviewer]: 'Top Reviewer',
  [BadgeType.EarlyAdopter]: 'Early Adopter',
  [BadgeType.MerchantPartner]: 'Merchant Partner',
  [BadgeType.CommunityModerator]: 'Community Moderator',
};

const BADGE_DESCRIPTIONS_BY_INDEX: Record<number, string> = {
  [BadgeType.FirstPurchase]: 'Awarded for making your first coupon purchase',
  [BadgeType.TenRedemptions]: 'Awarded for redeeming 10 coupons',
  [BadgeType.FiftyRedemptions]: 'Awarded for redeeming 50 coupons',
  [BadgeType.TopReviewer]: 'Awarded for submitting 20 ratings',
  [BadgeType.EarlyAdopter]: 'Awarded to early platform users',
  [BadgeType.MerchantPartner]: 'Awarded to verified merchant partners',
  [BadgeType.CommunityModerator]: 'Awarded to community moderators',
};

function getBadgeName(badgeType: any): string {
  if (typeof badgeType === 'object') {
    const key = Object.keys(badgeType)[0];
    return BADGE_NAMES[key] || 'Unknown';
  }
  return BADGE_NAMES_BY_INDEX[badgeType] || 'Unknown';
}

function getBadgeDescription(badgeType: any): string {
  if (typeof badgeType === 'object') {
    const key = Object.keys(badgeType)[0];
    return BADGE_DESCRIPTIONS[key] || '';
  }
  return BADGE_DESCRIPTIONS_BY_INDEX[badgeType] || '';
}

export class BadgeController {
  /**
   * GET /api/v1/badges/types
   * Get all available badge types
   */
  async getBadgeTypes(_req: Request, res: Response): Promise<void> {
    try {
      const badgeTypes = Object.keys(BadgeType)
        .filter((key) => !isNaN(Number(key)))
        .map((key) => {
          const value = parseInt(key);
          return {
            type: value,
            name: BADGE_NAMES_BY_INDEX[value],
            description: BADGE_DESCRIPTIONS_BY_INDEX[value],
          };
        });

      res.json({
        success: true,
        data: {
          badges: badgeTypes,
        },
      });
    } catch (error) {
      logger.error('Error in getBadgeTypes:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch badge types',
      });
    }
  }

  /**
   * POST /api/v1/badges/mint
   * Mint a badge NFT
   */
  async mintBadge(req: Request, res: Response): Promise<void> {
    try {
      const { badgeType } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (badgeType === undefined || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: badgeType, walletAddress',
        });
      }

      if (badgeType < 0 || badgeType > 6) {
        res.status(400).json({
          success: false,
          error: 'Invalid badge type',
        });
      }

      const userPubkey = new PublicKey(walletAddress);

      // Derive user stats PDA
      const [userStatsPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_stats'), userPubkey.toBuffer()],
        solanaService.program.programId
      );

      // Check if user is eligible for this badge
      try {
        const userStats = await solanaService.program.account.userStats.fetch(userStatsPDA);

        const badgesEarned = Array.isArray(userStats.badgesEarned)
          ? userStats.badgesEarned
          : Array.from(userStats.badgesEarned);

        if (badgesEarned.includes(badgeType)) {
          res.status(400).json({
            success: false,
            error: 'Badge already earned',
          });
        }

        // Check eligibility based on badge type
        let isEligible = false;
        switch (badgeType) {
          case BadgeType.FirstPurchase:
            isEligible = userStats.totalPurchases >= 1;
            break;
          case BadgeType.TenRedemptions:
            isEligible = userStats.totalRedemptions >= 10;
            break;
          case BadgeType.FiftyRedemptions:
            isEligible = userStats.totalRedemptions >= 50;
            break;
          case BadgeType.TopReviewer:
            isEligible = userStats.totalRatingsGiven >= 20;
            break;
          default:
            isEligible = false;
        }

        if (!isEligible) {
          res.status(400).json({
            success: false,
            error: 'User not eligible for this badge',
          });
        }

        res.json({
          success: true,
          data: {
            userStatsPDA: userStatsPDA.toString(),
            badgeType,
            badgeName: BADGE_NAMES[badgeType],
            message: 'Ready to mint badge',
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'User stats not found',
        });
      }
    } catch (error) {
      logger.error('Error in mintBadge:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mint badge',
      });
    }
  }

  /**
   * POST /api/v1/badges/auto-award
   * Auto-award a badge to a user
   */
  async autoAwardBadge(req: Request, res: Response): Promise<void> {
    try {
      const { badgeType } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (badgeType === undefined || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: badgeType, walletAddress',
        });
      }

      if (badgeType < 0 || badgeType > 6) {
        res.status(400).json({
          success: false,
          error: 'Invalid badge type',
        });
      }

      const userPubkey = new PublicKey(walletAddress);

      // Derive user stats PDA
      const [userStatsPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_stats'), userPubkey.toBuffer()],
        solanaService.program.programId
      );

      res.json({
        success: true,
        data: {
          userStatsPDA: userStatsPDA.toString(),
          badgeType,
          badgeName: BADGE_NAMES[badgeType],
          message: 'Ready to auto-award badge',
        },
      });
    } catch (error) {
      logger.error('Error in autoAwardBadge:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to auto-award badge',
      });
    }
  }

  /**
   * GET /api/v1/badges/user/:userAddress
   * Get all badge NFTs for a user
   */
  async getUserBadgeNFTs(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;
      const walletFromHeader = req.headers['x-wallet-address'] as string;
      const finalUserAddress = userAddress || walletFromHeader;
      
      if (!finalUserAddress) {
        res.status(400).json({
          success: false,
          error: 'User address is required',
        });
        return;
      }
      
      const { page, limit } = getPaginationParams(req);

      const userPubkey = new PublicKey(finalUserAddress);

      // Fetch all badge NFTs for this user
      const allBadges = await solanaService.program.account.badgeNft.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: userPubkey.toBase58(),
          },
        },
      ]);

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBadges = allBadges.slice(startIndex, endIndex);

      const badges = paginatedBadges.map((b) => ({
        address: b.publicKey.toString(),
        user: b.account.user.toString(),
        badgeType: {
          value: b.account.badgeType,
          name: getBadgeName(b.account.badgeType),
          description: getBadgeDescription(b.account.badgeType),
        },
        mint: b.account.mint.toString(),
        metadata: b.account.metadata.toString(),
        metadataUri: b.account.metadataUri,
        earnedAt: new Date(b.account.earnedAt.toNumber() * 1000).toISOString(),
      }));

      res.json({
        success: true,
        data: {
          badges,
          pagination: createPaginationResult(allBadges.length, page, limit),
        },
      });
    } catch (error) {
      logger.error('Error in getUserBadgeNFTs:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user badges',
      });
    }
  }

  /**
   * GET /api/v1/badges/check-eligibility/:userAddress
   * Check which badges a user is eligible for
   */
  async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;
      const userPubkey = new PublicKey(userAddress);

      // Derive user stats PDA
      const [userStatsPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_stats'), userPubkey.toBuffer()],
        solanaService.program.programId
      );

      try {
        const userStats = await solanaService.program.account.userStats.fetch(userStatsPDA);

        const badgesEarned = Array.isArray(userStats.badgesEarned)
          ? userStats.badgesEarned
          : Array.from(userStats.badgesEarned);

        const eligibility = [
          {
            type: BadgeType.FirstPurchase,
            name: BADGE_NAMES[BadgeType.FirstPurchase],
            description: BADGE_DESCRIPTIONS[BadgeType.FirstPurchase],
            isEligible: userStats.totalPurchases >= 1,
            isEarned: badgesEarned.includes(BadgeType.FirstPurchase),
            progress: {
              current: userStats.totalPurchases,
              required: 1,
            },
          },
          {
            type: BadgeType.TenRedemptions,
            name: BADGE_NAMES[BadgeType.TenRedemptions],
            description: BADGE_DESCRIPTIONS[BadgeType.TenRedemptions],
            isEligible: userStats.totalRedemptions >= 10,
            isEarned: badgesEarned.includes(BadgeType.TenRedemptions),
            progress: {
              current: userStats.totalRedemptions,
              required: 10,
            },
          },
          {
            type: BadgeType.FiftyRedemptions,
            name: BADGE_NAMES[BadgeType.FiftyRedemptions],
            description: BADGE_DESCRIPTIONS[BadgeType.FiftyRedemptions],
            isEligible: userStats.totalRedemptions >= 50,
            isEarned: badgesEarned.includes(BadgeType.FiftyRedemptions),
            progress: {
              current: userStats.totalRedemptions,
              required: 50,
            },
          },
          {
            type: BadgeType.TopReviewer,
            name: BADGE_NAMES[BadgeType.TopReviewer],
            description: BADGE_DESCRIPTIONS[BadgeType.TopReviewer],
            isEligible: userStats.totalRatingsGiven >= 20,
            isEarned: badgesEarned.includes(BadgeType.TopReviewer),
            progress: {
              current: userStats.totalRatingsGiven,
              required: 20,
            },
          },
        ];

        res.json({
          success: true,
          data: {
            eligibility,
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'User stats not found',
        });
      }
    } catch (error) {
      logger.error('Error in checkEligibility:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check eligibility',
      });
    }
  }
}

export const badgeController = new BadgeController();
