import { useEffect, useState } from 'react';
import { User, Store, Clock } from 'lucide-react';

interface Activity {
  id: string;
  userName: string;
  userAvatar: string;
  merchantName: string;
  merchantLogo: string;
  savings: number;
  timeAgo: string;
  dealType: string;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    userName: 'Sarah Chen',
    userAvatar: '👩‍💼',
    merchantName: 'Bella Italia',
    merchantLogo: '🍝',
    savings: 50,
    timeAgo: '2m ago',
    dealType: 'Italian dinner'
  },
  {
    id: '2',
    userName: 'Mike Johnson',
    userAvatar: '👨‍💻',
    merchantName: 'Zen Spa',
    merchantLogo: '💆',
    savings: 75,
    timeAgo: '5m ago',
    dealType: 'massage package'
  },
  {
    id: '3',
    userName: 'Emma Wilson',
    userAvatar: '👩‍🎨',
    merchantName: 'FitZone Gym',
    merchantLogo: '💪',
    savings: 120,
    timeAgo: '8m ago',
    dealType: 'annual membership'
  },
  {
    id: '4',
    userName: 'David Lee',
    userAvatar: '👨‍🔬',
    merchantName: 'Coffee Haven',
    merchantLogo: '☕',
    savings: 15,
    timeAgo: '12m ago',
    dealType: 'coffee subscription'
  },
  {
    id: '5',
    userName: 'Lisa Park',
    userAvatar: '👩‍🏫',
    merchantName: 'Sushi Master',
    merchantLogo: '🍣',
    savings: 45,
    timeAgo: '15m ago',
    dealType: 'omakase dinner'
  },
  {
    id: '6',
    userName: 'James Brown',
    userAvatar: '👨‍🎤',
    merchantName: 'Urban Cuts',
    merchantLogo: '✂️',
    savings: 30,
    timeAgo: '18m ago',
    dealType: 'haircut & styling'
  }
];

export function SocialProofFeed() {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActivities(prev => {
        const newActivity = {
          ...prev[Math.floor(Math.random() * prev.length)],
          id: Date.now().toString(),
          timeAgo: 'Just now'
        };
        return [newActivity, ...prev.slice(0, 5)];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-lime-50 to-yellow-50 dark:from-lime-950/20 dark:to-yellow-950/20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-2 h-2 bg-lime-500 rounded-full animate-ping"></div>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Live Activity</h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">Real-time</span>
        </div>
      </div>

      <div className="max-h-96 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 animate-slideIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-400 to-yellow-400 flex items-center justify-center text-xl shadow-md">
                    {activity.userAvatar}
                  </div>
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">{activity.userName}</span>
                    <span className="text-gray-600 dark:text-gray-300"> just saved </span>
                    <span className="font-bold text-lime-600 dark:text-lime-400">
                      ${activity.savings}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300"> on {activity.dealType}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Store className="w-3 h-3" />
                      <span>{activity.merchantName}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{activity.timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Logo */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-lg border border-gray-200 dark:border-gray-600">
                    {activity.merchantLogo}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-lime-600 dark:text-lime-400">2,847</span> people saved today
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Total: <span className="font-semibold text-yellow-600 dark:text-yellow-400">$127,450</span>
          </span>
        </div>
      </div>
    </div>
  );
}
