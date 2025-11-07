import { useState, useEffect } from 'react';
import { Users, Loader2 } from "lucide-react";
import { socialAPI } from '@/lib/api';

interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
}

export default function CommunityActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await socialAPI.getFeed({ limit: 4 });
      setActivities(response.data || []);
    } catch (error) {
      console.error('Failed to load community activity:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-heading font-bold">Community Activity</h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <div 
              key={activity.id} 
              className="flex items-center gap-4 pb-4 border-b border-border last:border-0 animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{activity.user}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.action}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
