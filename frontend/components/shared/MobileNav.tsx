import { Link, useLocation } from "react-router-dom";
import { Home, Compass, Wallet, User, Store, ShoppingBag, Menu, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function MobileNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const { toast } = useToast();

  const userNavItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/deals", icon: Compass, label: "Discover" },
    { path: "/marketplace", icon: ShoppingBag, label: "Market" },
    { path: "/my-deals", icon: Wallet, label: "Deals" },
  ];

  const moreNavItems = [
    { path: "/auctions-enhanced", label: "Auctions" },
    { path: "/group-deals", label: "Group Deals" },
    { path: "/redemption-tickets", label: "Tickets" },
    { path: "/social", label: "Social" },
    { path: "/staking", label: "Staking" },
    { path: "/user-stats", label: "Stats" },
    { path: "/external-deals", label: "External" },
    { path: "/profile", label: "Profile" },
  ];

  const merchantNavItems = [
    { path: "/merchant/dashboard", icon: Store, label: "Dashboard" },
    { path: "/merchant/promotions", icon: Compass, label: "Promotions" },
    { path: "/merchant/analytics", icon: Wallet, label: "Analytics" },
    { path: "/merchant/profile", icon: User, label: "Profile" },
  ];

  const isMerchantRoute = location.pathname.startsWith("/merchant");
  const navItems = isMerchantRoute ? merchantNavItems : userNavItems;

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

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        >
          <div 
            className="absolute bottom-16 left-0 right-0 bg-card/98 backdrop-blur-xl border-t border-border shadow-2xl max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4 text-foreground">More Features</h3>
              <div className="grid grid-cols-2 gap-3">
                {moreNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex items-center justify-center p-4 rounded-xl border transition-all",
                      location.pathname === item.path
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "bg-card/50 border-border/50 text-foreground/70 hover:bg-primary/5 hover:border-primary/30"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px]",
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground hover:scale-105"
                )}
              >
                <div
                  className={cn(
                    "relative transition-all duration-300",
                    isActive && "animate-bounce-subtle"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-all duration-300",
                      isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                    )}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    isActive ? "font-semibold" : "font-normal"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Share Button - Viral Feature */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-[56px] text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
          >
            <div className="relative transition-all duration-300">
              <Share2 className="w-6 h-6 transition-all duration-300" />
            </div>
            <span className="text-[10px] font-medium transition-all duration-300">
              Share
            </span>
          </button>
          
          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl transition-all duration-300 min-w-[56px]",
              showMore
                ? "text-primary scale-110"
                : "text-muted-foreground hover:text-foreground hover:scale-105"
            )}
          >
            <div
              className={cn(
                "relative transition-all duration-300",
                showMore && "animate-bounce-subtle"
              )}
            >
              <Menu
                className={cn(
                  "w-6 h-6 transition-all duration-300",
                  showMore && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                )}
              />
              {showMore && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-all duration-300",
                showMore ? "font-semibold" : "font-normal"
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
