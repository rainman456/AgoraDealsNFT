import React, { useState, useEffect } from 'react';
import { NFTCard } from '@/components/NFTCard';
import { RedemptionTicket } from '@/components/RedemptionTicket';
import { nftAPI, marketplaceAPI, NFT } from '@/lib/api';
import { useListData } from '@/hooks/useListData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SavingsCalculator } from '@/components/SavingsCalculator';
import { RedemptionSuccessScreen } from '@/components/RedemptionSuccessScreen';

export const Account: React.FC = () => {
  const { error, handleErrorResponse } = useErrorHandler();
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Ticket Dialog
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketDeal, setTicketDeal] = useState<NFT | null>(null);
  
  // Transfer Dialog
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<NFT | null>(null);
  const [transferEmail, setTransferEmail] = useState('');
  
  // List Dialog
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listPrice, setListPrice] = useState('');
  
  // Redemption Success
  const [showRedemptionSuccess, setShowRedemptionSuccess] = useState(false);
  const [redemptionData, setRedemptionData] = useState({
    savingsAmount: 0,
    dealTitle: '',
    merchantName: '',
    reputationGain: 0,
    currentTier: 'Bronze',
    nextTier: 'Silver',
    tierProgress: 0,
  });

  // Use list data hook for better state management
  const deals = useListData<NFT>(
    async (page, pageSize) => {
      const data = await nftAPI.getUserNFTs();
      return { items: data, total: data.length };
    },
    { pageSize: 100, optimisticUpdates: true }
  );

  const filteredDeals = deals.items.filter((deal) => {
    const now = new Date();
    const expiresAt = deal.deal?.expiresAt ? new Date(deal.deal.expiresAt) : new Date();
    const isExpired = expiresAt < now;
    
    switch (filterTab) {
      case 'active':
        return !deal.isRedeemed && !isExpired;
      case 'redeemed':
        return deal.isRedeemed;
      case 'expired':
        return isExpired && !deal.isRedeemed;
      default:
        return true;
    }
  });

  const handleViewTicket = (dealId: string) => {
    const deal = deals.items.find(d => d.id === dealId);
    if (!deal) return;
    setTicketDeal(deal);
    setTicketDialogOpen(true);
  };

  const handleDownloadTicket = () => {
    toast.success('Ticket downloaded!');
  };

  const handleShareTicket = () => {
    toast.success('Ticket link copied to clipboard!');
  };

  const handleRedeem = async (dealId: string) => {
    try {
      setActionLoading(true);
      await nftAPI.redeemNFT(dealId);
      
      // Get deal details for success screen
      const deal = deals.items.find(d => d.id === dealId);
      if (deal) {
        const originalPrice = deal.deal?.originalPrice || 100;
        const discount = deal.deal?.discount || deal.deal?.discountPercentage || 0;
        setRedemptionData({
          savingsAmount: Math.round(originalPrice * (discount / 100)),
          dealTitle: deal.deal?.title || 'Deal',
          merchantName: typeof deal.deal?.merchant === 'object' ? deal.deal.merchant.name : 'Merchant',
          reputationGain: 10,
          currentTier: 'Bronze',
          nextTier: 'Silver',
          tierProgress: 65,
        });
        setShowRedemptionSuccess(true);
      }
      
      await deals.refresh();
      toast.success('Deal redeemed successfully!');
    } catch (err: any) {
      handleErrorResponse(err, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferClick = (dealId: string) => {
    const deal = deals.items.find(d => d.id === dealId);
    if (!deal) return;
    setSelectedDeal(deal);
    setTransferDialogOpen(true);
  };

  const handleTransferSubmit = async () => {
    if (!selectedDeal || !transferEmail) return;
    
    try {
      setActionLoading(true);
      deals.removeItem(selectedDeal.id, true); // optimistic update
      await nftAPI.transferNFT(selectedDeal.id, transferEmail);
      toast.success('Deal sent successfully!');
      setTransferDialogOpen(false);
      setTransferEmail('');
    } catch (err: any) {
      deals.removeItem(selectedDeal.id, false); // revert optimistic update
      handleErrorResponse(err, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleListClick = (dealId: string) => {
    const deal = deals.items.find(d => d.id === dealId);
    if (!deal) return;
    setSelectedDeal(deal);
    setListDialogOpen(true);
  };

  const handleListSubmit = async () => {
    if (!selectedDeal || !listPrice) return;
    
    try {
      setActionLoading(true);
      const originalItem = deals.items.find(d => d.id === selectedDeal.id);
      deals.updateItem(selectedDeal.id, { ...originalItem, isListed: true }, true); // optimistic
      await marketplaceAPI.listNFT(selectedDeal.id, parseFloat(listPrice));
      toast.success('Deal listed for sale successfully!');
      setListDialogOpen(false);
      setListPrice('');
    } catch (err: any) {
      deals.updateItem(selectedDeal.id, selectedDeal, false); // revert optimistic
      handleErrorResponse(err, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlist = async (dealId: string) => {
    const deal = deals.items.find(d => d.id === dealId);
    if (!deal) return;
    
    try {
      setActionLoading(true);
      deals.updateItem(dealId, { ...deal, isListed: false }, true); // optimistic
      await marketplaceAPI.unlistNFT(deal.id);
      toast.success('Deal unlisted successfully!');
    } catch (err: any) {
      deals.updateItem(dealId, deal, false); // revert optimistic
      handleErrorResponse(err, true);
    } finally {
      setActionLoading(false);
    }
  };

  const activeDeals = filteredDeals.filter(deal => !deal.isRedeemed && deal.deal?.expiresAt && new Date(deal.deal.expiresAt) > new Date());
  const redeemedDeals = filteredDeals.filter(deal => deal.isRedeemed);
  const expiredDeals = filteredDeals.filter(deal => !deal.isRedeemed && deal.deal?.expiresAt && new Date(deal.deal.expiresAt) <= new Date());

  const getFilteredCount = (filter: typeof filterTab) => {
    const now = new Date();
    return deals.items.filter((deal) => {
      const expiresAt = deal.deal?.expiresAt ? new Date(deal.deal.expiresAt) : new Date();
      const isExpired = expiresAt < now;
      
      switch (filter) {
        case 'active':
          return !deal.isRedeemed && !isExpired;
        case 'redeemed':
          return deal.isRedeemed;
        case 'expired':
          return isExpired && !deal.isRedeemed;
        default:
          return true;
      }
    }).length;
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Savings Calculator Section */}
        <div className="mb-12">
          <SavingsCalculator />
        </div>

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-sans font-bold text-3xl md:text-4xl mb-2">My Deals</h1>
            <p className="text-muted-foreground">
              Manage your deals - redeem, gift, or list them for sale ({deals.items.length} total)
            </p>
          </div>
          
          {/* Advanced Mode Toggle */}
          <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="advanced-mode" className="text-sm cursor-pointer">
              Advanced
            </Label>
            <Switch
              id="advanced-mode"
              checked={advancedMode}
              onCheckedChange={setAdvancedMode}
            />
          </div>
        </div>

        {/* Advanced Mode Info Banner */}
        {advancedMode && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Advanced Mode Enabled</h3>
                <p className="text-xs text-muted-foreground">
                  You can now see technical details like deal IDs, account addresses, and processing information.
                </p>
              </div>
            </div>
          </div>
        )}

        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)} className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all">
              All ({deals.items.length})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({getFilteredCount('active')})
            </TabsTrigger>
            <TabsTrigger value="redeemed">
              Redeemed ({getFilteredCount('redeemed')})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Expired ({getFilteredCount('expired')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {deals.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-16">
                <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-4">No deals in your collection</p>
                <Button onClick={() => window.location.href = '/'}>
                  Browse Deals
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeals.map((deal) => (
                  <NFTCard
                    key={deal.id}
                    nft={deal}
                    onRedeem={handleRedeem}
                    onTransfer={handleTransferClick}
                    onList={handleListClick}
                    onUnlist={handleUnlist}
                    onViewTicket={handleViewTicket}
                    isLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {deals.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : activeDeals.length === 0 ? (
              <div className="text-center py-16">
                <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-4">No active deals in your collection</p>
                <Button onClick={() => window.location.href = '/'}>
                  Browse Deals
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDeals.map((deal) => (
                  <NFTCard
                    key={deal.id}
                    nft={deal}
                    onRedeem={handleRedeem}
                    onTransfer={handleTransferClick}
                    onList={handleListClick}
                    onUnlist={handleUnlist}
                    onViewTicket={handleViewTicket}
                    isLoading={actionLoading}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="redeemed">
            {redeemedDeals.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No redeemed deals yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {redeemedDeals.map((deal) => (
                  <NFTCard key={deal.id} nft={deal} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired">
            {expiredDeals.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No expired deals</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expiredDeals.map((deal) => (
                  <NFTCard key={deal.id} nft={deal} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Gift Deal Dialog */}
        <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gift Deal</DialogTitle>
              <DialogDescription>
                Send this deal to a friend via email
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  They'll receive an email with instructions to claim this deal
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTransferSubmit} disabled={!transferEmail || actionLoading}>
                {actionLoading ? 'Sending...' : 'Send Gift'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Redemption Ticket Dialog */}
        <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Redemption Ticket</DialogTitle>
              <DialogDescription>
                Present this ticket to the merchant to redeem your deal
              </DialogDescription>
            </DialogHeader>
            {ticketDeal && ticketDeal.deal && (
              <RedemptionTicket
                nftId={ticketDeal.id}
                dealTitle={ticketDeal.deal.title || 'Deal'}
                dealImage={ticketDeal.deal.imageUrl || ''}
                merchantName={typeof ticketDeal.deal.merchant === 'object' ? ticketDeal.deal.merchant.name : 'Merchant'}
                merchantLogo={typeof ticketDeal.deal.merchant === 'object' ? ticketDeal.deal.merchant.logo || '' : ''}
                location={ticketDeal.deal.location || ''}
                redeemedAt={ticketDeal.redeemedAt || ''}
                expiresAt={ticketDeal.deal.expiresAt || ''}
                redemptionCode={ticketDeal.tokenId || 'N/A'}
                status={
                  ticketDeal.isRedeemed
                    ? 'redeemed'
                    : ticketDeal.deal.expiresAt && new Date(ticketDeal.deal.expiresAt) < new Date()
                    ? 'expired'
                    : 'active'
                }
                onDownload={handleDownloadTicket}
                onShare={handleShareTicket}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* List Dialog */}
        <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>List Deal for Sale</DialogTitle>
              <DialogDescription>
                Set a price for your deal on the marketplace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  A small processing fee will be added at checkout
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setListDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleListSubmit} disabled={!listPrice || actionLoading}>
                {actionLoading ? 'Listing...' : 'List for Sale'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Redemption Success Screen */}
      <RedemptionSuccessScreen
        isOpen={showRedemptionSuccess}
        onClose={() => setShowRedemptionSuccess(false)}
        savingsAmount={redemptionData.savingsAmount}
        dealTitle={redemptionData.dealTitle}
        merchantName={redemptionData.merchantName}
        reputationGain={redemptionData.reputationGain}
        currentTier={redemptionData.currentTier}
        nextTier={redemptionData.nextTier}
        tierProgress={redemptionData.tierProgress}
      />
    </div>
  );
};
