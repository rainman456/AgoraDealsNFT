import { Router } from 'express';
import { redemptionController } from '../controllers/redemption';

const router = Router();

// POST /api/v1/redemption/generate-qr
router.post('/generate-qr', redemptionController.generateQR.bind(redemptionController));

// POST /api/v1/redemption/redeem
router.post('/redeem', redemptionController.redeem.bind(redemptionController));

// GET /api/v1/redemption/:couponId/status
router.get('/:couponId/status', redemptionController.getStatus.bind(redemptionController));

export default router;
