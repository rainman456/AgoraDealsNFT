import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include wallet address if available
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  const merchant = localStorage.getItem('merchant');
  
  if (user) {
    const userData = JSON.parse(user);
    if (userData.walletAddress) {
      config.headers['X-Wallet-Address'] = userData.walletAddress;
    }
  } else if (merchant) {
    const merchantData = JSON.parse(merchant);
    if (merchantData.walletAddress) {
      config.headers['X-Wallet-Address'] = merchantData.walletAddress;
    }
  }
  
  return config;
});

// Types
export interface User {
  _id: string;
  email: string;
  name: string;
  walletAddress: string;
  role: 'user' | 'merchant';
  createdAt: string;
}

export interface Merchant {
  _id: string;
  name: string;
  email: string;
  walletAddress: string;
  businessName: string;
  description?: string;
  category?: string;
  location?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: [number, number];
  };
  verified: boolean;
  createdAt: string;
}

export interface Promotion {
  _id?: string;
  id?: string;
  onChainAddress?: string;
  merchantId?: string;
  merchant?: string | Merchant;
  title: string;
  description: string;
  discountPercentage: number;
  originalPrice?: number;
  price: number;
  discountedPrice?: number;
  category: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  expiryTimestamp?: string;
  maxSupply: number;
  currentSupply: number;
  isActive: boolean;
  promotionAccount?: string;
  transactionSignature?: string;
  stats?: {
    totalMinted: number;
    totalRedeemed: number;
    averageRating: number;
    totalRatings: number;
    totalComments: number;
  };
  ratings?: {
    average: number;
    count: number;
  };
  createdAt: string;
}

export interface Coupon {
  _id: string;
  promotionId: string;
  promotion?: Promotion;
  ownerId: string;
  owner?: User;
  couponAccount: string;
  mintAddress: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  transactionSignature?: string;
  createdAt: string;
}

