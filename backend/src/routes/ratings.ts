import { Router } from 'express';
import { ratingController } from '../controllers/rating';

const router = Router();

// POST /api/v1/ratings/rate
router.post('/rate', ratingController.ratePromotion.bind(ratingController));

// GET /api/v1/ratings/promotion/:promotionId
router.get('/promotion/:promotionId', ratingController.getPromotionRatings.bind(ratingController));

// GET /api/v1/ratings/user/:userAddress
router.get('/user/:userAddress', ratingController.getUserRatings.bind(ratingController));

// GET /api/v1/ratings/:promotionId/:userAddress
router.get('/:promotionId/:userAddress', ratingController.getUserPromotionRating.bind(ratingController));

export default router;
