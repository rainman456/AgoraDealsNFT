import { Users } from "lucide-react";

interface Activity {
  user: string;
  action: string;
  time: string;
}

const activities: Activity[] = [
  { user: "Sarah M.", action: "saved $50 on Italian dinner", time: "2 min ago" },
  { user: "James K.", action: "joined group spa deal", time: "5 min ago" },
  { user: "Emma L.", action: "redeemed mountain resort package", time: "12 min ago" },
  { user: "Michael T.", action: "earned Diamond tier badge", time: "18 min ago" },
];

export default function CommunityActivity() {
  return (
    <div className="glass-card rounded-xl p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-heading font-bold">Community Activity</h2>
      </div>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div 
            key={i} 
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
    </div>
  );
}
