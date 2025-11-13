import axios, { AxiosError } from 'axios';
import {
  mockAuthAPI,
  mockDealsAPI,
  mockNftAPI,
  mockMarketplaceAPI,
  mockMerchantAPI,
  mockGroupDealsAPI,
  mockSocialAPI,
} from './mockApi';
import { handleError, AppError } from './error-handler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add wallet address header
api.interceptors.request.use(
  (config) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      config.headers['X-Wallet-Address'] = walletAddress;
    }
    // Add request timestamp for debugging
    config.headers['X-Request-Timestamp'] = new Date().toISOString();
    return config;
  },
  (error) => Promise.reject(handleError(error))
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Add response logging for debugging
    console.debug(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    const appError = handleError(error);
    
    // Log error for debugging
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`);
    console.error('Error details:', appError);
    
    // Handle 401 - Auto logout and redirect
    if (appError.status === 401) {
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('user');
      localStorage.removeItem('merchant');
      localStorage.removeItem('authToken');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(appError);
  }
);

export default api;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
  id: string;
  walletAddress: string;
  address?: string; // Legacy compatibility
  username?: string;
  name?: string; // Legacy compatibility
  email?: string;
  totalPurchases: number;
  totalRedemptions: number;
  reputationScore: number;
  reputation?: number; // Legacy compatibility
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  reputationTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'; // Legacy compatibility
  badgesEarned: string[];
  badges?: Badge[]; // Legacy compatibility
  role?: 'user' | 'merchant'; // Legacy compatibility
  avatar?: string; // Legacy compatibility
  totalSpent?: number; // Legacy compatibility
  dealsRedeemed?: number; // Legacy compatibility
  stakingBalance?: number; // Legacy compatibility
  stakingRewards?: number; // Legacy compatibility
  preferences?: {
    categories: string[];
    locationEnabled: boolean;
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Merchant {
  id: string;
  email: string;
  walletAddress?: string;
  onChainAddress?: string;
  name: string;
  businessName?: string;
  category: string;
  description?: string;
  logo?: string; // Legacy compatibility
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  totalCouponsCreated: number;
  totalCouponsRedeemed: number;
  isActive: boolean;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  _id: string;
  id: string;
  onChainAddress: string;
  merchant: Merchant | string;
  title: string;
  description: string;
  category: string;
  discountPercentage: number;
  discount?: number; // Legacy compatibility
  maxSupply: number;
  currentSupply: number;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  imageUrl?: string;
  expiryTimestamp: string;
  expiresAt?: string; // Legacy compatibility
  endDate?: string;
  isActive: boolean;
  stats: {
    totalMinted: number;
    totalRedeemed: number;
    averageRating: number;
    totalRatings: number;
    totalComments: number;
  };
  redemptionCount?: number; // Legacy compatibility
  maxRedemptions?: number; // Legacy compatibility
  rating?: number; // Legacy compatibility
  reviewCount?: number; // Legacy compatibility
  currency?: string; // Legacy compatibility
  location?: string; // Legacy compatibility
  nftMetadata?: {
    tokenId?: string;
    contractAddress?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  _id: string;
  id: string;
  onChainAddress: string;
  couponId: number;
  tokenId?: string; // Legacy compatibility
  nftMint: string;
  promotion: Promotion | string;
  dealId?: string; // Legacy compatibility
  deal?: Promotion; // Legacy compatibility
  owner: string;
  merchant: string;
  discountPercentage: number;
  expiryTimestamp: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  redemptionCode?: string;
  isListed: boolean;
  listingPrice?: number;
  resalePrice?: number; // Legacy compatibility
  purchasedAt?: string; // Legacy compatibility
  transferHistory: Array<{
    from: string;
    to: string;
    timestamp: string;
    transactionSignature: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListing {
  _id: string;
  id: string;
  onChainAddress: string;
  coupon: Coupon;
  nft?: Coupon; // Legacy compatibility
  seller: string | User; // Can be string or User object
  price: number;
  currency?: string; // Legacy compatibility
  listedAt?: string; // Legacy compatibility
  isActive: boolean;
  createdAt: string;
}

export interface GroupDeal {
  id: string;
  onChainAddress: string;
  promotion: Promotion | string;
  deal?: Promotion; // Legacy compatibility
  targetParticipants: number;
  requiredParticipants?: number; // Legacy compatibility
  currentParticipants: number;
  status: 'active' | 'completed' | 'expired';
  tiers: Array<{
    participants: number;
    discountPercentage: number;
    discount?: number; // Legacy compatibility
  }>;
  expiresAt: string;
  createdAt: string;
}

export interface Auction {
  _id?: string;
  id?: string;
  onChainAddress: string;
  couponAddress?: string;
  coupon?: Coupon | string;
  sellerAddress: string;
  seller?: string | User; // Can be string or User object
  merchantAddress?: string;
  title: string;
  description?: string;
  category?: string;
  startingPrice: number;
  currentBid: number;
  reservePrice?: number;
  buyNowPrice?: number;
  highestBidder?: string | null;
  bids?: Array<{
    bidder: string;
    amount: number;
    timestamp: string;
  }>;
  totalBids?: number;
  status: 'active' | 'completed' | 'cancelled';
  isActive?: boolean;
  isSettled?: boolean;
  finalPrice?: number;
  endTime: string;
  endsAt?: string; // Legacy compatibility
  startTime?: string;
  extendOnBid?: boolean;
  extensionTime?: number;
  couponMetadata?: {
    discountPercentage?: number;
    expiryTimestamp?: string;
    merchantName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Badge {
  id: string;
  badgeType: string;
  name: string;
  description: string;
  imageUrl: string;
  earnedAt?: string;
  owner?: string;
  mintAddress?: string;
  nftTokenId?: string; // Legacy compatibility
  criteria?: {
    type: string;
    value: string;
  };
}

export interface Stake {
  _id?: string;
  id?: string;
  address?: string;
  user: string;
  coupon: string;
  nftMint?: string;
  amountStaked?: number;
  stakedAt: string;
  unlockAt?: string;
  unlocksAt?: string; // Legacy compatibility
  durationDays?: string | number;
  rewardsEarned?: number | string;
  estimatedRewards?: number; // Legacy compatibility
  isActive?: boolean;
  claimedAt?: string | null;
  status?: 'active' | 'completed';
}

export interface Comment {
  _id: string;
  id: string;
  user: {
    username: string;
    walletAddress: string;
    name?: string; // Legacy compatibility
    avatar?: string; // Legacy compatibility
  };
  content: string;
  comment?: string; // Legacy compatibility
  likes: number;
  createdAt: string;
}

export interface Rating {
  _id: string;
  id: string;
  user: string;
  stars: number;
  createdAt: string;
}

export interface RedemptionTicket {
  id: string;
  ticketAccount: string;
  couponId: string;
  userId: string;
  merchantId: string;
  status: 'pending' | 'redeemed' | 'cancelled' | 'expired';
  qrCode: string;
  expiresAt: string;
  createdAt: string;
}

export interface Activity {
  type: 'mint' | 'redeem' | 'transfer' | 'list' | 'purchase';
  user: string;
  promotion: string;
  timestamp: string;
}

// Legacy type aliases
export type Deal = Promotion;
export type NFT = Coupon;

// ============================================================================
// AUTHENTICATION API
// ============================================================================

interface IAuthAPI {
  registerUser: (data: { username: string; email: string; password: string }) => Promise<{ success: boolean; data: { user: User } }>;
  registerMerchant: (data: any) => Promise<{ success: boolean; data: { merchant: Merchant } }>;
  login: (email: string, password: string) => Promise<{ success: boolean; data: any }>;
  getUserByWallet: (walletAddress: string) => Promise<{ success: boolean; data: User }>;
  getMerchantByWallet: (walletAddress: string) => Promise<{ success: boolean; data: Merchant }>;
  connectWallet: (signature: string, message: string) => Promise<any>;
  loginEmail: (email: string, password: string) => Promise<any>;
  logout: () => Promise<{ success: boolean }>;
  getCurrentUser: () => Promise<User>;
}

const realAuthAPI: IAuthAPI = {
  registerUser: async (data: { username: string; email: string; password: string }) => {
    const { data: response } = await api.post('/auth/register/user', data);
    // Backend returns data object with user info directly
    return {
      success: response.success,
      data: {
        user: response.data?.user || response.data || response
      }
    };
  },

  registerMerchant: async (data: {
    name: string;
    email: string;
    password: string;
    category: string;
    description?: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  }) => {
    const { data: response } = await api.post('/auth/register/merchant', data);
    // Backend returns data object with merchant info directly
    return {
      success: response.success,
      data: {
        merchant: response.data?.merchant || response.data || response
      }
    };
  },

  login: async (email: string, password: string): Promise<{ success: boolean; data: any }> => {
    const { data } = await api.post('/auth/login', { email, password });
    // Store wallet address from response
    if (data.success && data.data?.walletAddress) {
      localStorage.setItem('walletAddress', data.data.walletAddress);
    }
    return data;
  },

  getUserByWallet: async (walletAddress: string): Promise<{ success: boolean; data: User }> => {
    const { data } = await api.get(`/auth/user/${walletAddress}`);
    return data;
  },

  getMerchantByWallet: async (walletAddress: string): Promise<{ success: boolean; data: Merchant }> => {
    const { data } = await api.get(`/auth/merchant/${walletAddress}`);
    return data;
  },

  // Legacy methods for compatibility
  connectWallet: async (signature: string, message: string) => {
    // No wallet endpoint on backend, use registerUser instead
    throw new Error('Use registerUser or registerMerchant instead');
  },

  loginEmail: async (email: string, password: string) => {
    // Deprecated: Use login() instead
    return realAuthAPI.login(email, password);
  },

  logout: async () => {
    // No logout endpoint needed - just clear local storage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('user');
    localStorage.removeItem('merchant');
    return { success: true };
  },

  getCurrentUser: async (): Promise<User> => {
    // Get from localStorage or fetch from wallet endpoint
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) {
      throw new Error('No wallet connected');
    }
    const response = await realAuthAPI.getUserByWallet(walletAddress);
    return response.data;
  },
};

export const authAPI: IAuthAPI = USE_MOCK_API ? mockAuthAPI : realAuthAPI;

// ============================================================================
// PROMOTIONS API
// ============================================================================

const realPromotionsAPI = {
 createPromotion: async (data: {
  walletAddress: string;
  email: string;
  title: string;
  description: string;
  discountPercentage: number;
  price: number;
  category: string;
  maxSupply: number;
  expiryDays?: number;
  expiryTimestamp?: string;
  imageUrl?: string;
}) => {
  // Add validation for category
  const validCategories = ['flights', 'hotels', 'restaurants', 'experiences', 'shopping'];
  if (!validCategories.includes(data.category.toLowerCase())) {
    throw new Error(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }
  
  const { data: response } = await api.post('/promotions', {
    ...data,
    category: data.category.toLowerCase() // Ensure lowercase
  }, {
    headers: { 'X-Wallet-Address': data.walletAddress },
  });
  return response;
},
  listPromotions: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    minDiscount?: number;
    search?: string;
    sortBy?: 'discount' | 'price' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) => {
    const { data } = await api.get('/promotions', { params });
    return data;
  },

  getPromotionById: async (promotionId: string) => {
    const { data } = await api.get(`/promotions/${promotionId}`);
    return data;
  },

  updatePromotion: async (
    promotionId: string,
    walletAddress: string,
    updates: {
      title?: string;
      description?: string;
      price?: number;
      maxSupply?: number;
    }
  ) => {
    const { data } = await api.put(`/promotions/${promotionId}`, { walletAddress, ...updates }, {
      headers: { 'X-Wallet-Address': walletAddress },
    });
    return data;
  },

  pausePromotion: async (promotionId: string, walletAddress: string) => {
    const { data } = await api.patch(`/promotions/${promotionId}/pause`, null, {
      headers: { 'X-Wallet-Address': walletAddress },
    });
    return data;
  },

  resumePromotion: async (promotionId: string, walletAddress: string) => {
    const { data } = await api.patch(`/promotions/${promotionId}/resume`, null, {
      headers: { 'X-Wallet-Address': walletAddress },
    });
    return data;
  },

  deletePromotion: async (promotionId: string, walletAddress: string) => {
    const { data } = await api.delete(`/promotions/${promotionId}`, {
      headers: { 'X-Wallet-Address': walletAddress },
    });
    return data;
  },

  // Legacy compatibility methods
  getDeals: async (params?: any) => {
    return realPromotionsAPI.listPromotions(params);
  },

  searchDeals: async (query: string) => {
    return realPromotionsAPI.listPromotions({ search: query });
  },

  getNearbyDeals: async (lat: number, lng: number, radius: number = 10) => {
    return realPromotionsAPI.listPromotions({ latitude: lat, longitude: lng, radius });
  },
};

// ============================================================================
// COUPONS API
// ============================================================================

const realCouponsAPI = {
  mintCoupon: async (walletAddress: string, promotionId: string) => {
    const { data } = await api.post('/coupons/mint', { walletAddress, promotionId });
    return data;
  },

  listCoupons: async (params?: {
    page?: number;
    limit?: number;
    owner?: string;
    promotion?: string;
    isRedeemed?: boolean;
    isListed?: boolean;
  }) => {
    const { data } = await api.get('/coupons', { params });
    return data;
  },

  getMyCoupons: async (walletAddress: string) => {
    const { data } = await api.get('/coupons/my-coupons', {
      params: { walletAddress },
      headers: { 'X-Wallet-Address': walletAddress },
    });
    return data;
  },

  getCouponById: async (couponId: string) => {
    const { data } = await api.get(`/coupons/${couponId}`);
    return data;
  },

  transferCoupon: async (walletAddress: string, couponId: string, recipientAddress: string) => {
    const { data } = await api.post('/coupons/transfer', {
      walletAddress,
      couponId,
      recipientAddress,
    });
    return data;
  },
};

export const couponsAPI = realCouponsAPI;

// ============================================================================
// MARKETPLACE API
// ============================================================================

const realMarketplaceAPI = {
  listCoupon: async (walletAddress: string, couponId: string, price: number) => {
    const { data } = await api.post('/marketplace/list', { walletAddress, couponId, price });
    return data;
  },

  getListings: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'createdAt';
  }) => {
    const { data } = await api.get('/marketplace/listings', { params });
    return data;
  },

  buyCoupon: async (walletAddress: string, listingId: string) => {
    const { data } = await api.post('/marketplace/buy', { walletAddress, listingId });
    return data;
  },

  cancelListing: async (walletAddress: string, listingId: string) => {
    const { data } = await api.post('/marketplace/cancel', { walletAddress, listingId });
    return data;
  },

  // Alternative endpoints
  createListing: async (walletAddress: string, couponId: string, price: number) => {
    const { data } = await api.post('/listings', { walletAddress, couponId, price });
    return data;
  },

  getAllListings: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get('/listings', { params });
    return data;
  },

  getListingById: async (listingId: string) => {
    const { data } = await api.get(`/listings/${listingId}`);
    return data;
  },

  deactivateListing: async (listingId: string) => {
    const { data } = await api.patch(`/listings/${listingId}/deactivate`);
    return data;
  },

  deleteListing: async (listingId: string) => {
    const { data } = await api.delete(`/listings/${listingId}`);
    return data;
  },

  // Legacy compatibility methods
  listNFT: async (nftId: string, price: number) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return realMarketplaceAPI.listCoupon(walletAddress, nftId, price);
  },

  unlistNFT: async (listingId: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return realMarketplaceAPI.cancelListing(walletAddress, listingId);
  },

  buyNFT: async (listingId: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return realMarketplaceAPI.buyCoupon(walletAddress, listingId);
  },
};

export const promotionsAPI = realPromotionsAPI;

export const marketplaceAPI = USE_MOCK_API ? mockMarketplaceAPI : realMarketplaceAPI;

// ============================================================================
// REDEMPTION API
// ============================================================================

export const redemptionAPI = {
  generateQR: async (walletAddress: string, couponId: string) => {
    const { data } = await api.post('/redemption/generate-qr', { walletAddress, couponId });
    return data;
  },

  redeemCoupon: async (walletAddress: string, couponId: string, redemptionCode: string) => {
    const { data } = await api.post('/redemption/redeem', { walletAddress, couponId, redemptionCode });
    return data;
  },

  getRedemptionStatus: async (couponId: string) => {
    const { data } = await api.get(`/redemption/${couponId}/status`);
    return data;
  },

  generateTicket: async (walletAddress: string, couponId: string) => {
    const { data } = await api.post('/redemption-tickets/generate', { walletAddress, couponId });
    return data;
  },

  verifyAndRedeemTicket: async (walletAddress: string, ticketId: string) => {
    const { data } = await api.post('/redemption-tickets/verify-and-redeem', { walletAddress, ticketId });
    return data;
  },

  cancelTicket: async (ticketId: string) => {
    const { data } = await api.post(`/redemption-tickets/${ticketId}/cancel`);
    return data;
  },

  getUserTickets: async (userAddress: string) => {
    const { data } = await api.get(`/redemption-tickets/user/${userAddress}`);
    return data;
  },

  getMerchantTickets: async (merchantAddress: string) => {
    const { data } = await api.get(`/redemption-tickets/merchant/${merchantAddress}`);
    return data;
  },
};

// ============================================================================
// SOCIAL & ACTIVITY API
// ============================================================================

const realSocialAPI = {
  trackShare: async (walletAddress: string, promotionId: string, platform: string) => {
    const { data } = await api.post('/social/share', { walletAddress, promotionId, platform });
    return data;
  },

  trackView: async (walletAddress: string, promotionId: string) => {
    const { data } = await api.post('/social/view', { walletAddress, promotionId });
    return data;
  },

  getTrending: async (params?: { limit?: number; timeframe?: 'day' | 'week' | 'month' }) => {
    const { data } = await api.get('/social/trending', { params });
    return data;
  },

  getPopular: async (params?: { limit?: number }) => {
    const { data } = await api.get('/social/popular', { params });
    return data;
  },

  rateCoupon: async (walletAddress: string, couponId: string, rating: number) => {
    const { data } = await api.post('/social/rate', { walletAddress, couponId, rating });
    return data;
  },

  getActivityFeed: async (params?: { limit?: number }) => {
    const { data } = await api.get('/social/feed', { params });
    return data;
  },

  // Legacy compatibility methods
  shareDeal: async (dealId: string, platform: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return realSocialAPI.trackShare(walletAddress, dealId, platform);
  },

  getComments: async (dealId: string) => {
    const response = await commentsAPI.listComments(dealId);
    return response.data?.comments || [];
  },

  addComment: async (dealId: string, comment: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return commentsAPI.createComment(dealId, comment, walletAddress);
  },
};

export const socialAPI = USE_MOCK_API ? mockSocialAPI : realSocialAPI;

// ============================================================================
// MERCHANTS API
// ============================================================================

const realMerchantsAPI = {
  getMerchantProfile: async (merchantId: string) => {
    const { data } = await api.get(`/merchants/${merchantId}`);
    return data;
  },

  listMerchants: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) => {
    const { data } = await api.get('/merchants', { params });
    return data;
  },

  getMerchantAnalytics: async (merchantAddress: string) => {
    const { data } = await api.get(`/merchant-dashboard/${merchantAddress}/analytics`);
    return data;
  },

  getMerchantRecentActivity: async (merchantAddress: string) => {
    const { data } = await api.get(`/merchant-dashboard/${merchantAddress}/recent-activity`);
    return data;
  },
};

export const merchantsAPI = USE_MOCK_API ? mockMerchantAPI : realMerchantsAPI;

// ============================================================================
// USER STATS API
// ============================================================================

export const userStatsAPI = {
  getUserStats: async (userAddress: string) => {
    const { data } = await api.get(`/user-stats/${userAddress}`);
    return data;
  },

  getUserBadges: async (userAddress: string) => {
    const { data } = await api.get(`/user-stats/${userAddress}/badges`);
    return data;
  },

  getLeaderboard: async (params?: { limit?: number; sortBy?: 'reputation' | 'purchases' | 'redemptions' }) => {
    const { data } = await api.get('/user-stats/leaderboard', { params });
    return data;
  },

  getPlatformStats: async () => {
    const { data } = await api.get('/user-stats/stats/overview');
    return data;
  },
};

// ============================================================================
// GROUP DEALS API
// ============================================================================

const realGroupDealsAPI = {
  createGroupDeal: async (data: {
    walletAddress: string;
    promotionId: string;
    targetParticipants: number;
    duration: number;
    tiers: Array<{ participants: number; discountPercentage: number }>;
  }) => {
    const { data: response } = await api.post('/group-deals/create', data);
    return response;
  },

  joinGroupDeal: async (dealId: string, walletAddress: string) => {
    const { data } = await api.post(`/group-deals/${dealId}/join`, { walletAddress });
    return data;
  },

  finalizeGroupDeal: async (dealId: string) => {
    const { data } = await api.post(`/group-deals/${dealId}/finalize`);
    return data;
  },

  listGroupDeals: async (params?: { status?: 'active' | 'completed' | 'expired'; page?: number; limit?: number }) => {
    const { data } = await api.get('/group-deals', { params });
    return data;
  },

  getGroupDealById: async (dealId: string) => {
    const { data } = await api.get(`/group-deals/${dealId}`);
    return data;
  },

  // Legacy compatibility
  getGroupDeals: async () => {
    const response = await realGroupDealsAPI.listGroupDeals({ status: 'active' });
    return response.data || [];
  },
};

export const groupDealsAPI = USE_MOCK_API ? mockGroupDealsAPI : realGroupDealsAPI;

// ============================================================================
// AUCTIONS API
// ============================================================================

export const auctionsAPI = {
  createAuction: async (data: {
    walletAddress: string;
    couponId: string;
    title: string;
    description?: string;
    category?: string;
    startingPrice: number;
    reservePrice?: number;
    buyNowPrice?: number;
    durationDays: number;
    extendOnBid?: boolean;
    extensionTime?: number;
  }) => {
    const { data: response } = await api.post('/auctions', data);
    return response;
  },

  placeBid: async (auctionId: string, walletAddress: string, amount: number) => {
    const { data } = await api.post(`/auctions/${auctionId}/bid`, { walletAddress, amount });
    return data;
  },

  settleAuction: async (auctionId: string, walletAddress: string) => {
    const { data } = await api.post(`/auctions/${auctionId}/settle`, { walletAddress });
    return data;
  },

  listAuctions: async (params?: { status?: 'active' | 'completed' | 'cancelled'; page?: number; limit?: number }) => {
    const { data } = await api.get('/auctions', { params });
    // Transform response to match useListData expectations
    if (data.success && data.data) {
      return {
        items: data.data.auctions || [],
        total: data.pagination?.total || 0,
      };
    }
    return { items: [], total: 0 };
  },

  getAuctionById: async (auctionId: string) => {
    const { data } = await api.get(`/auctions/${auctionId}`);
    return data;
  },

  // Alias for getAuctionById
  getAuction: async (auctionId: string) => {
    return auctionsAPI.getAuctionById(auctionId);
  },
};

// ============================================================================
// BADGES API
// ============================================================================

export const badgesAPI = {
  getBadgeTypes: async () => {
    const { data } = await api.get('/badges/types');
    return data;
  },

  mintBadge: async (walletAddress: string, badgeType: string) => {
    const { data } = await api.post('/badges/mint', { walletAddress, badgeType });
    return data;
  },

  autoAwardBadge: async (walletAddress: string) => {
    const { data } = await api.post('/badges/auto-award', { walletAddress });
    return data;
  },

  getUserBadges: async (userAddress: string) => {
    const { data } = await api.get(`/badges/user/${userAddress}`);
    return data;
  },

  checkBadgeEligibility: async (userAddress: string) => {
    const { data } = await api.get(`/badges/check-eligibility/${userAddress}`);
    return data;
  },
};

// ============================================================================
// STAKING API
// ============================================================================

export const stakingAPI = {
  stakeCoupon: async (walletAddress: string, couponId: string, durationDays: number) => {
    const { data } = await api.post('/staking/stake', { walletAddress, couponId, durationDays });
    return data;
  },

  claimRewards: async (walletAddress: string, stakeAccountAddress: string) => {
    const { data } = await api.post('/staking/claim', { walletAddress, stakeAccountAddress });
    return data;
  },

  getUserStakes: async (userAddress: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/staking/user/${userAddress}`, { params });
    return data;
  },

  getCouponStake: async (couponId: string) => {
    const { data } = await api.get(`/staking/coupon/${couponId}`);
    return data;
  },

  getStakingPool: async () => {
    const { data } = await api.get('/staking/pool');
    return data;
  },
};

