import { Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getSolanaConfig } from '../config/solana';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

export interface WalletData {
  publicKey: string;
  encryptedPrivateKey: string;
  iv: string;
  authTag: string;
}

export class WalletService {
  private get config() {
    return getSolanaConfig();
  }

  /**
   * Generate a new wallet keypair
   */
  generateWallet(): Keypair {
    return Keypair.generate();
  }


constructor() {
  this.validateEncryptionKey();
}

private validateEncryptionKey(): void {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
    logger.error('WALLET_ENCRYPTION_KEY is not set or too short. Using generated key (NOT SECURE FOR PRODUCTION)');
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WALLET_ENCRYPTION_KEY must be set in production');
    }
  } else {
    logger.info('✅ Wallet encryption key validated');
  }
}



  /**
   * Encrypt a private key for secure storage
   */
  encryptPrivateKey(keypair: Keypair): { 
  encryptedPrivateKey: string; 
  iv: string; 
  authTag: string;
  version: string;
} {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  
  if (key.length !== 32) {
    throw new Error('Invalid encryption key length');
  }
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  const privateKeyBytes = keypair.secretKey;
  let encrypted = cipher.update(Buffer.from(privateKeyBytes));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();

  return {
    encryptedPrivateKey: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    version: '1.0', // For future key rotation
  };
}


  /**
   * Decrypt a private key from storage
   */
  decryptPrivateKey(
  encryptedPrivateKey: string, 
  iv: string, 
  authTag: string,
  version?: string
): Keypair {
  try {
    // Validate inputs
    if (!encryptedPrivateKey || !iv || !authTag) {
      throw new Error('Missing required decryption parameters');
    }

    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    
    if (key.length !== 32) {
      throw new Error('Invalid encryption key length');
    }

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(Buffer.from(encryptedPrivateKey, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    // Validate decrypted data length
    if (decrypted.length !== 64) {
      throw new Error('Invalid decrypted key length');
    }
    
    const keypair = Keypair.fromSecretKey(decrypted);
    
    // Validate keypair
    if (!keypair.publicKey) {
      throw new Error('Failed to create valid keypair from decrypted data');
    }
    
    return keypair;
  } catch (error) {
    logger.error('Failed to decrypt private key:', error);
    throw new Error('Decryption failed - key may be corrupted or encryption key changed');
  }
}

  /**
   * Create a new wallet and encrypt it for storage
   */
  createWalletData(): WalletData {
    const keypair = this.generateWallet();
    const { encryptedPrivateKey, iv, authTag } = this.encryptPrivateKey(keypair);

    return {
      publicKey: keypair.publicKey.toString(),
      encryptedPrivateKey,
      iv,
      authTag,
    };
  }

  /**
   * Airdrop SOL to a wallet (localnet/devnet only)
   */
  async airdropSol(publicKey: PublicKey, amount: number = 2): Promise<string> {
  try {
    const network = await this.config.connection.getVersion();
    logger.info(`Requesting airdrop on ${JSON.stringify(network)}`);
    
    // Check if on devnet/localnet
    const balance = await this.getBalance(publicKey);
    logger.info(`Current balance: ${balance} SOL`);

    const signature = await this.config.connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );

    logger.info(`Airdrop requested: ${signature}`);

    // Wait for confirmation with timeout
    const confirmation = await Promise.race([
      this.config.connection.confirmTransaction(signature, 'confirmed'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Airdrop confirmation timeout')), 30000)
      ),
    ]);

    const newBalance = await this.getBalance(publicKey);
    logger.info(`Airdropped ${amount} SOL to ${publicKey.toString()}. New balance: ${newBalance} SOL`);
    
    return signature;
  } catch (error: any) {
    logger.error('Failed to airdrop SOL:', error);
    
    if (error.message?.includes('airdrop request limit')) {
      throw new Error('Airdrop rate limit reached. Please wait a moment and try again.');
    }
    
    if (error.message?.includes('429')) {
      throw new Error('Too many requests. Please use a different RPC endpoint or wait.');
    }
    
    throw error;
  }
}

  /**
   * Get wallet balance
   */
  async getBalance(publicKey: PublicKey, retries = 3): Promise<number> {
  for (let i = 0; i < retries; i++) {
    try {
      const balance = await this.config.connection.getBalance(publicKey, 'confirmed');
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      if (i === retries - 1) {
        logger.error('Failed to get balance:', error);
        throw error;
      }
      logger.warn(`Retrying balance check (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return 0;
}

  /**
   * Restore keypair from encrypted data
   */
  restoreKeypair(walletData: { encryptedPrivateKey: string; iv: string; authTag: string }): Keypair {
    return this.decryptPrivateKey(
      walletData.encryptedPrivateKey,
      walletData.iv,
      walletData.authTag
    );
  }
}

export const walletService = new WalletService();
