import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Gift, 
  TrendingUp, 
  Shield, 
  ArrowRight, 
  Check,
  Mail,
  ChevronLeft
} from "lucide-react";

type OnboardingStep = "splash" | "value-props" | "signup" | "verify" | "first-deal" | "success";

const GIFT_DEAL = {
  id: "welcome-gift",
  title: "Welcome Gift: 20% Off Your First Purchase",
  merchant: "DealChain Partners",
  discount: 20,
  image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&auto=format&fit=crop",
  description: "Redeem at any participating merchant"
};

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>("splash");
  const [valuePropIndex, setValuePropIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-advance splash screen
  useEffect(() => {
    if (step === "splash") {
      const timer = setTimeout(() => setStep("value-props"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const valueProps = [
    {
      icon: Gift,
      title: "Save on Everything",
      description: "Get exclusive deals from your favorite brands and local businesses",
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      title: "Share & Trade",
      description: "Give deals to friends or sell them to others who want them",
      color: "text-accent"
    },
    {
      icon: Shield,
      title: "Always Yours",
      description: "Your deals are safe and can't be copied or taken away",
      color: "text-success"
    }
  ];

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulate instant signup
    setTimeout(() => {
      setStep("verify");
      toast({
        title: "Check your email!",
        description: `We sent a code to ${email}`,
      });
    }, 100);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return;
    
    // Instant verification
    setStep("first-deal");
  };

  const handleClaimGift = () => {
    setIsMinting(true);
    
    // Magical claiming animation
    setTimeout(() => {
      setIsMinting(false);
      setStep("success");
    }, 2000);
  };

  const handleComplete = () => {
    navigate("/home");
    toast({
      title: "Welcome to DealChain! 🎉",
      description: "Start exploring amazing deals",
    });
  };

  // Splash Screen
  if (step === "splash") {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-4">🎁</div>
          <h1 className="text-4xl font-heading font-bold text-white">DealChain</h1>
          <p className="text-white/80 mt-2">Save money on things you love</p>
        </div>
      </div>
    );
  }

  // Value Props Carousel
  if (step === "value-props") {
    const currentProp = valueProps[valuePropIndex];
    const Icon = currentProp.icon;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center animate-slide-up">
            <div className={`w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center`}>
              <Icon className={`w-12 h-12 ${currentProp.color}`} />
            </div>
            <h2 className="text-3xl font-heading font-bold mb-4">{currentProp.title}</h2>
            <p className="text-lg text-foreground/70 mb-8">{currentProp.description}</p>
            
            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mb-8">
              {valueProps.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === valuePropIndex ? "w-8 bg-primary" : "w-2 bg-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-3">
          {valuePropIndex < valueProps.length - 1 ? (
            <>
              <Button
                onClick={() => setValuePropIndex(valuePropIndex + 1)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6"
                size="lg"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setStep("signup")}
                variant="ghost"
                className="w-full"
              >
                Skip
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setStep("signup")}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6"
              size="lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Sign Up Screen
  if (step === "signup") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4">
          <button
            onClick={() => setStep("value-props")}
            className="p-2 hover:bg-muted rounded-lg transition-smooth"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-heading font-bold mb-2">Create Your Account</h2>
              <p className="text-foreground/70">Join thousands saving money every day</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="py-6 text-base"
                  required
                  autoFocus
                />
                <p className="text-xs text-foreground/60 mt-2">
                  We'll send you a verification code
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6"
                size="lg"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>

            {/* Social Sign Up */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-foreground/60">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast({ title: "Google sign-in coming soon!" })}
                  className="py-6"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toast({ title: "Apple sign-in coming soon!" })}
                  className="py-6"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verification Screen
  if (step === "verify") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4">
          <button
            onClick={() => setStep("signup")}
            className="p-2 hover:bg-muted rounded-lg transition-smooth"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full animate-slide-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-heading font-bold mb-2">Check Your Email</h2>
              <p className="text-foreground/70">
                We sent a 6-digit code to<br />
                <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Verification code</label>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="py-6 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={verificationCode.length !== 6}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6 disabled:opacity-50"
                size="lg"
              >
                Verify
                <Check className="w-5 h-5 ml-2" />
              </Button>

              <button
                type="button"
                onClick={() => toast({ title: "Code resent!", description: "Check your email" })}
                className="w-full text-sm text-primary hover:underline"
              >
                Didn't receive the code? Resend
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // First Deal Screen
  if (step === "first-deal") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full animate-slide-up">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4 animate-bounce">🎁</div>
              <h2 className="text-3xl font-heading font-bold mb-2">Here's a Gift for You!</h2>
              <p className="text-foreground/70">
                Grab your first deal and start saving
              </p>
            </div>

            {/* Gift Deal Card */}
            <div className="holographic-card overflow-hidden mb-6">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={GIFT_DEAL.image}
                  alt={GIFT_DEAL.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-4 py-2 rounded-full text-lg font-bold animate-pulse">
                  {GIFT_DEAL.discount}% OFF
                </div>
              </div>

              <div className="p-6">
                <p className="text-xs text-primary mb-2 uppercase tracking-wider">{GIFT_DEAL.merchant}</p>
                <h3 className="font-semibold text-xl mb-2">{GIFT_DEAL.title}</h3>
                <p className="text-foreground/60 mb-6">{GIFT_DEAL.description}</p>

                <Button
                  onClick={handleClaimGift}
                  disabled={isMinting}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary py-6"
                  size="lg"
                >
                  {isMinting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating your deal...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      Claim My Gift
                    </>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-foreground/60">
              Your deal will be ready to use right away
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center px-4 text-white">
        <div className="max-w-md w-full text-center animate-slide-up">
          {/* Celebration Animation */}
          <div className="relative mb-8">
            <div className="text-8xl animate-bounce">🎉</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-yellow-400/20 rounded-full animate-ping" />
            </div>
          </div>

          <h2 className="text-4xl font-heading font-bold mb-4">You're All Set!</h2>
          <p className="text-xl text-white/90 mb-8">
            Your first deal is ready to use.<br />
            Start exploring and saving!
          </p>

          {/* Quick Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-white/80">Deal Owned</div>
              </div>
              <div>
                <div className="text-2xl font-bold">20%</div>
                <div className="text-sm text-white/80">Discount</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$0</div>
                <div className="text-sm text-white/80">Saved (so far)</div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-white text-primary hover:bg-white/90 py-6 text-lg font-semibold"
            size="lg"
          >
            Start Exploring
            <Sparkles className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-sm text-white/70 mt-4">
            💡 Share deals with friends and family!
          </p>
        </div>
      </div>
    );
  }

  return null;
}
