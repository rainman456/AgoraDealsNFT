import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  onChainAddress: string;
  user: string;
  promotion: string;
  content: string;
  createdAt: Date;
  likes: number;
  isMerchantReply: boolean;
  parentComment?: string;
}

const CommentSchema = new Schema<IComment>(
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
    content: {
      type: String,
      required: true,
      maxlength: 500,
    },
    likes: {
      type: Number,
      default: 0,
    },
    isMerchantReply: {
      type: Boolean,
      default: false,
    },
    parentComment: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

CommentSchema.index({ promotion: 1, createdAt: -1 });
CommentSchema.index({ user: 1, createdAt: -1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
