import { Zap, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionBadgeProps {
  type?: 'free' | 'sponsored' | 'subsidized';
  className?: string;
  merchantName?: string;
}

export function TransactionBadge({ type = 'free', className, merchantName }: TransactionBadgeProps) {
  const badges = {
    free: {
      icon: Zap,
      text: 'Free Transaction',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-300',
    },
    sponsored: {
      icon: Gift,
      text: merchantName ? `${merchantName} pays fees` : 'Merchant pays fees',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-300',
    },
    subsidized: {
      icon: Zap,
      text: 'Platform subsidized',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
    },
  };

  const badge = badges[type];
  const Icon = badge.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
      badge.bgColor,
      badge.textColor,
      className
    )}>
      <Icon className="w-3.5 h-3.5" />
      <span>{badge.text}</span>
    </div>
  );
}
