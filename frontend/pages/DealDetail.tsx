import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Users, Share2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupDealVisualization } from '@/components/shared/GroupDealVisualization';
import { RedemptionSuccess } from '@/components/shared/RedemptionSuccess';
import { promotionsAPI, Promotion } from '@/lib/api';
import { mockDeals, promotionToDeal } from '@/lib/mock-data';

export default function DealDetail() {
  const { id } = useParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDeal = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await promotionsAPI.getDetails(id);
        
        if (response.success) {
          setDeal(response.data);
        } else {
          // Fallback to mock data
          const foundDeal = mockDeals.find(d => d._id === id) || mockDeals[0];
          setDeal(promotionToDeal(foundDeal));
        }
      } catch (error) {
        console.error('Failed to load deal:', error);
        // Fallback to mock data
        const foundDeal = mockDeals.find(d => d._id === id) || mockDeals[0];
        setDeal(promotionToDeal(foundDeal));
      } finally {
        setLoading(false);
      }
    };
    
    loadDeal();
  }, [id]);

  if (loading || !deal) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
          <div className="text-center">Loading...</div>
        </div>
      </main>
    );
  }

  const handleRedeem = () => {
    setShowSuccess(true);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 5000);
  };

  // Mock group deal data
  const groupDealTiers = [
    { participants: 20, discount: 30, price: 84, unlocked: true },
    { participants: 50, discount: 40, price: 72, unlocked: true },
    { participants: 75, discount: 50, price: 60, unlocked: false },
    { participants: 100, discount: 60, price: 48, unlocked: false }
  ];

  const endsAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now

  return (
    <main className="min-h-screen bg-background">
      {showSuccess && (
        <RedemptionSuccess
          dealTitle={deal.title}
          merchantName={deal.merchant}
          savingsAmount={45}
          reputationGain={10}
          currentLevel={12}
          levelProgress={65}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Deal Info */}
          <div>
            {/* Image */}
            <div className="aspect-video rounded-2xl overflow-hidden mb-6 shadow-xl">
              <img
                src={deal.image || '/placeholder.svg'}
                alt={deal.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Merchant */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-[32px] lg:text-[44px] font-black mb-3 leading-tight">{deal.title}</h1>
                  <p className="text-xl lg:text-2xl font-semibold text-muted-foreground">{deal.merchant}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>0.5 mi away</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Valid until Dec 31, 2024</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>234 claimed</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold mb-4">About This Deal</h2>
              <p className="text-muted-foreground leading-relaxed">
                {deal.description || 'Experience an amazing offer from one of our trusted merchants. This exclusive deal provides exceptional value and quality service.'}
              </p>
            </div>

            {/* Terms */}
            <div className="p-4 bg-muted/50 rounded-xl">
              <h3 className="font-semibold mb-2">Terms & Conditions</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Valid for new customers only</li>
                <li>• One redemption per person</li>
                <li>• Cannot be combined with other offers</li>
                <li>• Reservation required 24 hours in advance</li>
              </ul>
            </div>
          </div>

          {/* Right Column - Group Deal Visualization */}
          <div className="lg:sticky lg:top-8 h-fit">
            <GroupDealVisualization
              dealTitle={deal.title}
              originalPrice={120}
              currentParticipants={47}
              tiers={groupDealTiers}
              endsAt={endsAt}
              friendsJoined={['Sarah', 'Mike', 'Emma', 'David']}
            />

            {/* Alternative: Simple Purchase */}
            <div className="mt-6 p-6 bg-card border border-border rounded-2xl">
              <h3 className="font-semibold mb-4">Or buy individually</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-lime-600 dark:text-lime-400">
                  ${deal.price}
                </span>
                <span className="text-lg text-muted-foreground line-through">
                  ${deal.originalPrice}
                </span>
                <span className="px-2 py-1 bg-lime-500 text-white text-sm font-bold rounded">
                  {deal.discount}% OFF
                </span>
              </div>
              <Button
                onClick={handleRedeem}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
