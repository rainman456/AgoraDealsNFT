import { Router } from 'express';
import { groupDealController } from '../controllers/group-deal';

const router = Router();

/**
 * @route   POST /api/v1/group-deals/create
 * @desc    Create a new group deal
 * @access  Private (Merchant)
 */
router.post('/create', groupDealController.createGroupDeal.bind(groupDealController));

/**
 * @route   POST /api/v1/group-deals/:dealId/join
 * @desc    Join a group deal
 * @access  Private (User)
 */
router.post('/:dealId/join', groupDealController.joinGroupDeal.bind(groupDealController));

/**
 * @route   POST /api/v1/group-deals/:dealId/finalize
 * @desc    Finalize a group deal
 * @access  Private (Merchant)
 */
router.post('/:dealId/finalize', groupDealController.finalizeGroupDeal.bind(groupDealController));

/**
 * @route   GET /api/v1/group-deals
 * @desc    Get all group deals
 * @access  Public
 */
router.get('/', groupDealController.getGroupDeals.bind(groupDealController));

/**
 * @route   GET /api/v1/group-deals/:dealId
 * @desc    Get group deal details
 * @access  Public
 */
router.get('/:dealId', groupDealController.getGroupDeal.bind(groupDealController));

export default router;
