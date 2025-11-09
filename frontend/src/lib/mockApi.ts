import { Promotion, Coupon, User, Merchant, MarketplaceListing, GroupDeal } from './api';
import { mockDeals, mockNFTs, mockUsers, mockMerchants, mockListings, mockGroupDeals, delay } from './mockData';

// Mock Auth APIs
export const mockAuthAPI = {
  registerUser: async (data: { username: string; email: string }) => {
    await delay();
    const newUser: User = {
      ...mockUsers[0],
      id: 'user-' + Date.now(),
      walletAddress: '0x' + Math.random().toString(36).substring(7),
      email: data.email,
      username: data.username,
      name: data.username,
    };
    return { success: true, data: { user: newUser } };
  },

  registerMerchant: async (data: any) => {
    await delay();
    const newMerchant: Merchant = {
      id: 'merchant-' + Date.now(),
      email: data.email,
      walletAddress: '0x' + Math.random().toString(36).substring(7),
      name: data.name,
      category: data.category,
      description: data.description,
      location: data.location,
      totalCouponsCreated: 0,
      totalCouponsRedeemed: 0,
      isActive: true,
      averageRating: 0,
      totalRatings: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: { merchant: newMerchant } };
  },

  getUserByWallet: async (walletAddress: string) => {
    await delay();
    const user = mockUsers.find(u => u.walletAddress === walletAddress || u.address === walletAddress);
    if (user) {
      return { success: true, data: user };
    }
    throw new Error('User not found');
  },

  getMerchantByWallet: async (walletAddress: string) => {
    await delay();
    const merchant = mockMerchants.find(m => m.walletAddress === walletAddress);
    if (merchant) {
      return { success: true, data: merchant };
    }
    throw new Error('Merchant not found');
  },


  connectWallet: async (signature: string, message: string) => {
    await delay();
    const token = 'mock-jwt-token-' + Date.now();
    const user = mockUsers[0];
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },
  
  loginEmail: async (email: string, password: string) => {
    await delay();
    const token = 'mock-jwt-token-' + Date.now();
    
    // Check if email matches a merchant or user
    let user = mockUsers.find(u => u.email === email);
    
    // If no exact match, determine role from email pattern
    if (!user) {
      // Check if it's a merchant email pattern
      const isMerchantEmail = email.includes('merchant') || email.includes('business') || email.includes('store');
      user = mockUsers.find(u => u.role === (isMerchantEmail ? 'merchant' : 'user'));
      
      // Fallback to first user if still not found
      if (!user) {
        user = mockUsers[0];
      }
    }
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
  },
  
  logout: async () => {
    await delay();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return { success: true };
  },
  
  getCurrentUser: async (): Promise<User> => {
    await delay();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    throw new Error('Not authenticated');
  },
};

