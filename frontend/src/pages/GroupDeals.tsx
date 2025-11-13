import React, { useState, useEffect } from 'react';
import { groupDealsAPI, GroupDeal } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'react-toastify';
import { Users, TrendingUp, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Countdown from 'react-countdown';
import { motion } from 'framer-motion';
import { EnhancedGroupDealProgress } from '@/components/EnhancedGroupDealProgress';

export const GroupDeals: React.FC = () => {
  const [groupDeals, setGroupDeals] = useState<GroupDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    loadGroupDeals();
  }, []);

  const loadGroupDeals = async () => {
    try {
      setIsLoading(true);
      const data = await groupDealsAPI.getGroupDeals();
      setGroupDeals(data);
    } catch (error) {
      console.error('Failed to load group deals:', error);
      toast.error('Failed to load group deals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (groupDealId: string) => {
    try {
      setJoiningId(groupDealId);
      const walletAddress = localStorage.getItem('walletAddress');
      if (!walletAddress) {
        toast.error('Please connect your wallet');
        return;
      }
      await groupDealsAPI.joinGroupDeal(groupDealId, walletAddress);
      toast.success('Successfully joined group deal!');
      loadGroupDeals();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to join group deal');
    } finally {
      setJoiningId(null);
    }
  };

  const getActiveDiscount = (groupDeal: GroupDeal) => {
    const sortedTiers = [...groupDeal.tiers].sort((a, b) => b.participants - a.participants);
    for (const tier of sortedTiers) {
      if (groupDeal.currentParticipants >= tier.participants) {
        return tier.discountPercentage || tier.discount || 0;
      }
    }
    return groupDeal.tiers[0]?.discountPercentage || groupDeal.tiers[0]?.discount || 0;
  };

  const getNextTier = (groupDeal: GroupDeal) => {
    const sortedTiers = [...groupDeal.tiers].sort((a, b) => a.participants - b.participants);
    return sortedTiers.find(tier => tier.participants > groupDeal.currentParticipants);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-sans font-bold text-4xl md:text-5xl mb-4">Group Deals</h1>
          <p className="text-xl text-muted-foreground">
            Join with others to unlock bigger discounts. The more people join, the better the deal!
          </p>
        </div>

        {/* Featured Group Deal with Enhanced Visualization */}
        {!isLoading && groupDeals.length > 0 && (
          <div className="mb-12">
            <EnhancedGroupDealProgress
              currentCount={groupDeals[0].currentParticipants}
              tiers={groupDeals[0].tiers.map(t => ({
                threshold: t.participants,
                discount: t.discountPercentage || t.discount || 0,
                label: `${t.discountPercentage || t.discount || 0}% OFF`,
              }))}
              participants={Array.from({ length: Math.min(groupDeals[0].currentParticipants, 20) }, (_, i) => ({
                id: `user-${i}`,
                name: `User ${i + 1}`,
                avatar: `https://i.pravatar.cc/150?img=${i + 1}`,
              }))}
              timeRemaining={Math.floor((new Date(groupDeals[0].expiresAt).getTime() - Date.now()) / 1000)}
              onJoin={() => handleJoin(groupDeals[0].id)}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">Loading group deals...</div>
        ) : groupDeals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No active group deals at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupDeals.map((groupDeal) => {
              const activeDiscount = getActiveDiscount(groupDeal);
              const nextTier = getNextTier(groupDeal);
              const progress = (groupDeal.currentParticipants / (groupDeal.requiredParticipants || groupDeal.targetParticipants)) * 100;
              
              let expiresIn = 'expires soon';
              try {
                const expiresDate = new Date(groupDeal.expiresAt);
                if (!isNaN(expiresDate.getTime())) {
                  expiresIn = formatDistanceToNow(expiresDate, { addSuffix: true });
                }
              } catch (e) {
                // Invalid date, use fallback
              }

              return (
                <motion.div
                  key={groupDeal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={groupDeal.deal?.imageUrl || '/placeholder-merchant.png'}
                      alt={groupDeal.deal?.title || 'Group Deal'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-accent text-accent-foreground font-bold text-lg shadow-lg">
                        {activeDiscount}% OFF
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-primary-foreground">
                        <Users className="w-3 h-3 mr-1" />
                        Group Deal
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2">
                        <Countdown
                          date={new Date(groupDeal.expiresAt)}
                          renderer={({ days, hours, minutes, seconds }) => (
                            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>
                                {days > 0 && `${days}d `}
                                {hours}h {minutes}m {seconds}s
                              </span>
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="line-clamp-2">{groupDeal.deal?.title || 'Group Deal'}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {groupDeal.currentParticipants}/{groupDeal.requiredParticipants || groupDeal.targetParticipants} joined
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      
                      {/* Participant Avatars */}
                      <div className="flex items-center gap-1 mt-2">
                        {[...Array(Math.min(5, groupDeal.currentParticipants))].map((_, i) => (
                          <Avatar key={i} className="w-6 h-6 border-2 border-background">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-white">
                              {String.fromCharCode(65 + i)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {groupDeal.currentParticipants > 5 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{groupDeal.currentParticipants - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tier Visualization */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Unlock Tiers</p>
                      <div className="space-y-1">
                        {groupDeal.tiers.map((tier, index) => {
                          const isUnlocked = groupDeal.currentParticipants >= tier.participants;
                          const isNext = tier.participants > groupDeal.currentParticipants && 
                                        !groupDeal.tiers.some(t => t.participants > groupDeal.currentParticipants && t.participants < tier.participants);
                          return (
                            <div
                              key={index}
                              className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                                isUnlocked
                                  ? 'bg-primary/10 border border-primary/20'
                                  : isNext
                                  ? 'bg-accent/10 border border-accent/20'
                                  : 'bg-muted/30'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isUnlocked ? (
                                  <Zap className="w-4 h-4 text-primary" />
                                ) : (
                                  <Users className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className={isUnlocked ? 'font-semibold' : 'text-muted-foreground'}>
                                  {tier.participants} people
                                </span>
                              </div>
                              <Badge variant={isUnlocked ? 'default' : 'outline'}>
                                {tier.discount}% OFF
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {nextTier && (
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-accent" />
                          <span className="font-medium">Almost There!</span>
                        </div>
                        <p className="text-muted-foreground">
                          {nextTier.participants - groupDeal.currentParticipants} more people needed for{' '}
                          <span className="font-bold text-primary">{nextTier.discount}% OFF</span>
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Current Discount:</span>
                        <span className="font-bold text-primary">{activeDiscount}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold">${groupDeal.deal?.price || 0}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleJoin(groupDeal.id)}
                      disabled={joiningId === groupDeal.id || progress >= 100}
                    >
                      {joiningId === groupDeal.id
                        ? 'Joining...'
                        : progress >= 100
                        ? 'Deal Unlocked'
                        : 'Join Group Deal'}
                    </Button>
                  </CardFooter>
                </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
