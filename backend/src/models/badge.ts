import mongoose, { Schema, Document } from 'mongoose';

export enum BadgeType {
  FirstPurchase = 'FirstPurchase',
  TenRedemptions = 'TenRedemptions',
  FiftyRedemptions = 'FiftyRedemptions',
  TopReviewer = 'TopReviewer',
  EarlyAdopter = 'EarlyAdopter',
  MerchantPartner = 'MerchantPartner',
  CommunityModerator = 'CommunityModerator',
}

export enum ReputationTier {
  Bronze = 'Bronze',
  Silver = 'Silver',
  Gold = 'Gold',
  Platinum = 'Platinum',
  Diamond = 'Diamond',
}

export interface IUserReputation extends Document {
  onChainAddress: string;
  user: string;
  totalPurchases: number;
  totalRedemptions: number;
  totalRatingsGiven: number;
  totalComments: number;
  reputationScore: number;
  tier: ReputationTier;
  badgesEarned: BadgeType[];
  joinedAt: Date;
  createdAt: Date;
}

export interface IBadgeNFT extends Document {
  onChainAddress: string;
  user: string;
  badgeType: BadgeType;
  mint: string;
  metadata: string;
  earnedAt: Date;
  metadataUri: string;
  createdAt: Date;
}

const UserReputationSchema = new Schema<IUserReputation>(
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
      unique: true,
      index: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
    },
    totalRedemptions: {
      type: Number,
      default: 0,
    },
    totalRatingsGiven: {
      type: Number,
      default: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: Object.values(ReputationTier),
      default: ReputationTier.Bronze,
    },
    badgesEarned: [{
      type: String,
      enum: Object.values(BadgeType),
    }],
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const BadgeNFTSchema = new Schema<IBadgeNFT>(
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
    badgeType: {
      type: String,
      enum: Object.values(BadgeType),
      required: true,
    },
    mint: {
      type: String,
      required: true,
      unique: true,
    },
    metadata: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    metadataUri: {
      type: String,
      required: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

UserReputationSchema.index({ tier: 1, reputationScore: -1 });
UserReputationSchema.index({ user: 1 });

BadgeNFTSchema.index({ user: 1, badgeType: 1 });
BadgeNFTSchema.index({ earnedAt: -1 });

export const UserReputation = mongoose.model<IUserReputation>('UserReputation', UserReputationSchema);
export const BadgeNFT = mongoose.model<IBadgeNFT>('BadgeNFT', BadgeNFTSchema);
