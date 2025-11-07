import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  onChainAddress: string;
  coupon: string;
  seller: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
}

const ListingSchema = new Schema<IListing>(
  {
    onChainAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    coupon: {
      type: String,
      required: true,
      index: true,
    },
    seller: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ListingSchema.index({ isActive: 1, price: 1 });
ListingSchema.index({ seller: 1, isActive: 1 });

export const Listing = mongoose.model<IListing>('Listing', ListingSchema);
