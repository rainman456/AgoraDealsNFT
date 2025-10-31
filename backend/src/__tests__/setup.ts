import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/discount-platform-test';
process.env.SOLANA_NETWORK = 'devnet';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';
process.env.PROGRAM_ID = '11111111111111111111111111111111';
process.env.WALLET_PRIVATE_KEY = JSON.stringify([1, 2, 3, 4, 5]);
process.env.API_PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.LOG_LEVEL = 'error';

// Mock logger to suppress logs during tests
vi.mock('../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
