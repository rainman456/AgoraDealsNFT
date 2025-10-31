import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { logger } from '../utils/logger';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class StakingController {
  /**
   * GET /api/v1/staking/pool
   * Get staking pool information
   */
  async getStakingPool(_req: Request, res: Response): Promise<void> {
    try {
      // Derive staking pool PDA
      const [stakingPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        solanaService.program.programId
      );

      try {
        const stakingPool = await solanaService.program.account.stakingPool.fetch(stakingPoolPDA);

        res.json({
          success: true,
          data: {
            address: stakingPoolPDA.toString(),
            authority: stakingPool.authority.toString(),
            totalStaked: stakingPool.totalStaked.toString(),
            totalRewardsDistributed: stakingPool.totalRewardsDistributed.toString(),
            rewardRatePerDay: stakingPool.rewardRatePerDay.toString(),
            minStakeDuration: stakingPool.minStakeDuration.toString(),
            isActive: stakingPool.isActive,
            createdAt: new Date(stakingPool.createdAt.toNumber() * 1000).toISOString(),
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'Staking pool not initialized',
        });
      }
    } catch (error) {
      logger.error('Error in getStakingPool:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch staking pool',
      });
    }
  }

  /**
   * POST /api/v1/staking/stake
   * Stake a coupon
   */
  async stakeCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { couponId, durationDays } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || !durationDays || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, durationDays, walletAddress',
        });
      }

      const couponPubkey = new PublicKey(couponId);
      const userPubkey = new PublicKey(walletAddress);

      // Derive stake account PDA
      const [stakeAccountPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('stake_account'),
          userPubkey.toBuffer(),
          couponPubkey.toBuffer(),
        ],
        solanaService.program.programId
      );

      // Derive staking pool PDA
      const [stakingPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        solanaService.program.programId
      );

      res.json({
        success: true,
        data: {
          stakeAccountPDA: stakeAccountPDA.toString(),
          stakingPoolPDA: stakingPoolPDA.toString(),
          couponPDA: couponPubkey.toString(),
          durationDays,
          message: 'Ready to stake coupon',
        },
      });
    } catch (error) {
      logger.error('Error in stakeCoupon:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stake coupon',
      });
    }
  }

  /**
   * GET /api/v1/staking/user/:userAddress
   * Get all stake accounts for a user
   */
  async getUserStakes(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;
      const { page, limit } = getPaginationParams(req);

      const userPubkey = new PublicKey(userAddress);

      // Fetch all stake accounts for this user
      const allStakes = await solanaService.program.account.stakeAccount.all([
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
      const paginatedStakes = allStakes.slice(startIndex, endIndex);

      const stakes = paginatedStakes.map((s) => ({
        address: s.publicKey.toString(),
        user: s.account.user.toString(),
        coupon: s.account.coupon.toString(),
        nftMint: s.account.nftMint.toString(),
        amountStaked: s.account.amountStaked.toString(),
        stakedAt: new Date(s.account.stakedAt.toNumber() * 1000).toISOString(),
        unlockAt: new Date(s.account.unlockAt.toNumber() * 1000).toISOString(),
        durationDays: s.account.durationDays.toString(),
        rewardsEarned: s.account.rewardsEarned.toString(),
        isActive: s.account.isActive,
        claimedAt: s.account.claimedAt
          ? new Date(s.account.claimedAt.toNumber() * 1000).toISOString()
          : null,
      }));

      res.json({
        success: true,
        data: {
          stakes,
          pagination: createPaginationResult(allStakes.length, page, limit),
        },
      });
    } catch (error) {
      logger.error('Error in getUserStakes:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user stakes',
      });
    }
  }

  /**
   * GET /api/v1/staking/coupon/:couponId
   * Get stake account for a specific coupon
   */
  async getCouponStake(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.params;
      const couponPubkey = new PublicKey(couponId);

      // Fetch all stake accounts for this coupon
      const stakes = await solanaService.program.account.stakeAccount.all([
        {
          memcmp: {
            offset: 8 + 32, // Skip discriminator + user pubkey
            bytes: couponPubkey.toBase58(),
          },
        },
      ]);

      if (stakes.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No stake found for this coupon',
        });
      }

      const stake = stakes[0];

      res.json({
        success: true,
        data: {
          address: stake.publicKey.toString(),
          user: stake.account.user.toString(),
          coupon: stake.account.coupon.toString(),
          nftMint: stake.account.nftMint.toString(),
          amountStaked: stake.account.amountStaked.toString(),
          stakedAt: new Date(stake.account.stakedAt.toNumber() * 1000).toISOString(),
          unlockAt: new Date(stake.account.unlockAt.toNumber() * 1000).toISOString(),
          durationDays: stake.account.durationDays.toString(),
          rewardsEarned: stake.account.rewardsEarned.toString(),
          isActive: stake.account.isActive,
          claimedAt: stake.account.claimedAt
            ? new Date(stake.account.claimedAt.toNumber() * 1000).toISOString()
            : null,
        },
      });
    } catch (error) {
      logger.error('Error in getCouponStake:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch coupon stake',
      });
    }
  }

  /**
   * POST /api/v1/staking/claim
   * Claim staking rewards
   */
  async claimRewards(req: Request, res: Response): Promise<void> {
    try {
      const { couponId } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, walletAddress',
        });
      }

      const couponPubkey = new PublicKey(couponId);
      const userPubkey = new PublicKey(walletAddress);

      // Derive stake account PDA
      const [stakeAccountPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('stake_account'),
          userPubkey.toBuffer(),
          couponPubkey.toBuffer(),
        ],
        solanaService.program.programId
      );

      // Derive staking pool PDA
      const [stakingPoolPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('staking_pool')],
        solanaService.program.programId
      );

      // Fetch stake account to check if it can be claimed
      try {
        const stakeAccount = await solanaService.program.account.stakeAccount.fetch(stakeAccountPDA);

        const currentTime = Math.floor(Date.now() / 1000);
        const unlockTime = stakeAccount.unlockAt.toNumber();

        if (currentTime < unlockTime) {
          res.status(400).json({
            success: false,
            error: 'Stake period has not matured yet',
            unlockAt: new Date(unlockTime * 1000).toISOString(),
          });
          return;
        }

        if (!stakeAccount.isActive) {
          res.status(400).json({
            success: false,
            error: 'Stake is not active',
          });
          return;
        }

        res.json({
          success: true,
          data: {
            stakeAccountPDA: stakeAccountPDA.toString(),
            stakingPoolPDA: stakingPoolPDA.toString(),
            couponPDA: couponPubkey.toString(),
            rewardsEarned: stakeAccount.rewardsEarned.toString(),
            message: 'Ready to claim rewards',
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          error: 'Stake account not found',
        });
      }
    } catch (error) {
      logger.error('Error in claimRewards:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to claim rewards',
      });
    }
  }
}

export const stakingController = new StakingController();