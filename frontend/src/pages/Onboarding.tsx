import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ShoppingBag, DollarSign, Gift, Mail } from 'lucide-react';

const valuePropSteps = [
  {
    title: 'Own Your Deals',
    description: 'Your coupons become digital assets you truly own',
    icon: ShoppingBag,
    color: 'from-blue-500 to-indigo-600',
    detail: 'No more screenshots or lost emails. Your deals live securely in your account.',
  },
  {
    title: 'Trade & Gift',
    description: 'Sell deals you won\'t use or gift them to friends',
    icon: Gift,
    color: 'from-purple-500 to-pink-600',
    detail: 'Turn unused deals into cash on our marketplace.',
  },
  {
    title: 'Earn Rewards',
    description: 'Build reputation and unlock exclusive perks',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-600',
    detail: 'The more you save, the better deals you unlock.',
  },
];

export const Onboarding: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [valuePropIndex, setValuePropIndex] = useState(0);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentScreen === 1 && valuePropIndex < valuePropSteps.length - 1) {
      setValuePropIndex(valuePropIndex + 1);
    } else {
      setCurrentScreen(currentScreen + 1);
      if (currentScreen === 1) setValuePropIndex(0);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/signup');
  };

  const handleCreateAccount = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/signup');
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {/* Screen 1: Welcome */}
          {currentScreen === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Hero Animation */}
                  <div className="relative h-64 bg-gradient-to-br from-primary via-accent to-pink-500 flex items-center justify-center overflow-hidden">
                    <motion.div
                      animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="text-8xl"
                    >
                      💰
                    </motion.div>
                    <motion.div
                      animate={{
                        y: [0, -15, 0],
                        x: [-60, -60, -60],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.5,
                      }}
                      className="text-6xl absolute"
                    >
                      🎫
                    </motion.div>
                    <motion.div
                      animate={{
                        y: [0, -25, 0],
                        x: [60, 60, 60],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1,
                      }}
                      className="text-6xl absolute"
                    >
                      🎁
                    </motion.div>
                  </div>

                  <div className="p-8 text-center">
                    <h1 className="text-4xl font-heading font-bold mb-4">
                      Welcome to AgoraDeals
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                      Your deals, your assets, your savings
                    </p>

                    <Button
                      onClick={handleNext}
                      className="w-full h-14 text-lg font-semibold rounded-xl mb-3"
                      size="lg"
                    >
                      Start Saving <ArrowRight className="ml-2" />
                    </Button>

                    <Button
                      onClick={handleSkip}
                      variant="ghost"
                      className="w-full"
                    >
                      How it works
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Screen 2: Value Props (Swipeable Cards) */}
          {currentScreen === 1 && (
            <motion.div
              key="valueprops"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-2 shadow-xl">
                <CardContent className="p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={valuePropIndex}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      {(() => {
                        const prop = valuePropSteps[valuePropIndex];
                        const Icon = prop.icon;
                        return (
                          <div className="text-center">
                            <div
                              className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${prop.color} flex items-center justify-center shadow-lg`}
                            >
                              <Icon className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-3xl font-heading font-bold mb-4">
                              {prop.title}
                            </h2>
                            <p className="text-lg text-muted-foreground mb-4">
                              {prop.description}
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {prop.detail}
                            </p>
                          </div>
                        );
                      })()}
                    </motion.div>
                  </AnimatePresence>

                  {/* Progress Dots */}
                  <div className="flex justify-center gap-2 my-8">
                    {valuePropSteps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${
                          index === valuePropIndex ? 'bg-primary w-8' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full h-12 text-lg font-semibold rounded-xl"
                  >
                    {valuePropIndex === valuePropSteps.length - 1 ? (
                      <>
                        Continue <ArrowRight className="ml-2" />
                      </>
                    ) : (
                      <>
                        Next <ArrowRight className="ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Screen 3: Account Creation */}
          {currentScreen === 2 && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-2 shadow-xl">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-heading font-bold mb-2">
                      Create Your Account
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Start saving in seconds
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 text-base rounded-xl"
                      />
                    </div>

                    <Button
                      onClick={handleCreateAccount}
                      className="w-full h-12 text-lg font-semibold rounded-xl"
                      disabled={!email}
                    >
                      <Mail className="mr-2" />
                      Continue with Email
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleSocialLogin('Google')}
                        variant="outline"
                        className="h-12 rounded-xl"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google
                      </Button>
                      <Button
                        onClick={() => handleSocialLogin('Apple')}
                        variant="outline"
                        className="h-12 rounded-xl"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                        Apple
                      </Button>
                    </div>

                    {/* Fine Print */}
                    <p className="text-xs text-center text-muted-foreground mt-6">
                      🔒 Your account is secured automatically.
                      <br />
                      No technical knowledge needed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
