import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User, Merchant } from '@/lib/api';
import { toast } from 'react-toastify';

interface AuthContextType {
  user: User | null;
  merchant: Merchant | null;
  isAuthenticated: boolean;
  isMerchant: boolean;
  isUser: boolean;
  isLoading: boolean;
  walletAddress: string | null;
  registerUser: (username: string, email: string) => Promise<User | undefined>;
  registerMerchant: (data: {
    name: string;
    email: string;
    category: string;
    description?: string;
    location?: any;
  }) => Promise<Merchant | undefined>;
  loginWithWallet: (walletAddress: string) => Promise<void>;
  login: (email: string, password: string) => Promise<User | undefined>; // Legacy compatibility
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedWalletAddress = localStorage.getItem('walletAddress');
      const savedUser = localStorage.getItem('user');
      const savedMerchant = localStorage.getItem('merchant');
      
      if (savedWalletAddress) {
        setWalletAddress(savedWalletAddress);
        
        try {
          // Try to fetch user first
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          
          // Try to fetch merchant
          if (savedMerchant) {
            setMerchant(JSON.parse(savedMerchant));
          }

          // Refresh from server
          try {
            const userResponse = await authAPI.getUserByWallet(savedWalletAddress);
            if (userResponse.success) {
              setUser(userResponse.data);
              localStorage.setItem('user', JSON.stringify(userResponse.data));
            }
          } catch (error) {
            // User might not exist, try merchant
            try {
              const merchantResponse = await authAPI.getMerchantByWallet(savedWalletAddress);
              if (merchantResponse.success) {
                setMerchant(merchantResponse.data);
                localStorage.setItem('merchant', JSON.stringify(merchantResponse.data));
                localStorage.setItem('merchantEmail', merchantResponse.data.email);
              }
            } catch (merchantError) {
              console.error('Failed to fetch merchant:', merchantError);
            }
          }
        } catch (error) {
          console.error('Failed to fetch account:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const registerUser = async (username: string, email: string) => {
    try {
      const response = await authAPI.registerUser({ username, email });
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);
        setWalletAddress(userData.walletAddress);
        localStorage.setItem('walletAddress', userData.walletAddress);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('User registered successfully!');
        return userData;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const registerMerchant = async (data: {
    name: string;
    email: string;
    category: string;
    description?: string;
    location?: any;
  }) => {
    try {
      const response = await authAPI.registerMerchant(data);
      if (response.success) {
        const merchantData = response.data.merchant;
        setMerchant(merchantData);
        setWalletAddress(merchantData.walletAddress || '');
        localStorage.setItem('walletAddress', merchantData.walletAddress || '');
        localStorage.setItem('merchant', JSON.stringify(merchantData));
        localStorage.setItem('merchantEmail', merchantData.email);
        toast.success('Merchant registered successfully!');
        return merchantData;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Merchant registration failed');
      throw error;
    }
  };

  const loginWithWallet = async (address: string) => {
    try {
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);

      // Try to fetch user
      try {
        const userResponse = await authAPI.getUserByWallet(address);
        if (userResponse.success) {
          setUser(userResponse.data);
          localStorage.setItem('user', JSON.stringify(userResponse.data));
          toast.success('Welcome back!');
          return;
        }
      } catch (error) {
        // User doesn't exist, try merchant
        try {
          const merchantResponse = await authAPI.getMerchantByWallet(address);
          if (merchantResponse.success) {
            setMerchant(merchantResponse.data);
            localStorage.setItem('merchant', JSON.stringify(merchantResponse.data));
            localStorage.setItem('merchantEmail', merchantResponse.data.email);
            toast.success('Welcome back, Merchant!');
            return;
          }
        } catch (merchantError) {
          // Neither user nor merchant exists
          toast.info('Wallet connected. Please complete registration.');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setMerchant(null);
      setWalletAddress(null);
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('user');
      localStorage.removeItem('merchant');
      localStorage.removeItem('merchantEmail');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.loginEmail(email, password);
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      if (response.user) {
        setUser(response.user);
        setWalletAddress(response.user.walletAddress);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('walletAddress', response.user.walletAddress);
        toast.success('Welcome back!');
        return response.user;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!walletAddress) return;

    try {
      if (user) {
        const userResponse = await authAPI.getUserByWallet(walletAddress);
        if (userResponse.success) {
          setUser(userResponse.data);
          localStorage.setItem('user', JSON.stringify(userResponse.data));
        }
      } else if (merchant) {
        const merchantResponse = await authAPI.getMerchantByWallet(walletAddress);
        if (merchantResponse.success) {
          setMerchant(merchantResponse.data);
          localStorage.setItem('merchant', JSON.stringify(merchantResponse.data));
        }
      }
    } catch (error) {
      console.error('Failed to refresh account:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        merchant,
        isAuthenticated: !!(user || merchant),
        isMerchant: !!merchant,
        isUser: !!user,
        isLoading,
        walletAddress,
        registerUser,
        registerMerchant,
        loginWithWallet,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
