import { Router } from 'express';
import { stakingController } from '../controllers/staking';

const router = Router();

// GET /api/v1/staking/pool
router.get('/pool', stakingController.getStakingPool.bind(stakingController));

// POST /api/v1/staking/stake
router.post('/stake', stakingController.stakeCoupon.bind(stakingController));

// POST /api/v1/staking/claim
router.post('/claim', stakingController.claimRewards.bind(stakingController));

// GET /api/v1/staking/user/:userAddress
router.get('/user/:userAddress', stakingController.getUserStakes.bind(stakingController));

// GET /api/v1/staking/coupon/:couponId
router.get('/coupon/:couponId', stakingController.getCouponStake.bind(stakingController));

export default router;
