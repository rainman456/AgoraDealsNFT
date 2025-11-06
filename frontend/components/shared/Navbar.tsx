import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, Palette, ShoppingBag, Check, Menu, ChevronDown, Wallet, Plus, LogOut, User, Share2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Navbar({ isOpen, setIsOpen }: NavbarProps) {
  const [theme, setTheme] = useState("lime-dark");
  const [mounted, setMounted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { toast } = useToast();
  const { user, merchant, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") || "lime-dark";
    setTheme(saved);
  }, []);

  const themes = [
    { value: "lime-dark", label: "Lime Dark", mode: "dark" },
    { value: "lime-light", label: "Lime Light", mode: "light" },
    { value: "neomint", label: "NeoMint", mode: "light" },
    { value: "cyber", label: "Cyber Void", mode: "pure-dark" },
    { value: "plasma", label: "Plasma Dream", mode: "pure-dark" },
    { value: "sunset", label: "Sunset Glow", mode: "vibrant" },
    { value: "ocean", label: "Ocean Deep", mode: "dark" },
    { value: "sakura", label: "Sakura Bloom", mode: "light" },
    { value: "forest", label: "Forest Twilight", mode: "mid-tone" },
    { value: "royal", label: "Royal Purple", mode: "dark" },
    { value: "midnight", label: "Midnight Blue", mode: "light" },
  ];



  const applyTheme = (themeName: string) => {
    const html = document.documentElement;
    html.classList.remove("dark", "light", "lime-dark", "lime-light", "neomint", "cyber", "plasma", "sunset", "ocean", "sakura", "forest", "royal", "midnight");
    
    if (themeName === "lime-dark") {
      html.classList.add("dark");
    } else if (themeName === "lime-light") {
      html.classList.add("light");
    } else {
      html.classList.add(themeName);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Check out these amazing deals!',
      text: 'I found incredible deals on AgoraDeals - save up to 80% on top brands! 🎉',
      url: window.location.origin
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Thanks for sharing! 🎉",
          description: "Help your friends save money too!",
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied! 📋",
          description: "Share it with your friends to unlock group deals!",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.origin);
        toast({
          title: "Link copied! 📋",
          description: "Share it with your friends to unlock group deals!",
        });
      }
    }
  };

  if (!mounted) return null;

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="flex h-20 items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <img 
              src="/logo.svg" 
              alt="AgoraDeals" 
              className="h-12 w-auto transition-all duration-300 group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
            <Link 
              to="/deals" 
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5 rounded-lg transition-all"
            >
              Deals
            </Link>
            <Link 
              to="/marketplace" 
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5 rounded-lg transition-all"
            >
              Marketplace
            </Link>
            
            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-primary/5 rounded-lg transition-all flex items-center gap-1"
              >
                More
                <ChevronDown className={cn("w-4 h-4 transition-transform", showMoreMenu && "rotate-180")} />
              </button>
              
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute top-full mt-2 right-0 w-56 bg-card border border-border rounded-xl shadow-xl z-50 py-2">
                    <Link to="/auctions-enhanced" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                      Auctions
                    </Link>
                    <Link to="/group-deals" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                      Group Deals
                    </Link>
                    <Link to="/redemption-tickets" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                      Redemption Tickets
                    </Link>
                    <Link to="/social" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                      Social
                    </Link>
                    <Link to="/staking" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                      Staking
                    </Link>
                    <Link to="/user-stats" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                      Stats & Badges
                    </Link>
                    <Link to="/external-deals" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                      External Deals
                    </Link>
                    {!isLandingPage && (
                      <Link to="/my-deals" className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all" onClick={() => setShowMoreMenu(false)}>
                        My Deals
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <Input 
                placeholder="Search deals..." 
                className="pl-11 pr-4 py-3 w-72 bg-card/50 border-border/50 hover:border-border focus:border-primary/50 text-base rounded-xl transition-all" 
              />
            </div>

            {/* Theme Selector */}
            <div className="relative">
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-[180px] bg-card/50 border-border/50 hover:border-border focus:border-primary/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="Select theme" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl z-[100]">
                  {themes.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="cursor-pointer">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Share Button - Viral Feature */}
            <Button 
              variant="outline" 
              onClick={handleShare}
              className="font-medium px-4 py-2.5 text-base rounded-xl hover:bg-primary/5 border-primary/20 hover:border-primary/40"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* User Menu Dropdown */}
                  <div className="relative">
                    <Button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 font-semibold px-6 py-2.5 text-base rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {user?.name || merchant?.name || 'Account'}
                      <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showUserMenu && "rotate-180")} />
                    </Button>
                    
                    {showUserMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                        <div className="absolute top-full mt-2 right-0 w-56 bg-card border border-border rounded-xl shadow-xl z-50 py-2">
                          <Link 
                            to={merchant ? "/merchant/dashboard" : "/profile"}
                            className="block px-4 py-2 text-sm hover:bg-primary/5 transition-all"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {merchant ? 'Dashboard' : 'Profile'}
                            </div>
                          </Link>
                          <div className="border-t border-border my-1" />
                          <button
                            onClick={() => {
                              logout();
                              setShowUserMenu(false);
                              navigate('/');
                              toast({
                                title: "Logged out",
                                description: "You have been successfully logged out",
                              });
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-all text-red-600 dark:text-red-400"
                          >
                            <div className="flex items-center gap-2">
                              <LogOut className="w-4 h-4" />
                              Logout
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/user/login')}
                    className="font-medium px-5 py-2.5 text-base rounded-xl hover:bg-primary/5"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/user/login')}
                    className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 font-semibold px-6 py-2.5 text-base rounded-xl shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    Sign Up Free
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Theme Button - Only on small screens */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-card/50 hover:bg-card rounded-xl border border-border/50 hover:border-border transition-all"
            aria-label="Select theme"
          >
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Theme</span>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
}

{/* Mobile Theme Selector - Only on small screens */}
export function MobileMenu({ isOpen, setIsOpen, theme, onThemeChange }: any) {
  const themes = [
    { value: "lime-dark", label: "Lime Dark" },
    { value: "lime-light", label: "Lime Light" },
    { value: "neomint", label: "NeoMint" },
    { value: "cyber", label: "Cyber Void" },
    { value: "plasma", label: "Plasma Dream" },
    { value: "sunset", label: "Sunset Glow" },
    { value: "ocean", label: "Ocean Deep" },
    { value: "sakura", label: "Sakura Bloom" },
    { value: "forest", label: "Forest Twilight" },
    { value: "royal", label: "Royal Purple" },
    { value: "midnight", label: "Midnight Blue" },
  ];
  
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Only on small screens */}
      <div 
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Bottom Sheet Panel - Only on small screens */}
      <div className="md:hidden mobile-menu-panel fixed bottom-16 left-0 right-0 z-[70] bg-card rounded-t-3xl shadow-2xl border-t border-border animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Menu Content */}
            <div className="px-6 pb-8 pt-4 max-h-[60vh] overflow-y-auto">
              {/* Theme Selector */}
              <div className="mb-4">
                <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground">
                  <Palette className="w-4 h-4" />
                  <span>Select Theme</span>
                </div>
                <div className="space-y-1 mt-2">
                  {themes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => onThemeChange(t.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-foreground hover:bg-muted rounded-xl transition-all active:scale-95 ${
                        theme === t.value ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="text-base font-medium">{t.label}</span>
                      {theme === t.value && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
    </>
  );
}
