import { useState } from 'react';
import { TrendingUp, Share2, Coffee, Pizza, Plane, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthData {
  month: string;
  savings: number;
}

const mockData: MonthData[] = [
  { month: 'Jan', savings: 145 },
  { month: 'Feb', savings: 230 },
  { month: 'Mar', savings: 180 },
  { month: 'Apr', savings: 320 },
  { month: 'May', savings: 410 },
  { month: 'Jun', savings: 385 }
];

const comparisons = [
  { icon: Coffee, label: 'Starbucks lattes', value: 287, emoji: '☕' },
  { icon: Pizza, label: 'Pizza deliveries', value: 95, emoji: '🍕' },
  { icon: Plane, label: 'Flight tickets', value: 2, emoji: '✈️' }
];

export function SavingsCalculator() {
  const [isSharing, setIsSharing] = useState(false);
  const totalSavings = mockData.reduce((sum, m) => sum + m.savings, 0);
  const maxSavings = Math.max(...mockData.map(m => m.savings));

  const handleShare = () => {
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 2000);
    
    if (navigator.share) {
      navigator.share({
        title: 'My DealForge Savings',
        text: `I've saved $${totalSavings.toLocaleString()} with DealForge! 🎉`,
        url: window.location.href
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-lime-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-lime-200 dark:border-lime-900 overflow-hidden">
      {/* Header with Big Number */}
      <div className="relative px-8 py-10 bg-gradient-to-r from-lime-500 to-yellow-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">Total Savings</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold tracking-tight">
              ${totalSavings.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-semibold">+24%</span>
            </div>
          </div>
          <p className="mt-2 text-sm opacity-90">Since joining DealForge</p>
        </div>

        <Button
          onClick={handleShare}
          className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white"
          size="sm"
        >
          <Share2 className="w-4 h-4 mr-2" />
          {isSharing ? 'Shared!' : 'Share'}
        </Button>
      </div>

      {/* Chart */}
      <div className="px-8 py-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Trend</h3>
        <div className="flex items-end justify-between gap-3 h-48">
          {mockData.map((data, index) => {
            const height = (data.savings / maxSavings) * 100;
            return (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full group">
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-10">
                    ${data.savings}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900 dark:bg-gray-700"></div>
                  </div>
                  
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-lime-500 to-yellow-400 rounded-t-lg transition-all duration-500 hover:from-lime-600 hover:to-yellow-500 cursor-pointer shadow-lg"
                    style={{ 
                      height: `${height}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{data.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparisons */}
      <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          That's equivalent to...
        </h3>
        <div className="space-y-3">
          {comparisons.map((comp, index) => (
            <div 
              key={comp.label}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 animate-slideIn"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-100 to-yellow-100 dark:from-lime-900/30 dark:to-yellow-900/30 flex items-center justify-center text-2xl">
                {comp.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {comp.value} {comp.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Based on average prices
                </p>
              </div>
              <div className="text-2xl font-bold text-lime-600 dark:text-lime-400">
                {comp.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Badge */}
      <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-lime-500/10 to-yellow-500/10 rounded-xl border border-lime-200 dark:border-lime-800">
          <div className="text-4xl">🏆</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">Super Saver Status!</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Top 5% of all users</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">Level 12</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Next: Level 13</p>
          </div>
        </div>
      </div>
    </div>
  );
}
