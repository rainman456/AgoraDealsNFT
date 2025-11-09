import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { Mail, Lock, User, ShoppingBag } from 'lucide-react';

export const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // User signup state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Merchant signup state
  const [merchantForm, setMerchantForm] = useState({
    businessName: '',
    email: '',
    password: '',
    businessType: '',
    description: '',
  });

  const handleUserSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      // Instant signup - no artificial delays
      
      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: userForm.name,
        email: userForm.email,
        role: 'user' as const,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userForm.name}`,
        reputation: 0,
        reputationTier: 'Bronze' as const,
        badges: [],
        totalSpent: 0,
        dealsRedeemed: 0,
        stakingBalance: 0,
        stakingRewards: 0,
      };

      // Store mock user and token
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // Use login with email/password instead
      await login(userForm.email, userForm.password);
      toast.success('Account created successfully!');
      navigate('/onboarding');
    } catch (error) {
      console.error('Signup failed:', error);
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMerchantSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      // Instant signup - no artificial delays
      
      const mockMerchant = {
        id: Math.random().toString(36).substr(2, 9),
        name: merchantForm.businessName,
        email: merchantForm.email,
        role: 'merchant' as const,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${merchantForm.businessName}`,
      };

      // Store mock merchant and token
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify(mockMerchant));
      
      // Use login with email/password instead
      await login(merchantForm.email, merchantForm.password);
      toast.success('Merchant account created successfully!');
      navigate('/merchant/onboarding');
    } catch (error) {
      console.error('Signup failed:', error);
      toast.error('Failed to create merchant account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-purple-50/30 to-blue-50/30 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glass">
              <span className="text-white font-heading font-bold text-3xl">D</span>
            </div>
          </div>
          <h1 className="font-heading font-bold text-4xl mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Join DealChain
          </h1>
          <p className="text-muted-foreground text-lg">Create your account instantly</p>
        </div>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 glass p-1 h-auto">
            <TabsTrigger value="user" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-accent data-[state=active]:text-white data-[state=active]:shadow-emerald-glow">
              <User className="w-4 h-4" />
              <span className="font-medium">User</span>
            </TabsTrigger>
            <TabsTrigger value="merchant" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-gold data-[state=active]:text-foreground data-[state=active]:shadow-gold-glow">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-medium">Merchant</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="animate-fade-in">
            <Card className="glass border-0 shadow-glass-lg">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Create User Account</CardTitle>
                <CardDescription>Sign up to discover amazing deals</CardDescription>
              </CardHeader>
              <form onSubmit={handleUserSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="user-name"
                        type="text"
                        placeholder="John Doe"
                        className="pl-10"
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="user-password"
                        type="password"
                        placeholder="Any password"
                        className="pl-10"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-gradient-accent hover:shadow-emerald-glow transition-all" size="lg" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                  <p className="text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Log in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="merchant" className="animate-fade-in">
            <Card className="glass border-0 shadow-glass-lg">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Create Merchant Account</CardTitle>
                <CardDescription>Start offering deals to customers</CardDescription>
              </CardHeader>
              <form onSubmit={handleMerchantSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="business-name"
                        type="text"
                        placeholder="Your Business Name"
                        className="pl-10"
                        value={merchantForm.businessName}
                        onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="merchant-email">Business Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="merchant-email"
                        type="email"
                        placeholder="business@example.com"
                        className="pl-10"
                        value={merchantForm.email}
                        onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-type">Business Type</Label>
                    <Input
                      id="business-type"
                      type="text"
                      placeholder="e.g., Restaurant, Hotel, Retail"
                      value={merchantForm.businessType}
                      onChange={(e) => setMerchantForm({ ...merchantForm, businessType: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="merchant-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="merchant-password"
                        type="password"
                        placeholder="Any password"
                        className="pl-10"
                        value={merchantForm.password}
                        onChange={(e) => setMerchantForm({ ...merchantForm, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full bg-gradient-gold hover:shadow-gold-glow transition-all text-foreground" size="lg" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Sign Up as Merchant'}
                  </Button>
                  <p className="text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Log in
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
