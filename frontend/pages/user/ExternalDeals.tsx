import { useState, useEffect } from 'react';
import { externalDealsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plane, Hotel, ShoppingBag, Package, Search, 
  ExternalLink, MapPin, Calendar, DollarSign, Star,
  TrendingUp, Filter, RefreshCw
} from 'lucide-react';

interface ExternalDeal {
  id: string;
  title: string;
  description: string;
  source: 'skyscanner' | 'booking' | 'shopify' | 'amazon';
  category: 'Travel' | 'Hotels' | 'Shopping' | 'Products';
  image: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  location?: string;
  dates?: string;
  url: string;
  featured: boolean;
}

// External deal sources configuration
const sources = [
  { name: 'skyscanner', label: 'Skyscanner', icon: Plane, color: 'text-blue-500' },
  { name: 'booking', label: 'Booking.com', icon: Hotel, color: 'text-purple-500' },
  { name: 'shopify', label: 'Shopify', icon: ShoppingBag, color: 'text-green-500' },
  { name: 'amazon', label: 'Amazon', icon: Package, color: 'text-orange-500' }
];

export default function ExternalDeals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deals, setDeals] = useState<ExternalDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDeals();
  }, [selectedSource, selectedCategory]);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = await externalDealsAPI.list({
        source: selectedSource || undefined,
        category: selectedCategory || undefined,
        limit: 50
      });
      setDeals(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load external deals:', error);
      toast({
        title: "Error",
        description: "Failed to load external deals",
        variant: "destructive"
      });
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeals = Array.isArray(deals) ? deals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) : [];

  const getSourceIcon = (source: string) => {
    const sourceData = sources.find(s => s.name === source);
    if (!sourceData) return null;
    const Icon = sourceData.icon;
    return <Icon className={`w-5 h-5 ${sourceData.color}`} />;
  };

  return (
    <main className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] lg:text-[40px] font-bold mb-2">External Deals</h1>
          <p className="text-base lg:text-lg text-muted-foreground">
            Discover amazing deals from top platforms worldwide
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {sources.map((source) => {
            const Icon = source.icon;
            const count = deals.filter(d => d.source === source.name).length;
            return (
              <Card key={source.name} className="p-4 text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${source.color}`} />
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{source.label}</p>
              </Card>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Source</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedSource === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSource(null)}
                >
                  All
                </Button>
                {sources.map((source) => (
                  <Button
                    key={source.name}
                    variant={selectedSource === source.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSource(source.name)}
                  >
                    {source.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {['Travel', 'Hotels', 'Shopping', 'Products'].map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sync Button */}
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Deals
              </Button>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading deals...</p>
          </div>
        ) : (
          <>
        {/* Featured Deals */}
        {filteredDeals.some(d => d.featured) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Featured Deals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeals.filter(d => d.featured).map((deal) => (
                <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video">
                    <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      {getSourceIcon(deal.source)}
                    </div>

                    <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                      {deal.discount}% OFF
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                      <Badge variant="outline" className="bg-black/50 text-white border-white/30">
                        {deal.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{deal.description}</p>

                    {deal.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        {deal.location}
                      </div>
                    )}

                    {deal.dates && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        {deal.dates}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(deal.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{deal.rating}</span>
                      <span className="text-xs text-muted-foreground">({deal.reviews})</span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-primary">${deal.price}</span>
                      <span className="text-sm text-muted-foreground line-through">${deal.originalPrice}</span>
                    </div>

                    <Button className="w-full" asChild>
                      <a href={deal.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Deal
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Deals */}
        <div>
          <h2 className="text-2xl font-bold mb-4">All Deals ({filteredDeals.filter(d => !d.featured).length})</h2>
          {filteredDeals.filter(d => !d.featured).length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No deals found matching your criteria</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.filter(d => !d.featured).map((deal) => (
              <Card key={deal.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video">
                  <img src={deal.image} alt={deal.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    {getSourceIcon(deal.source)}
                  </div>

                  <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm">
                    {deal.discount}% OFF
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <Badge variant="outline" className="bg-black/50 text-white border-white/30">
                      {deal.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2">{deal.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{deal.description}</p>

                  {deal.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4" />
                      {deal.location}
                    </div>
                  )}

                  {deal.dates && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      {deal.dates}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(deal.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{deal.rating}</span>
                    <span className="text-xs text-muted-foreground">({deal.reviews})</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-primary">${deal.price}</span>
                    <span className="text-sm text-muted-foreground line-through">${deal.originalPrice}</span>
                  </div>

                  <Button className="w-full" asChild>
                    <a href={deal.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Deal
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </main>
  );
}
