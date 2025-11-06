import { ShoppingBag, Search, Heart, Package, TrendingUp, Users, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export type EmptyStateType = 'deals' | 'saved' | 'history' | 'search' | 'badges' | 'merchants' | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
  className?: string;
  imageUrl?: string;
}

const emptyStateConfig = {
  deals: {
    icon: ShoppingBag,
    title: 'No Deals Available',
    message: 'Check back soon for amazing deals! New offers are added daily.',
    actionLabel: 'Browse All Deals',
    actionLink: '/deals',
    imageUrl: 'https://assets-gen.codenut.dev/images/1762269069_58213952.png',
  },
  saved: {
    icon: Heart,
    title: 'No Saved Deals Yet',
    message: 'Start saving your favorite deals to access them quickly later!',
    actionLabel: 'Discover Deals',
    actionLink: '/deals',
    imageUrl: 'https://assets-gen.codenut.dev/images/1762269069_58213952.png',
  },
  history: {
    icon: Package,
    title: 'No Purchase History',
    message: 'Your claimed deals and purchases will appear here.',
    actionLabel: 'Start Shopping',
    actionLink: '/deals',
    imageUrl: 'https://assets-gen.codenut.dev/images/1762269069_58213952.png',
  },
  search: {
    icon: Search,
    title: 'No Results Found',
    message: 'Try adjusting your search terms or filters to find what you\'re looking for.',
    actionLabel: 'Clear Filters',
    imageUrl: 'https://assets-gen.codenut.dev/images/1762269069_58213952.png',
  },
  badges: {
    icon: Sparkles,
    title: 'No Badges Earned Yet',
    message: 'Start claiming deals and sharing with friends to unlock exclusive badges!',
    actionLabel: 'Explore Deals',
    actionLink: '/deals',
    imageUrl: 'https://assets-gen.codenut.dev/images/1762269069_58213952.png',
  },
  merchants: {
    icon: Users,
    title: 'No Merchants Found',
    message: 'We\'re constantly adding new merchants. Check back soon!',
    actionLabel: 'Become a Merchant',
    actionLink: '/merchant/onboarding',
    imageUrl: 'https://assets-gen.codenut.dev/images/1762269069_58213952.png',
  },
  generic: {
    icon: Gift,
    title: 'Nothing Here Yet',
    message: 'This section is empty right now. Start exploring to fill it up!',
    actionLabel: 'Get Started',
    actionLink: '/',
    imageUrl: 'https://assets-gen.codenut.dev/images/1762269069_58213952.png',
  },
};

export function EmptyState({
  type = 'generic',
  title,
  message,
  actionLabel,
  actionLink,
  onAction,
  className,
  imageUrl,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;
  const displayImageUrl = imageUrl || config.imageUrl;

  const ActionButton = () => {
    const buttonContent = (
      <Button 
        onClick={onAction}
        className="bg-primary text-white hover:bg-primary/90 font-bold shadow-lg hover:shadow-xl transition-all px-6 py-6 text-base rounded-xl"
      >
        {actionLabel || config.actionLabel}
      </Button>
    );

    if (actionLink || config.actionLink) {
      return (
        <Link to={actionLink || config.actionLink || '/'}>
          {buttonContent}
        </Link>
      );
    }

    return onAction ? buttonContent : null;
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 md:p-12 text-center', className)}>
      {displayImageUrl ? (
        <img 
          src={displayImageUrl}
          alt={title || config.title}
          className="w-48 h-48 md:w-64 md:h-64 mx-auto mb-6 opacity-80 animate-float"
        />
      ) : (
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 animate-float">
          <Icon className="w-10 h-10 md:w-12 md:h-12 text-primary" />
        </div>
      )}
      
      <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
        {title || config.title}
      </h3>
      
      <p className="text-base md:text-lg text-muted-foreground max-w-md mb-6 leading-relaxed">
        {message || config.message}
      </p>

      <ActionButton />
    </div>
  );
}

interface CompactEmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function CompactEmptyState({ 
  icon: Icon = Package, 
  message, 
  actionLabel, 
  onAction,
  className 
}: CompactEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
