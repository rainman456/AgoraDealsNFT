import { Router } from 'express';
import { userStatsController } from '../controllers/user-stats';

const router = Router();

// GET /api/v1/user-stats/leaderboard
router.get('/leaderboard', userStatsController.getLeaderboard.bind(userStatsController));

// GET /api/v1/user-stats/stats/overview
router.get('/stats/overview', userStatsController.getPlatformStats.bind(userStatsController));

// GET /api/v1/user-stats/:userAddress/badges (must come before /:userAddress)
router.get('/:userAddress/badges', userStatsController.getUserBadges.bind(userStatsController));

// GET /api/v1/user-stats/:userAddress
router.get('/:userAddress', userStatsController.getUserStats.bind(userStatsController));

export default router;
