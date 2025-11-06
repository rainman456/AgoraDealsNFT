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

// PUT /api/v1/promotions/:promotionId
router.put('/:promotionId', promotionController.update.bind(promotionController));

// DELETE /api/v1/promotions/:promotionId
router.delete('/:promotionId', promotionController.delete.bind(promotionController));

// PATCH /api/v1/promotions/:promotionId/pause
router.patch('/:promotionId/pause', promotionController.pause.bind(promotionController));

// PATCH /api/v1/promotions/:promotionId/resume
router.patch('/:promotionId/resume', promotionController.resume.bind(promotionController));

export default router;