// ============================================================================
// COMMENTS & RATINGS API
// ============================================================================

export const commentsAPI = {
  listComments: async (promotionId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await api.get(`/promotions/${promotionId}/comments`, { params });
    return data;
  },

  createComment: async (promotionId: string, content: string, walletAddress: string) => {
    const { data } = await api.post(
      `/promotions/${promotionId}/comments`,
      { content },
      { headers: { 'X-Wallet-Address': walletAddress } }
    );
    return data;
  },

  likeComment: async (commentId: string, walletAddress: string) => {
    const { data } = await api.post(`/comments/${commentId}/like`, null, {
      headers: { 'X-Wallet-Address': walletAddress },
    });
    return data;
  },

  deleteComment: async (commentId: string) => {
    const { data } = await api.delete(`/comments/${commentId}`);
    return data;
  },
};

export const ratingsAPI = {
  listRatings: async (promotionId: string) => {
    const { data } = await api.get(`/promotions/${promotionId}/ratings`);
    return data;
  },

  createOrUpdateRating: async (promotionId: string, stars: number, walletAddress: string) => {
    const { data } = await api.post(
      `/promotions/${promotionId}/ratings`,
      { stars },
      { headers: { 'X-Wallet-Address': walletAddress } }
    );
    return data;
  },

  getRatingStats: async (promotionId: string) => {
    const { data } = await api.get(`/promotions/${promotionId}/ratings/stats`);
    return data;
  },
};

