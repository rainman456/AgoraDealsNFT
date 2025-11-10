import { Connection, PublicKey, Logs, Context } from '@solana/web3.js';
import { Program, BorshCoder, EventParser } from '@coral-xyz/anchor';
import { getSolanaConfig } from '../config/solana';
import { logger } from '../utils/logger';
import { DiscountPlatform } from '../idl/discount_platform';
import { EventEmitter } from 'events';

/**
 * Blockchain Event Listener Service
 * 
 * Subscribes to Solana program logs and emits parsed events.
 * Implements proper event-driven architecture with blockchain as source of truth.
 */
export class BlockchainEventListenerService extends EventEmitter {
  private static instance: BlockchainEventListenerService;
  private connection: Connection;
  private program: Program<DiscountPlatform>;
  private programId: PublicKey;
  private subscriptionId: number | null = null;
  private eventParser: EventParser;
  private isListening = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // 5 seconds

  private constructor() {
    super();
    const config = getSolanaConfig();
    this.connection = config.connection;
    this.program = config.program;
    this.programId = config.programId;
    
    // Initialize event parser
    const coder = new BorshCoder(this.program.idl);
    this.eventParser = new EventParser(this.programId, coder);
  }

  public static getInstance(): BlockchainEventListenerService {
    if (!BlockchainEventListenerService.instance) {
      BlockchainEventListenerService.instance = new BlockchainEventListenerService();
    }
    return BlockchainEventListenerService.instance;
  }

  /**
   * Start listening to blockchain events
   */
  public async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('Event listener already running');
      return;
    }

    try {
      logger.info(`Starting blockchain event listener for program: ${this.programId.toString()}`);

      this.subscriptionId = this.connection.onLogs(
        this.programId,
        this.handleLogs.bind(this),
        'confirmed' // Use 'confirmed' for faster updates, will verify finality separately
      );

      this.isListening = true;
      this.reconnectAttempts = 0;
      logger.info(`✅ Event listener started with subscription ID: ${this.subscriptionId}`);
    } catch (error) {
      logger.error('Failed to start event listener:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Stop listening to blockchain events
   */
  public async stopListening(): Promise<void> {
    if (!this.isListening || this.subscriptionId === null) {
      return;
    }

    try {
      await this.connection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      this.isListening = false;
      logger.info('Event listener stopped');
    } catch (error) {
      logger.error('Error stopping event listener:', error);
    }
  }

  /**
   * Handle incoming logs from the blockchain
   */
  private async handleLogs(logs: Logs, context: Context): Promise<void> {
    try {
      const { signature, err } = logs;

      // Skip failed transactions
      if (err) {
        logger.debug(`Skipping failed transaction: ${signature}`);
        return;
      }

      // Parse events from logs
      const events = this.eventParser.parseLogs(logs.logs);

      for (const event of events) {
        await this.processEvent(event, signature, context.slot);
      }
    } catch (error) {
      logger.error('Error handling logs:', error);
    }
  }

  /**
   * Process a single parsed event
   */
  private async processEvent(event: any, signature: string, slot: number): Promise<void> {
    try {
      const eventName = event.name;
      const eventData = event.data;

      logger.info(`📡 Blockchain Event: ${eventName}`, {
        signature,
        slot,
        data: eventData,
      });

      // Emit event with metadata
      this.emit('blockchain-event', {
        name: eventName,
        data: eventData,
        signature,
        slot,
        timestamp: new Date(),
        commitment: 'confirmed', // Initial commitment level
      });

      // Emit specific event types
      this.emit(eventName, {
        data: eventData,
        signature,
        slot,
        timestamp: new Date(),
      });

      // Schedule finality check
      this.scheduleFinalityCheck(signature, slot, eventName, eventData);
    } catch (error) {
      logger.error('Error processing event:', error);
    }
  }

  /**
   * Schedule a finality check for a transaction
   * Solana has ~30 second finality, we check after 35 seconds
   */
  private scheduleFinalityCheck(
    signature: string,
    slot: number,
    eventName: string,
    eventData: any
  ): void {
    setTimeout(async () => {
      try {
        const status = await this.connection.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        });

        if (status?.value?.confirmationStatus === 'finalized') {
          logger.info(`✅ Transaction finalized: ${signature}`);
          
          // Emit finalized event
          this.emit('transaction-finalized', {
            signature,
            slot,
            eventName,
            eventData,
            timestamp: new Date(),
          });

          // Emit specific finalized event
          this.emit(`${eventName}-finalized`, {
            data: eventData,
            signature,
            slot,
            timestamp: new Date(),
          });
        } else {
          logger.warn(`⚠️  Transaction not finalized after 35s: ${signature}`, {
            status: status?.value?.confirmationStatus,
          });
          
          // Emit reorg warning
          this.emit('potential-reorg', {
            signature,
            slot,
            eventName,
            eventData,
            status: status?.value?.confirmationStatus,
          });
        }
      } catch (error) {
        logger.error('Error checking transaction finality:', error);
      }
    }, 35000); // 35 seconds
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Manual intervention required.');
      this.emit('max-reconnect-attempts-reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    logger.info(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      this.startListening();
    }, delay);
  }

  /**
   * Get listener status
   */
  public getStatus(): {
    isListening: boolean;
    subscriptionId: number | null;
    reconnectAttempts: number;
  } {
    return {
      isListening: this.isListening,
      subscriptionId: this.subscriptionId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const blockchainEventListener = BlockchainEventListenerService.getInstance();
