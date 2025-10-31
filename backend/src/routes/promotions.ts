import { Router } from 'express';
import { promotionController } from '../controllers/promotion';

const router = Router();

// POST /api/v1/promotions
router.post('/', promotionController.create.bind(promotionController));

// GET /api/v1/promotions
router.get('/', promotionController.list.bind(promotionController));

// GET /api/v1/promotions/:promotionId
router.get('/:promotionId', promotionController.getDetails.bind(promotionController));

// POST /api/v1/promotions/rate
router.post('/rate', promotionController.rate.bind(promotionController));

// POST /api/v1/promotions/comment
router.post('/comment', promotionController.addComment.bind(promotionController));

export default router;
