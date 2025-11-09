import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp } from 'lucide-react';

export type ReputationTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

interface ReputationBadgeProps {
  tier: ReputationTier;
  currentPoints: number;
  nextTierPoints?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const tierConfig: Record<
  ReputationTier,
  {
    color: string;
    gradient: string;
    glow: string;
    textColor: string;
    icon: string;
  }
> = {
  Bronze: {
    color: '#CD7F32',
    gradient: 'from-orange-700 via-orange-600 to-orange-500',
    glow: 'shadow-[0_0_20px_rgba(205,127,50,0.5)]',
    textColor: 'text-orange-700',
    icon: '🥉',
  },
  Silver: {
    color: '#C0C0C0',
    gradient: 'from-gray-400 via-gray-300 to-gray-200',
    glow: 'shadow-[0_0_20px_rgba(192,192,192,0.6)]',
    textColor: 'text-gray-600',
    icon: '🥈',
  },
  Gold: {
    color: '#FFD700',
    gradient: 'from-yellow-600 via-yellow-400 to-yellow-300',
    glow: 'shadow-[0_0_25px_rgba(255,215,0,0.7)]',
    textColor: 'text-yellow-600',
    icon: '🥇',
  },
  Platinum: {
    color: '#E5E4E2',
    gradient: 'from-slate-300 via-slate-200 to-white',
    glow: 'shadow-[0_0_30px_rgba(229,228,226,0.8)]',
    textColor: 'text-slate-600',
    icon: '💎',
  },
  Diamond: {
    color: '#B9F2FF',
    gradient: 'from-cyan-400 via-blue-300 to-purple-400',
    glow: 'shadow-[0_0_35px_rgba(185,242,255,0.9)]',
    textColor: 'text-cyan-600',
    icon: '💠',
  },
};

const sizeConfig = {
  sm: {
    container: 'w-16 h-20',
    shield: 'w-14 h-16',
    icon: 'text-2xl',
    text: 'text-xs',
  },
  md: {
    container: 'w-24 h-28',
    shield: 'w-20 h-24',
    icon: 'text-4xl',
    text: 'text-sm',
  },
  lg: {
    container: 'w-32 h-36',
    shield: 'w-28 h-32',
    icon: 'text-5xl',
    text: 'text-base',
  },
};

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  tier,
  currentPoints,
  nextTierPoints,
  showProgress = true,
  size = 'md',
  animated = true,
}) => {
  const config = tierConfig[tier];
  const sizeStyles = sizeConfig[size];
  const progressPercentage = nextTierPoints
    ? Math.min((currentPoints / nextTierPoints) * 100, 100)
    : 100;

  const badgeVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
    },
    hover: {
      rotate: [0, -5, 5, -5, 0],
    },
  };

  const badgeTransition = {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  };

  const hoverTransition = {
    duration: 0.5,
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Shield Badge */}
      <motion.div
        className={`relative ${sizeStyles.container} cursor-pointer`}
        initial={animated ? badgeVariants.initial : undefined}
        animate={animated ? badgeVariants.animate : undefined}
        whileHover={animated ? { ...badgeVariants.hover, transition: hoverTransition } : undefined}
        transition={animated ? badgeTransition : undefined}
      >
        {/* Glow Effect */}
        <div
          className={`absolute inset-0 rounded-full blur-xl ${config.glow} opacity-60`}
        />

        {/* Shield Shape */}
        <div className={`relative ${sizeStyles.shield} mx-auto`}>
          {/* Shield Background with Gradient */}
          <svg
            viewBox="0 0 100 120"
            className="w-full h-full drop-shadow-xl"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`gradient-${tier}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" className={config.gradient.split(' ')[0].replace('from-', '')} />
                <stop offset="50%" className={config.gradient.split(' ')[1].replace('via-', '')} />
                <stop offset="100%" className={config.gradient.split(' ')[2].replace('to-', '')} />
              </linearGradient>
              <filter id={`shimmer-${tier}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
              </filter>
            </defs>
            
            {/* Shield Path */}
            <path
              d="M50 5 L90 25 L90 60 Q90 90 50 115 Q10 90 10 60 L10 25 Z"
              fill={`url(#gradient-${tier})`}
              stroke="white"
              strokeWidth="2"
            />
            
            {/* Inner Shield Detail */}
            <path
              d="M50 15 L80 30 L80 60 Q80 85 50 105 Q20 85 20 60 L20 30 Z"
              fill="rgba(255,255,255,0.2)"
            />
          </svg>

          {/* Tier Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={sizeStyles.icon}>{config.icon}</span>
          </div>
        </div>

        {/* Shimmer Animation */}
        {animated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      {/* Tier Name */}
      <div className="text-center">
        <div className={`font-heading font-bold ${sizeStyles.text} ${config.textColor}`}>
          {tier} Tier
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center mt-1">
          <Award className="w-3 h-3" />
          <span>{currentPoints} points</span>
        </div>
      </div>

      {/* Progress Bar to Next Tier */}
      {showProgress && nextTierPoints && (
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress to next tier</span>
            <span className="font-semibold">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${config.gradient}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>
              {nextTierPoints - currentPoints} points to next tier
            </span>
          </div>
        </div>
      )}

      {/* Top Percentage Tooltip */}
      {tier === 'Diamond' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold"
        >
          ✨ Top 1% of users
        </motion.div>
      )}
      {tier === 'Platinum' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-400 to-slate-300 text-slate-700 text-xs px-3 py-1 rounded-full font-semibold"
        >
          ⭐ Top 5% of users
        </motion.div>
      )}
    </div>
  );
};
