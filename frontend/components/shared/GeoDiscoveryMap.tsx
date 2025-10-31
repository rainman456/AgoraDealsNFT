import { useState, useEffect } from 'react';
import { MapPin, Navigation, X, Filter, Zap, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Deal {
  id: number;
  title: string;
  merchant: string;
  discount: number;
  distance: number;
  lat: number;
  lng: number;
  category: string;
  expiresIn: string;
  rating: number;
}

interface GeoDiscoveryMapProps {
  onClose?: () => void;
  className?: string;
}

export function GeoDiscoveryMap({ onClose, className }: GeoDiscoveryMapProps) {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: 37.7749, lng: -122.4194 });
  const [filter, setFilter] = useState<'all' | 'nearby' | 'trending'>('all');
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });

  // Mock deals data with coordinates
  const deals: Deal[] = [
    { id: 1, title: 'Coffee & Pastry', merchant: 'Brew Haven', discount: 25, distance: 0.3, lat: 37.7750, lng: -122.4190, category: 'Food', expiresIn: '2h', rating: 4.8 },
    { id: 2, title: 'Lunch Special', merchant: 'Poke Bowl', discount: 30, distance: 0.5, lat: 37.7755, lng: -122.4200, category: 'Food', expiresIn: '5h', rating: 4.6 },
    { id: 3, title: 'Yoga Class', merchant: 'Zen Studio', discount: 40, distance: 0.8, lat: 37.7760, lng: -122.4180, category: 'Wellness', expiresIn: '1d', rating: 4.9 },
    { id: 4, title: 'Happy Hour', merchant: 'The Lounge', discount: 50, distance: 1.2, lat: 37.7740, lng: -122.4210, category: 'Dining', expiresIn: '3h', rating: 4.5 },
    { id: 5, title: 'Spa Treatment', merchant: 'Relax Spa', discount: 35, distance: 1.5, lat: 37.7765, lng: -122.4175, category: 'Wellness', expiresIn: '2d', rating: 4.7 },
  ];

  const filteredDeals = deals.filter(deal => {
    if (filter === 'nearby') return deal.distance < 1;
    if (filter === 'trending') return deal.rating >= 4.7;
    return true;
  });

  const centerOnUser = () => {
    setMapCenter(userLocation);
  };

  return (
    <div className={cn("relative w-full h-[600px] bg-background rounded-lg overflow-hidden border", className)}>
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold">Discover Nearby Deals</h3>
              <p className="text-xs text-muted-foreground">San Francisco, CA</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={centerOnUser}>
              <Navigation className="w-4 h-4 mr-1" />
              My Location
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Deals
          </Button>
          <Button
            variant={filter === 'nearby' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('nearby')}
          >
            <MapPin className="w-3 h-3 mr-1" />
            Nearby
          </Button>
          <Button
            variant={filter === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('trending')}
          >
            <Zap className="w-3 h-3 mr-1" />
            Trending
          </Button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10">
        {/* Grid overlay for map effect */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* User location marker */}
        <div 
          className="absolute w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg z-10"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
        </div>

        {/* Deal markers */}
        {filteredDeals.map((deal, index) => {
          const offsetX = (deal.lng - mapCenter.lng) * 5000;
          const offsetY = (deal.lat - mapCenter.lat) * -5000;
          
          return (
            <button
              key={deal.id}
              className={cn(
                "absolute w-10 h-10 rounded-full border-2 border-background shadow-lg transition-all hover:scale-110 z-10",
                selectedDeal?.id === deal.id ? "bg-primary scale-125" : "bg-accent"
              )}
              style={{
                left: `calc(50% + ${offsetX}px)`,
                top: `calc(50% + ${offsetY}px)`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => setSelectedDeal(deal)}
            >
              <div className="flex items-center justify-center w-full h-full text-xs font-bold text-primary-foreground">
                {deal.discount}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Deal Details Panel */}
      {selectedDeal && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-background border-t p-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedDeal.category}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {selectedDeal.rating}
                </div>
              </div>
              <h4 className="font-semibold text-lg">{selectedDeal.title}</h4>
              <p className="text-sm text-muted-foreground">{selectedDeal.merchant}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedDeal.distance} mi
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires in {selectedDeal.expiresIn}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-3xl font-bold text-primary">
                {selectedDeal.discount}%
              </div>
              <Button size="sm" className="w-full">
                Claim Deal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Count Badge */}
      <div className="absolute top-24 right-4 z-20 bg-background/95 backdrop-blur-sm border rounded-full px-3 py-1.5 text-sm font-medium shadow-lg">
        {filteredDeals.length} deals nearby
      </div>
    </div>
  );
}
