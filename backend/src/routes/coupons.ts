import { Router } from 'express';
import { couponController } from '../controllers/coupon';

const router = Router();

// GET /api/v1/coupons - List all coupons
router.get('/', couponController.list.bind(couponController));

// POST /api/v1/coupons/mint
router.post('/mint', couponController.mint.bind(couponController));

// GET /api/v1/coupons/my-coupons
router.get('/my-coupons', couponController.getMyCoupons.bind(couponController));

// GET /api/v1/coupons/:couponId
router.get('/:couponId', couponController.getDetails.bind(couponController));

// POST /api/v1/coupons/transfer
router.post('/transfer', couponController.transfer.bind(couponController));

export default router;