// Mock Deals APIs
export const mockDealsAPI = {
  listPromotions: async (params?: any) => {
    await delay();
    let filteredDeals = [...mockDeals];
    
    if (params?.category) {
      filteredDeals = filteredDeals.filter(d => d.category === params.category);
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filteredDeals.slice(start, end),
      total: filteredDeals.length,
      page,
    };
  },

  getPromotionById: async (id: string) => {
    await delay();
    const deal = mockDeals.find(d => d.id === id);
    if (!deal) throw new Error('Promotion not found');
    return { data: deal };
  },

  createPromotion: async (data: any) => {
    await delay();
    const merchantData = mockMerchants[0];
    const newDeal: Promotion = {
      _id: 'deal-' + Date.now(),
      id: 'deal-' + Date.now(),
      onChainAddress: '0xpromo' + Date.now(),
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
      discountPercentage: data.discountPercentage,
      discount: data.discountPercentage,
      category: data.category,
      merchant: merchantData,
      price: data.price,
      maxSupply: data.maxSupply || 100,
      currentSupply: 0,
      expiryTimestamp: data.expiryTimestamp || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: data.expiryTimestamp || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      stats: {
        totalMinted: 0,
        totalRedeemed: 0,
        averageRating: 0,
        totalRatings: 0,
        totalComments: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDeals.push(newDeal);
    return { data: newDeal };
  },

  deletePromotion: async (promotionId: string, walletAddress: string) => {
    await delay();
    return { success: true };
  },


  getDeals: async (params?: {
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) => {
    await delay();
    let filteredDeals = [...mockDeals];
    
    if (params?.category) {
      filteredDeals = filteredDeals.filter(d => d.category === params.category);
    }
    
    if (params?.sortBy === 'trending') {
      filteredDeals = filteredDeals.slice(0, params?.limit || 5);
    }
    
    const page = params?.page || 1;
    const limit = params?.limit || 12;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      deals: filteredDeals.slice(start, end),
      total: filteredDeals.length,
      page,
    };
  },
  
  getDealById: async (id: string): Promise<Promotion> => {
    await delay();
    const deal = mockDeals.find(d => d.id === id);
    if (!deal) throw new Error('Deal not found');
    return deal;
  },
  
  searchDeals: async (query: string) => {
    await delay();
    const results = mockDeals.filter(d => 
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.description.toLowerCase().includes(query.toLowerCase())
    );
    return { deals: results, total: results.length };
  },
  
  getNearbyDeals: async (lat: number, lng: number, radius: number = 10) => {
    await delay();
    // Mock: return random subset
    return { deals: mockDeals.slice(0, 3) || [], total: mockDeals.slice(0, 3).length };
  },
  
  claimDeal: async (dealId: string) => {
    await delay();
    const deal = mockDeals.find(d => d.id === dealId);
    if (!deal) throw new Error('Deal not found');
    
    const newNFT: Coupon = {
      _id: 'nft-' + Date.now(),
      id: 'nft-' + Date.now(),
      onChainAddress: '0xmock' + Date.now(),
      couponId: 1000 + mockNFTs.length,
      tokenId: String(1000 + mockNFTs.length),
      nftMint: '0xmint' + Date.now(),
      promotion: deal,
      dealId,
      deal,
      owner: mockUsers[0].address || mockUsers[0].id,
      merchant: typeof deal.merchant === 'string' ? deal.merchant : deal.merchant.id,
      discountPercentage: deal.discountPercentage,
      expiryTimestamp: deal.expiryTimestamp,
      isRedeemed: false,
      isListed: false,
      purchasedAt: new Date().toISOString(),
      transferHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockNFTs.push(newNFT);
    return { nft: newNFT, transactionHash: '0xmock...' };
  },
  
  rateDeal: async (dealId: string, rating: number, comment?: string) => {
    await delay();
    return { success: true, rating, comment };
  },
};

// Mock NFT APIs
export const mockNftAPI = {
  mintCoupon: async (walletAddress: string, promotionId: string) => {
    await delay();
    const deal = mockDeals.find(d => d.id === promotionId);
    if (!deal) throw new Error('Promotion not found');
    
    const newNFT: Coupon = {
      _id: 'nft-' + Date.now(),
      id: 'nft-' + Date.now(),
      onChainAddress: '0xmock' + Date.now(),
      couponId: 1000 + mockNFTs.length,
      tokenId: String(1000 + mockNFTs.length),
      nftMint: '0xmint' + Date.now(),
      promotion: deal,
      dealId: promotionId,
      deal,
      owner: walletAddress,
      merchant: typeof deal.merchant === 'string' ? deal.merchant : deal.merchant.id,
      discountPercentage: deal.discountPercentage,
      expiryTimestamp: deal.expiryTimestamp,
      isRedeemed: false,
      isListed: false,
      purchasedAt: new Date().toISOString(),
      transferHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockNFTs.push(newNFT);
    return { data: newNFT };
  },

  getMyCoupons: async (walletAddress: string) => {
    await delay();
    const coupons = mockNFTs.filter(nft => nft.owner === walletAddress);
    return { data: coupons };
  },

  getCouponById: async (couponId: string) => {
    await delay();
    const coupon = mockNFTs.find(n => n.id === couponId);
    if (!coupon) throw new Error('Coupon not found');
    return { data: coupon };
  },

  transferCoupon: async (walletAddress: string, couponId: string, recipientAddress: string) => {
    await delay();
    const nft = mockNFTs.find(n => n.id === couponId);
    if (!nft) throw new Error('Coupon not found');
    nft.owner = recipientAddress;
    return { success: true, transactionHash: '0xmock...' };
  },

  getUserNFTs: async (): Promise<Coupon[]> => {
    await delay();
    return mockNFTs.filter(nft => nft.owner === mockUsers[0].address || nft.owner === mockUsers[0].id);
  },
  
  getNFTById: async (id: string): Promise<Coupon> => {
    await delay();
    const nft = mockNFTs.find(n => n.id === id);
    if (!nft) throw new Error('NFT not found');
    return nft;
  },
  
  transferNFT: async (nftId: string, toAddress: string) => {
    await delay();
    const nft = mockNFTs.find(n => n.id === nftId);
    if (!nft) throw new Error('NFT not found');
    nft.owner = toAddress;
    return { success: true, transactionHash: '0xmock...' };
  },
  
  redeemNFT: async (nftId: string) => {
    await delay();
    const nft = mockNFTs.find(n => n.id === nftId);
    if (!nft) throw new Error('NFT not found');
    nft.isRedeemed = true;
    nft.redeemedAt = new Date().toISOString();
    return { success: true, redemptionCode: 'REDEEM-' + Date.now() };
  },
  
  generateRedemptionQR: async (nftId: string) => {
    await delay();
    return { 
      qrData: `dealchain://redeem/${nftId}`,
      redemptionCode: 'QR-' + nftId.toUpperCase(),
    };
  },
};

// Mock Marketplace APIs
export const mockMarketplaceAPI = {
  getListings: async (params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) => {
    await delay();
    let filteredListings = [...mockListings];
    
    if (params?.category) {
      filteredListings = filteredListings.filter(l => l.nft?.deal?.category === params.category);
    }
    
    if (params?.minPrice) {
      filteredListings = filteredListings.filter(l => l.price >= params.minPrice!);
    }
    
    if (params?.maxPrice) {
      filteredListings = filteredListings.filter(l => l.price <= params.maxPrice!);
    }
    
    return {
      listings: filteredListings,
      total: filteredListings.length,
    };
  },
  
  listNFT: async (nftId: string, price: number) => {
    await delay();
    const nft = mockNFTs.find(n => n.id === nftId);
    if (!nft) throw new Error('NFT not found');
    
    nft.isListed = true;
    nft.resalePrice = price;
    
    const listing: MarketplaceListing = {
      _id: 'listing-' + Date.now(),
      id: 'listing-' + Date.now(),
      onChainAddress: '0xlisting' + Date.now(),
      coupon: nft,
      nft,
      seller: mockUsers[0],
      price,
      currency: 'USD',
      listedAt: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    mockListings.push(listing);
    return { listing };
  },
  
  unlistNFT: async (listingId: string) => {
    await delay();
    const index = mockListings.findIndex(l => l.id === listingId);
    if (index === -1) throw new Error('Listing not found');
    
    const listing = mockListings[index];
    if (listing.nft) {
      listing.nft.isListed = false;
      listing.nft.resalePrice = undefined;
    }
    mockListings.splice(index, 1);
    
    return { success: true };
  },
  
  buyNFT: async (listingId: string) => {
    await delay();
    const listing = mockListings.find(l => l.id === listingId);
    if (!listing) throw new Error('Listing not found');
    
    if (listing.nft) {
      listing.nft.owner = mockUsers[0].address || mockUsers[0].id;
      listing.nft.isListed = false;
    }
    
    return { success: true, transactionHash: '0xmock...' };
  },
};

// Mock Merchant APIs
export const mockMerchantAPI = {
  createDeal: async (dealData: any) => {
    await delay();
    const merchantData = mockUsers.find(u => u.role === 'merchant');
    const newDeal: Promotion = {
      _id: 'deal-' + Date.now(),
      id: 'deal-' + Date.now(),
      onChainAddress: '0xpromo' + Date.now(),
      title: dealData.title,
      description: dealData.description,
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
      discountPercentage: dealData.discount,
      discount: dealData.discount,
      category: dealData.category,
      merchant: merchantData?.id || mockUsers[0].id,
      price: dealData.price,
      originalPrice: dealData.originalPrice,
      maxSupply: dealData.maxRedemptions || 100,
      currentSupply: 0,
      currency: 'USD',
      expiryTimestamp: dealData.expiresAt,
      expiresAt: dealData.expiresAt,
      location: dealData.location,
      isActive: true,
      stats: {
        totalMinted: 0,
        totalRedeemed: 0,
        averageRating: 0,
        totalRatings: 0,
        totalComments: 0,
      },
      redemptionCount: 0,
      maxRedemptions: dealData.maxRedemptions,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockDeals.push(newDeal);
    return { deal: newDeal };
  },
  
  getMerchantDeals: async () => {
    await delay();
    return mockDeals.slice(0, 3);
  },
  
  getDealAnalytics: async (dealId: string) => {
    await delay();
    return {
      views: 1234,
      claims: 45,
      redemptions: 32,
      revenue: 15600,
      conversionRate: 3.6,
    };
  },
  
  revokeDeal: async (dealId: string) => {
    await delay();
    return { success: true };
  },
};

// Mock Group Deals APIs
export const mockGroupDealsAPI = {
  getGroupDeals: async () => {
    await delay();
    return mockGroupDeals;
  },
  
  joinGroupDeal: async (groupDealId: string) => {
    await delay();
    const groupDeal = mockGroupDeals.find(g => g.id === groupDealId);
    if (!groupDeal) throw new Error('Group deal not found');
    
    groupDeal.currentParticipants += 1;
    return { success: true, groupDeal };
  },
};

// Mock Social APIs
export const mockSocialAPI = {
  shareDeal: async (dealId: string, platform: string) => {
    await delay();
    return { success: true, shareUrl: `https://dealchain.example.com/deals/${dealId}` };
  },
  
  getComments: async (dealId: string) => {
    await delay();
    return [
      {
        id: '1',
        user: mockUsers[0],
        comment: 'Amazing deal! Just booked my flight.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        user: { name: 'Sarah Johnson', avatar: '/placeholder-avatar.png' },
        comment: 'Great value! Highly recommend.',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
    ];
  },
  
  addComment: async (dealId: string, comment: string) => {
    await delay();
    return {
      id: 'comment-' + Date.now(),
      user: mockUsers[0],
      comment,
      createdAt: new Date().toISOString(),
    };
  },
};
