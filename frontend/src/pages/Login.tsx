import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-toastify';
import { Mail, Lock, User, ShoppingBag, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { error, getFieldErrorMessage, hasFieldError, handleErrorResponse, clearError } = useErrorHandler();
  
  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Basic validation
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🔐 Login attempt with:', { email, passwordLength: password.length });
      console.log('📡 API Base URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('🔄 Using Mock API:', import.meta.env.VITE_USE_MOCK_API === 'true');
      
      const response = await authAPI.login(email, password);
      console.log('✅ Login response:', response);
      
      if (response.success && response.data) {
        toast.success('Login successful!');
        // Store wallet address from response
        if (response.data.walletAddress) {
          localStorage.setItem('walletAddress', response.data.walletAddress);
        }
        // Navigate based on type
        if (response.data.type === 'merchant') {
          localStorage.setItem('merchant', JSON.stringify(response.data));
          navigate('/merchant');
        } else {
          localStorage.setItem('user', JSON.stringify(response.data));
          navigate('/');
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      handleErrorResponse(error, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-emerald-50/20 to-purple-50/20 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glass">
              <span className="text-white font-heading font-bold text-3xl">D</span>
            </div>
          </div>
          <h1 className="font-heading font-bold text-4xl mb-2 bg-gradient-to-r from-emerald-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-lg">
            Sign in instantly to access your deals
          </p>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 glass p-1 h-auto">
            <TabsTrigger value="email" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-accent data-[state=active]:text-white data-[state=active]:shadow-emerald-glow">
              <User className="w-4 h-4" />
              <span className="font-medium">User</span>
            </TabsTrigger>
            <TabsTrigger value="merchant" className="flex items-center gap-2 py-3 data-[state=active]:bg-gradient-gold data-[state=active]:text-foreground data-[state=active]:shadow-gold-glow">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-medium">Merchant</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="animate-fade-in">
            <Card className="glass border-0 shadow-glass-lg">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">User Login</CardTitle>
                <CardDescription>
                  Login as a user to browse and claim deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="user-email"
                        type="email"
                        placeholder="user@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-accent hover:shadow-emerald-glow transition-all"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Demo: user@example.com / any password
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="merchant" className="animate-fade-in">
            <Card className="glass border-0 shadow-glass-lg">
              <CardHeader>
                <CardTitle className="font-heading text-2xl">Merchant Login</CardTitle>
                <CardDescription>
                  Login as a merchant to manage your deals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="merchant-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="merchant-email"
                        type="email"
                        placeholder="merchant@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="merchant-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-400" />
                      <Input
                        id="merchant-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-gold hover:shadow-gold-glow transition-all text-foreground"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Demo: merchant@luxuryhotels.com / any password
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
