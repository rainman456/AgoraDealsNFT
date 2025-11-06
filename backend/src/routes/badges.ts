import { Router } from 'express';
import { badgeController } from '../controllers/badge';

const router = Router();

// GET /api/v1/badges/types
router.get('/types', badgeController.getBadgeTypes.bind(badgeController));

// POST /api/v1/badges/mint
router.post('/mint', badgeController.mintBadge.bind(badgeController));

// POST /api/v1/badges/auto-award
router.post('/auto-award', badgeController.autoAwardBadge.bind(badgeController));

// GET /api/v1/badges/user/:userAddress
// GET /api/v1/badges/user/ (with wallet from header)
router.get('/user/:userAddress?', badgeController.getUserBadgeNFTs.bind(badgeController));

// GET /api/v1/badges/check-eligibility/:userAddress
router.get('/check-eligibility/:userAddress', badgeController.checkEligibility.bind(badgeController));

export default router;
