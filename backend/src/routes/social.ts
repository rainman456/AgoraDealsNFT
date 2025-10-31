import { Router } from 'express';
import { socialController } from '../controllers/social';

const router = Router();

/**
 * @route   POST /api/v1/social/share
 * @desc    Track coupon/promotion share
 * @access  Public
 */
router.post('/share', socialController.trackShare.bind(socialController));

/**
 * @route   POST /api/v1/social/view
 * @desc    Track coupon/promotion view
 * @access  Public
 */
router.post('/view', socialController.trackView.bind(socialController));

/**
 * @route   GET /api/v1/social/trending
 * @desc    Get trending coupons/promotions
 * @access  Public
 */
router.get('/trending', socialController.getTrending.bind(socialController));

/**
 * @route   GET /api/v1/social/popular
 * @desc    Get popular coupons by category
 * @access  Public
 */
router.get('/popular', socialController.getPopular.bind(socialController));

/**
 * @route   POST /api/v1/social/rate
 * @desc    Rate a coupon or promotion
 * @access  Private
 */
router.post('/rate', socialController.rateCoupon.bind(socialController));

/**
 * @route   GET /api/v1/social/feed
 * @desc    Get personalized social feed
 * @access  Public
 */
router.get('/feed', socialController.getFeed.bind(socialController));

export default router;
