import mongoose, { Schema, Document } from 'mongoose';

export interface IGroupDeal extends Document {
  onChainAddress: string;
  promotionAddress: string;
  merchantAddress: string;
  
  // Deal configuration
  title: string;
  description: string;
  category: string;
  
  // Pricing tiers
  tiers: Array<{
    minParticipants: number;
    discountPercentage: number;
    pricePerUnit: number;
  }>;
  
  // Participation tracking
  targetParticipants: number;
  currentParticipants: number;
  maxParticipants: number;
  
  // Participant list
  participants: Array<{
    userAddress: string;
    joinedAt: Date;
    quantity: number;
    paidAmount: number;
    txSignature: string;
  }>;
  
  // Timing
  startTime: Date;
  endTime: Date;
  expiryTimestamp: Date;
  
  // Status
  status: 'pending' | 'active' | 'successful' | 'failed' | 'expired' | 'cancelled';
  isActive: boolean;
  isSuccessful: boolean;
  
  // Financial
  totalRevenue: number;
  currentTier: number;
  
  // Metadata
  imageUrl?: string;
  termsAndConditions: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

const GroupDealSchema = new Schema<IGroupDeal>(
  {
    onChainAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    promotionAddress: {
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
    tiers: [
      {
        minParticipants: { type: Number, required: true },
        discountPercentage: { type: Number, required: true, min: 0, max: 100 },
        pricePerUnit: { type: Number, required: true, min: 0 },
      },
    ],
    targetParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    currentParticipants: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    participants: [
      {
        userAddress: { type: String, required: true },
        joinedAt: { type: Date, default: Date.now },
        quantity: { type: Number, required: true, min: 1 },
        paidAmount: { type: Number, required: true, min: 0 },
        txSignature: { type: String, required: true },
      },
    ],
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    expiryTimestamp: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'successful', 'failed', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isSuccessful: {
      type: Boolean,
      default: false,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentTier: {
      type: Number,
      default: 0,
      min: 0,
    },
    imageUrl: String,
    termsAndConditions: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
GroupDealSchema.index({ status: 1, endTime: 1 });
GroupDealSchema.index({ merchantAddress: 1, status: 1, createdAt: -1 });
GroupDealSchema.index({ category: 1, isActive: 1, currentParticipants: 1 });
GroupDealSchema.index({ 'participants.userAddress': 1 });

export const GroupDeal = mongoose.model<IGroupDeal>('GroupDeal', GroupDealSchema);
