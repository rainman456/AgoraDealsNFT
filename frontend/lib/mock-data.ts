export interface Deal {
  id: string;
  title: string;
  description: string;
  discount: number;
  expiry: string;
  merchant: string;
  image: string;
  category: string;
  nftMetadata: {
    owner: string | null;
    transferable: boolean;
    redeemable: boolean;
  };
  price?: number;
  originalPrice?: number;
  likes?: number;
  comments?: number;
}

export interface Auction {
  id: string;
  title: string;
  merchant: string;
  description: string;
  image: string;
  startingBid: number;
  currentBid: number;
  bids: number;
  timeRemaining: string;
  highestBidder: string;
  auctionType: string;
  status: string;
  finalPrice?: number;
}

export const mockAuctions: Auction[] = [
  {
    id: "1",
    title: "Weekend Getaway Package",
    merchant: "Mountain Resort",
    description: "Escape to luxury with a 2-night stay at our premium mountain resort. Includes daily gourmet breakfast, access to spa facilities, guided hiking tours, and complimentary wine tasting. Perfect for couples or solo travelers seeking relaxation and adventure.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
    startingBid: 250,
    currentBid: 380,
    bids: 12,
    timeRemaining: "2:15:30",
    highestBidder: "Alex M.",
    auctionType: "English",
    status: "live",
  },
  {
    id: "2",
    title: "Premium Fitness Membership",
    merchant: "FitLife Gym",
    description: "Transform your fitness journey with our exclusive 3-month premium membership. Includes unlimited gym access, 12 personal training sessions, nutrition consultation, group fitness classes, and access to our state-of-the-art equipment and facilities.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
    startingBid: 50,
    currentBid: 85,
    bids: 8,
    timeRemaining: "5:45:20",
    highestBidder: "Jordan K.",
    auctionType: "English",
    status: "live",
  },
  {
    id: "3",
    title: "Spa Wellness Package",
    merchant: "Serenity Spa",
    description: "Indulge in ultimate relaxation with our comprehensive full-day spa experience. Features 90-minute deep tissue massage, rejuvenating facial treatment, aromatherapy session, access to sauna and steam rooms, healthy lunch, and herbal tea service.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop",
    startingBid: 100,
    currentBid: 145,
    bids: 6,
    timeRemaining: "0:45:15",
    highestBidder: "Sam P.",
    auctionType: "English",
    status: "live",
  },
  {
    id: "4",
    title: "Italian Restaurant Dinner",
    merchant: "Bella Notte",
    description: "Experience authentic Italian cuisine with our chef's special three-course tasting menu for two. Each course expertly paired with premium Italian wines. Menu includes antipasti, handmade pasta or risotto, choice of main course, and traditional tiramisu dessert.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    startingBid: 40,
    currentBid: 65,
    bids: 5,
    timeRemaining: "0:00:00",
    highestBidder: "Taylor R.",
    auctionType: "English",
    status: "ended",
    finalPrice: 65,
  },
  {
    id: "5",
    title: "Designer Watch Collection",
    merchant: "Luxury Timepieces",
    description: "Own a piece of horological excellence with this limited edition Swiss-made automatic watch. Features sapphire crystal, 42mm stainless steel case, genuine leather strap, and comes with authenticity certificate and luxury presentation box. Only 100 pieces worldwide.",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=300&fit=crop",
    startingBid: 500,
    currentBid: 720,
    bids: 15,
    timeRemaining: "1:30:45",
    highestBidder: "Chris L.",
    auctionType: "English",
    status: "live",
  },
  {
    id: "6",
    title: "Gourmet Cooking Class",
    merchant: "Chef's Academy",
    description: "Learn culinary secrets from a Michelin-starred chef in this exclusive private cooking session. Master 3 signature dishes, receive personalized instruction, enjoy wine pairings, and take home professional recipes and techniques. Includes all ingredients and equipment.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop",
    startingBid: 75,
    currentBid: 120,
    bids: 9,
    timeRemaining: "3:20:10",
    highestBidder: "Morgan T.",
    auctionType: "English",
    status: "live",
  },
];

import { Promotion } from './api';

// Legacy Deal interface for backward compatibility
export interface Deal {
  id: string;
  title: string;
  description: string;
  discount: number;
  expiry: string;
  merchant: string;
  image: string;
  category: string;
  nftMetadata: {
    owner: string | null;
    transferable: boolean;
    redeemable: boolean;
  };
  price?: number;
  originalPrice?: number;
  likes?: number;
  comments?: number;
}

// Helper function to convert Promotion to Deal for backward compatibility
export function promotionToDeal(promo: Promotion): any {
  const merchantName = promo.merchant?.businessName || promo.merchant?.name || 'Merchant';
  return {
    ...promo,
    id: promo._id,
    discount: promo.discountPercentage,
    expiry: promo.endDate,
    merchant: merchantName,
    image: promo.imageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    price: promo.discountedPrice,
    nftMetadata: {
      owner: null,
      transferable: true,
      redeemable: true,
    },
    likes: promo.ratings?.count || 0,
    comments: 0,
  };
}

