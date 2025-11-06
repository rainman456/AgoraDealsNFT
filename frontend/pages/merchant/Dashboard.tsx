import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import NotificationBar from "@/components/shared/NotificationBar";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, Users, Zap, DollarSign, Target, BarChart3, Eye, ArrowUpRight, Sparkles, QrCode, Printer, Download, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { promotionsAPI, Promotion } from "@/lib/api";

export default function Dashboard() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const qrPrintRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadMerchantPromotions();
  }, []);

  const loadMerchantPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const merchant = localStorage.getItem('merchant');
      if (!merchant) {
        setError('Please connect your wallet as a merchant');
        return;
      }
      const merchantData = JSON.parse(merchant);
      const response = await promotionsAPI.list({ merchantId: merchantData._id });
      setPromotions(response.data || []);
    } catch (err: any) {
      console.error('Failed to load promotions:', err);
      setError(err.response?.data?.message || 'Failed to load your promotions');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalRevenue: promotions.reduce((sum, p) => sum + (p.discountedPrice * p.currentSupply), 0),
    activeDeals: promotions.filter(p => p.isActive).length,
    totalCustomers: promotions.reduce((sum, p) => sum + p.currentSupply, 0),
    avgROI: 340,
  };

  const handlePrintQR = (promo: Promotion) => {
    setSelectedPromo(promo);
    setShowQRModal(true);
  };

  const handlePrint = () => {
    const printContent = qrPrintRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${selectedPromo?.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            .print-container {
              text-align: center;
              max-width: 600px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
              color: #333;
            }
            .discount {
              font-size: 48px;
              font-weight: bold;
              color: #3b82f6;
              margin: 20px 0;
            }
            .qr-code {
              margin: 30px 0;
            }
            .instructions {
              font-size: 14px;
              color: #666;
              margin-top: 20px;
              line-height: 1.6;
            }
            .deal-id {
              font-size: 12px;
              color: #999;
              margin-top: 10px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: "Print Ready",
      description: "QR code is ready to print",
    });
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr-code-${selectedPromo?.id}.png`;
    link.href = url;
    link.click();

    toast({
      title: "QR Code Downloaded",
      description: "QR code saved to your device",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <NotificationBar type="merchant" />

      <div className="py-8 px-4 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">
                Your <span className="neon-text">Dashboard</span>
              </h1>
              <p className="text-foreground/60 text-lg">Manage deals and grow your business</p>
            </div>
            <Link to="/merchant/create-deal">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-2xl transition-all duration-200 text-lg px-8 py-6 hover:scale-105"
              >
                <Plus className="w-6 h-6 mr-2" />
                Create New Deal
              </Button>
            </Link>
          </div>

          {/* Big Stats Cards - Shopify Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-success/30 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Total Revenue</p>
                  <p className="text-3xl md:text-4xl font-bold text-success">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-success">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-semibold">+23% from last month</span>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Active Deals</p>
                  <p className="text-3xl md:text-4xl font-bold text-primary">{stats.activeDeals}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary">
                <Sparkles className="w-3 h-3" />
                <span className="font-semibold">2 deals live now</span>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/30 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Total Customers</p>
                  <p className="text-3xl md:text-4xl font-bold text-secondary">{stats.totalCustomers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-secondary">
                <ArrowUpRight className="w-3 h-3" />
                <span className="font-semibold">+156 new this week</span>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-foreground/60 mb-1">Avg ROI</p>
                  <p className="text-3xl md:text-4xl font-bold text-accent">{stats.avgROI}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-accent">
                <BarChart3 className="w-3 h-3" />
                <span className="font-semibold">Above industry avg</span>
              </div>
            </Card>
          </div>

          {/* Quick Actions - Big Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link to="/merchant/create-deal" className="block">
              <Card className="p-6 hover:shadow-xl transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Create Deal</h3>
                    <p className="text-sm text-foreground/60">Launch a new promotion</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Card className="p-6 hover:shadow-xl transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-secondary/50 bg-gradient-to-br from-secondary/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">View Analytics</h3>
                  <p className="text-sm text-foreground/60">Track performance</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-xl transition-all duration-200 cursor-pointer group border-2 border-transparent hover:border-accent/50 bg-gradient-to-br from-accent/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Marketing Tools</h3>
                  <p className="text-sm text-foreground/60">Boost visibility</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Active Promotions */}
          <Card className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Your Active Deals</h2>
                <p className="text-foreground/60">Monitor and manage your live promotions</p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-lg">Loading your deals...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Error Loading Deals</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadMerchantPromotions}>Try Again</Button>
              </div>
            )}

            {!loading && !error && (
            <div className="space-y-4">
              {promotions.map((promo) => (
                <Card key={promo._id} className="p-6 hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-primary/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Deal Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{promo.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          promo.isActive 
                            ? "bg-success/20 text-success" 
                            : "bg-warning/20 text-warning"
                        }`}>
                          {promo.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Discount</p>
                          <p className="text-lg font-bold text-primary">{promo.discountPercentage}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Claimed</p>
                          <p className="text-lg font-bold">{promo.currentSupply.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Revenue</p>
                          <p className="text-lg font-bold text-success">${(promo.discountedPrice * promo.currentSupply).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">Available</p>
                          <p className="text-lg font-bold text-secondary">{promo.maxSupply - promo.currentSupply}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="lg" className="flex-1 md:flex-none">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="flex-1 md:flex-none"
                        onClick={() => handlePrintQR(promo)}
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        QR Code
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-foreground/60 mb-2">
                      <span>Performance</span>
                      <span>Expires: {new Date(promo.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${(promo.currentSupply / promo.maxSupply) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            )}

            {!loading && !error && promotions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No active deals yet</h3>
                <p className="text-foreground/60 mb-6">Create your first deal to start attracting customers</p>
                <Link to="/merchant/create-deal">
                  <Button size="lg" className="bg-primary hover:bg-primary-dark">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Deal
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* ROI Insights */}
          <Card className="mt-8 p-6 md:p-8 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">💡 ROI Insight</h3>
                <p className="text-foreground/70 mb-4">
                  Your deals are performing <span className="font-bold text-warning">340% better</span> than the industry average. 
                  Customers who claim your deals spend <span className="font-bold">2.3x more</span> on repeat visits.
                </p>
                <Button variant="outline" className="border-warning/30 hover:bg-warning/10">
                  View Full Report
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedPromo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
          <Card className="max-w-2xl w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Printable QR Code</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowQRModal(false)}>
                ✕
              </Button>
            </div>

            {/* Print Preview */}
            <div ref={qrPrintRef} className="print-container">
              <h1>{selectedPromo.title}</h1>
              <div className="discount">{selectedPromo.discountPercentage}% OFF</div>
              
              <div className="qr-code" id="qr-canvas">
                <QRCodeSVG
                  value={`deal-${selectedPromo._id}-merchant-redemption`}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="instructions">
                <p><strong>How to use this QR code:</strong></p>
                <p>1. Print and display at your location</p>
                <p>2. Customers scan to view deal details</p>
                <p>3. Verify and redeem at checkout</p>
              </div>

              <div className="deal-id">Deal ID: {selectedPromo._id}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                onClick={handlePrint}
                className="flex-1 bg-primary hover:bg-primary-dark"
                size="lg"
              >
                <Printer className="w-5 h-5 mr-2" />
                Print QR Code
              </Button>
              <Button
                onClick={handleDownloadQR}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PNG
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Display this QR code at your store for customers to easily access your deal
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
