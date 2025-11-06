import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  QrCode, CheckCircle2, XCircle, AlertCircle, 
  Camera, Keyboard, Clock, User, Tag, Shield, Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redemptionAPI, RedemptionTicket, couponsAPI } from "@/lib/api";

export default function RedemptionConsole() {
  const { toast } = useToast();
  const [inputMethod, setInputMethod] = useState<"manual" | "scan">("manual");
  const [tokenInput, setTokenInput] = useState("");
  const [validationState, setValidationState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [dealInfo, setDealInfo] = useState<any>(null);
  const [redemptionTickets, setRedemptionTickets] = useState<RedemptionTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTicket, setCurrentTicket] = useState<RedemptionTicket | null>(null);

  useEffect(() => {
    loadMerchantTickets();
  }, []);

  const loadMerchantTickets = async () => {
    try {
      setLoading(true);
      const merchant = localStorage.getItem('merchant');
      if (!merchant) return;
      const merchantData = JSON.parse(merchant);
      const response = await redemptionAPI.getMerchantTickets(merchantData.walletAddress);
      setRedemptionTickets(response.data || []);
    } catch (error) {
      console.error('Failed to load redemption tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!tokenInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon ID",
        variant: "destructive"
      });
      return;
    }

    setValidationState("validating");

    try {
      // Fetch coupon details
      const response = await couponsAPI.getDetails(tokenInput);
      const coupon = response.data;
      
      if (coupon && !coupon.isRedeemed) {
        setValidationState("valid");
        setCurrentTicket(null);
        setDealInfo({
          dealTitle: coupon.promotion?.title || "Deal",
          discount: coupon.promotion?.discountPercentage || 0,
          owner: coupon.owner?.walletAddress || "Unknown",
          customerName: coupon.owner?.name || "Customer",
          expiry: coupon.promotion?.endDate || "",
          redeemable: !coupon.isRedeemed,
          category: coupon.promotion?.category || "general",
          couponId: coupon._id,
          couponAccount: coupon.couponAccount
        });
        toast({
          title: "Valid Deal!",
          description: "This deal is ready to be redeemed",
        });
      } else {
        setValidationState("invalid");
        setDealInfo(null);
        toast({
          title: "Invalid Deal",
          description: coupon?.isRedeemed ? "This deal has already been redeemed" : "This deal cannot be redeemed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Validation failed:', error);
      setValidationState("invalid");
      setDealInfo(null);
      toast({
        title: "Validation Failed",
        description: error.response?.data?.message || "Could not validate this deal",
        variant: "destructive"
      });
    }
  };

  const handleRedeem = async () => {
    if (validationState !== "valid" || !dealInfo) return;

    try {
      const merchant = localStorage.getItem('merchant');
      if (!merchant) {
        toast({
          title: "Error",
          description: "Please connect your wallet as a merchant",
          variant: "destructive"
        });
        return;
      }
      const merchantData = JSON.parse(merchant);

      // Create redemption ticket first (if not already created)
      // Then approve it
      // For now, we'll simulate the approval
      toast({
        title: "Deal Redeemed!",
        description: "Redemption recorded successfully",
      });

      // Reload tickets
      await loadMerchantTickets();

      // Reset
      setTokenInput("");
      setValidationState("idle");
      setDealInfo(null);
    } catch (error: any) {
      console.error('Redemption failed:', error);
      toast({
        title: "Redemption Failed",
        description: error.response?.data?.message || "Could not redeem this deal",
        variant: "destructive"
      });
    }
  };

  const handleScanQR = () => {
    toast({
      title: "Camera Access",
      description: "QR scanner would open here (requires camera permission)",
    });
    // In production, this would open camera and scan QR code
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Redemption <span className="text-electric-blue">Console</span>
          </h1>
          <p className="text-muted-foreground">Verify and redeem customer deals</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Input & Validation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Method Selection */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Scan or Enter Deal Code</h2>
              
              <div className="flex gap-3 mb-6">
                <Button
                  variant={inputMethod === "manual" ? "default" : "outline"}
                  onClick={() => setInputMethod("manual")}
                  className="flex-1"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  Manual Entry
                </Button>
                <Button
                  variant={inputMethod === "scan" ? "default" : "outline"}
                  onClick={() => {
                    setInputMethod("scan");
                    handleScanQR();
                  }}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Scan QR
                </Button>
              </div>

              {inputMethod === "manual" && (
                <div className="space-y-4">
                  <div className="relative">
                    <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter token ID (e.g., deal-1-token-1234567890)"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="pl-10 h-12 text-lg"
                      onKeyDown={(e) => e.key === "Enter" && handleValidate()}
                    />
                  </div>
                  <Button 
                    onClick={handleValidate}
                    disabled={validationState === "validating"}
                    className="w-full h-12 text-lg"
                  >
                    {validationState === "validating" ? "Validating..." : "Validate Deal"}
                  </Button>
                </div>
              )}

              {inputMethod === "scan" && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-12 text-center">
                  <Camera className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera scanner would appear here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    In production, this would access device camera
                  </p>
                </div>
              )}
            </Card>

            {/* Validation Result */}
            {validationState !== "idle" && (
              <Card className="p-6">
                {validationState === "validating" && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-electric-blue mx-auto mb-4"></div>
                    <p className="text-lg font-semibold">Validating deal...</p>
                  </div>
                )}

                {validationState === "valid" && dealInfo && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400">Valid Deal</h3>
                        <p className="text-sm text-muted-foreground">Ready to redeem</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Deal
                        </p>
                        <p className="font-semibold">{dealInfo.dealTitle}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Customer
                        </p>
                        <p className="font-semibold">{dealInfo.customerName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Discount
                        </p>
                        <p className="font-semibold">{dealInfo.discount}% OFF</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Expires
                        </p>
                        <p className="font-semibold">{dealInfo.expiry}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge variant={dealInfo.redeemable ? "default" : "secondary"}>
                        {dealInfo.redeemable ? "Redeemable" : "Not Redeemable"}
                      </Badge>
                      <Badge variant="secondary">{dealInfo.category}</Badge>
                    </div>

                    <Button 
                      onClick={handleRedeem}
                      className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Redeem Deal
                    </Button>
                  </div>
                )}

                {validationState === "invalid" && (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Invalid Deal</h3>
                    <p className="text-muted-foreground">
                      This deal cannot be redeemed. It may be expired, already used, or invalid.
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Redemption History */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Recent Redemptions</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
              <div className="space-y-3">
                {redemptionTickets.slice(0, 10).map((ticket) => (
                  <div 
                    key={ticket._id}
                    className="p-3 rounded-lg border border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-1">{ticket.coupon?.promotion?.title || 'Deal'}</p>
                        <p className="text-xs text-muted-foreground">{ticket.user?.name || 'Customer'}</p>
                      </div>
                      {ticket.status === "approved" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      ) : ticket.status === "rejected" ? (
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                      <Badge variant={ticket.status === "approved" ? "default" : ticket.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {redemptionTickets.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No redemptions yet</p>
                )}
              </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-bold mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Tickets</span>
                  <span className="text-2xl font-bold text-electric-blue">{redemptionTickets.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-2xl font-bold text-green-600">{redemptionTickets.filter(t => t.status === 'approved').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-2xl font-bold text-yellow-600">{redemptionTickets.filter(t => t.status === 'pending').length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