export interface RedemptionTicket {
  _id: string;
  couponId: string;
  coupon?: Coupon;
  userId: string;
  user?: User;
  merchantId: string;
  merchant?: Merchant;
  ticketAccount: string;
  status: 'pending' | 'approved' | 'rejected';
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalDeal {
  _id: string;
  onChainAddress: string;
  source: string;
  externalId: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  category: string;
  imageUrl: string;
  affiliateUrl: string;
  expiryTimestamp: string;
  isVerified: boolean;
  verificationCount: number;
  createdAt: string;
}

export interface Listing {
  _id: string;
  onChainAddress: string;
  coupon: string;
  seller: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  onChainAddress: string;
  user: string;
  promotion: string;
  content: string;
  likes: number;
  isMerchantReply: boolean;
  parentComment?: string;
  createdAt: string;
}

export interface Rating {
  _id: string;
  onChainAddress: string;
  user: string;
  promotion: string;
  merchant: string;
  stars: number;
  createdAt: string;
  updatedAt: string;
}

// Auth API
export const authAPI = {
  registerUser: async (data: { username: string; email: string }) => {
    const response = await api.post('/auth/register/user', data);
    return response.data;
  },
  
  registerMerchant: async (data: { 
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
    const response = await api.post('/auth/register/merchant', data);
    return response.data;
  },
  
  getUserByWallet: async (walletAddress: string) => {
    const response = await api.get(`/auth/user/${walletAddress}`);
    return response.data;
  },
  
  getMerchantByWallet: async (walletAddress: string) => {
    const response = await api.get(`/auth/merchant/${walletAddress}`);
    return response.data;
  },
};

// Promotions API
export const promotionsAPI = {
  list: async (params?: { 
    category?: string; 
    merchantId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/promotions', { params });
    return response.data;
  },
  
  // Comments API
  getComments: async (promotionId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/promotions/${promotionId}/comments`, { params });
    return response.data;
  },
  
  createComment: async (promotionId: string, content: string) => {
    const response = await api.post(`/promotions/${promotionId}/comments`, { content });
    return response.data;
  },
  
  likeComment: async (commentId: string) => {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data;
  },
  
  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },
  
  // Ratings API
  getRatings: async (promotionId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get(`/promotions/${promotionId}/ratings`, { params });
    return response.data;
  },
  
  createRating: async (promotionId: string, stars: number) => {
    const response = await api.post(`/promotions/${promotionId}/ratings`, { stars });
    return response.data;
  },
  
  getRatingStats: async (promotionId: string) => {
    const response = await api.get(`/promotions/${promotionId}/ratings/stats`);
    return response.data;
  },
  
  getDetails: async (promotionId: string) => {
    const response = await api.get(`/promotions/${promotionId}`);
    return response.data;
  },
  
  getById: async (promotionId: string) => {
    const response = await api.get(`/promotions/${promotionId}`);
    return response.data;
  },
  
  create: async (data: {
    walletAddress?: string;
    email?: string;
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
    const response = await api.post('/promotions', data);
    return response.data;
  },
  
  rate: async (data: {
    walletAddress: string;
    promotionId: string;
    rating: number;
  }) => {
    const response = await api.post('/promotions/rate', data);
    return response.data;
  },
  
  addComment: async (data: {
    walletAddress: string;
    promotionId: string;
    comment: string;
  }) => {
    const response = await api.post('/promotions/comment', {
      walletAddress: data.walletAddress,
      promotionId: data.promotionId,
      content: data.comment
    });
    return response.data;
  },
  
  update: async (promotionId: string, data: {
    title?: string;
    description?: string;
    price?: number;
    maxSupply?: number;
  }) => {
    const response = await api.put(`/promotions/${promotionId}`, data);
    return response.data;
  },
  
  delete: async (promotionId: string) => {
    const response = await api.delete(`/promotions/${promotionId}`);
    return response.data;
  },
  
  pause: async (promotionId: string, walletAddress?: string) => {
    const response = await api.patch(`/promotions/${promotionId}/pause`, { walletAddress });
    return response.data;
  },
  
  resume: async (promotionId: string, walletAddress?: string) => {
    const response = await api.patch(`/promotions/${promotionId}/resume`, { walletAddress });
    return response.data;
  },
  
  uploadImage: async (file: File, type: string = 'promotions') => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(`/upload/${type}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  deleteImage: async (filename: string, type: string = 'promotions') => {
    const response = await api.delete(`/upload/${type}/${filename}`);
    return response.data;
  },
};

// External Deals API
export const externalDealsAPI = {
  list: async (params?: {
    category?: string;
    source?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/external-deals', { params });
    return response.data;
  },
  
  getById: async (dealId: string) => {
    const response = await api.get(`/external-deals/${dealId}`);
    return response.data;
  },
};

// Marketplace Listings API
export const listingsAPI = {
  list: async (params?: {
    seller?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/listings', { params });
    return response.data;
  },
  
  getById: async (listingId: string) => {
    const response = await api.get(`/listings/${listingId}`);
    return response.data;
  },
  
  create: async (data: {
    couponAddress: string;
    price: number;
  }) => {
    const response = await api.post('/listings', data);
    return response.data;
  },
  
  deactivate: async (listingId: string) => {
    const response = await api.patch(`/listings/${listingId}/deactivate`);
    return response.data;
  },
  
  delete: async (listingId: string) => {
    const response = await api.delete(`/listings/${listingId}`);
    return response.data;
  },
};

// Coupons API
export const couponsAPI = {
  list: async (params?: {
    userId?: string;
    promotionId?: string;
    isRedeemed?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/coupons', { params });
    return response.data;
  },
  
  mint: async (data: {
    promotionId: string;
    recipientAddress: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/coupons/mint', data);
    return response.data;
  },
  
  getMyCoupons: async (walletAddress: string) => {
    const response = await api.get(`/coupons/user/${walletAddress}`);
    return response.data;
  },
  
  getDetails: async (couponId: string) => {
    const response = await api.get(`/coupons/${couponId}`);
    return response.data;
  },
  
  transfer: async (data: {
    couponId: string;
    newOwner: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/coupons/transfer', data);
    return response.data;
  },
};

// Redemption API
export const redemptionAPI = {
  createTicket: async (data: {
    userWalletAddress: string;
    couponMint: string;
  }) => {
    const response = await api.post('/redemption/create-ticket', data);
    return response.data;
  },
  
  verifyTicket: async (data: {
    merchantWalletAddress: string;
    ticketId: string;
  }) => {
    const response = await api.post('/redemption/verify-ticket', data);
    return response.data;
  },
  
  getMyTickets: async (walletAddress: string) => {
    const response = await api.get(`/redemption/tickets/${walletAddress}`);
    return response.data;
  },
};

// Redemption Tickets API
export const redemptionTicketsAPI = {
  generate: async (data: { couponId: string; userAddress: string }) => {
    const response = await api.post('/redemption-tickets/generate', data);
    return response.data;
  },
  
  verifyAndRedeem: async (data: { ticketId: string; merchantAddress: string }) => {
    const response = await api.post('/redemption-tickets/verify-and-redeem', data);
    return response.data;
  },
  
  cancel: async (ticketId: string) => {
    const response = await api.post(`/redemption-tickets/${ticketId}/cancel`);
    return response.data;
  },
  
  getUserTickets: async (userAddress: string) => {
    const response = await api.get(`/redemption-tickets/user/${userAddress}`);
    return response.data;
  },
  
  getMerchantTickets: async (merchantAddress: string) => {
    const response = await api.get(`/redemption-tickets/merchant/${merchantAddress}`);
    return response.data;
  },
  
  listTickets: async (params?: { limit?: number; status?: string }) => {
    const user = localStorage.getItem('user');
    if (!user) {
      return { success: false, data: [] };
    }
    const userData = JSON.parse(user);
    const walletAddress = userData.walletAddress || '';
    if (!walletAddress) {
      return { success: false, data: [] };
    }
    const response = await api.get(`/redemption-tickets/user/${walletAddress}`, { params });
    return response.data;
  },
};

// Social API
export const socialAPI = {
  trackShare: async (data: { promotionId?: string; couponId?: string; platform: string }) => {
    const response = await api.post('/social/share', data);
    return response.data;
  },
  
  trackView: async (data: { promotionId?: string; couponId?: string }) => {
    const response = await api.post('/social/view', data);
    return response.data;
  },
  
  getTrending: async (params?: { limit?: number; category?: string }) => {
    const response = await api.get('/social/trending', { params });
    return response.data;
  },
  
  getPopular: async (params?: { category?: string; limit?: number }) => {
    const response = await api.get('/social/popular', { params });
    return response.data;
  },
  
  rateCoupon: async (data: { couponId: string; rating: number }) => {
    const response = await api.post('/social/rate', data);
    return response.data;
  },
  
  getFeed: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/social/feed', { params });
    return response.data;
  },
};

// Group Deals API
export const groupDealsAPI = {
  create: async (data: {
    promotionId: string;
    minParticipants: number;
    maxParticipants: number;
    discountTiers: Array<{ participants: number; discount: number }>;
    endTime: string;
  }) => {
    const response = await api.post('/group-deals/create', data);
    return response.data;
  },
  
  join: async (dealId: string, data: { userAddress: string }) => {
    const response = await api.post(`/group-deals/${dealId}/join`, data);
    return response.data;
  },
  
  finalize: async (dealId: string, data: { merchantAddress: string }) => {
    const response = await api.post(`/group-deals/${dealId}/finalize`, data);
    return response.data;
  },
  
  list: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/group-deals', { params });
    return response.data;
  },
  
  getById: async (dealId: string) => {
    const response = await api.get(`/group-deals/${dealId}`);
    return response.data;
  },
};

// User Stats API
export const userStatsAPI = {
  getUserStats: async (userAddress: string) => {
    const response = await api.get(`/user-stats/${userAddress}`);
    return response.data;
  },
  
  getLeaderboard: async (params?: { tier?: string; page?: number; limit?: number }) => {
    const response = await api.get('/user-stats/leaderboard', { params });
    return response.data;
  },
  
  getUserBadges: async (userAddress: string) => {
    const response = await api.get(`/user-stats/${userAddress}/badges`);
    return response.data;
  },
  
  getPlatformStats: async () => {
    const response = await api.get('/user-stats/stats/overview');
    return response.data;
  },
};

// Auctions API
export const auctionsAPI = {
  create: async (data: {
    couponId: string;
    startingPrice: number;
    reservePrice?: number;
    duration: number;
  }) => {
    const response = await api.post('/auctions/create', data);
    return response.data;
  },
  
  placeBid: async (auctionId: string, data: { bidAmount: number; bidderAddress: string }) => {
    const response = await api.post(`/auctions/${auctionId}/bid`, data);
    return response.data;
  },
  
  settle: async (auctionId: string, data: { settlerAddress: string }) => {
    const response = await api.post(`/auctions/${auctionId}/settle`, data);
    return response.data;
  },
  
  list: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/auctions', { params });
    return response.data;
  },
  
  getById: async (auctionId: string) => {
    const response = await api.get(`/auctions/${auctionId}`);
    return response.data;
  },
};

// Merchant Dashboard API
export const merchantDashboardAPI = {
  getAnalytics: async (merchantAddress: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await api.get(`/merchant-dashboard/${merchantAddress}/analytics`, { params });
    return response.data;
  },
  
  getRecentActivity: async (merchantAddress: string, params?: { limit?: number }) => {
    const response = await api.get(`/merchant-dashboard/${merchantAddress}/recent-activity`, { params });
    return response.data;
  },
};



// Badges API
export const badgesAPI = {
  getTypes: async () => {
    const response = await api.get('/badges/types');
    return response.data;
  },
  
  mint: async (data: { userAddress: string; badgeType: string }) => {
    const response = await api.post('/badges/mint', data);
    return response.data;
  },
  
  autoAward: async (data: { userAddress: string }) => {
    const response = await api.post('/badges/auto-award', data);
    return response.data;
  },
  
  getUserBadges: async (userAddress?: string) => {
    const endpoint = userAddress ? `/badges/user/${userAddress}` : '/badges/user';
    const response = await api.get(endpoint);
    return response.data;
  },
  
  checkEligibility: async (userAddress: string) => {
    const response = await api.get(`/badges/check-eligibility/${userAddress}`);
    return response.data;
  },
};

// Staking API
export const stakingAPI = {
  getPool: async () => {
    const response = await api.get('/staking/pool');
    return response.data;
  },
  
  stake: async (data: { couponId: string; userAddress: string; amount: number }) => {
    const response = await api.post('/staking/stake', data);
    return response.data;
  },
  
  claimRewards: async (data: { userAddress: string; couponId?: string }) => {
    const response = await api.post('/staking/claim', data);
    return response.data;
  },
  
  getUserStakes: async (userAddress: string) => {
    if (!userAddress) {
      throw new Error('User address is required');
    }
    const response = await api.get(`/staking/user/${userAddress}`);
    return response.data;
  },
  
  getCouponStake: async (couponId: string) => {
    const response = await api.get(`/staking/coupon/${couponId}`);
    return response.data;
  },
};



export default api;
