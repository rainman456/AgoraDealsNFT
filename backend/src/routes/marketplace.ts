import { Router } from 'express';
import { marketplaceController } from '../controllers/marketplace';

const router = Router();

// POST /api/v1/marketplace/list
router.post('/list', marketplaceController.listCoupon.bind(marketplaceController));

// GET /api/v1/marketplace/listings
router.get('/listings', marketplaceController.getListings.bind(marketplaceController));

// POST /api/v1/marketplace/buy
router.post('/buy', marketplaceController.buyCoupon.bind(marketplaceController));

// POST /api/v1/marketplace/cancel
router.post('/cancel', marketplaceController.cancelListing.bind(marketplaceController));

export default router;
