import { Link } from "react-router-dom";
import { Flame, TrendingUp, Users } from "lucide-react";
import type { Promotion } from "@/lib/api";

interface TrendingSectionProps {
  deals: Promotion[];
}

export default function TrendingSection({ deals }: TrendingSectionProps) {
  return (
    <div className="mb-12 lg:mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-[24px] lg:text-[32px] font-semibold tracking-tight">Trending Now</h2>
        </div>
        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
          HOT
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {deals.map((deal, index) => {
          const merchantName = deal.merchant?.businessName || deal.merchant?.name || 'Merchant';
          return (
          <Link 
            key={deal._id} 
            to={`/deals/${deal._id}`}
            className="block"
          >
            <div className="bg-card border border-border/50 hover:border-orange-500/50 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
              {/* Ranking badge */}
              <div className="absolute top-0 right-0 w-16 h-16">
                <div className="absolute transform rotate-45 bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs font-bold py-1 right-[-35px] top-[15px] w-[100px] text-center shadow-md">
                  #{index + 1}
                </div>
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-8">
                  <h3 className="font-semibold text-base lg:text-lg mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {deal.title}
                  </h3>
                  <p className="text-sm lg:text-base text-muted-foreground">{merchantName}</p>
                </div>
              </div>
              
              {/* Stats row - Data visualization */}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-orange-500">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm lg:text-base font-bold">{deal.discountPercentage}% off</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{deal.currentSupply || 0} claimed</span>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}
