import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

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

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  _id: string;
  merchantId: string;
  merchant?: Merchant;
  title: string;
  description: string;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
  category: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  maxSupply: number;
  currentSupply: number;
  isActive: boolean;
  promotionAccount: string;
  transactionSignature?: string;
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

// Auth API
export const authAPI = {
  registerUser: async (data: { username: string; email: string }) => {
    const response = await api.post('/auth/register/user', data);
    return response.data;
  },
  
  registerMerchant: async (data: { 
    name: string;
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
  
  getDetails: async (promotionId: string) => {
    const response = await api.get(`/promotions/${promotionId}`);
    return response.data;
  },
  
  create: async (data: {
    walletAddress: string;
    title: string;
    description: string;
    discountPercentage: number;
    price: number;
    category: string;
    maxSupply: number;
    expiryDays: number;
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
    const response = await api.post('/promotions/comment', data);
    return response.data;
  },
};

// Coupons API
export const couponsAPI = {
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
  
  approveTicket: async (data: {
    merchantWalletAddress: string;
    ticketAccount: string;
  }) => {
    const response = await api.post('/redemption/approve', data);
    return response.data;
  },
  
  rejectTicket: async (data: {
    merchantWalletAddress: string;
    ticketAccount: string;
  }) => {
    const response = await api.post('/redemption/reject', data);
    return response.data;
  },
  
  getMyTickets: async (userWalletAddress: string) => {
    const response = await api.get('/redemption/my-tickets', {
      params: { userWalletAddress },
    });
    return response.data;
  },
  
  getMerchantTickets: async (merchantWalletAddress: string, status?: string) => {
    const response = await api.get('/redemption/merchant-tickets', {
      params: { merchantWalletAddress, status },
    });
    return response.data;
  },
};

// Merchants API
export const merchantsAPI = {
  list: async (params?: { 
    category?: string;
    verified?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/merchants', { params });
    return response.data;
  },
  
  getProfile: async (merchantId: string) => {
    const response = await api.get(`/merchants/${merchantId}`);
    return response.data;
  },
};

// Marketplace API
export const marketplaceAPI = {
  listForSale: async (data: {
    couponId: string;
    price: number;
    walletAddress: string;
  }) => {
    const response = await api.post('/marketplace/list', data);
    return response.data;
  },
  
  buy: async (data: {
    listingId: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/marketplace/buy', data);
    return response.data;
  },
  
  getListings: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/marketplace/listings', { params });
    return response.data;
  },
  
  cancelListing: async (data: {
    listingId: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/marketplace/cancel', data);
    return response.data;
  },
};

// External Deals API
export const externalDealsAPI = {
  searchFlights: async (params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults?: number;
  }) => {
    const response = await api.get('/external/flights', { params });
    return response.data;
  },
  
  searchHotels: async (params: {
    city: string;
    checkIn: string;
    checkOut: string;
    adults?: number;
  }) => {
    const response = await api.get('/external/hotels', { params });
    return response.data;
  },
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Auctions API
export const auctionsAPI = {
  create: async (data: {
    couponId: string;
    title: string;
    description: string;
    category: string;
    startingPrice: number;
    reservePrice?: number;
    buyNowPrice?: number;
    durationDays: number;
    extendOnBid?: boolean;
    extensionTime?: number;
    walletAddress: string;
  }) => {
    const response = await api.post('/auctions/create', data);
    return response.data;
  },
  
  placeBid: async (auctionId: string, data: {
    amount: number;
    walletAddress: string;
  }) => {
    const response = await api.post(`/auctions/${auctionId}/bid`, data);
    return response.data;
  },
  
  settle: async (auctionId: string, data: {
    walletAddress: string;
  }) => {
    const response = await api.post(`/auctions/${auctionId}/settle`, data);
    return response.data;
  },
  
  list: async (params?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/auctions', { params });
    return response.data;
  },
  
  getDetails: async (auctionId: string) => {
    const response = await api.get(`/auctions/${auctionId}`);
    return response.data;
  },
};

// Group Deals API
export const groupDealsAPI = {
  create: async (data: {
    promotionId: string;
    title: string;
    description: string;
    category: string;
    tiers: Array<{
      minParticipants: number;
      discountPercentage: number;
      pricePerUnit: number;
    }>;
    targetParticipants: number;
    maxParticipants: number;
    durationDays: number;
    walletAddress: string;
  }) => {
    const response = await api.post('/group-deals/create', data);
    return response.data;
  },
  
  join: async (dealId: string, data: {
    quantity: number;
    walletAddress: string;
  }) => {
    const response = await api.post(`/group-deals/${dealId}/join`, data);
    return response.data;
  },
  
  finalize: async (dealId: string, data: {
    walletAddress: string;
  }) => {
    const response = await api.post(`/group-deals/${dealId}/finalize`, data);
    return response.data;
  },
  
  list: async (params?: {
    status?: string;
    category?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/group-deals', { params });
    return response.data;
  },
  
  getDetails: async (dealId: string) => {
    const response = await api.get(`/group-deals/${dealId}`);
    return response.data;
  },
};

// Redemption Tickets API
export const redemptionTicketsAPI = {
  generate: async (data: {
    couponId: string;
    walletAddress: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const response = await api.post('/redemption-tickets/generate', data);
    return response.data;
  },
  
  verifyAndRedeem: async (data: {
    ticketId: string;
    ticketHash: string;
    walletAddress: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const response = await api.post('/redemption-tickets/verify-and-redeem', data);
    return response.data;
  },
  
  cancel: async (ticketId: string, data: {
    walletAddress: string;
  }) => {
    const response = await api.post(`/redemption-tickets/${ticketId}/cancel`, data);
    return response.data;
  },
  
  getUserTickets: async (userAddress: string, params?: {
    status?: string;
  }) => {
    const response = await api.get(`/redemption-tickets/user/${userAddress}`, { params });
    return response.data;
  },
  
  getMerchantTickets: async (merchantAddress: string, params?: {
    status?: string;
  }) => {
    const response = await api.get(`/redemption-tickets/merchant/${merchantAddress}`, { params });
    return response.data;
  },
};

// Social API
export const socialAPI = {
  trackShare: async (data: {
    itemId: string;
    itemType: string;
    platform: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/social/share', data);
    return response.data;
  },
  
  trackView: async (data: {
    itemId: string;
    itemType: string;
  }) => {
    const response = await api.post('/social/view', data);
    return response.data;
  },
  
  getTrending: async (params?: {
    category?: string;
    timeframe?: string;
    limit?: number;
  }) => {
    const response = await api.get('/social/trending', { params });
    return response.data;
  },
  
  getPopular: async (params?: {
    category?: string;
    limit?: number;
  }) => {
    const response = await api.get('/social/popular', { params });
    return response.data;
  },
  
  rate: async (data: {
    couponId: string;
    rating: number;
    review?: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/social/rate', data);
    return response.data;
  },
  
  getFeed: async (params?: {
    category?: string;
    limit?: number;
  }) => {
    const response = await api.get('/social/feed', { params });
    return response.data;
  },
};

// Merchant Dashboard API
export const merchantDashboardAPI = {
  getAnalytics: async (merchantAddress: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get(`/merchant-dashboard/${merchantAddress}/analytics`, { params });
    return response.data;
  },
  
  getRecentActivity: async (merchantAddress: string, params?: {
    limit?: number;
  }) => {
    const response = await api.get(`/merchant-dashboard/${merchantAddress}/recent-activity`, { params });
    return response.data;
  },
};

// User Stats API
export const userStatsAPI = {
  getStats: async (userAddress: string) => {
    const response = await api.get(`/user-stats/${userAddress}`);
    return response.data;
  },
};

// Badges API
export const badgesAPI = {
  getUserBadges: async (userAddress: string) => {
    const response = await api.get(`/badges/user/${userAddress}`);
    return response.data;
  },
};

// Staking API
export const stakingAPI = {
  stake: async (data: {
    couponId: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/staking/stake', data);
    return response.data;
  },
  
  unstake: async (data: {
    couponId: string;
    walletAddress: string;
  }) => {
    const response = await api.post('/staking/unstake', data);
    return response.data;
  },
  
  claimRewards: async (data: {
    walletAddress: string;
  }) => {
    const response = await api.post('/staking/claim-rewards', data);
    return response.data;
  },
  
  getStakingInfo: async (userAddress: string) => {
    const response = await api.get(`/staking/${userAddress}`);
    return response.data;
  },
};

export default api;
