import { Router } from 'express';
import { merchantDashboardController } from '../controllers/merchant-dashboard';

const router = Router();

/**
 * @route   GET /api/v1/merchant-dashboard/:merchantAddress/analytics
 * @desc    Get comprehensive merchant analytics
 * @access  Private (Merchant)
 */
router.get('/:merchantAddress/analytics', merchantDashboardController.getAnalytics.bind(merchantDashboardController));

/**
 * @route   GET /api/v1/merchant-dashboard/:merchantAddress/recent-activity
 * @desc    Get recent merchant activity
 * @access  Private (Merchant)
 */
router.get('/:merchantAddress/recent-activity', merchantDashboardController.getRecentActivity.bind(merchantDashboardController));

/**
 * @route   GET /api/v1/merchant-dashboard/:merchantAddress/deals
 * @desc    Get all deals/promotions created by merchant
 * @access  Private (Merchant)
 */
router.get('/:merchantAddress/deals', merchantDashboardController.getMerchantDeals.bind(merchantDashboardController));

export default router;
