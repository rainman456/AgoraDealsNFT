import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  userName: string;
  userAvatar: string;
  action: string;
  amount: number;
  merchantName: string;
  merchantLogo: string;
  timestamp: Date;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    userName: 'Sarah Chen',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    action: 'saved',
    amount: 50,
    merchantName: 'Italian Bistro',
    merchantLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=bistro',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: '2',
    userName: 'Marcus Johnson',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    action: 'claimed',
    amount: 120,
    merchantName: 'Luxury Spa',
    merchantLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=spa',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: '3',
    userName: 'Emily Rodriguez',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    action: 'saved',
    amount: 200,
    merchantName: 'Flight Deals',
    merchantLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=flight',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
  },
  {
    id: '4',
    userName: 'David Kim',
    userAvatar: 'https://i.pravatar.cc/150?img=4',
    action: 'redeemed',
    amount: 75,
    merchantName: 'Sushi Palace',
    merchantLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=sushi',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
  },
  {
    id: '5',
    userName: 'Lisa Anderson',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    action: 'saved',
    amount: 35,
    merchantName: 'Coffee House',
    merchantLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=coffee',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '6',
    userName: 'James Wilson',
    userAvatar: 'https://i.pravatar.cc/150?img=6',
    action: 'claimed',
    amount: 150,
    merchantName: 'Boutique Hotel',
    merchantLogo: 'https://api.dicebear.com/7.x/shapes/svg?seed=hotel',
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
  },
];

export const SocialProofFeed: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Show first 3 activities initially
    setVisibleActivities(activities.slice(0, 3));

    // Rotate activities every 4 seconds
    const interval = setInterval(() => {
      setActivities((prev) => {
        const rotated = [...prev];
        const first = rotated.shift();
        if (first) {
          // Update timestamp to make it feel live
          first.timestamp = new Date();
          rotated.push(first);
        }
        return rotated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setVisibleActivities(activities.slice(0, 3));
  }, [activities]);

  const getActionText = (activity: Activity) => {
    switch (activity.action) {
      case 'saved':
        return 'just saved';
      case 'claimed':
        return 'claimed a deal at';
      case 'redeemed':
        return 'redeemed at';
      default:
        return 'interacted with';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <h3 className="font-bold text-lg">Live Activity</h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleActivities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
                <div className="relative">
                  <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                    <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                    <AvatarFallback>{activity.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <img
                      src={activity.merchantLogo}
                      alt={activity.merchantName}
                      className="w-4 h-4 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight">
                    <span className="font-semibold text-foreground">
                      {activity.userName}
                    </span>{' '}
                    <span className="text-muted-foreground">
                      {getActionText(activity)}
                    </span>{' '}
                    <span className="font-bold text-accent">
                      ${activity.amount}
                    </span>{' '}
                    {activity.action === 'saved' && (
                      <span className="text-muted-foreground">
                        on {activity.merchantName}
                      </span>
                    )}
                    {activity.action !== 'saved' && (
                      <span className="text-muted-foreground">
                        {activity.merchantName}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="flex-shrink-0"
                >
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <span className="text-success text-lg">✓</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-center text-muted-foreground">
          <span className="font-semibold text-foreground">2,847</span> deals claimed in the last 24 hours
        </p>
      </div>
    </Card>
  );
};
