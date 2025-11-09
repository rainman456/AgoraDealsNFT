import React, { useState, useEffect } from 'react';
import { merchantAPI, Deal } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { Plus, TrendingUp, Users, DollarSign, BarChart2, Upload, Edit, Pause, Copy, CheckCircle, Clock, MapPin } from 'lucide-react';
import { QrCode } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

export const MerchantDashboard: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [wizardStep, setWizardStep] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    category: 'flights',
    price: '',
    originalPrice: '',
    expiresAt: '',
    maxRedemptions: '',
    location: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setIsLoading(true);
      const data = await merchantAPI.getMerchantDeals();
      setDeals(data);
    } catch (error) {
      console.error('Failed to load deals:', error);
      toast.error('Failed to load your deals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleCreateDeal = async () => {
    try {
      setIsCreating(true);
      
      const dealData = {
        title: formData.title,
        description: formData.description,
        discount: parseFloat(formData.discount),
        category: formData.category,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        expiresAt: formData.expiresAt,
        maxRedemptions: formData.maxRedemptions ? parseInt(formData.maxRedemptions) : undefined,
        location: formData.location || undefined,
        imageFile: imageFile || undefined,
      };

      await merchantAPI.createDeal(dealData);
      toast.success('Deal created successfully!');
      setCreateDialogOpen(false);
      resetForm();
      loadDeals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create deal');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discount: '',
      category: 'flights',
      price: '',
      originalPrice: '',
      expiresAt: '',
      maxRedemptions: '',
      location: '',
    });
    setImageFile(null);
  };

  const handleRevoke = async (dealId: string) => {
    if (!confirm('Are you sure you want to revoke this deal?')) return;
    
    try {
      await merchantAPI.revokeDeal(dealId);
      toast.success('Deal revoked successfully');
      loadDeals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke deal');
    }
  };

  const totalDeals = deals.length;
  const totalRedemptions = deals.reduce((sum, deal) => sum + (deal.redemptionCount || 0), 0);
  const totalRevenue = deals.reduce((sum, deal) => sum + (deal.price * (deal.redemptionCount || 0)), 0);
  const redemptionRate = totalDeals > 0 ? ((totalRedemptions / (deals.reduce((sum, deal) => sum + (deal.maxRedemptions || 100), 0))) * 100).toFixed(1) : 0;

  // Mock analytics data
  const revenueData = [
    { date: 'Mon', revenue: 1200 },
    { date: 'Tue', revenue: 1900 },
    { date: 'Wed', revenue: 1500 },
    { date: 'Thu', revenue: 2200 },
    { date: 'Fri', revenue: 2800 },
    { date: 'Sat', revenue: 3200 },
    { date: 'Sun', revenue: 2600 },
  ];

  const redemptionsByHour = [
    { hour: '9AM', count: 5 },
    { hour: '12PM', count: 15 },
    { hour: '3PM', count: 12 },
    { hour: '6PM', count: 22 },
    { hour: '9PM', count: 18 },
  ];

  const categoryData = [
    { name: 'Flights', value: 35, color: '#3b82f6' },
    { name: 'Hotels', value: 25, color: '#8b5cf6' },
    { name: 'Restaurants', value: 20, color: '#ec4899' },
    { name: 'Experiences', value: 20, color: '#f59e0b' },
  ];

  const recentRedemptions = [
    { id: '1', customer: 'Alice Johnson', deal: '50% Off Flight', time: '2 mins ago', amount: '$1200' },
    { id: '2', customer: 'Bob Smith', deal: 'Luxury Resort', time: '15 mins ago', amount: '$450' },
    { id: '3', customer: 'Carol White', deal: 'Spa Package', time: '1 hour ago', amount: '$180' },
  ];

  const handleVerifyRedemption = async () => {
    if (!scannedCode) return;
    
    setVerificationStatus('idle');
    // Simulate verification
    setTimeout(() => {
      setVerificationStatus('success');
      toast.success('Redemption verified successfully!');
      setTimeout(() => {
        setScannerOpen(false);
        setScannedCode('');
        setVerificationStatus('idle');
      }, 2000);
    }, 1000);
  };

  const handleDuplicateDeal = (deal: Deal) => {
    setFormData({
      title: `${deal.title} (Copy)`,
      description: deal.description,
      discount: (deal.discount || deal.discountPercentage || 0).toString(),
      category: deal.category,
      price: deal.price.toString(),
      originalPrice: deal.originalPrice?.toString() || '',
      expiresAt: '',
      maxRedemptions: deal.maxRedemptions?.toString() || '',
      location: deal.location || '',
    });
    setWizardStep(1);
    setCreateDialogOpen(true);
  };

  const handlePauseDeal = async (dealId: string) => {
    toast.info('Deal paused successfully');
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">
              Merchant Dashboard
            </h1>
            <p className="text-muted-foreground">
              Create and manage your promotional deals
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setScannerOpen(true)} variant="outline" size="lg">
              <QrCode className="w-5 h-5 mr-2" />
              Scan QR
            </Button>
            <Button onClick={() => { setWizardStep(1); setCreateDialogOpen(true); }} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Deal
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="promotions">Promotions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Coupons</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-heading font-bold">{totalDeals}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active promotions</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Redeemed</CardTitle>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-heading font-bold">{totalRedemptions}</div>
                    <p className="text-xs text-muted-foreground mt-1">{redemptionRate}% redemption rate</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                    <DollarSign className="w-4 h-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-heading font-bold">${totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-green-600 mt-1">+12.5% from last week</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Deal Value</CardTitle>
                    <BarChart2 className="w-4 h-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-heading font-bold">${totalDeals > 0 ? (totalRevenue / totalRedemptions || 0).toFixed(2) : '0.00'}</div>
                    <p className="text-xs text-muted-foreground mt-1">Per redemption</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                  <CardDescription>Redemptions by time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={redemptionsByHour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hour" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Redemptions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Redemptions</CardTitle>
                <CardDescription>Latest customer activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRedemptions.map((redemption) => (
                    <div key={redemption.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{redemption.customer}</p>
                          <p className="text-sm text-muted-foreground">{redemption.deal}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{redemption.amount}</p>
                        <p className="text-xs text-muted-foreground">{redemption.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROMOTIONS TAB */}
          <TabsContent value="promotions" className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle>Active Promotions</CardTitle>
                <CardDescription>Manage your live deals</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : deals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">No deals created yet</p>
                    <p className="text-sm mb-4">Create your first deal to start attracting customers!</p>
                    <Button onClick={() => { setWizardStep(1); setCreateDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Deal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deals.map((deal) => (
                      <motion.div
                        key={deal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <img
                          src={deal.imageUrl}
                          alt={deal.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-heading font-bold text-lg">{deal.title}</h3>
                            <Badge variant={deal.redemptionCount && deal.maxRedemptions && deal.redemptionCount >= deal.maxRedemptions ? 'destructive' : 'default'}>
                              {deal.redemptionCount && deal.maxRedemptions && deal.redemptionCount >= deal.maxRedemptions ? 'Sold Out' : 'Active'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Badge variant="outline">{deal.category}</Badge>
                            </span>
                            <span>{deal.discount}% off</span>
                            <span className="font-bold text-foreground">${deal.price}</span>
                            {deal.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {deal.location}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={((deal.redemptionCount || 0) / (deal.maxRedemptions || 100)) * 100} className="flex-1 h-2" />
                            <span className="text-sm font-medium">
                              {deal.redemptionCount || 0}/{deal.maxRedemptions || '∞'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>Revenue: ${((deal.redemptionCount || 0) * deal.price).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleDuplicateDeal(deal)}>
                            <Copy className="w-4 h-4 mr-1" />
                            Duplicate
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePauseDeal(deal.id)}>
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRevoke(deal.id)}
                          >
                            End
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Redemptions Over Time</CardTitle>
                  <CardDescription>30-day trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>By deal type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>ROI Calculator</CardTitle>
                <CardDescription>Estimate your return on investment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Investment</p>
                    <p className="text-2xl font-bold">${(totalDeals * 50).toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
                    <p className="text-2xl font-bold text-green-500">${(totalRevenue - totalDeals * 50).toFixed(2)}</p>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">ROI</p>
                    <p className="text-2xl font-bold text-blue-500">{totalDeals > 0 ? (((totalRevenue - totalDeals * 50) / (totalDeals * 50)) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REDEMPTIONS TAB */}
          <TabsContent value="redemptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Redemption History</CardTitle>
                <CardDescription>All verified redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRedemptions.map((redemption) => (
                    <div key={redemption.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <p className="font-bold">{redemption.customer}</p>
                          <p className="text-sm text-muted-foreground">{redemption.deal}</p>
                          <p className="text-xs text-muted-foreground">{redemption.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{redemption.amount}</p>
                        <Badge variant="outline" className="mt-1">Verified</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IMPORT TAB */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Import Deals</CardTitle>
                <CardDescription>Upload CSV or connect to your existing systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Drop CSV file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mb-4">Supports .csv, .xlsx files up to 10MB</p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <BarChart2 className="w-8 h-8 mx-auto mb-3 text-blue-500" />
                      <h3 className="font-bold mb-2">Restaurant Template</h3>
                      <p className="text-sm text-muted-foreground mb-3">Pre-configured for food & dining deals</p>
                      <Button variant="outline" size="sm">Download</Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-3 text-purple-500" />
                      <h3 className="font-bold mb-2">Retail Template</h3>
                      <p className="text-sm text-muted-foreground mb-3">Perfect for shopping promotions</p>
                      <Button variant="outline" size="sm">Download</Button>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 mx-auto mb-3 text-green-500" />
                      <h3 className="font-bold mb-2">Service Template</h3>
                      <p className="text-sm text-muted-foreground mb-3">For spas, salons & services</p>
                      <Button variant="outline" size="sm">Download</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* QR Scanner Dialog */}
        <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Verify Redemption</DialogTitle>
              <DialogDescription>
                Scan customer QR code or enter code manually
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {verificationStatus === 'idle' && (
                <>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Position QR code in frame</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Or enter code manually</Label>
                    <Input
                      placeholder="Enter redemption code"
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleVerifyRedemption} disabled={!scannedCode} className="w-full">
                    Verify Redemption
                  </Button>
                </>
              )}

              {verificationStatus === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Verified!</h3>
                  <p className="text-muted-foreground">Redemption successful</p>
                </motion.div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Deal Wizard Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Promotion - Step {wizardStep} of 5</DialogTitle>
              <DialogDescription>
                {wizardStep === 1 && 'Enter deal details and description'}
                {wizardStep === 2 && 'Set supply and pricing'}
                {wizardStep === 3 && 'Configure validity period'}
                {wizardStep === 4 && 'Set location (optional)'}
                {wizardStep === 5 && 'Preview and launch'}
              </DialogDescription>
            </DialogHeader>

            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    step <= wizardStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <div className="space-y-4 py-4">
              {/* Step 1: Deal Details */}
              {wizardStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Deal Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., 50% Off Flight to Paris"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your deal..."
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flights">Flights</SelectItem>
                          <SelectItem value="hotels">Hotels</SelectItem>
                          <SelectItem value="restaurants">Restaurants</SelectItem>
                          <SelectItem value="experiences">Experiences</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount % *</Label>
                      <Input
                        id="discount"
                        type="number"
                        placeholder="e.g., 50"
                        value={formData.discount}
                        onChange={(e) => handleInputChange('discount', e.target.value)}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Deal Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imageFile && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-border"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Supply & Pricing */}
              {wizardStep === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="maxRedemptions">Max Supply *</Label>
                    <Input
                      id="maxRedemptions"
                      type="number"
                      placeholder="How many coupons to create?"
                      value={formData.maxRedemptions}
                      onChange={(e) => handleInputChange('maxRedemptions', e.target.value)}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for unlimited supply</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Coupon (USD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="e.g., 99.99"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="originalPrice">Original Value (USD)</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        placeholder="e.g., 199.99"
                        value={formData.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {formData.price && formData.maxRedemptions && (
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm font-medium mb-1">Potential Revenue</p>
                      <p className="text-2xl font-bold">${(parseFloat(formData.price) * parseInt(formData.maxRedemptions)).toFixed(2)}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Validity */}
              {wizardStep === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expiration Date & Time *</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">When should this deal expire?</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 7);
                      handleInputChange('expiresAt', date.toISOString().slice(0, 16));
                    }}>7 Days</Button>
                    <Button variant="outline" onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 30);
                      handleInputChange('expiresAt', date.toISOString().slice(0, 16));
                    }}>30 Days</Button>
                    <Button variant="outline" onClick={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 90);
                      handleInputChange('expiresAt', date.toISOString().slice(0, 16));
                    }}>90 Days</Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Location */}
              {wizardStep === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Paris, France or leave empty for online deals"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Add location for geo-targeted deals</p>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Preview */}
              {wizardStep === 5 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="border border-border rounded-lg p-6">
                    <h3 className="font-bold text-xl mb-4">Preview</h3>
                    {imageFile && (
                      <div className="mb-4">
                        <img
                          src={URL.createObjectURL(imageFile)}
                          alt="Deal preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Title</p>
                        <p className="font-bold">{formData.title || 'No title'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p>{formData.description || 'No description'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Discount</p>
                          <p className="font-bold text-primary">{formData.discount}% OFF</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-bold">${formData.price}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Supply</p>
                          <p className="font-bold">{formData.maxRedemptions || 'Unlimited'} coupons</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Category</p>
                          <p className="font-bold capitalize">{formData.category}</p>
                        </div>
                      </div>
                      {formData.location && (
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-bold">{formData.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                {wizardStep > 1 && (
                  <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setWizardStep(1); }}>
                  Cancel
                </Button>
                {wizardStep < 5 ? (
                  <Button onClick={() => setWizardStep(wizardStep + 1)}>
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleCreateDeal}
                    disabled={!formData.title || !formData.description || !formData.discount || !formData.price || !formData.expiresAt || isCreating}
                  >
                    {isCreating ? 'Creating Deal...' : 'Launch Promotion'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
