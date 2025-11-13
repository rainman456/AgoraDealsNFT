import React, { useState, useEffect } from 'react';
import { dealsAPI, Deal } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DealCard } from '@/components/DealCard';
import { toast } from 'react-toastify';
import { MapPin, Navigation, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const GeoDiscovery: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(10);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setLocationName('Your Location');
          loadNearbyDeals(location.lat, location.lng, searchRadius);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Silently use default location without showing error to user
          const defaultLocation = { lat: 40.7128, lng: -74.0060 };
          setUserLocation(defaultLocation);
          setLocationName('New York, NY (Default)');
          loadNearbyDeals(defaultLocation.lat, defaultLocation.lng, searchRadius);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      // Silently use default location
      const defaultLocation = { lat: 40.7128, lng: -74.0060 };
      setUserLocation(defaultLocation);
      setLocationName('New York, NY (Default)');
      loadNearbyDeals(defaultLocation.lat, defaultLocation.lng, searchRadius);
    }
  };

  const loadNearbyDeals = async (lat: number, lng: number, radius: number) => {
    try {
      setIsLoading(true);
      const data = await dealsAPI.getNearbyDeals(lat, lng, radius);
      // Ensure deals is always an array
      let dealsArray: Deal[] = [];
      if (Array.isArray(data)) {
        dealsArray = data;
      } else if (Array.isArray(data?.deals)) {
        dealsArray = data.deals;
      } else if (Array.isArray(data?.data)) {
        dealsArray = data.data;
      } else if (Array.isArray(data?.items)) {
        dealsArray = data.items;
      }
      setDeals(dealsArray);
    } catch (error) {
      console.error('Failed to load nearby deals:', error);
      toast.error('Failed to load nearby deals');
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setSearchRadius(newRadius);
    if (userLocation) {
      loadNearbyDeals(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">
            Discover Nearby Deals
          </h1>
          <p className="text-muted-foreground">
            Find amazing deals near your location
          </p>
        </div>

        {/* Location & Radius Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                <span className="font-medium">{locationName || 'Unknown Location'}</span>
                {userLocation && (
                  <Badge variant="outline" className="text-xs">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={getUserLocation}>
                <Navigation className="w-4 h-4 mr-2" />
                Update Location
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search Radius: {searchRadius} km</label>
              <div className="flex items-center gap-4">
                <Input
                  type="range"
                  min="1"
                  max="100"
                  value={searchRadius}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  {[5, 10, 25, 50].map((radius) => (
                    <Button
                      key={radius}
                      variant={searchRadius === radius ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleRadiusChange(radius)}
                    >
                      {radius}km
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Placeholder */}
        <Card className="mb-8">
          <CardContent className="p-0">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
              <div className="text-center z-10">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Interactive Map View</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Map integration coming soon. Will display deal locations with markers and clustering.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nearby Deals */}
        <div className="mb-6">
          <h2 className="font-heading font-bold text-2xl mb-4">
            Deals Near You ({deals.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Finding nearby deals...</p>
          </div>
        ) : !deals || deals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-lg font-medium mb-2">No deals found nearby</p>
              <p className="text-sm text-muted-foreground mb-4">
                Try increasing your search radius or check back later
              </p>
              <Button onClick={() => handleRadiusChange(searchRadius * 2)}>
                Expand Search Radius
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
