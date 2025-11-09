import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireMerchant?: boolean;
  requireUser?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireMerchant = false,
  requireUser = false 
}) => {
  const { isAuthenticated, isMerchant, isUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireMerchant && !isMerchant) {
    return <Navigate to="/" replace />;
  }

  if (requireUser && !isUser) {
    return <Navigate to="/merchant" replace />;
  }

  return <>{children}</>;
};
