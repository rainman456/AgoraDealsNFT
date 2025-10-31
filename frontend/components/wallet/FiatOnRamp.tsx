import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CreditCard, DollarSign, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FiatOnRampProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FiatOnRamp({ isOpen, onClose }: FiatOnRampProps) {
  const [amount, setAmount] = useState('50');
  const [step, setStep] = useState<'amount' | 'payment' | 'processing' | 'success'>('amount');
  const [showDetails, setShowDetails] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const { toast } = useToast();

  const solAmount = (parseFloat(amount) / 23.5).toFixed(4); // Mock conversion rate
  const gasFee = 0.25;
  const totalAmount = parseFloat(amount) + gasFee;

  const handleAmountSubmit = () => {
    if (parseFloat(amount) < 10) {
      toast({
        title: "Minimum Amount",
        description: "Minimum purchase is $10",
        variant: "destructive",
      });
      return;
    }
    setStep('payment');
  };

  const handlePayment = () => {
    if (!cardNumber || !expiry || !cvv) {
      toast({
        title: "Missing Information",
        description: "Please fill in all card details",
        variant: "destructive",
      });
      return;
    }

    setStep('processing');

    setTimeout(() => {
      setStep('success');
      localStorage.setItem('wallet_balance', amount);
      toast({
        title: "Funds Added",
        description: `$${amount} credits added to your account`,
      });

      setTimeout(() => {
        onClose();
        setStep('amount');
        setCardNumber('');
        setExpiry('');
        setCvv('');
      }, 2500);
    }, 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <DollarSign className="w-5 h-5 text-primary" />
            Add Funds
          </DialogTitle>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Amount (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg"
                  min="10"
                  step="10"
                />
              </div>
              <div className="flex gap-2">
                {['25', '50', '100', '250'].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset)}
                    className={amount === preset ? 'border-primary' : ''}
                  >
                    ${preset}
                  </Button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">You'll receive</span>
                <span className="font-semibold">${amount} credits</span>
              </div>
              
              {showDetails && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Platform credits</span>
                    <span>${amount}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processing fee</span>
                    <span>${gasFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm font-medium">
                    <span>Total charge</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-xs text-primary hover:underline w-full justify-center pt-1"
              >
                {showDetails ? 'Hide' : 'Show'} details
                <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <Button onClick={handleAmountSubmit} className="w-full" size="lg">
              Continue
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment • Instant delivery
            </p>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Adding</span>
                <span className="font-bold">${amount}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Card Number</label>
                <div className="relative mt-1">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="pl-10"
                    maxLength={19}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Expiry</label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="mt-1"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CVV</label>
                  <Input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="mt-1"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('amount')} className="flex-1">
                Back
              </Button>
              <Button onClick={handlePayment} className="flex-1">
                Pay ${totalAmount.toFixed(2)}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              🔒 Secured by Stripe • Your card info is encrypted
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <p className="font-semibold">Processing payment...</p>
              <p className="text-sm text-muted-foreground">This will only take a moment</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg">Funds Added!</p>
              <p className="text-sm text-muted-foreground">
                ${amount} credits added to your account
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
