import mongoose, { Schema, Document } from 'mongoose';

/**
 * NFT Metadata following Metaplex Token Metadata Standard
 * https://docs.metaplex.com/programs/token-metadata/token-standard
 */

export interface INFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
}

export interface INFTMetadata extends Document {
  // Metaplex Standard Fields
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  
  // Attributes (traits)
  attributes: INFTAttribute[];
  
  // Coupon-specific metadata
  couponData: {
    discountPercentage: number;
    discountType: 'percentage' | 'fixed' | 'bogo' | 'bundle';
    originalPrice?: number;
    discountedPrice?: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    category: string;
    subcategory?: string;
    merchantId: string;
    merchantName: string;
    promotionId: string;
    expiryTimestamp: number;
    termsAndConditions: string[];
    redemptionInstructions: string;
    isTransferable: boolean;
    maxRedemptionsPerUser?: number;
  };
  
  // Location data
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
    radius?: number; // meters
  };
  
  // Verification & Security
  verification: {
    isVerified: boolean;
    verifiedBy?: string;
    verificationDate?: Date;
    securityHash: string;
  };
  
  // Marketplace data
  marketplace?: {
    isListed: boolean;
    listingPrice?: number;
    floorPrice?: number;
    lastSalePrice?: number;
    totalSales: number;
  };
  
  // Social proof
  social?: {
    totalViews: number;
    totalShares: number;
    totalRedemptions: number;
    averageRating: number;
    totalRatings: number;
  };
  
  // On-chain references
  onChain: {
    mint: string;
    couponPDA: string;
    metadataPDA: string;
    updateAuthority: string;
    isMutable: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const NFTMetadataSchema = new Schema<INFTMetadata>(
  {
    name: {
      type: String,
      required: true,
      maxlength: 32,
    },
    symbol: {
      type: String,
      required: true,
      maxlength: 10,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    image: {
      type: String,
      required: true,
    },
    external_url: String,
    animation_url: String,
    
    attributes: [
      {
        trait_type: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
        display_type: String,
      },
    ],
    
    couponData: {
      discountPercentage: { type: Number, required: true, min: 0, max: 100 },
      discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'bogo', 'bundle'],
        default: 'percentage',
      },
      originalPrice: Number,
      discountedPrice: Number,
      minPurchaseAmount: Number,
      maxDiscountAmount: Number,
      category: { type: String, required: true, index: true },
      subcategory: String,
      merchantId: { type: String, required: true, index: true },
      merchantName: { type: String, required: true },
      promotionId: { type: String, required: true, index: true },
      expiryTimestamp: { type: Number, required: true, index: true },
      termsAndConditions: [String],
      redemptionInstructions: { type: String, required: true },
      isTransferable: { type: Boolean, default: true },
      maxRedemptionsPerUser: Number,
    },
    
    location: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      address: String,
      city: String,
      country: String,
      radius: Number,
    },
    
    verification: {
      isVerified: { type: Boolean, default: false },
      verifiedBy: String,
      verificationDate: Date,
      securityHash: { type: String, required: true },
    },
    
    marketplace: {
      isListed: { type: Boolean, default: false, index: true },
      listingPrice: Number,
      floorPrice: Number,
      lastSalePrice: Number,
      totalSales: { type: Number, default: 0 },
    },
    
    social: {
      totalViews: { type: Number, default: 0 },
      totalShares: { type: Number, default: 0 },
      totalRedemptions: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
    },
    
    onChain: {
      mint: { type: String, required: true, unique: true, index: true },
      couponPDA: { type: String, required: true, unique: true, index: true },
      metadataPDA: { type: String, required: true },
      updateAuthority: { type: String, required: true },
      isMutable: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
NFTMetadataSchema.index({ 'couponData.category': 1, 'couponData.expiryTimestamp': 1 });
NFTMetadataSchema.index({ 'couponData.merchantId': 1, createdAt: -1 });
NFTMetadataSchema.index({ 'marketplace.isListed': 1, 'marketplace.listingPrice': 1 });
NFTMetadataSchema.index({ 'social.averageRating': -1, 'social.totalRatings': -1 });

export const NFTMetadata = mongoose.model<INFTMetadata>('NFTMetadata', NFTMetadataSchema);
