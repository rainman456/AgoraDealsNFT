import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  onChainAddress: string;
  user: string;
  promotion: string;
  merchant: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    onChainAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: String,
      required: true,
      index: true,
    },
    promotion: {
      type: String,
      required: true,
      index: true,
    },
    merchant: {
      type: String,
      required: true,
      index: true,
    },
    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one rating per user per promotion
RatingSchema.index({ user: 1, promotion: 1 }, { unique: true });
RatingSchema.index({ promotion: 1, createdAt: -1 });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
