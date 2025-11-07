import { Router } from 'express';
import { commentController } from '../controllers/comment';

const router = Router();

// GET /api/v1/promotions/:promotionId/comments - List comments for a promotion
router.get('/promotions/:promotionId/comments', commentController.list);

// POST /api/v1/promotions/:promotionId/comments - Create a comment
router.post('/promotions/:promotionId/comments', commentController.create);

// POST /api/v1/comments/:commentId/like - Like a comment
router.post('/comments/:commentId/like', commentController.like);

// DELETE /api/v1/comments/:commentId - Delete a comment
router.delete('/comments/:commentId', commentController.delete);

export default router;
