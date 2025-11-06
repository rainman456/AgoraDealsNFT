import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchant extends Document {
  email: string;
  walletAddress?: string;
  encryptedPrivateKey?: string;
  iv?: string;
  authTag?: string;
  authority?: string;
  onChainAddress?: string;
  name: string;
  category: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  totalCouponsCreated: number;
  totalCouponsRedeemed: number;
  isActive: boolean;
  averageRating: number;
  totalRatings: number;
  createdAt: Date;
}

const MerchantSchema = new Schema<IMerchant>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      required: false,
    },
    encryptedPrivateKey: {
      type: String,
      required: false,
    },
    iv: {
      type: String,
      required: false,
    },
    authTag: {
      type: String,
      required: false,
    },
    authority: {
      type: String,
      index: true,
      required: false,
    },
    onChainAddress: {
      type: String,
      unique: true,
      sparse: true,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    totalCouponsCreated: {
      type: Number,
      default: 0,
    },
    totalCouponsRedeemed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

MerchantSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export const Merchant = mongoose.model<IMerchant>('Merchant', MerchantSchema);
