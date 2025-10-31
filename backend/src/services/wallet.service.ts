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
  private config = getSolanaConfig();

  /**
   * Generate a new wallet keypair
   */
  generateWallet(): Keypair {
    return Keypair.generate();
  }

  /**
   * Encrypt a private key for secure storage
   */
  encryptPrivateKey(keypair: Keypair): { encryptedPrivateKey: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    const privateKeyBytes = keypair.secretKey;
    let encrypted = cipher.update(Buffer.from(privateKeyBytes));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();

    return {
      encryptedPrivateKey: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt a private key from storage
   */
  decryptPrivateKey(encryptedPrivateKey: string, iv: string, authTag: string): Keypair {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(Buffer.from(encryptedPrivateKey, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return Keypair.fromSecretKey(decrypted);
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
      const signature = await this.config.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );

      await this.config.connection.confirmTransaction(signature);
      logger.info(`Airdropped ${amount} SOL to ${publicKey.toString()}`);
      
      return signature;
    } catch (error) {
      logger.error('Failed to airdrop SOL:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.config.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
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
