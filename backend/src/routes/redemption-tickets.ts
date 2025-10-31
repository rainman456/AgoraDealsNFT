import { Router } from 'express';
import { redemptionTicketController } from '../controllers/redemption-ticket';

const router = Router();

/**
 * @route   POST /api/v1/redemption-tickets/generate
 * @desc    Generate a redemption ticket for a coupon
 * @access  Private (User)
 */
router.post('/generate', redemptionTicketController.generateTicket.bind(redemptionTicketController));

/**
 * @route   POST /api/v1/redemption-tickets/verify-and-redeem
 * @desc    Verify and redeem a ticket (merchant side)
 * @access  Private (Merchant)
 */
router.post('/verify-and-redeem', redemptionTicketController.verifyAndRedeem.bind(redemptionTicketController));

/**
 * @route   POST /api/v1/redemption-tickets/:ticketId/cancel
 * @desc    Cancel a redemption ticket
 * @access  Private (User)
 */
router.post('/:ticketId/cancel', redemptionTicketController.cancelTicket.bind(redemptionTicketController));

/**
 * @route   GET /api/v1/redemption-tickets/user/:userAddress
 * @desc    Get user's redemption tickets
 * @access  Public
 */
router.get('/user/:userAddress', redemptionTicketController.getUserTickets.bind(redemptionTicketController));

/**
 * @route   GET /api/v1/redemption-tickets/merchant/:merchantAddress
 * @desc    Get merchant's redemption tickets
 * @access  Public
 */
router.get('/merchant/:merchantAddress', redemptionTicketController.getMerchantTickets.bind(redemptionTicketController));

export default router;
