import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NFT } from '@/lib/api';
import { Check, Clock, ShoppingBag, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { cardHover, buttonPress, hapticFeedback } from '@/lib/animations';

interface NFTCardProps {
  nft: NFT;
  onRedeem?: (nftId: string) => void;
  onTransfer?: (nftId: string) => void;
  onList?: (nftId: string) => void;
  onUnlist?: (nftId: string) => void;
  onViewTicket?: (nftId: string) => void;
  isLoading?: boolean;
}

export const NFTCard: React.FC<NFTCardProps> = ({
  nft,
  onRedeem,
  onTransfer,
  onList,
  onUnlist,
  onViewTicket,
  isLoading,
}) => {
  const expiresIn = nft.deal?.expiresAt ? formatDistanceToNow(new Date(nft.deal.expiresAt), { addSuffix: true }) : 'No expiry';
  const isExpired = nft.deal?.expiresAt ? new Date(nft.deal.expiresAt) < new Date() : false;

  const handleAction = (action: () => void) => {
    hapticFeedback('light');
    action();
  };

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={cardHover}
    >
    <Card className="overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <img
          src={nft.deal?.imageUrl || '/placeholder-merchant.png'}
          alt={nft.deal?.title || 'Deal'}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className="bg-accent text-accent-foreground font-bold">
            {nft.deal?.discount || nft.deal?.discountPercentage || 0}% OFF
          </Badge>
          {nft.isRedeemed && (
            <Badge className="bg-green-500 text-white">
              <Check className="w-3 h-3 mr-1" />
              Redeemed
            </Badge>
          )}
          {nft.isListed && (
            <Badge className="bg-blue-500 text-white">
              <ShoppingBag className="w-3 h-3 mr-1" />
              Listed
            </Badge>
          )}
        </div>
        {isExpired && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              Expired
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-heading font-bold text-lg mb-2 line-clamp-2">
          {nft.deal?.title || 'Deal'}
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Deal ID:</span>
            <span className="font-mono font-medium">#{nft.tokenId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Merchant:</span>
            <span className="font-medium">{typeof nft.deal?.merchant === 'object' ? nft.deal.merchant.name : 'Merchant'}</span>
          </div>

          {!nft.isRedeemed && !isExpired && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Expires {expiresIn}</span>
            </div>
          )}

          {nft.isRedeemed && nft.redeemedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Redeemed:</span>
              <span className="font-medium">
                {formatDistanceToNow(new Date(nft.redeemedAt), { addSuffix: true })}
              </span>
            </div>
          )}

          {nft.isListed && nft.resalePrice && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Listed Price:</span>
              <span className="font-bold text-primary">${nft.resalePrice}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2">
        {!nft.isRedeemed && !isExpired && (
          <>
            <div className="flex gap-2 w-full">
              <motion.div className="flex-1" variants={buttonPress} whileTap="tap">
                <Button
                  className="w-full"
                  onClick={() => handleAction(() => onRedeem?.(nft.id))}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Redeem Now'}
                </Button>
              </motion.div>
              <motion.div variants={buttonPress} whileTap="tap">
                <Button
                  variant="outline"
                  onClick={() => handleAction(() => onViewTicket?.(nft.id))}
                >
                  <FileText className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
            <div className="flex gap-2 w-full">
              <motion.div className="flex-1" variants={buttonPress} whileTap="tap">
                {nft.isListed ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction(() => onUnlist?.(nft.id))}
                    disabled={isLoading}
                  >
                    Unlist
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleAction(() => onList?.(nft.id))}
                    disabled={isLoading}
                  >
                    List for Sale
                  </Button>
                )}
              </motion.div>
              <motion.div className="flex-1" variants={buttonPress} whileTap="tap">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleAction(() => onTransfer?.(nft.id))}
                  disabled={isLoading}
                >
                  Transfer
                </Button>
              </motion.div>
            </div>
          </>
        )}
        {nft.isRedeemed && (
          <div className="w-full text-center py-2 text-muted-foreground">
            This deal has been redeemed
          </div>
        )}
        {isExpired && !nft.isRedeemed && (
          <div className="w-full text-center py-2 text-destructive">
            This deal has expired
          </div>
        )}
      </CardFooter>
    </Card>
    </motion.div>
  );
};
