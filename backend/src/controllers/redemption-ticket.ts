import { Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '../services/solana.service';
import { RedemptionTicket } from '../models/redemption-ticket';
import { Coupon } from '../models/coupon';
import { logger } from '../utils/logger';
import { generateQRCode } from '../utils/qr-generator';


export class RedemptionTicketController {
  /**
   * POST /api/v1/redemption-tickets/generate
   * Generate a redemption ticket for a coupon
   */
  async generateTicket(req: Request, res: Response): Promise<void> {
    try {
      const { couponId, latitude, longitude } = req.body;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!couponId || !walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: couponId, walletAddress',
        });
      }

      const coupon = await Coupon.findOne({
        $or: [{ _id: couponId }, { onChainAddress: couponId }],
      });

      if (!coupon) {
        res.status(404).json({
          success: false,
          error: 'Coupon not found',
        });
      }

      if (coupon.owner !== walletAddress) {
        res.status(403).json({
          success: false,
          error: 'Not coupon owner',
        });
      }

      if (coupon.isRedeemed) {
        res.status(400).json({
          success: false,
          error: 'Coupon already redeemed',
        });
      }

      // Generate nonce (current timestamp)
      const nonce = Math.floor(Date.now() / 1000);
      
      const couponPDA = new PublicKey(coupon.onChainAddress);
      const userPubkey = new PublicKey(walletAddress);

      // Generate ticket on-chain
      const result = await solanaService.generateRedemptionTicket(
        couponPDA,
        userPubkey,
        nonce,
        latitude,
        longitude
      );

      // Generate QR code
      const qrData = {
        ticket: result.ticket,
        coupon: coupon.onChainAddress,
        user: walletAddress,
        merchant: coupon.merchant,
        hash: result.ticketHash,
        nonce: nonce.toString(),
        expiresAt: result.expiresAt,
      };

      const qrCodeImage = await generateQRCode(JSON.stringify(qrData));

      // Save to database
      const ticket = await RedemptionTicket.create({
        onChainAddress: result.ticket,
        couponAddress: coupon.onChainAddress,
        userAddress: walletAddress,
        merchantAddress: coupon.merchant,
        ticketHash: result.ticketHash,
        nonce: nonce,
        expiresAt: new Date(result.expiresAt * 1000),
        isConsumed: false,
        generationLocation: latitude && longitude ? {
          latitude,
          longitude,
          timestamp: new Date(),
        } : undefined,
        qrCodeData: JSON.stringify(qrData),
        qrCodeImage,
        verificationMethod: 'qr_scan',
        generationTxSignature: result.signature,
        status: 'active',
      });

      res.status(201).json({
        success: true,
        data: {
          ticket: {
            id: ticket._id,
            onChainAddress: ticket.onChainAddress,
            ticketHash: ticket.ticketHash,
            expiresAt: ticket.expiresAt,
            qrCode: qrCodeImage,
          },
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to generate redemption ticket:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/redemption-tickets/verify-and-redeem
   * Verify and redeem a ticket (merchant side)
   */
  async verifyAndRedeem(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId, ticketHash, latitude, longitude } = req.body;
      const merchantWallet = req.body.walletAddress || req.user?.walletAddress;

      if (!ticketId || !ticketHash || !merchantWallet) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: ticketId, ticketHash, walletAddress',
        });
      }

      const ticket = await RedemptionTicket.findOne({
        $or: [{ _id: ticketId }, { onChainAddress: ticketId }],
      });

      if (!ticket) {
        res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      if (ticket.isConsumed) {
        res.status(400).json({
          success: false,
          error: 'Ticket already consumed',
        });
      }

      if (new Date() > ticket.expiresAt) {
        res.status(400).json({
          success: false,
          error: 'Ticket expired',
        });
      }

      const ticketPDA = new PublicKey(ticket.onChainAddress);
      const couponPDA = new PublicKey(ticket.couponAddress);
      const merchantAuthority = new PublicKey(merchantWallet);
      const userPubkey = new PublicKey(ticket.userAddress);

      // Convert hash string to array
      const hashArray = Buffer.from(ticketHash, 'hex');

      // Verify and redeem on-chain
      const result = await solanaService.verifyAndRedeemTicket(
        ticketPDA,
        couponPDA,
        merchantAuthority,
        userPubkey,
        Array.from(hashArray)
      );

      // Update ticket
      await RedemptionTicket.updateOne(
        { _id: ticket._id },
        {
          $set: {
            isConsumed: true,
            consumedAt: new Date(),
            redemptionLocation: latitude && longitude ? {
              latitude,
              longitude,
              timestamp: new Date(),
            } : undefined,
            redemptionTxSignature: result.signature,
            status: 'consumed',
          },
        }
      );

      // Update coupon
      await Coupon.updateOne(
        { onChainAddress: ticket.couponAddress },
        {
          $set: {
            isRedeemed: true,
            redeemedAt: new Date(),
          },
        }
      );

      res.json({
        success: true,
        data: {
          transactionSignature: result.signature,
          redeemedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to verify and redeem ticket:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/v1/redemption-tickets/:ticketId/cancel
   * Cancel a redemption ticket
   */
  async cancelTicket(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const walletAddress = req.body.walletAddress || req.user?.walletAddress;

      if (!walletAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing walletAddress',
        });
      }

      const ticket = await RedemptionTicket.findOne({
        $or: [{ _id: ticketId }, { onChainAddress: ticketId }],
      });

      if (!ticket) {
        res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      if (ticket.userAddress !== walletAddress) {
        res.status(403).json({
          success: false,
          error: 'Not ticket owner',
        });
      }

      if (ticket.isConsumed) {
        res.status(400).json({
          success: false,
          error: 'Cannot cancel consumed ticket',
        });
      }

      const ticketPDA = new PublicKey(ticket.onChainAddress);
      const userPubkey = new PublicKey(walletAddress);

      // Cancel on-chain
      const result = await solanaService.cancelRedemptionTicket(ticketPDA, userPubkey);

      // Update database
      await RedemptionTicket.updateOne(
        { _id: ticket._id },
        {
          $set: {
            status: 'cancelled',
            cancellationTxSignature: result.signature,
          },
        }
      );

      res.json({
        success: true,
        data: {
          transactionSignature: result.signature,
        },
      });
    } catch (error) {
      logger.error('Failed to cancel ticket:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/redemption-tickets/user/:userAddress
   * Get user's redemption tickets
   */
  async getUserTickets(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;
      const { status } = req.query;

      const filter: any = { userAddress };
      if (status) {
        filter.status = status;
      }

      const tickets = await RedemptionTicket.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      logger.error('Failed to get user tickets:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/redemption-tickets/merchant/:merchantAddress
   * Get merchant's redemption tickets
   */
  async getMerchantTickets(req: Request, res: Response): Promise<void> {
    try {
      const { merchantAddress } = req.params;
      const { status } = req.query;

      const filter: any = { merchantAddress };
      if (status) {
        filter.status = status;
      }

      const tickets = await RedemptionTicket.find(filter)
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      logger.error('Failed to get merchant tickets:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const redemptionTicketController = new RedemptionTicketController();

// Export individual controller methods for testing
export const generateRedemptionTicket = redemptionTicketController.generateTicket.bind(redemptionTicketController);
export const verifyAndRedeemTicket = redemptionTicketController.verifyAndRedeem.bind(redemptionTicketController);
export const redeemCoupon = redemptionTicketController.verifyAndRedeem.bind(redemptionTicketController);
export const cancelRedemptionTicket = redemptionTicketController.cancelTicket.bind(redemptionTicketController);
export const getUserRedemptionTickets = redemptionTicketController.getUserTickets.bind(redemptionTicketController);
export const getMerchantRedemptionTickets = redemptionTicketController.getMerchantTickets.bind(redemptionTicketController);
