import { AlertCircle, RefreshCw, Home, ArrowLeft, WifiOff, ServerCrash, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type ErrorType = 'network' | 'server' | 'notfound' | 'generic' | 'offline';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
  showActions?: boolean;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    title: 'Connection Issue',
    message: 'Unable to connect. Please check your internet connection and try again.',
    color: 'text-orange-500',
  },
  server: {
    icon: ServerCrash,
    title: 'Something Went Wrong',
    message: 'Our servers are having trouble. Please try again in a moment.',
    color: 'text-red-500',
  },
  notfound: {
    icon: FileQuestion,
    title: 'Not Found',
    message: 'The page or resource you\'re looking for doesn\'t exist.',
    color: 'text-blue-500',
  },
  offline: {
    icon: WifiOff,
    title: 'You\'re Offline',
    message: 'No internet connection detected. Some features may be unavailable.',
    color: 'text-gray-500',
  },
  generic: {
    icon: AlertCircle,
    title: 'Oops!',
    message: 'Something unexpected happened. Please try again.',
    color: 'text-yellow-500',
  },
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  onGoBack,
  onGoHome,
  className,
  showActions = true,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className={cn('w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4', config.color)}>
        <Icon className="w-8 h-8" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        {title || config.title}
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-6">
        {message || config.message}
      </p>

      {showActions && (
        <div className="flex flex-wrap gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface LoadingErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function LoadingError({ message = 'Failed to load content', onRetry }: LoadingErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <p className="text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
