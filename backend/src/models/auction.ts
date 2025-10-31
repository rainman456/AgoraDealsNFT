import mongoose, { Schema, Document } from 'mongoose';

export interface IAuction extends Document {
  onChainAddress: string;
  couponAddress: string;
  sellerAddress: string;
  merchantAddress: string;
  
  // Auction configuration
  title: string;
  description: string;
  category: string;
  
  // Pricing
  startingPrice: number;
  reservePrice?: number;
  currentBid: number;
  buyNowPrice?: number;
  
  // Bidding
  bids: Array<{
    bidderAddress: string;
    amount: number;
    timestamp: Date;
    txSignature: string;
    isWinning: boolean;
  }>;
  
  totalBids: number;
  highestBidder?: string;
  
  // Timing
  startTime: Date;
  endTime: Date;
  extendOnBid: boolean;
  extensionTime?: number; // seconds
  
  // Status
  status: 'pending' | 'active' | 'ended' | 'cancelled' | 'settled';
  isActive: boolean;
  isSettled: boolean;
  
  // Settlement
  winner?: string;
  finalPrice?: number;
  settledAt?: Date;
  settlementTxSignature?: string;
  
  // Metadata
  imageUrl?: string;
  couponMetadata?: {
    discountPercentage: number;
    expiryTimestamp: Date;
    merchantName: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema = new Schema<IAuction>(
  {
    onChainAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    couponAddress: {
      type: String,
      required: true,
      index: true,
    },
    sellerAddress: {
      type: String,
      required: true,
      index: true,
    },
    merchantAddress: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    reservePrice: {
      type: Number,
      min: 0,
    },
    currentBid: {
      type: Number,
      default: 0,
      min: 0,
    },
    buyNowPrice: {
      type: Number,
      min: 0,
    },
    bids: [
      {
        bidderAddress: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
        timestamp: { type: Date, default: Date.now },
        txSignature: { type: String, required: true },
        isWinning: { type: Boolean, default: false },
      },
    ],
    totalBids: {
      type: Number,
      default: 0,
      min: 0,
    },
    highestBidder: String,
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    extendOnBid: {
      type: Boolean,
      default: true,
    },
    extensionTime: {
      type: Number,
      default: 300, // 5 minutes
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'ended', 'cancelled', 'settled'],
      default: 'pending',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
    winner: String,
    finalPrice: Number,
    settledAt: Date,
    settlementTxSignature: String,
    imageUrl: String,
    couponMetadata: {
      discountPercentage: Number,
      expiryTimestamp: Date,
      merchantName: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AuctionSchema.index({ status: 1, endTime: 1 });
AuctionSchema.index({ sellerAddress: 1, status: 1, createdAt: -1 });
AuctionSchema.index({ category: 1, isActive: 1, currentBid: 1 });
AuctionSchema.index({ 'bids.bidderAddress': 1 });
AuctionSchema.index({ isActive: 1, endTime: 1 });

export const Auction = mongoose.model<IAuction>('Auction', AuctionSchema);
