import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  onChainAddress: string;
  couponId: number;
  nftMint: string;
  promotion: string;
  owner: string;
  merchant: string;
  discountPercentage: number;
  expiryTimestamp: Date;
  isRedeemed: boolean;
  redeemedAt?: Date;
  redemptionCode?: string;
  isListed: boolean;
  listingPrice?: number;
  transferHistory: Array<{
    from: string;
    to: string;
    timestamp: Date;
    transactionSignature: string;
  }>;
  createdAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    onChainAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    couponId: {
      type: Number,
      required: true,
    },
    nftMint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    promotion: {
      type: String,
      required: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    merchant: {
      type: String,
      required: true,
      index: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
    },
    expiryTimestamp: {
      type: Date,
      required: true,
    },
    isRedeemed: {
      type: Boolean,
      default: false,
      index: true,
    },
    redeemedAt: {
      type: Date,
    },
    redemptionCode: {
      type: String,
    },
    isListed: {
      type: Boolean,
      default: false,
      index: true,
    },
    listingPrice: {
      type: Number,
    },
    transferHistory: [
      {
        from: String,
        to: String,
        timestamp: Date,
        transactionSignature: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Coupon = mongoose.model<ICoupon>('Coupon', CouponSchema);
