import { useState } from 'react';
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

const mockExternalDeals: ExternalDeal[] = [
  {
    id: '1',
    title: 'Round Trip to Paris',
    description: 'Direct flights from NYC to Paris with premium airlines',
    source: 'skyscanner',
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop',
    price: 450,
    originalPrice: 850,
    discount: 47,
    rating: 4.8,
    reviews: 1250,
    location: 'New York → Paris',
    dates: 'Dec 15 - Dec 22',
    url: 'https://skyscanner.com',
    featured: true
  },
  {
    id: '2',
    title: 'Luxury Hotel in Bali',
    description: '5-star beachfront resort with spa and infinity pool',
    source: 'booking',
    category: 'Hotels',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
    price: 120,
    originalPrice: 280,
    discount: 57,
    rating: 4.9,
    reviews: 890,
    location: 'Bali, Indonesia',
    dates: '3 nights',
    url: 'https://booking.com',
    featured: true
  },
  {
    id: '3',
    title: 'Designer Handbag Collection',
    description: 'Authentic luxury handbags from top brands',
    source: 'shopify',
    category: 'Shopping',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=400&fit=crop',
    price: 299,
    originalPrice: 599,
    discount: 50,
    rating: 4.7,
    reviews: 456,
    url: 'https://shopify.com',
    featured: false
  },
  {
    id: '4',
    title: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium audio quality with 30-hour battery life',
    source: 'amazon',
    category: 'Products',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
    price: 179,
    originalPrice: 349,
    discount: 49,
    rating: 4.6,
    reviews: 3420,
    url: 'https://amazon.com',
    featured: false
  },
  {
    id: '5',
    title: 'Tokyo City Break',
    description: 'Explore Tokyo with guided tours and cultural experiences',
    source: 'skyscanner',
    category: 'Travel',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop',
    price: 680,
    originalPrice: 1200,
    discount: 43,
    rating: 4.8,
    reviews: 678,
    location: 'Los Angeles → Tokyo',
    dates: 'Jan 10 - Jan 17',
    url: 'https://skyscanner.com',
    featured: true
  },
  {
    id: '6',
    title: 'Mountain Resort in Switzerland',
    description: 'Ski resort with panoramic mountain views',
    source: 'booking',
    category: 'Hotels',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
    price: 195,
    originalPrice: 420,
    discount: 54,
    rating: 4.9,
    reviews: 1120,
    location: 'Zermatt, Switzerland',
    dates: '4 nights',
    url: 'https://booking.com',
    featured: false
  }
];

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

  const filteredDeals = mockExternalDeals.filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         deal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = !selectedSource || deal.source === selectedSource;
    const matchesCategory = !selectedCategory || deal.category === selectedCategory;
    return matchesSearch && matchesSource && matchesCategory;
  });

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
            const count = mockExternalDeals.filter(d => d.source === source.name).length;
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
          <h2 className="text-2xl font-bold mb-4">All Deals ({filteredDeals.length})</h2>
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

          {filteredDeals.length === 0 && (
            <Card className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No deals found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
