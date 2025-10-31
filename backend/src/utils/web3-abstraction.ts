import { PublicKey, Connection } from '@solana/web3.js';
import { logger } from './logger';

/**
 * Web3 Abstraction Layer
 * Simplifies blockchain interactions for mainstream users
 */

export interface SimplifiedWallet {
  address: string;
  balance: number;
  isConnected: boolean;
}

export interface SimplifiedTransaction {
  id: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: string;
  timestamp: Date;
  details: any;
}

export class Web3AbstractionService {
  /**
   * Convert technical wallet info to user-friendly format
   */
  static simplifyWalletInfo(publicKey: PublicKey, balance: number): SimplifiedWallet {
    return {
      address: publicKey.toBase58(),
      balance: balance / 1e9, // Convert lamports to SOL
      isConnected: true,
    };
  }

  /**
   * Convert transaction signature to user-friendly format
   */
  static simplifyTransaction(
    signature: string,
    type: string,
    details: any
  ): SimplifiedTransaction {
    return {
      id: signature,
      status: 'pending',
      type,
      timestamp: new Date(),
      details,
    };
  }

  /**
   * Generate user-friendly error messages
   */
  static getUserFriendlyError(error: any): string {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    // Map technical errors to user-friendly messages
    if (errorMessage.includes('insufficient funds')) {
      return 'You don\'t have enough funds to complete this transaction.';
    }

    if (errorMessage.includes('User rejected')) {
      return 'Transaction was cancelled.';
    }

    if (errorMessage.includes('already redeemed')) {
      return 'This coupon has already been used.';
    }

    if (errorMessage.includes('expired')) {
      return 'This coupon has expired.';
    }

    if (errorMessage.includes('not owner')) {
      return 'You don\'t own this coupon.';
    }

    if (errorMessage.includes('network')) {
      return 'Network connection issue. Please try again.';
    }

    if (errorMessage.includes('timeout')) {
      return 'Transaction timed out. Please try again.';
    }

    // Default fallback
    return 'Something went wrong. Please try again or contact support.';
  }

  /**
   * Format SOL amount for display
   */
  static formatSOL(lamports: number): string {
    const sol = lamports / 1e9;
    return `${sol.toFixed(4)} SOL`;
  }

  /**
   * Format USD equivalent (requires price feed)
   */
  static formatUSD(lamports: number, solPrice: number): string {
    const sol = lamports / 1e9;
    const usd = sol * solPrice;
    return `$${usd.toFixed(2)}`;
  }

  /**
   * Shorten wallet address for display
   */
  static shortenAddress(address: string, chars: number = 4): string {
    if (address.length <= chars * 2 + 3) return address;
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }

  /**
   * Validate wallet address
   */
  static isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get transaction explorer URL
   */
  static getExplorerUrl(signature: string, network: 'mainnet' | 'devnet' | 'testnet' = 'devnet'): string {
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `https://explorer.solana.com/tx/${signature}${cluster}`;
  }

  /**
   * Get address explorer URL
   */
  static getAddressExplorerUrl(address: string, network: 'mainnet' | 'devnet' | 'testnet' = 'devnet'): string {
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `https://explorer.solana.com/address/${address}${cluster}`;
  }

  /**
   * Estimate transaction fee in user-friendly format
   */
  static estimateFee(signatures: number = 1): { lamports: number; sol: string; description: string } {
    const lamportsPerSignature = 5000;
    const totalLamports = lamportsPerSignature * signatures;
    
    return {
      lamports: totalLamports,
      sol: this.formatSOL(totalLamports),
      description: `Network fee for ${signatures} signature${signatures > 1 ? 's' : ''}`,
    };
  }

  /**
   * Check if transaction is confirmed
   */
  static async checkTransactionStatus(
    connection: Connection,
    signature: string
  ): Promise<'confirmed' | 'pending' | 'failed'> {
    try {
      const status = await connection.getSignatureStatus(signature);
      
      if (!status || !status.value) {
        return 'pending';
      }

      if (status.value.err) {
        return 'failed';
      }

      if (status.value.confirmationStatus === 'confirmed' || 
          status.value.confirmationStatus === 'finalized') {
        return 'confirmed';
      }

      return 'pending';
    } catch (error) {
      logger.error('Failed to check transaction status:', error);
      return 'pending';
    }
  }

  /**
   * Wait for transaction confirmation with timeout
   */
  static async waitForConfirmation(
    connection: Connection,
    signature: string,
    timeoutMs: number = 60000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.checkTransactionStatus(connection, signature);
      
      if (status === 'confirmed') {
        return true;
      }

      if (status === 'failed') {
        return false;
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return false;
  }

  /**
   * Generate QR code data for wallet connection
   */
  static generateWalletConnectQR(walletAddress: string, appName: string): string {
    return JSON.stringify({
      type: 'wallet_connect',
      address: walletAddress,
      app: appName,
      timestamp: Date.now(),
    });
  }

  /**
   * Parse transaction for user-friendly display
   */
  static parseTransactionForDisplay(_transaction: any): {
    type: string;
    description: string;
    amount?: string;
    from?: string;
    to?: string;
  } {
    // This would parse the transaction and return user-friendly info
    // Implementation depends on transaction structure
    return {
      type: 'transfer',
      description: 'Transaction completed',
    };
  }
}

/**
 * Fiat Payment Integration Helper
 * For users who want to use credit cards instead of crypto
 */
export class FiatPaymentHelper {
  /**
   * Calculate fiat equivalent of SOL amount
   */
  static calculateFiatAmount(lamports: number, solPrice: number, currency: string = 'USD'): {
    amount: number;
    currency: string;
    formatted: string;
  } {
    const sol = lamports / 1e9;
    const amount = sol * solPrice;
    
    return {
      amount,
      currency,
      formatted: `${currency} ${amount.toFixed(2)}`,
    };
  }

  /**
   * Generate payment intent for fiat on-ramp
   */
  static generatePaymentIntent(
    amount: number,
    currency: string,
    walletAddress: string,
    metadata: any
  ): {
    intentId: string;
    amount: number;
    currency: string;
    destination: string;
    metadata: any;
  } {
    return {
      intentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      destination: walletAddress,
      metadata,
    };
  }
}

/**
 * Wallet Provider Abstraction
 * Supports multiple wallet providers with unified interface
 */
export class WalletProviderHelper {
  static readonly SUPPORTED_WALLETS = [
    { id: 'phantom', name: 'Phantom', icon: 'phantom.svg' },
    { id: 'solflare', name: 'Solflare', icon: 'solflare.svg' },
    { id: 'backpack', name: 'Backpack', icon: 'backpack.svg' },
    { id: 'glow', name: 'Glow', icon: 'glow.svg' },
  ];

  /**
   * Detect available wallets
   */
  static detectAvailableWallets(): string[] {
    const available: string[] = [];
    
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') {
      const win = (globalThis as any).window;
      if (win.solana?.isPhantom) available.push('phantom');
      if (win.solflare) available.push('solflare');
      if (win.backpack) available.push('backpack');
      if (win.glow) available.push('glow');
    }

    return available;
  }

  /**
   * Get wallet connection instructions
   */
  static getConnectionInstructions(walletId: string): string {
    const instructions: Record<string, string> = {
      phantom: 'Click the Phantom extension and approve the connection request.',
      solflare: 'Open Solflare wallet and approve the connection.',
      backpack: 'Open Backpack wallet and approve the connection.',
      glow: 'Open Glow wallet and approve the connection.',
    };

    return instructions[walletId] || 'Please approve the connection in your wallet.';
  }
}
