import { Router } from 'express';
import { auctionController } from '../controllers/auction';

const router = Router();

/**
 * @route   GET /api/v1/auctions
 * @desc    Get all auctions with optional filters
 * @access  Public
 */
router.get('/', auctionController.getAuctions.bind(auctionController));

/**
 * @route   POST /api/v1/auctions
 * @desc    Create a new auction
 * @access  Private
 */
router.post('/', auctionController.createAuction.bind(auctionController));

/**
 * @route   GET /api/v1/auctions/:auctionId
 * @desc    Get auction details
 * @access  Public
 */
router.get('/:auctionId', auctionController.getAuction.bind(auctionController));

/**
 * @route   POST /api/v1/auctions/:auctionId/bid
 * @desc    Place a bid on an auction
 * @access  Private
 */
router.post('/:auctionId/bid', auctionController.placeBid.bind(auctionController));

/**
 * @route   POST /api/v1/auctions/:auctionId/settle
 * @desc    Settle an auction
 * @access  Private
 */
router.post('/:auctionId/settle', auctionController.settleAuction.bind(auctionController));

export default router;
