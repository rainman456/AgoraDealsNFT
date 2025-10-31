import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { BADGE_NAMES, TIER_NAMES, ReputationTier } from '../types/badge-enums';

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

const TIER_NAMES_BY_INDEX: Record<number, string> = {
  [ReputationTier.Bronze]: 'Bronze',
  [ReputationTier.Silver]: 'Silver',
  [ReputationTier.Gold]: 'Gold',
  [ReputationTier.Platinum]: 'Platinum',
  [ReputationTier.Diamond]: 'Diamond',
};

function getTierName(tier: any): string {
  if (typeof tier === 'object') {
    const key = Object.keys(tier)[0];
    return TIER_NAMES[key] || 'Unknown';
  }
  return TIER_NAMES_BY_INDEX[tier] || 'Unknown';
}

function getBadgeName(badgeType: any): string {
  if (typeof badgeType === 'object') {
    const key = Object.keys(badgeType)[0];
    return BADGE_NAMES[key] || 'Unknown';
  }
  return BADGE_NAMES_BY_INDEX[badgeType] || 'Unknown';
}

export class UserStatsController {
  /**
   * GET /api/v1/user-stats/:userAddress
   * Get user stats for a specific user
   */
  async getUserStats(req: Request, res: Response): Promise<void> {
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

        // Convert badges from Buffer to array if needed
        const badgesEarned = Array.isArray(userStats.badgesEarned)
          ? userStats.badgesEarned
          : Array.from(userStats.badgesEarned);

        const badges = badgesEarned.map((badgeType: number) => ({
          type: badgeType,
          name: getBadgeName(badgeType),
        }));

        res.json({
          success: true,
          data: {
            address: userStatsPDA.toString(),
            user: userStats.user.toString(),
            totalPurchases: userStats.totalPurchases,
            totalRedemptions: userStats.totalRedemptions,
            totalRatingsGiven: userStats.totalRatingsGiven,
            totalComments: userStats.totalComments,
            totalListings: userStats.totalListings,
            reputationScore: userStats.reputationScore.toString(),
            tier: {
              value: userStats.tier,
              name: getTierName(userStats.tier),
            },
            badges,
            joinedAt: new Date(userStats.joinedAt.toNumber() * 1000).toISOString(),
            lastActivity: new Date(userStats.lastActivity.toNumber() * 1000).toISOString(),
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'User stats not found',
        });
      }
    } catch (error) {
      logger.error('Error in getUserStats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user stats',
      });
    }
  }

  /**
   * GET /api/v1/user-stats/leaderboard
   * Get leaderboard of users by reputation score
   */
  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit } = getPaginationParams(req);
      const { tier } = req.query;

      // Fetch all user stats
      let allUserStats = await solanaService.program.account.userStats.all();

      // Filter by tier if specified
      if (tier !== undefined) {
        const tierName = tier as string;
        // Map tier names to enum values
        const tierMap: Record<string, string> = {
          '0': 'bronze',
          '1': 'silver',
          '2': 'gold',
          '3': 'platinum',
          '4': 'diamond',
          'bronze': 'bronze',
          'silver': 'silver',
          'gold': 'gold',
          'platinum': 'platinum',
          'diamond': 'diamond'
        };
        const mappedTier = tierMap[tierName.toLowerCase()];
        if (mappedTier) {
          allUserStats = allUserStats.filter((u) => {
            const accountTier = u.account.tier as any;
            return accountTier[mappedTier] !== undefined;
          });
        }
      }

      // Sort by reputation score (descending)
      allUserStats.sort((a, b) => {
        const scoreA = a.account.reputationScore.toNumber();
        const scoreB = b.account.reputationScore.toNumber();
        return scoreB - scoreA;
      });

      // Paginate results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = allUserStats.slice(startIndex, endIndex);

      const leaderboard = paginatedUsers.map((u, index) => {
        const badgesEarned = Array.isArray(u.account.badgesEarned)
          ? u.account.badgesEarned
          : Array.from(u.account.badgesEarned);

        return {
          rank: startIndex + index + 1,
          address: u.publicKey.toString(),
          user: u.account.user.toString(),
          reputationScore: u.account.reputationScore.toString(),
          tier: {
            value: u.account.tier,
            name: getTierName(u.account.tier),
          },
          totalPurchases: u.account.totalPurchases,
          totalRedemptions: u.account.totalRedemptions,
          totalRatingsGiven: u.account.totalRatingsGiven,
          badgeCount: badgesEarned.length,
          joinedAt: new Date(u.account.joinedAt.toNumber() * 1000).toISOString(),
        };
      });

      res.json({
        success: true,
        data: {
          leaderboard,
          pagination: createPaginationResult(allUserStats.length, page, limit),
        },
      });
    } catch (error) {
      logger.error('Error in getLeaderboard:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
      });
    }
  }

  /**
   * GET /api/v1/user-stats/:userAddress/badges
   * Get all badges earned by a user
   */
  async getUserBadges(req: Request, res: Response): Promise<void> {
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

        // Convert badges from Buffer to array if needed
        const badgesEarned = Array.isArray(userStats.badgesEarned)
          ? userStats.badgesEarned
          : Array.from(userStats.badgesEarned);

        const badges = badgesEarned.map((badgeType: number) => ({
          type: badgeType,
          name: getBadgeName(badgeType),
        }));

        // Fetch badge NFTs for this user
        const badgeNFTs = await solanaService.program.account.badgeNft.all([
          {
            memcmp: {
              offset: 8, // Skip discriminator
              bytes: userPubkey.toBase58(),
            },
          },
        ]);

        const nfts = badgeNFTs.map((nft) => ({
          address: nft.publicKey.toString(),
          badgeType: {
            value: nft.account.badgeType,
            name: getBadgeName(nft.account.badgeType),
          },
          mint: nft.account.mint.toString(),
          metadata: nft.account.metadata.toString(),
          metadataUri: nft.account.metadataUri,
          earnedAt: new Date(nft.account.earnedAt.toNumber() * 1000).toISOString(),
        }));

        res.json({
          success: true,
          data: {
            badges,
            nfts,
            totalBadges: badges.length,
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'User stats not found',
        });
      }
    } catch (error) {
      logger.error('Error in getUserBadges:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user badges',
      });
    }
  }

  /**
   * GET /api/v1/user-stats/stats/overview
   * Get platform-wide statistics
   */
  async getPlatformStats(_req: Request, res: Response): Promise<void> {
    try {
      // Fetch all user stats
      const allUserStats = await solanaService.program.account.userStats.all();

      const totalUsers = allUserStats.length;
      const totalPurchases = allUserStats.reduce((sum, u) => sum + u.account.totalPurchases, 0);
      const totalRedemptions = allUserStats.reduce((sum, u) => sum + u.account.totalRedemptions, 0);
      const totalRatings = allUserStats.reduce((sum, u) => sum + u.account.totalRatingsGiven, 0);
      const totalComments = allUserStats.reduce((sum, u) => sum + u.account.totalComments, 0);

      // Count users by tier
      const tierDistribution = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0,
        diamond: 0,
      };

      allUserStats.forEach((u) => {
        const tier = u.account.tier;
        if (typeof tier === 'object') {
          const key = Object.keys(tier)[0] as keyof typeof tierDistribution;
          if (key in tierDistribution) tierDistribution[key]++;
        } else {
          switch (tier) {
            case ReputationTier.Bronze:
              tierDistribution.bronze++;
              break;
            case ReputationTier.Silver:
              tierDistribution.silver++;
              break;
            case ReputationTier.Gold:
              tierDistribution.gold++;
              break;
            case ReputationTier.Platinum:
              tierDistribution.platinum++;
              break;
            case ReputationTier.Diamond:
              tierDistribution.diamond++;
              break;
          }
        }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          totalPurchases,
          totalRedemptions,
          totalRatings,
          totalComments,
          tierDistribution,
        },
      });
    } catch (error) {
      logger.error('Error in getPlatformStats:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch platform stats',
      });
    }
  }
}

export const userStatsController = new UserStatsController();
