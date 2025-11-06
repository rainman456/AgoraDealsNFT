import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User, Merchant } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  merchant: Merchant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginUser: (email: string) => Promise<void>;
  loginMerchant: (email: string) => Promise<void>;
  registerUser: (username: string, email: string) => Promise<void>;
  registerMerchant: (data: {
    name: string;
    email: string;
    category: string;
    description?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedUser = localStorage.getItem('user');
    const storedMerchant = localStorage.getItem('merchant');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedMerchant) {
      setMerchant(JSON.parse(storedMerchant));
    }
    
    setIsLoading(false);
  }, []);

  const loginUser = async (email: string) => {
    try {
      // Simple email-based login - create or retrieve user
      const userData = {
        _id: `user_${Date.now()}`,
        walletAddress: '',
        name: email.split('@')[0],
        email: email,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginMerchant = async (email: string) => {
    try {
      // Simple email-based login - create or retrieve merchant
      const merchantData = {
        _id: `merchant_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        walletAddress: '',
        businessName: '',
        description: '',
        category: '',
        location: undefined,
        verified: false,
        createdAt: new Date().toISOString(),
      };
      setMerchant(merchantData);
      localStorage.setItem('merchant', JSON.stringify(merchantData));
    } catch (error) {
      console.error('Merchant login error:', error);
      throw error;
    }
  };

  const registerUser = async (username: string, email: string) => {
    try {
      // Simple registration - create user locally
      const userData = {
        _id: `user_${Date.now()}`,
        walletAddress: '',
        name: username,
        email: email,
        role: 'user' as const,
        createdAt: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const registerMerchant = async (data: {
    name: string;
    email: string;
    category: string;
    description?: string;
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  }) => {
    try {
      const response = await authAPI.registerMerchant(data);
      
      if (response.success) {
        const merchantData = {
          _id: response.data.merchantId,
          name: response.data.name,
          email: response.data.email || data.email,
          walletAddress: response.data.walletAddress || '',
          businessName: response.data.name,
          description: data.description,
          category: response.data.category,
          location: data.location,
          verified: false,
          createdAt: new Date().toISOString(),
        };
        setMerchant(merchantData);
        localStorage.setItem('merchant', JSON.stringify(merchantData));
      }
    } catch (error) {
      console.error('Merchant registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setMerchant(null);
    localStorage.removeItem('user');
    localStorage.removeItem('merchant');
  };

  const value = {
    user,
    merchant,
    isAuthenticated: !!(user || merchant),
    isLoading,
    loginUser,
    loginMerchant,
    registerUser,
    registerMerchant,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
