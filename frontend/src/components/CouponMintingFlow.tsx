import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { celebrationConfetti } from './ConfettiEffect';
import { hapticFeedback } from '@/lib/animations';

interface CouponMintingFlowProps {
  isOpen: boolean;
  dealTitle: string;
  onComplete: () => void;
}

export const CouponMintingFlow: React.FC<CouponMintingFlowProps> = ({
  isOpen,
  dealTitle,
  onComplete,
}) => {
  const [step, setStep] = useState<'minting' | 'success' | 'slide-in'>('minting');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('minting');
      setProgress(0);

      // Simulate minting progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              hapticFeedback('heavy');
              celebrationConfetti();
              setStep('success');
              setTimeout(() => {
                setStep('slide-in');
                setTimeout(() => {
                  onComplete();
                }, 1000);
              }, 2000);
            }, 300);
            return 100;
          }
          return prev + 10;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {step === 'minting' && (
                <motion.div
                  key="minting"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center space-y-6"
                >
                  <div>
                    <h3 className="font-heading font-bold text-2xl mb-2">
                      Creating Your Deal
                    </h3>
                    <p className="text-muted-foreground">{dealTitle}</p>
                  </div>

                  {/* Animated progress bar */}
                  <div className="space-y-2">
                    <Progress value={progress} className="h-3" />
                    <motion.p
                      key={progress}
                      initial={{ scale: 1.2, color: '#10b981' }}
                      animate={{ scale: 1, color: '#6b7280' }}
                      className="text-sm font-semibold"
                    >
                      {progress}%
                    </motion.p>
                  </div>

                  {/* Animated dots */}
                  <div className="flex items-center justify-center gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="text-center space-y-6"
                >
                  {/* Success checkmark */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg"
                  >
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h3 className="font-heading font-bold text-3xl mb-2 text-green-600">
                      Success!
                    </h3>
                    <p className="text-muted-foreground">
                      Your deal has been created
                    </p>
                  </motion.div>

                  {/* Pulsing rings */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{
                        scale: [1, 2, 2.5],
                        opacity: [0.5, 0.2, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: 'easeOut',
                      }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-4 border-green-400 rounded-full pointer-events-none"
                    />
                  ))}
                </motion.div>
              )}

              {step === 'slide-in' && (
                <motion.div
                  key="slide-in"
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  className="text-center space-y-4"
                >
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6">
                    <h4 className="font-heading font-bold text-xl mb-2">
                      Deal Added to Your Account
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can now redeem this deal anytime
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
