import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar, { MobileMenu } from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import MobileNav from '@/components/shared/MobileNav';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthProvider } from '@/contexts/AuthContext';

// User Pages
import Index from '@/pages/Index';
import Home from '@/pages/user/Home';
import Deals from '@/pages/user/Deals';
import DealDetailUser from '@/pages/user/DealDetail';
import Marketplace from '@/pages/user/Marketplace';
import MyDeals from '@/pages/user/MyDeals';
import Redemption from '@/pages/user/Redemption';
import GroupDeals from '@/pages/user/GroupDeals';
import Auctions from '@/pages/user/Auctions';
import AuctionsEnhanced from '@/pages/user/AuctionsEnhanced';
import ProfileUser from '@/pages/user/Profile';
import RedemptionTickets from '@/pages/user/RedemptionTickets';
import Social from '@/pages/user/Social';
import UserStats from '@/pages/user/UserStats';
import Staking from '@/pages/user/Staking';
import ExternalDeals from '@/pages/user/ExternalDeals';

// Standalone Pages
import Profile from '@/pages/Profile';
import DealDetail from '@/pages/DealDetail';
import MerchantDashboard from '@/pages/MerchantDashboard';
import MerchantDashboardEnhanced from '@/pages/MerchantDashboardEnhanced';
import MerchantLogin from '@/pages/MerchantLogin';
import UserLogin from '@/pages/UserLogin';

// Merchant Pages
import MerchantOnboarding from '@/pages/merchant/MerchantOnboarding';
import Dashboard from '@/pages/merchant/Dashboard';
import PromotionWizard from '@/pages/merchant/PromotionWizard';
import RedemptionConsole from '@/pages/merchant/RedemptionConsole';

// Onboarding
import Onboarding from './pages/onboarding/Onboarding';

const queryClient = new QueryClient();

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState("lime-dark");
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "lime-dark";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeName: string) => {
    const html = document.documentElement;
    
    // Remove all theme classes
    html.classList.remove("dark", "light", "lime-dark", "lime-light", "neomint", "cyber", "plasma", "sunset", "ocean", "sakura", "forest", "royal", "midnight");
    
    // Apply new theme
    if (themeName === "lime-dark") {
      html.classList.add("dark");
    } else if (themeName === "lime-light") {
      html.classList.add("light");
    } else {
      html.classList.add(themeName);
    }
  };

  const signInProviders = [
    { name: "Google", icon: "🔐" },
    { name: "Email", icon: "📧" },
    { name: "Apple", icon: "🍎" },
    { name: "Facebook", icon: "📘" },
  ];

  const handleSignIn = (provider: string) => {
    toast({
      title: "Account Connected",
      description: `Signed in with ${provider}`,
    });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    setIsMenuOpen(false);
  };

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
          <main className="flex-1 pb-20 md:pb-0">
            <Routes>
              {/* Onboarding */}
              <Route path="/welcome" element={<Onboarding />} />
              
              {/* User Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Home />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/:id" element={<DealDetailUser />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/my-deals" element={<MyDeals />} />
              <Route path="/redemption" element={<Redemption />} />
              <Route path="/group-deals" element={<GroupDeals />} />
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/auctions-enhanced" element={<AuctionsEnhanced />} />
              <Route path="/redemption-tickets" element={<RedemptionTickets />} />
              <Route path="/social" element={<Social />} />
              <Route path="/stats" element={<UserStats />} />
              <Route path="/user-stats" element={<UserStats />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/external-deals" element={<ExternalDeals />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/profile" element={<ProfileUser />} />
              <Route path="/user/login" element={<UserLogin />} />
              
              {/* Merchant Routes */}
              <Route path="/merchant/login" element={<MerchantLogin />} />
              <Route path="/merchant/onboarding" element={<MerchantOnboarding />} />
              <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
              <Route path="/merchant/promotions" element={<MerchantDashboard />} />
              <Route path="/merchant/analytics" element={<MerchantDashboardEnhanced />} />
              <Route path="/merchant/profile" element={<MerchantDashboard />} />
              <Route path="/merchant/dashboard-old" element={<Dashboard />} />
              <Route path="/merchant/create-deal" element={<PromotionWizard />} />
              <Route path="/merchant/redemption" element={<RedemptionConsole />} />
            </Routes>
          </main>
          <Footer />
          <MobileNav />
          <MobileMenu 
            isOpen={isMenuOpen} 
            setIsOpen={setIsMenuOpen}
            theme={theme}
            onThemeChange={handleThemeChange}
            handleSignIn={handleSignIn}
            signInProviders={signInProviders}
          />
        </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
