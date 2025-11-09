import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { nftAPI, NFT } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { Check, X, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Countdown from 'react-countdown';
import { celebrationConfetti } from './ConfettiEffect';
import { hapticFeedback, shake } from '@/lib/animations';

interface RedemptionModalProps {
  nft: NFT | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RedemptionModal: React.FC<RedemptionModalProps> = ({
  nft,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'generate' | 'show-qr' | 'verifying' | 'success' | 'error'>('generate');
  const [qrData, setQrData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [qrExpiry, setQrExpiry] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen && nft) {
      setStep('generate');
      setQrData('');
      setError('');
    }
  }, [isOpen, nft]);

  const handleGenerateQR = async () => {
    if (!nft) return;

    try {
      setStep('verifying');
      // Simulate QR generation animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await nftAPI.generateRedemptionQR(nft.id);
      setQrData(response.qrData);
      setQrExpiry(new Date(Date.now() + 5 * 60 * 1000)); // 5 minutes from now
      setStep('show-qr');
      
      // Start polling for redemption status
      startPolling();
    } catch (error: any) {
      hapticFeedback('heavy');
      setError(error.response?.data?.message || 'Failed to generate QR code');
      setStep('error');
    }
  };

  const startPolling = () => {
    if (!nft) return;

    const pollInterval = setInterval(async () => {
      try {
        const updatedNFT = await nftAPI.getNFTById(nft.id);
        if (updatedNFT.isRedeemed) {
          clearInterval(pollInterval);
          hapticFeedback('heavy');
          celebrationConfetti();
          setStep('success');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 3000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleClose = () => {
    setStep('generate');
    setQrData('');
    setError('');
    onClose();
  };

  if (!nft) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem NFT Deal</DialogTitle>
          <DialogDescription>
            {step === 'generate' && 'Generate a QR code to redeem your deal'}
            {step === 'show-qr' && 'Show this QR code to the merchant'}
            {step === 'verifying' && 'Verifying redemption...'}
            {step === 'success' && 'Deal redeemed successfully!'}
            {step === 'error' && 'An error occurred'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
          {step === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-4"
            >
              <div className="p-4 bg-secondary rounded-lg">
                <h3 className="font-heading font-bold text-lg mb-2">{nft.deal?.title || 'Deal'}</h3>
                <p className="text-sm text-muted-foreground mb-2">{typeof nft.deal?.merchant === 'object' ? nft.deal.merchant.name : 'Merchant'}</p>
                <p className="text-2xl font-bold text-primary">{nft.deal?.discount || nft.deal?.discountPercentage || 0}% OFF</p>
              </div>
              <Button onClick={handleGenerateQR} className="w-full" size="lg">
                <Zap className="w-5 h-5 mr-2" />
                Generate QR Code
              </Button>
            </motion.div>
          )}

          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 mx-auto"
              >
                <div className="w-full h-full border-8 border-primary/20 border-t-primary rounded-full" />
              </motion.div>
              <p className="font-medium">Generating secure QR code...</p>
            </motion.div>
          )}

          {step === 'show-qr' && qrData && (
            <motion.div
              key="show-qr"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="bg-white p-6 rounded-lg inline-block shadow-xl relative"
              >
                {/* Pulsing border effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg border-4 border-primary"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <QRCodeSVG value={qrData} size={256} level="H" />
              </motion.div>
              
              {qrExpiry && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <Clock className="w-4 h-4 text-accent" />
                    <span>Expires in: </span>
                    <Countdown
                      date={qrExpiry}
                      renderer={({ minutes, seconds }) => (
                        <motion.span 
                          className="text-accent font-mono text-lg"
                          animate={minutes === 0 && seconds < 30 ? {
                            scale: [1, 1.1, 1],
                            color: ['#f59e0b', '#ef4444', '#f59e0b'],
                          } : {}}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                          }}
                        >
                          {minutes}:{seconds.toString().padStart(2, '0')}
                        </motion.span>
                      )}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="font-medium">Show this QR code to the merchant</p>
                <p className="text-sm text-muted-foreground">
                  The merchant will scan this code to verify and redeem your deal
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-primary rounded-full"
                />
                <span>Waiting for merchant verification...</span>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          <AnimatePresence>
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto"
              >
                <Check className="w-10 h-10 text-green-600" />
              </motion.div>
              <div>
                <p className="font-heading font-bold text-2xl mb-2">Success!</p>
                <p className="text-muted-foreground">Your deal has been redeemed</p>
                <p className="text-sm text-primary mt-2">+10 Reputation Points</p>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, ...shake.animate }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <p className="font-heading font-bold text-xl mb-2">Error</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => setStep('generate')} variant="outline">
                Try Again
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
