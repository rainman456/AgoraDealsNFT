import mongoose, { Schema, Document } from 'mongoose';

export interface IRedemptionTicket extends Document {
  onChainAddress: string;
  couponAddress: string;
  userAddress: string;
  merchantAddress: string;
  
  // Ticket details
  ticketHash: string;
  nonce: number;
  createdAt: Date;
  expiresAt: Date;
  isConsumed: boolean;
  consumedAt?: Date;
  
  // Location data (optional)
  generationLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  
  redemptionLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  
  // QR code data
  qrCodeData?: string;
  qrCodeImage?: string;
  
  // Verification
  verificationMethod: 'qr_scan' | 'manual' | 'nfc' | 'api';
  verifiedBy?: string;
  
  // Transaction references
  generationTxSignature: string;
  redemptionTxSignature?: string;
  cancellationTxSignature?: string;
  
  status: 'active' | 'consumed' | 'expired' | 'cancelled';
}

const RedemptionTicketSchema = new Schema<IRedemptionTicket>(
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
    userAddress: {
      type: String,
      required: true,
      index: true,
    },
    merchantAddress: {
      type: String,
      required: true,
      index: true,
    },
    ticketHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isConsumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedAt: Date,
    generationLocation: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      timestamp: Date,
    },
    redemptionLocation: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      timestamp: Date,
    },
    qrCodeData: String,
    qrCodeImage: String,
    verificationMethod: {
      type: String,
      enum: ['qr_scan', 'manual', 'nfc', 'api'],
      default: 'qr_scan',
    },
    verifiedBy: String,
    generationTxSignature: {
      type: String,
      required: true,
    },
    redemptionTxSignature: String,
    cancellationTxSignature: String,
    status: {
      type: String,
      enum: ['active', 'consumed', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
RedemptionTicketSchema.index({ userAddress: 1, status: 1, createdAt: -1 });
RedemptionTicketSchema.index({ merchantAddress: 1, status: 1, createdAt: -1 });
RedemptionTicketSchema.index({ couponAddress: 1, isConsumed: 1 });

export const RedemptionTicket = mongoose.model<IRedemptionTicket>('RedemptionTicket', RedemptionTicketSchema);