// ============================================================================
// EXTERNAL DEALS API
// ============================================================================

export const externalDealsAPI = {
  syncFlightDeals: async () => {
    const { data } = await api.post('/external/sync-flights');
    return data;
  },

  syncHotelDeals: async () => {
    const { data } = await api.post('/external/sync-hotels');
    return data;
  },

  getExternalDeals: async () => {
    const { data } = await api.get('/external/deals');
    return data;
  },

  listExternalDeals: async (params?: { page?: number; limit?: number; source?: string; category?: string }) => {
    const { data } = await api.get('/external-deals', { params });
    return data;
  },

  getExternalDealById: async (dealId: string) => {
    const { data } = await api.get(`/external-deals/${dealId}`);
    return data;
  },

  createExternalDeal: async (dealData: any) => {
    const { data } = await api.post('/external-deals', dealData);
    return data;
  },

  updateExternalDeal: async (dealId: string, updates: any) => {
    const { data } = await api.patch(`/external-deals/${dealId}`, updates);
    return data;
  },
};

// ============================================================================
// FILE UPLOAD API
// ============================================================================

export const uploadAPI = {
  uploadImage: async (type: 'promotions' | 'merchants' | 'users' | 'badges', file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post(`/upload/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteImage: async (type: 'promotions' | 'merchants' | 'users' | 'badges', filename: string) => {
    const { data } = await api.delete(`/upload/${type}/${filename}`);
    return data;
  },
};

// ============================================================================
// LEGACY COMPATIBILITY (for existing code)
// ============================================================================

export const dealsAPI = {
  getDeals: async (params?: any) => {
    const response = await (USE_MOCK_API ? mockDealsAPI : realPromotionsAPI).getDeals(params);
    return response;
  },
  getDealById: async (id: string) => {
    const response = await (USE_MOCK_API ? mockDealsAPI : realPromotionsAPI).getPromotionById(id);
    return response.data || response;
  },
  searchDeals: async (query: string) => {
    const response = await (USE_MOCK_API ? mockDealsAPI : realPromotionsAPI).searchDeals(query);
    return response;
  },
  getNearbyDeals: async (lat: number, lng: number, radius: number = 10) => {
    const response = await (USE_MOCK_API ? mockDealsAPI : realPromotionsAPI).getNearbyDeals(lat, lng, radius);
    return response;
  },
  claimDeal: async (dealId: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return (USE_MOCK_API ? mockNftAPI : realCouponsAPI).mintCoupon(walletAddress, dealId);
  },
  rateDeal: async (dealId: string, rating: number, comment?: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    if (comment) {
      await commentsAPI.createComment(dealId, comment, walletAddress);
    }
    return ratingsAPI.createOrUpdateRating(dealId, rating, walletAddress);
  },
};

export const nftAPI = {
  getUserNFTs: async () => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    const response = await (USE_MOCK_API ? mockNftAPI : realCouponsAPI).getMyCoupons(walletAddress);
    return response.data || response;
  },
  getNFTById: async (id: string) => {
    const response = await (USE_MOCK_API ? mockNftAPI : realCouponsAPI).getCouponById(id);
    return response.data || response;
  },
  transferNFT: async (nftId: string, toAddress: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return (USE_MOCK_API ? mockNftAPI : realCouponsAPI).transferCoupon(walletAddress, nftId, toAddress);
  },
  redeemNFT: async (nftId: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return redemptionAPI.generateTicket(walletAddress, nftId);
  },
  generateRedemptionQR: async (nftId: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Wallet not connected');
    return redemptionAPI.generateQR(walletAddress, nftId);
  },
};

export const merchantAPI = {
  createDeal: async (dealData: any) => {
    const walletAddress = localStorage.getItem('walletAddress');
    const email = localStorage.getItem('merchantEmail');
    if (!walletAddress || !email) throw new Error('Merchant not authenticated');
    
    return (USE_MOCK_API ? mockDealsAPI : realPromotionsAPI).createPromotion({
      walletAddress,
      email,
      title: dealData.title,
      description: dealData.description,
      discountPercentage: dealData.discount,
      price: dealData.price,
      category: dealData.category,
      maxSupply: dealData.maxRedemptions || 1000,
      expiryTimestamp: dealData.expiresAt,
      imageUrl: dealData.imageUrl,
    });
  },
  getMerchantDeals: async (merchantAddress?: string) => {
    const address = merchantAddress || localStorage.getItem('walletAddress');
    if (!address) throw new Error('Merchant not authenticated');
    const { data } = await api.get(`/merchant-dashboard/${address}/deals`);
    return data;
  },
  getDealAnalytics: async (dealId: string) => {
    return (USE_MOCK_API ? mockDealsAPI : realPromotionsAPI).getPromotionById(dealId);
  },
  revokeDeal: async (dealId: string) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Merchant not authenticated');
    return (USE_MOCK_API ? mockDealsAPI : realPromotionsAPI).deletePromotion(dealId, walletAddress);
  },
  completeOnboarding: async (data: any) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) throw new Error('Merchant not authenticated');
    // For now, just update local storage; in production this would update backend
    localStorage.setItem('merchantProfile', JSON.stringify(data));
    return { success: true, data };
  },
};
