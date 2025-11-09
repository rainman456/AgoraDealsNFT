import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { Account } from '@/pages/Account';
import { Marketplace } from '@/pages/Marketplace';
import { MerchantDashboard } from '@/pages/MerchantDashboard';
import { MerchantOnboarding } from '@/pages/MerchantOnboarding';
import { DealDetail } from '@/pages/DealDetail';
import { Login } from '@/pages/Login';
import { SignUp } from '@/pages/SignUp';
import { GroupDeals } from '@/pages/GroupDeals';
import { Auctions } from '@/pages/Auctions';
import { Social } from '@/pages/Social';
import { Staking } from '@/pages/Staking';
import { Profile } from '@/pages/Profile';
import { Onboarding } from '@/pages/Onboarding';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { GeoDiscovery } from '@/pages/GeoDiscovery';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransition } from '@/lib/animations';
import 'react-toastify/dist/ReactToastify.css';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div {...pageTransition}>
            <Home />
          </motion.div>
        } />
        <Route path="/deals/:id" element={
          <motion.div {...pageTransition}>
            <DealDetail />
          </motion.div>
        } />
        <Route path="/account" element={
          <ProtectedRoute requireUser>
            <motion.div {...pageTransition}>
              <Account />
            </motion.div>
          </ProtectedRoute>
        } />
        {/* Legacy route redirect */}
        <Route path="/wallet" element={
          <ProtectedRoute requireUser>
            <motion.div {...pageTransition}>
              <Account />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/marketplace" element={
          <motion.div {...pageTransition}>
            <Marketplace />
          </motion.div>
        } />
              <Route path="/merchant" element={
                <ProtectedRoute requireMerchant>
                  <motion.div {...pageTransition}>
                    <MerchantDashboard />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/merchant/onboarding" element={
                <ProtectedRoute requireMerchant>
                  <motion.div {...pageTransition}>
                    <MerchantOnboarding />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/group-deals" element={
                <motion.div {...pageTransition}>
                  <GroupDeals />
                </motion.div>
              } />
              <Route path="/auctions" element={
                <motion.div {...pageTransition}>
                  <Auctions />
                </motion.div>
              } />
              <Route path="/social" element={
                <motion.div {...pageTransition}>
                  <Social />
                </motion.div>
              } />
              <Route path="/nearby" element={
                <motion.div {...pageTransition}>
                  <GeoDiscovery />
                </motion.div>
              } />
              <Route path="/staking" element={
                <ProtectedRoute requireUser>
                  <motion.div {...pageTransition}>
                    <Staking />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <motion.div {...pageTransition}>
                    <Profile />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/onboarding" element={
                <ProtectedRoute requireUser>
                  <motion.div {...pageTransition}>
                    <Onboarding />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/login" element={
                <motion.div {...pageTransition}>
                  <Login />
                </motion.div>
              } />
              <Route path="/signup" element={
                <motion.div {...pageTransition}>
                  <SignUp />
                </motion.div>
              } />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
          <Navbar />
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
          <Footer />
          <MobileBottomNav />
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
