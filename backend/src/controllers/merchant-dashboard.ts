import { Request, Response } from 'express';
import { Merchant } from '../models/merchant';
import { Promotion } from '../models/promotion';
import { Coupon } from '../models/coupon';
import { RedemptionTicket } from '../models/redemption-ticket';
import { GroupDeal } from '../models/group-deal';
import { Auction } from '../models/auction';
import { logger } from '../utils/logger';

export class MerchantDashboardController {
  /**
   * GET /api/v1/merchant-dashboard/:merchantAddress/analytics
   * Get comprehensive merchant analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { merchantAddress } = req.params;
      const { startDate, endDate } = req.query;

      const merchant = await Merchant.findOne({
        $or: [{ _id: merchantAddress }, { onChainAddress: merchantAddress }, { walletAddress: merchantAddress }],
      });

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);

      const filter: any = { merchant: merchant.onChainAddress };
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }

      // Fetch all relevant data
      const [
        promotions,
        coupons,
        redeemedCoupons,
        tickets,
        groupDeals,
        auctions,
      ] = await Promise.all([
        Promotion.find({ merchant: merchant.onChainAddress }),
        Coupon.find(filter),
        Coupon.find({ ...filter, isRedeemed: true }),
        RedemptionTicket.find({ merchantAddress: merchant.onChainAddress }),
        GroupDeal.find({ merchantAddress: merchant.onChainAddress }),
        Auction.find({ merchantAddress: merchant.onChainAddress }),
      ]);

      // Calculate metrics
      const totalPromotions = promotions.length;
      const activePromotions = promotions.filter(p => p.isActive).length;
      const totalCoupons = coupons.length;
      const totalRedemptions = redeemedCoupons.length;
      const redemptionRate = totalCoupons > 0 ? (totalRedemptions / totalCoupons) * 100 : 0;

      // Revenue calculations
      const totalRevenue = groupDeals.reduce((sum, deal) => sum + deal.totalRevenue, 0);
      const auctionRevenue = auctions
        .filter(a => a.isSettled && a.finalPrice)
        .reduce((sum, a) => sum + (a.finalPrice || 0), 0);

      // Category breakdown
      const categoryStats = promotions.reduce((acc: any, promo) => {
        if (!acc[promo.category]) {
          acc[promo.category] = {
            promotions: 0,
            coupons: 0,
            redemptions: 0,
          };
        }
        acc[promo.category].promotions++;
        return acc;
      }, {});

      // Add coupon and redemption counts per category
      for (const coupon of coupons) {
        const promo = promotions.find(p => p.onChainAddress === coupon.promotion);
        if (promo && categoryStats[promo.category]) {
          categoryStats[promo.category].coupons++;
          if (coupon.isRedeemed) {
            categoryStats[promo.category].redemptions++;
          }
        }
      }

      // Time series data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await this.calculateDailyStats(
        merchant.onChainAddress,
        thirtyDaysAgo,
        new Date()
      );

      // Top performing promotions
      const promotionPerformance = await Promise.all(
        promotions.map(async (promo) => {
          const promoCoupons = coupons.filter(c => c.promotion === promo.onChainAddress);
          const promoRedemptions = promoCoupons.filter(c => c.isRedeemed).length;
          
          return {
            id: promo._id,
            title: promo.title,
            category: promo.category,
            totalCoupons: promoCoupons.length,
            redemptions: promoRedemptions,
            redemptionRate: promoCoupons.length > 0 ? (promoRedemptions / promoCoupons.length) * 100 : 0,
            revenue: 0, // TODO: Calculate from group deals/auctions
          };
        })
      );

      promotionPerformance.sort((a, b) => b.redemptionRate - a.redemptionRate);

      res.json({
        success: true,
        data: {
          overview: {
            totalPromotions,
            activePromotions,
            totalCoupons,
            totalRedemptions,
            redemptionRate: redemptionRate.toFixed(2),
            totalRevenue,
            auctionRevenue,
          },
          categoryBreakdown: categoryStats,
          dailyStats,
          topPromotions: promotionPerformance.slice(0, 10),
          tickets: {
            total: tickets.length,
            active: tickets.filter(t => t.status === 'active').length,
            consumed: tickets.filter(t => t.status === 'consumed').length,
            expired: tickets.filter(t => t.status === 'expired').length,
          },
          groupDeals: {
            total: groupDeals.length,
            active: groupDeals.filter(d => d.isActive).length,
            successful: groupDeals.filter(d => d.isSuccessful).length,
            totalParticipants: groupDeals.reduce((sum, d) => sum + d.currentParticipants, 0),
          },
          auctions: {
            total: auctions.length,
            active: auctions.filter(a => a.isActive).length,
            settled: auctions.filter(a => a.isSettled).length,
            totalBids: auctions.reduce((sum, a) => sum + a.totalBids, 0),
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get merchant analytics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/v1/merchant-dashboard/:merchantAddress/recent-activity
   * Get recent merchant activity
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const { merchantAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const merchant = await Merchant.findOne({
        $or: [{ _id: merchantAddress }, { onChainAddress: merchantAddress }],
      });

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: 'Merchant not found',
        });
      }

      const [
        recentCoupons,
        recentTickets,
        recentGroupDeals,
        recentAuctions,
      ] = await Promise.all([
        Coupon.find({ merchant: merchant.onChainAddress })
          .sort({ createdAt: -1 })
          .limit(limit),
        RedemptionTicket.find({ merchantAddress: merchant.onChainAddress })
          .sort({ createdAt: -1 })
          .limit(limit),
        GroupDeal.find({ merchantAddress: merchant.onChainAddress })
          .sort({ createdAt: -1 })
          .limit(limit),
        Auction.find({ merchantAddress: merchant.onChainAddress })
          .sort({ createdAt: -1 })
          .limit(limit),
      ]);

      // Combine and sort all activities
      const activities: any[] = [];

      recentCoupons.forEach(coupon => {
        activities.push({
          type: 'coupon_minted',
          timestamp: coupon.createdAt,
          data: {
            couponId: coupon._id,
            owner: coupon.owner,
            discountPercentage: coupon.discountPercentage,
          },
        });

        if (coupon.isRedeemed && coupon.redeemedAt) {
          activities.push({
            type: 'coupon_redeemed',
            timestamp: coupon.redeemedAt,
            data: {
              couponId: coupon._id,
              owner: coupon.owner,
              discountPercentage: coupon.discountPercentage,
            },
          });
        }
      });

      recentTickets.forEach(ticket => {
        activities.push({
          type: 'ticket_generated',
          timestamp: ticket.createdAt,
          data: {
            ticketId: ticket._id,
            userAddress: ticket.userAddress,
            status: ticket.status,
          },
        });

        if (ticket.isConsumed && ticket.consumedAt) {
          activities.push({
            type: 'ticket_redeemed',
            timestamp: ticket.consumedAt,
            data: {
              ticketId: ticket._id,
              userAddress: ticket.userAddress,
            },
          });
        }
      });

      recentGroupDeals.forEach(deal => {
        activities.push({
          type: 'group_deal_created',
          timestamp: deal.createdAt,
          data: {
            dealId: deal._id,
            title: deal.title,
            targetParticipants: deal.targetParticipants,
          },
        });

        deal.participants.forEach(participant => {
          activities.push({
            type: 'group_deal_joined',
            timestamp: participant.joinedAt,
            data: {
              dealId: deal._id,
              userAddress: participant.userAddress,
              quantity: participant.quantity,
            },
          });
        });
      });

      recentAuctions.forEach(auction => {
        activities.push({
          type: 'auction_created',
          timestamp: auction.createdAt,
          data: {
            auctionId: auction._id,
            title: auction.title,
            startingPrice: auction.startingPrice,
          },
        });

        auction.bids.forEach(bid => {
          activities.push({
            type: 'auction_bid',
            timestamp: bid.timestamp,
            data: {
              auctionId: auction._id,
              bidderAddress: bid.bidderAddress,
              amount: bid.amount,
            },
          });
        });

        if (auction.isSettled && auction.settledAt) {
          activities.push({
            type: 'auction_settled',
            timestamp: auction.settledAt,
            data: {
              auctionId: auction._id,
              winner: auction.winner,
              finalPrice: auction.finalPrice,
            },
          });
        }
      });

      // Sort by timestamp descending
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      res.json({
        success: true,
        data: activities.slice(0, limit),
      });
    } catch (error) {
      logger.error('Failed to get recent activity:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Helper: Calculate daily statistics
   */
  private async calculateDailyStats(
    merchantAddress: string,
    startDate: Date,
    endDate: Date
  ) {
    const days: any[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const [coupons, redemptions, tickets] = await Promise.all([
        Coupon.countDocuments({
          merchant: merchantAddress,
          createdAt: { $gte: currentDate, $lt: nextDate },
        }),
        Coupon.countDocuments({
          merchant: merchantAddress,
          isRedeemed: true,
          redeemedAt: { $gte: currentDate, $lt: nextDate },
        }),
        RedemptionTicket.countDocuments({
          merchantAddress,
          createdAt: { $gte: currentDate, $lt: nextDate },
        }),
      ]);

      days.push({
        date: currentDate.toISOString().split('T')[0],
        coupons,
        redemptions,
        tickets,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }
}

export const merchantDashboardController = new MerchantDashboardController();
