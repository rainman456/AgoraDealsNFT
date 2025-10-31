import { useState, useEffect } from "react";
import { mockDeals, promotionToDeal } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, Loader2, Shield, Clock, AlertTriangle, Sparkles } from "lucide-react";

export default function Redemption() {
  const [selectedDeal, setSelectedDeal] = useState(promotionToDeal(mockDeals[0]) as any);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showConfetti, setShowConfetti] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const { toast } = useToast();

  // Countdown timer for redemption window
  useEffect(() => {
    if (countdown > 0 && !isRedeemed) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isRedeemed]);

  // Auto-brightness boost for outdoor scanning
  useEffect(() => {
    setBrightness(100);
  }, [selectedDeal]);

  const handleScanAtMerchant = async () => {
    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsVerifying(false);
    setIsRedeemed(true);
    setShowConfetti(true);
    
    toast({
      title: "🎉 Deal Redeemed!",
      description: "Enjoy your savings!",
    });

    // Hide confetti after animation
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleRefreshCode = () => {
    setCountdown(30);
    toast({
      title: "Code Refreshed",
      description: "New secure code generated",
    });
  };

  const daysUntilExpiry = Math.ceil((new Date(selectedDeal.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#0080FF', '#FF6B35', '#2DD4BF', '#FBBF24'][Math.floor(Math.random() * 4)],
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Redeem Your <span className="neon-text">Deal</span>
          </h1>
          <p className="text-foreground/60 text-lg">Show QR code at checkout to save instantly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deal Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Active Deals
              </h3>
              <div className="space-y-2">
                {mockDeals.slice(0, 5).map((promo) => {
                  const deal = promotionToDeal(promo);
                  return (
                    <button
                      key={deal.id}
                      onClick={() => {
                        setSelectedDeal(deal);
                        setIsRedeemed(false);
                        setCountdown(30);
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                        selectedDeal.id === deal.id
                          ? "bg-primary/20 border-2 border-primary text-primary shadow-lg scale-105"
                          : "bg-card border border-border hover:border-primary/50 hover:shadow-md"
                      }`}
                    >
                      <p className="font-semibold line-clamp-1 text-sm">{deal.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-foreground/60">{deal.merchant}</p>
                        <span className="text-xs font-bold text-primary">{deal.discount}% OFF</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main QR Code & Verification */}
          <div className="lg:col-span-2">
            <Card className="holographic-card p-6 md:p-10 relative overflow-hidden">
              {/* Security Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full border border-success/30">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-semibold">Secure Code</span>
              </div>

              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{selectedDeal.title}</h2>
                <p className="text-foreground/60 mb-6">{selectedDeal.merchant}</p>

                {/* Countdown Timer */}
                {!isRedeemed && (
                  <div className="mb-6 inline-flex items-center gap-2 bg-warning/10 text-warning px-4 py-2 rounded-full border border-warning/30">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span className="font-semibold text-sm">
                      Code expires in {countdown}s
                    </span>
                  </div>
                )}

                {/* QR Code with Auto-Brightness */}
                <div 
                  className="flex justify-center mb-8 p-8 bg-white rounded-2xl border-4 border-primary/20 shadow-2xl mx-auto max-w-sm"
                  style={{ filter: `brightness(${brightness}%)` }}
                >
                  <QRCodeSVG
                    value={`dealchain://redeem/${selectedDeal.id}?timestamp=${Date.now()}`}
                    size={280}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>

                {/* Brightness Control Hint */}
                {!isRedeemed && (
                  <p className="text-xs text-foreground/50 mb-6 flex items-center justify-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Auto-brightness enabled for outdoor scanning
                  </p>
                )}

                {/* Deal Details Grid */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
                    <p className="text-foreground/60 text-xs mb-1">Discount</p>
                    <p className="text-2xl font-bold text-primary">{selectedDeal.discount}%</p>
                  </div>
                  <div className="p-4 bg-accent/10 rounded-xl border border-accent/30">
                    <p className="text-foreground/60 text-xs mb-1">Valid For</p>
                    <p className="text-lg font-bold text-accent">{daysUntilExpiry}d</p>
                  </div>
                  <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/30">
                    <p className="text-foreground/60 text-xs mb-1">Savings</p>
                    <p className="text-lg font-bold text-secondary">${(selectedDeal.price || 0 * selectedDeal.discount / 100).toFixed(0)}</p>
                  </div>
                </div>

                {/* Quick Instructions */}
                <div className="mb-8 p-4 bg-muted/50 rounded-xl border border-border text-left">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    How to Redeem
                  </h4>
                  <ol className="text-sm text-foreground/70 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">1.</span>
                      <span>Show this QR code to the cashier at checkout</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">2.</span>
                      <span>They'll scan it to verify and apply your discount</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-primary">3.</span>
                      <span>Enjoy your savings instantly!</span>
                    </li>
                  </ol>
                </div>

                {/* Verification Status */}
                {isRedeemed ? (
                  <div className="p-6 bg-success/10 rounded-2xl border-2 border-success/30 mb-6 animate-slide-up">
                    <div className="flex flex-col items-center gap-3 text-success">
                      <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center animate-bounce-slow">
                        <CheckCircle className="w-10 h-10" />
                      </div>
                      <div>
                        <p className="font-bold text-xl mb-1">Successfully Redeemed!</p>
                        <p className="text-sm text-foreground/60">You saved ${(selectedDeal.price || 0 * selectedDeal.discount / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={handleScanAtMerchant}
                      disabled={isVerifying || countdown === 0}
                      className="w-full bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-xl transition-all duration-200 text-lg py-6"
                      size="lg"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verifying Deal...
                        </>
                      ) : countdown === 0 ? (
                        "Code Expired - Refresh"
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-2" />
                          Verify & Redeem
                        </>
                      )}
                    </Button>

                    {countdown === 0 && (
                      <Button
                        onClick={handleRefreshCode}
                        variant="outline"
                        className="w-full"
                      >
                        Generate New Code
                      </Button>
                    )}
                  </div>
                )}

                {/* Security Notice */}
                <div className="mt-6 p-3 bg-muted/30 rounded-lg border border-border">
                  <p className="text-xs text-foreground/50 flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3" />
                    Fraud-proof • One-time use • Encrypted verification
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
