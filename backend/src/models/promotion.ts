import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
  onChainAddress: string;
  merchant: string;
  title: string;
  description: string;
  category: string;
  discountPercentage: number;
  maxSupply: number;
  currentSupply: number;
  price: number;
  expiryTimestamp: Date;
  isActive: boolean;
  imageUrl: string;
  originalPrice:number;
  stats: {
    totalMinted: number;
    totalRedeemed: number;
    averageRating: number;
    totalRatings: number;
    totalComments: number;
  };
  createdAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    onChainAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchant: {
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
    discountPercentage: {
      type: Number,
      required: true,
    },
    maxSupply: {
      type: Number,
      required: true,
    },
    currentSupply: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    expiryTimestamp: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

     imageUrl: {
     type: String,
     default: '',
    },
    originalPrice: {
      type: Number,
    },
    stats: {
      totalMinted: {
        type: Number,
        default: 0,
      },
      totalRedeemed: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      totalComments: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Promotion = mongoose.model<IPromotion>('Promotion', PromotionSchema);