import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background py-12 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
              AgoraDeals
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Discover amazing deals from trusted local businesses
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/deals" className="text-muted-foreground hover:text-primary transition-colors">
                  Deals Feed
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/my-deals" className="text-muted-foreground hover:text-primary transition-colors">
                  My Deals
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Business</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/merchant/onboarding" className="text-muted-foreground hover:text-primary transition-colors">
                  Become a Merchant
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-foreground">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            © 2025 AgoraDeals. Made with <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" /> for savers
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Discord
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
