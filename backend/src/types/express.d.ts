import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        walletAddress: string;
        userId?: string;
        role?: string;
      };
    }
  }
}
