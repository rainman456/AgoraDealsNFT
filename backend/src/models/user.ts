import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  encryptedPrivateKey: string;
  iv: string;
  authTag: string;
  username?: string;
  email?: string;
  totalPurchases: number;
  totalRedemptions: number;
  reputationScore: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  badgesEarned: string[];
  preferences: {
    categories: string[];
    locationEnabled: boolean;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    encryptedPrivateKey: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalRedemptions: {
      type: Number,
      default: 0,
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze',
    },
    badgesEarned: {
      type: [String],
      default: [],
    },
    preferences: {
      categories: {
        type: [String],
        default: [],
      },
      locationEnabled: {
        type: Boolean,
        default: false,
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
