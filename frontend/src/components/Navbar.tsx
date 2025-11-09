import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, User, LogOut, ShoppingBag, LayoutGrid, Award } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Deals' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/group-deals', label: 'Group Deals' },
    { to: '/auctions', label: 'Auctions' },
    { to: '/nearby', label: 'Nearby' },
    { to: '/social', label: 'Social' },
    { to: '/staking', label: 'Staking' },
    ...(isAuthenticated ? [{ to: '/profile', label: 'Profile' }] : []),
    ...(user?.role === 'merchant' ? [{ to: '/merchant', label: 'Dashboard' }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-xl">D</span>
            </div>
            <span className="font-heading font-bold text-xl">DealChain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeSwitcher />
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/account')}
                  className="relative"
                >
                  <ShoppingBag className="w-5 h-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>
                          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{user?.name || user?.email || 'User'}</span>
                        {user?.reputationTier && (
                          <span className="text-xs text-muted-foreground">{user.reputationTier} Tier</span>
                        )}
                      </div>
                      {user?.reputation !== undefined && (
                        <Badge variant="secondary" className="ml-1">
                          <Award className="w-3 h-3 mr-1" />
                          {user.reputation}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-2 py-2 border-b border-border">
                      <p className="text-sm font-medium">{user?.name || user?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.role === 'merchant' ? 'Merchant Account' : 'User Account'}
                      </p>
                      {user?.reputationTier && user?.role === 'user' && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {user.reputationTier}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{user.reputation} pts</span>
                        </div>
                      )}
                    </div>
                    {user?.role === 'user' && (
                      <DropdownMenuItem onClick={() => navigate('/account')}>
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        My Account
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    {user?.role === 'merchant' && (
                      <DropdownMenuItem onClick={() => navigate('/merchant')}>
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Merchant Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/signup')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerContent className="lg:hidden h-[80vh] transition-transform duration-[280ms] ease-in-out">
          <DrawerHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <DrawerTitle className="font-heading text-xl">Menu</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="px-4 py-6 space-y-3 overflow-y-auto">
            {/* Theme Switcher in Mobile Menu */}
            <div className="pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Theme</span>
                <ThemeSwitcher />
              </div>
            </div>
            
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-3 text-foreground hover:text-primary transition-colors font-medium text-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <div className="border-t border-border my-4 pt-4">
                  <Link
                    to="/account"
                    className="block py-3 text-foreground hover:text-primary transition-colors font-medium text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    to="/profile"
                    className="block py-3 text-foreground hover:text-primary transition-colors font-medium text-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {user?.role === 'merchant' && (
                    <Link
                      to="/merchant"
                      className="block py-3 text-foreground hover:text-primary transition-colors font-medium text-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Merchant Dashboard
                    </Link>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="space-y-3 border-t border-border mt-4 pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate('/signup');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </nav>
  );
};
