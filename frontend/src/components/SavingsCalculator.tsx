import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Share2, Coffee, DollarSign, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { toast } from 'react-toastify';

interface SavingsData {
  month: string;
  savings: number;
}

const mockSavingsData: SavingsData[] = [
  { month: 'Jan', savings: 120 },
  { month: 'Feb', savings: 250 },
  { month: 'Mar', savings: 180 },
  { month: 'Apr', savings: 420 },
  { month: 'May', savings: 350 },
  { month: 'Jun', savings: 580 },
];

const comparisons = [
  { icon: Coffee, label: 'Coffee cups', value: 234, emoji: '☕' },
  { icon: DollarSign, label: 'Movie tickets', value: 89, emoji: '🎬' },
  { icon: Award, label: 'Gym memberships', value: 12, emoji: '💪' },
];

interface SavingsCalculatorProps {
  totalSavings?: number;
  monthlyData?: SavingsData[];
}

export const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({
  totalSavings = 1880,
  monthlyData = mockSavingsData,
}) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    // Simulate share action
    setTimeout(() => {
      toast.success('Savings shared to social media!');
      setIsSharing(false);
    }, 1000);
  };

  const averageMonthlySavings = Math.round(
    monthlyData.reduce((sum, data) => sum + data.savings, 0) / monthlyData.length
  );

  const trend = monthlyData[monthlyData.length - 1].savings > monthlyData[0].savings ? 'up' : 'down';
  const trendPercentage = Math.round(
    ((monthlyData[monthlyData.length - 1].savings - monthlyData[0].savings) / 
    monthlyData[0].savings) * 100
  );

  return (
    <div className="space-y-6">
      {/* Main Savings Card */}
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 opacity-100" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative p-8 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/80 text-sm font-medium mb-2">Total Savings</p>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
              >
                <h2 className="text-6xl font-bold mb-2">
                  ${totalSavings.toLocaleString()}
                </h2>
              </motion.div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend === 'up' ? '+' : ''}{trendPercentage}% this month
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-xs mb-1">Avg. Monthly</p>
              <p className="text-2xl font-bold">${averageMonthlySavings}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-xs mb-1">Deals Claimed</p>
              <p className="text-2xl font-bold">47</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Savings Trend Chart */}
      <Card className="p-6 border-0 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Savings Trend</h3>
          <Badge variant="outline" className="gap-1">
            <TrendingUp className="w-3 h-3" />
            6 months
          </Badge>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              formatter={(value: number) => [`$${value}`, 'Savings']}
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#savingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Fun Comparisons */}
      <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-accent/5 to-primary/5">
        <h3 className="text-xl font-bold mb-4">That's equivalent to...</h3>
        
        <div className="space-y-4">
          {comparisons.map((comparison, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-white rounded-lg"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                {comparison.emoji}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{comparison.value}</p>
                <p className="text-sm text-muted-foreground">{comparison.label}</p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
              >
                <Badge className="bg-success text-white border-0">
                  Saved!
                </Badge>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border-2 border-dashed border-primary/30">
          <p className="text-center text-sm text-muted-foreground">
            Keep going! You're on track to save{' '}
            <span className="font-bold text-primary">
              ${Math.round(averageMonthlySavings * 12)}
            </span>{' '}
            this year 🎉
          </p>
        </div>
      </Card>
    </div>
  );
};
