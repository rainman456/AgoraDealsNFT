import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncStatus extends Document {
  service: string;
  lastProcessedSlot: number;
  lastProcessedSignature?: string;
  lastSyncTime: Date;
  isHealthy: boolean;
  errorCount: number;
  lastError?: string;
}

const SyncStatusSchema = new Schema<ISyncStatus>(
  {
    service: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastProcessedSlot: {
      type: Number,
      required: true,
      default: 0,
    },
    lastProcessedSignature: String,
    lastSyncTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isHealthy: {
      type: Boolean,
      default: true,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
    lastError: String,
  },
  { timestamps: true }
);

export const SyncStatus = mongoose.model<ISyncStatus>('SyncStatus', SyncStatusSchema);