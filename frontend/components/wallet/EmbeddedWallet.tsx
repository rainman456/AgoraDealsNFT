import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Wallet, Mail, CheckCircle2, Loader2, Copy, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbeddedWalletProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EmbeddedWallet({ isOpen, onClose, onSuccess }: EmbeddedWalletProps) {
  const [step, setStep] = useState<'login' | 'creating' | 'success'>('login');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const { toast } = useToast();

  const socialProviders = [
    { 
      name: 'Google', 
      icon: 'https://www.google.com/favicon.ico', 
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700'
    },
    { 
      name: 'Apple', 
      icon: 'https://www.apple.com/favicon.ico', 
      color: 'from-gray-700 to-gray-900',
      bgColor: 'bg-black hover:bg-gray-900',
      textColor: 'text-white'
    },
    { 
      name: 'Facebook', 
      icon: 'https://www.facebook.com/favicon.ico', 
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    },
  ];

  const handleEmailLogin = async () => {
    if (!email) return;
    
    setStep('creating');
    
    // Simulate account creation
    setTimeout(() => {
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setWalletAddress(mockAddress);
      setStep('success');
      
      // Store account info
      localStorage.setItem('wallet_address', mockAddress);
      localStorage.setItem('wallet_email', email);
      localStorage.setItem('wallet_created', new Date().toISOString());
      
      toast({
        title: "Account Created",
        description: "Your secure account is ready to use",
      });

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    }, 2000);
  };

  const handleSocialLogin = (provider: string) => {
    setStep('creating');
    
    setTimeout(() => {
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42);
      setWalletAddress(mockAddress);
      setStep('success');
      
      localStorage.setItem('wallet_address', mockAddress);
      localStorage.setItem('wallet_provider', provider);
      localStorage.setItem('wallet_created', new Date().toISOString());
      
      toast({
        title: "Account Connected",
        description: `Signed in with ${provider}`,
      });

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    }, 2000);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: "Copied",
      description: "Account ID copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="w-5 h-5 text-primary" />
            {step === 'login' && 'Sign In to Your Account'}
            {step === 'creating' && 'Setting Up Your Account'}
            {step === 'success' && 'Welcome!'}
          </DialogTitle>
          <DialogDescription>
            {step === 'login' && 'Create your secure account with email or social login'}
            {step === 'creating' && 'Please wait while we set up your account'}
            {step === 'success' && 'Your account is ready to use'}
          </DialogDescription>
        </DialogHeader>

        {step === 'login' && (
          <div className="space-y-4 pt-4">
            {/* Email Login */}
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                />
              </div>
              <Button 
                onClick={handleEmailLogin} 
                className="w-full"
                disabled={!email}
              >
                Continue with Email
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-2">
              {socialProviders.map((provider) => (
                <Button
                  key={provider.name}
                  variant="outline"
                  className={`w-full justify-start gap-3 ${provider.bgColor} ${provider.textColor} border-gray-300 hover:border-gray-400`}
                  onClick={() => handleSocialLogin(provider.name)}
                >
                  <img src={provider.icon} alt={provider.name} className="w-5 h-5" />
                  <span>Continue with {provider.name}</span>
                </Button>
              ))}
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Your account will be secured automatically
            </p>
          </div>
        )}

        {step === 'creating' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <p className="font-semibold">Setting up your account...</p>
              <p className="text-sm text-muted-foreground">Securing your profile</p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">You're all set!</p>
                <p className="text-sm text-muted-foreground">Your account is ready to use</p>
              </div>
            </div>

            {showRecovery && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account ID</span>
                  <Button variant="ghost" size="sm" onClick={copyAddress}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <code className="text-xs break-all block bg-background p-2 rounded">
                  {walletAddress}
                </code>
                <p className="text-xs text-muted-foreground">
                  Save this ID for advanced features
                </p>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowRecovery(!showRecovery)}
            >
              {showRecovery ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide Advanced Info
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Advanced Info
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
