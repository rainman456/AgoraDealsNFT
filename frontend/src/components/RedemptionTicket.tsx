import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Clock, MapPin, Calendar, Download, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

interface RedemptionTicketProps {
  nftId: string;
  dealTitle: string;
  dealImage: string;
  merchantName: string;
  merchantLogo?: string;
  location?: string;
  redeemedAt?: string;
  expiresAt: string;
  redemptionCode: string;
  status: 'active' | 'redeemed' | 'expired';
  onDownload?: () => void;
  onShare?: () => void;
}

export const RedemptionTicket: React.FC<RedemptionTicketProps> = ({
  nftId,
  dealTitle,
  dealImage,
  merchantName,
  merchantLogo,
  location,
  redeemedAt,
  expiresAt,
  redemptionCode,
  status,
  onDownload,
  onShare,
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'redeemed':
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Redeemed</Badge>;
      case 'expired':
        return <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Active</Badge>;
    }
  };

  return (
    <>
    <Card className="overflow-hidden max-w-2xl mx-auto">
      {/* Quick Action Button */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-b">
        <Button
          onClick={() => setShowFullScreen(true)}
          className="w-full h-14 text-lg font-semibold rounded-xl"
          disabled={status !== 'active'}
        >
          {status === 'active' ? '📱 Show QR Code to Merchant' : status === 'redeemed' ? '✓ Already Redeemed' : '⏰ Expired'}
        </Button>
      </div>
      {/* Ticket Header with Deal Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={dealImage}
          alt={dealTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          {getStatusBadge()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-bold text-xl">{dealTitle}</h3>
        </div>
      </div>

      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {merchantLogo && (
              <img
                src={merchantLogo}
                alt={merchantName}
                className="w-12 h-12 rounded-full border-2 border-purple-200"
              />
            )}
            <div>
              <CardTitle className="text-lg">{merchantName}</CardTitle>
              {location && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <QRCodeSVG
              value={redemptionCode}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-600 mt-4 font-mono font-semibold">
            {redemptionCode}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Show this code to the merchant to redeem
          </p>
        </div>

        {/* Ticket Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Expires</span>
            </div>
            <span className="text-sm font-semibold">{formatDate(expiresAt)}</span>
          </div>

          {redeemedAt && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Check className="w-4 h-4" />
                <span>Redeemed</span>
              </div>
              <span className="text-sm font-semibold text-green-700">
                {formatDate(redeemedAt)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Deal ID</span>
            </div>
            <span className="text-sm font-mono">{nftId.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Instructions */}
        {status === 'active' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-sm text-blue-900 mb-2">Redemption Instructions</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Present this QR code or redemption code to the merchant</li>
              <li>Ensure the code is clearly visible for scanning</li>
              <li>Redemption must be completed before expiration date</li>
              <li>This ticket can only be redeemed once</li>
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onDownload}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={onShare}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </CardFooter>

      {/* Decorative Ticket Perforations */}
      <div className="relative h-4 bg-gradient-to-r from-purple-100 to-blue-100">
        <div className="absolute inset-0 flex justify-between px-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              style={{ marginTop: '6px' }}
            />
          ))}
        </div>
      </div>
    </Card>

    {/* Full-Screen QR Modal */}
    <AnimatePresence>
      {showFullScreen && status === 'active' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white flex flex-col"
          style={{ maxHeight: '100vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="font-heading font-bold text-lg">{merchantName}</h3>
              <p className="text-sm text-muted-foreground">{dealTitle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFullScreen(false)}
              className="rounded-full"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Countdown Timer - Prominent */}
          <div className="bg-gradient-to-r from-primary to-accent text-white py-4 text-center">
            <div className="text-sm font-medium mb-1">Time Remaining</div>
            <div className="text-3xl font-heading font-bold">{timeRemaining}</div>
          </div>

          {/* QR Code - Large, Centered, 60% of screen */}
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(168, 85, 247, 0.4)',
                  '0 0 0 20px rgba(168, 85, 247, 0)',
                  '0 0 0 0 rgba(168, 85, 247, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative"
            >
              {/* Pulsing Border Animation */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary via-accent to-pink-500 animate-pulse" style={{ padding: '8px' }}>
                <div className="w-full h-full bg-white rounded-3xl" />
              </div>
              
              {/* QR Code */}
              <div className="relative bg-white p-8 rounded-3xl">
                <QRCodeSVG
                  value={redemptionCode}
                  size={Math.min(window.innerWidth * 0.6, 300)}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </motion.div>
          </div>

          {/* Redemption Code */}
          <div className="text-center px-4 pb-4">
            <p className="text-sm text-muted-foreground mb-2">Redemption Code</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{redemptionCode}</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-t border-blue-200 p-6 text-center">
            <p className="text-lg font-semibold text-blue-900 mb-2">📱 Show this to merchant</p>
            <p className="text-sm text-blue-700">Ensure the QR code is clearly visible for scanning</p>
          </div>

          {/* Security Indicators */}
          <div className="border-t p-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs">{nftId.slice(0, 8)}...</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border-t border-yellow-200 p-3 text-center">
            <p className="text-xs text-yellow-800">⚠️ Screenshot prevention enabled • This ticket can only be redeemed once</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
