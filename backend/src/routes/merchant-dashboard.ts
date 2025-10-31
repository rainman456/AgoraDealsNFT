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

export default router;