export const mockDeals: Promotion[] = [
  {
    _id: "1",
    merchantId: "merchant1",
    merchant: {
      _id: "merchant1",
      name: "SkyWings Airlines",
      email: "contact@skywings.com",
      walletAddress: "0x1234567890",
      businessName: "SkyWings Airlines",
      verified: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    title: "50% Off Flight to Tokyo",
    description: "Experience Japan with round-trip premium economy flights to Tokyo. Includes priority boarding, extra legroom seating, complimentary meals and beverages, 2 checked bags, and access to airport lounges. Flexible dates available throughout the year.",
    discountPercentage: 50,
    originalPrice: 1198,
    discountedPrice: 599,
    category: "flights",
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    maxSupply: 100,
    currentSupply: 75,
    isActive: true,
    promotionAccount: "promo1",
    ratings: { average: 4.5, count: 234 },
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    _id: "2",
    merchantId: "merchant2",
    merchant: {
      _id: "merchant2",
      name: "LuxeStay Hotels",
      email: "contact@luxestay.com",
      walletAddress: "0x2234567890",
      businessName: "LuxeStay Hotels",
      verified: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    title: "40% Off Luxury Hotel Stay",
    description: "Immerse yourself in Parisian elegance with 3 nights at a prestigious 5-star hotel. All-inclusive package features deluxe room with Eiffel Tower views, daily gourmet breakfast, spa access, concierge service, and complimentary champagne upon arrival.",
    discountPercentage: 40,
    originalPrice: 1200,
    discountedPrice: 720,
    category: "hotels",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2025-11-30T23:59:59Z",
    maxSupply: 50,
    currentSupply: 30,
    isActive: true,
    promotionAccount: "promo2",
    ratings: { average: 4.8, count: 456 },
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    _id: "3",
    merchantId: "merchant3",
    merchant: {
      _id: "merchant3",
      name: "Culinary Delights",
      email: "contact@culinarydelights.com",
      walletAddress: "0x3234567890",
      businessName: "Culinary Delights",
      verified: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    title: "30% Off Michelin Star Restaurant",
    description: "Savor an unforgettable culinary journey for two at our Michelin-starred restaurant. Seven-course tasting menu featuring seasonal ingredients, expert wine pairings, amuse-bouche, and petit fours. Vegetarian and dietary accommodations available.",
    discountPercentage: 30,
    originalPrice: 200,
    discountedPrice: 140,
    category: "restaurants",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2025-10-31T23:59:59Z",
    maxSupply: 200,
    currentSupply: 150,
    isActive: true,
    promotionAccount: "promo3",
    ratings: { average: 4.9, count: 189 },
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    _id: "4",
    merchantId: "merchant4",
    merchant: {
      _id: "merchant4",
      name: "Fashion Forward",
      email: "contact@fashionforward.com",
      walletAddress: "0x4234567890",
      businessName: "Fashion Forward",
      verified: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    title: "60% Off Designer Handbag",
    description: "Elevate your style with this authentic designer handbag from the latest premium collection. Crafted from genuine Italian leather, features signature hardware, multiple compartments, adjustable strap, and comes with dust bag and authenticity card. Limited stock available.",
    discountPercentage: 60,
    originalPrice: 1200,
    discountedPrice: 480,
    category: "shopping",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=300&fit=crop",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2025-12-15T23:59:59Z",
    maxSupply: 25,
    currentSupply: 10,
    isActive: true,
    promotionAccount: "promo4",
    ratings: { average: 4.7, count: 567 },
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    _id: "5",
    merchantId: "merchant1",
    merchant: {
      _id: "merchant1",
      name: "SkyWings Airlines",
      email: "contact@skywings.com",
      walletAddress: "0x1234567890",
      businessName: "SkyWings Airlines",
      verified: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    title: "45% Off Flight to New York",
    description: "Discover the Big Apple with direct non-stop flights to New York City. Premium package includes priority check-in, complimentary lounge access with food and drinks, extra baggage allowance, preferred seating selection, and fast-track security clearance.",
    discountPercentage: 45,
    originalPrice: 600,
    discountedPrice: 330,
    category: "flights",
    imageUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2025-11-15T23:59:59Z",
    maxSupply: 150,
    currentSupply: 100,
    isActive: true,
    promotionAccount: "promo5",
    ratings: { average: 4.6, count: 312 },
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    _id: "6",
    merchantId: "merchant5",
    merchant: {
      _id: "merchant5",
      name: "Zen Wellness",
      email: "contact@zenwellness.com",
      walletAddress: "0x5234567890",
      businessName: "Zen Wellness",
      verified: true,
      createdAt: "2024-01-01T00:00:00Z",
    },
    title: "35% Off Spa & Wellness",
    description: "Rejuvenate mind and body with our comprehensive full-day wellness package. Includes 60-minute Swedish massage, revitalizing facial, body scrub, aromatherapy session, access to thermal pools and saunas, healthy lunch, and relaxation lounge with refreshments.",
    discountPercentage: 35,
    originalPrice: 200,
    discountedPrice: 130,
    category: "wellness",
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop",
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2025-10-20T23:59:59Z",
    maxSupply: 80,
    currentSupply: 60,
    isActive: true,
    promotionAccount: "promo6",
    ratings: { average: 4.8, count: 234 },
    createdAt: "2024-01-01T00:00:00Z",
  },
];
