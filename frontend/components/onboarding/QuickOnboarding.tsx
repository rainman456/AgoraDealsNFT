import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle2, Sparkles, Mail, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function QuickOnboarding({ isOpen, onComplete }: QuickOnboardingProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isOpen && step === 1) {
      setStartTime(Date.now());
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (startTime > 0) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('onboarding_time', totalTime.toString());
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_location', location);
      onComplete();
    }
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return email.length > 0;
    if (step === 3) return location.length > 0;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogTitle className="sr-only">Quick Onboarding</DialogTitle>
        <DialogDescription className="sr-only">Complete these 3 quick steps to get started</DialogDescription>
        <div className="space-y-6 pt-4">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all',
                  s <= step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* Timer Badge */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Step {step} of 3
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-primary">
              <Zap className="w-3 h-3" />
              {elapsedTime}s
            </div>
          </div>

          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome!</h2>
                <p className="text-muted-foreground">
                  Get started in under 30 seconds
                </p>
              </div>
              <Button onClick={handleNext} className="w-full" size="lg">
                Let's Go
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Email */}
          {step === 2 && (
            <div className="space-y-4 py-4">
              <div className="text-center mb-4">
                <Mail className="w-12 h-12 text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold mb-2">Your Email</h2>
                <p className="text-sm text-muted-foreground">
                  We'll send you the best deals
                </p>
              </div>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                autoFocus
                className="text-center text-lg"
              />
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4 py-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📍</span>
                </div>
                <h2 className="text-xl font-bold mb-2">Where are you?</h2>
                <p className="text-sm text-muted-foreground">
                  Find deals near you
                </p>
              </div>
              <Input
                type="text"
                placeholder="City, State"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                autoFocus
                className="text-center text-lg"
              />
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full"
                size="lg"
              >
                Start Saving
                <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Skip Option */}
          {step > 1 && (
            <button
              onClick={onComplete}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            >
              Skip for now
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
