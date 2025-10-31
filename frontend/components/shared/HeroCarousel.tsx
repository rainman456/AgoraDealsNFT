import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Verified, TrendingUp } from "lucide-react";
import type { Promotion } from "@/lib/api";

interface HeroCarouselProps {
  deals: Promotion[];
}

export default function HeroCarousel({ deals }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % deals.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [deals.length, isAutoPlaying]);

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % deals.length);
    setIsAutoPlaying(false);
  };

  const goToPrev = () => {
    setCurrent((prev) => (prev - 1 + deals.length) % deals.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative h-[450px] lg:h-[550px] rounded-2xl overflow-hidden shadow-2xl group">
      {deals.map((deal, index) => {
        const merchantName = deal.merchant?.businessName || deal.merchant?.name || 'Merchant';
        const imageUrl = deal.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop';
        const originalPrice = deal.originalPrice || 100;
        const discountedPrice = deal.discountedPrice || (originalPrice * (100 - deal.discountPercentage) / 100);
        const savings = (originalPrice - discountedPrice).toFixed(2);
        
        return (
          <div
            key={deal._id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Beautiful imagery - Airbnb-inspired */}
            <img 
              src={imageUrl} 
              alt={deal.title} 
              className="w-full h-full object-cover" 
            />
            
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12">
              {/* Verified merchant badge */}
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <Verified className="w-5 h-5 text-primary" />
                  <span className="text-base font-semibold text-foreground">{merchantName}</span>
                </div>
              </div>
              
              {/* Title */}
              <h2 className="text-[32px] lg:text-[40px] font-bold text-white mb-4 max-w-3xl leading-tight tracking-tight">
                {deal.title}
              </h2>
              
              {/* Savings highlight - Groupon-style clear value */}
              <div className="flex items-center gap-5 mb-8">
                <div className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-xl lg:text-2xl shadow-lg">
                  {deal.discountPercentage}% OFF
                </div>
                <div className="text-white">
                  <p className="text-sm lg:text-base opacity-90">Save up to</p>
                  <p className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    ${savings}
                  </p>
                </div>
              </div>
              
              {/* CTA */}
              <Link to={`/deals/${deal._id}`}>
                <Button 
                  size="lg" 
                  className="bg-white text-gray-900 hover:bg-white/90 font-bold text-base lg:text-lg px-10 py-7 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                >
                  Get This Deal
                </Button>
              </Link>
            </div>
          </div>
        );
      })}

      {/* Navigation arrows - appear on hover */}
      <button
        onClick={goToPrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
      </button>

      {/* Carousel indicators - Modern design */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2.5 z-10">
        {deals.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrent(index);
              setIsAutoPlaying(false);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current 
                ? "bg-white w-12 shadow-lg" 
                : "bg-white/40 hover:bg-white/60 w-8"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
