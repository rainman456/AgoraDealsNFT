import mongoose, { Schema, Document } from 'mongoose';

export enum DealSource {
  Skyscanner = 'Skyscanner',
  BookingCom = 'BookingCom',
  Shopify = 'Shopify',
  Amazon = 'Amazon',
  Custom = 'Custom',
}

export interface IExternalDeal extends Document {
  onChainAddress: string;
  oracleAuthority: string;
  source: DealSource;
  externalId: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  category: string;
  imageUrl: string;
  affiliateUrl: string;
  expiryTimestamp: Date;
  lastUpdated: Date;
  isVerified: boolean;
  verificationCount: number;
  createdAt: Date;
}

const ExternalDealSchema = new Schema<IExternalDeal>(
  {
    onChainAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    oracleAuthority: {
      type: String,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: Object.values(DealSource),
      required: true,
      index: true,
    },
    externalId: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    discountedPrice: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      required: true,
      maxlength: 50,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
      maxlength: 200,
    },
    affiliateUrl: {
      type: String,
      required: true,
      maxlength: 200,
    },
    expiryTimestamp: {
      type: Date,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

ExternalDealSchema.index({ source: 1, externalId: 1 }, { unique: true });
ExternalDealSchema.index({ category: 1, isVerified: 1 });
ExternalDealSchema.index({ expiryTimestamp: 1 });

export const ExternalDeal = mongoose.model<IExternalDeal>('ExternalDeal', ExternalDealSchema);
