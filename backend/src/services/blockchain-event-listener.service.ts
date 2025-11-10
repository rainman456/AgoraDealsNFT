import { Connection, PublicKey, Logs, Context } from '@solana/web3.js';
import { Program, BorshCoder, EventParser } from '@coral-xyz/anchor';
import { getSolanaConfig } from '../config/solana';
import { logger } from '../utils/logger';
import { DiscountPlatform } from '../idl/discount_platform';
import { SyncStatus } from '../models/sync-status';
import { EventEmitter } from 'events';

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
  private reconnectDelay = 5000;
  
  //  State management
  private processedTransactions: Set<string> = new Set();
  private lastProcessedSlot: number = 0;
  private lastEventTimestamp: number = Date.now();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  // Error tracking
  private errorCount: number = 0;
  private errorWindowStart: number = Date.now();
  private errorThreshold: number = 10;

  private constructor() {
    super();
    const config = getSolanaConfig();
    this.connection = config.connection;
    this.program = config.program;
    this.programId = config.programId;
    
    const coder = new BorshCoder(this.program.idl);
    this.eventParser = new EventParser(this.programId, coder);
    
    this.loadLastProcessedSlot();
  }

  public static getInstance(): BlockchainEventListenerService {
    if (!BlockchainEventListenerService.instance) {
      BlockchainEventListenerService.instance = new BlockchainEventListenerService();
    }
    return BlockchainEventListenerService.instance;
  }

  private async loadLastProcessedSlot(): Promise<void> {
    try {
      const syncStatus = await SyncStatus.findOne({ service: 'event-listener' });
      if (syncStatus) {
        this.lastProcessedSlot = syncStatus.lastProcessedSlot;
        logger.info(`Resuming from slot: ${this.lastProcessedSlot}`);
      }
    } catch (error) {
      logger.error('Error loading last processed slot:', error);
    }
  }

  private async saveLastProcessedSlot(slot: number): Promise<void> {
    try {
      this.lastProcessedSlot = slot;
      await SyncStatus.findOneAndUpdate(
        { service: 'event-listener' },
        {
          service: 'event-listener',
          lastProcessedSlot: slot,
          lastSyncTime: new Date(),
          isHealthy: true,
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error('Error saving last processed slot:', error);
    }
  }

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
        'confirmed'
      );

      this.isListening = true;
      this.reconnectAttempts = 0;
      this.startHealthMonitoring();
      
      logger.info(`✅ Event listener started with subscription ID: ${this.subscriptionId}`);
    } catch (error) {
      logger.error('Failed to start event listener:', error);
      this.scheduleReconnect();
    }
  }

  public async stopListening(): Promise<void> {
    if (!this.isListening || this.subscriptionId === null) {
      return;
    }

    try {
      await this.connection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      this.isListening = false;
      
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }
      
      logger.info('Event listener stopped');
    } catch (error) {
      logger.error('Error stopping event listener:', error);
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      const timeSinceLastEvent = Date.now() - this.lastEventTimestamp;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeSinceLastEvent > fiveMinutes) {
        logger.warn(`⚠️  No events received for ${timeSinceLastEvent / 1000}s. Connection may be dead.`);
        
        this.connection.getSlot()
          .then(() => {
            logger.info('Connection test passed - RPC endpoint is responsive');
          })
          .catch((error) => {
            logger.error('Connection test failed - restarting listener:', error);
            this.stopListening();
            this.scheduleReconnect();
          });
      }
    }, 60000);
  }

  private async handleLogs(logs: Logs, context: Context): Promise<void> {
    try {
      this.lastEventTimestamp = Date.now();
      const { signature, err } = logs;

      if (err) {
        logger.debug(`Skipping failed transaction: ${signature}`);
        return;
      }

      if (this.processedTransactions.has(signature)) {
        logger.debug(`Skipping duplicate transaction: ${signature}`);
        return;
      }

      let events: any[] = [];
      try {
        events = this.eventParser.parseLogs(logs.logs);
      } catch (parseError) {
        logger.error('Error parsing events from logs:', parseError, {
          signature,
          slot: context.slot,
          logs: logs.logs.slice(0, 5),
        });
        
        this.emit('parse-error', {
          signature,
          slot: context.slot,
          error: parseError,
        });
        
        return;
      }

      if (events.length > 0) {
        this.processedTransactions.add(signature);
        
        if (this.processedTransactions.size > 10000) {
          const firstKey = this.processedTransactions.keys().next().value;
          this.processedTransactions.delete(firstKey);
        }
      }

      for (const event of events) {
        await this.processEvent(event, signature, context.slot);
      }
      
      if (context.slot > this.lastProcessedSlot) {
        await this.saveLastProcessedSlot(context.slot);
      }
    } catch (error) {
      logger.error('Error handling logs:', error);
      this.trackError(error as Error);
    }
  }

  private async processEvent(event: any, signature: string, slot: number): Promise<void> {
    try {
      const eventName = event.name;
      const eventData = event.data;

      logger.info(`📡 Blockchain Event: ${eventName}`, {
        signature,
        slot,
        data: eventData,
      });

      this.emit('blockchain-event', {
        name: eventName,
        data: eventData,
        signature,
        slot,
        timestamp: new Date(),
        commitment: 'confirmed',
      });

      this.emit(eventName, {
        data: eventData,
        signature,
        slot,
        timestamp: new Date(),
      });

      this.scheduleFinalityCheck(signature, slot, eventName, eventData);
    } catch (error) {
      logger.error('Error processing event:', error);
    }
  }

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
          
          this.emit('transaction-finalized', {
            signature,
            slot,
            eventName,
            eventData,
            timestamp: new Date(),
          });

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
    }, 35000);
  }

  private trackError(error: Error): void {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (now - this.errorWindowStart > oneMinute) {
      this.errorCount = 0;
      this.errorWindowStart = now;
    }

    this.errorCount++;

    SyncStatus.findOneAndUpdate(
      { service: 'event-listener' },
      {
        $inc: { errorCount: 1 },
        $set: { 
          lastError: error.message,
          isHealthy: this.errorCount < this.errorThreshold,
        },
      },
      { upsert: true }
    ).catch((err) => logger.error('Error updating sync status:', err));

    if (this.errorCount >= this.errorThreshold) {
      logger.error(`🚨 HIGH ERROR RATE: ${this.errorCount} errors in the last minute`);
      this.emit('high-error-rate', {
        errorCount: this.errorCount,
        timeWindow: oneMinute,
        lastError: error.message,
      });
    }
  }

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

  public async backfillEvents(fromSlot: number, toSlot?: number): Promise<void> {
    try {
      const endSlot = toSlot || await this.connection.getSlot('finalized');
      logger.info(`Starting backfill from slot ${fromSlot} to ${endSlot}`);

      let currentSlot = fromSlot;
      const batchSize = 100;

      while (currentSlot <= endSlot) {
        const maxSlot = Math.min(currentSlot + batchSize, endSlot);
        
        logger.info(`Backfilling slots ${currentSlot} to ${maxSlot}`);

        const signatures = await this.connection.getSignaturesForAddress(
          this.programId,
          {
            minContextSlot: currentSlot,
            maxContextSlot: maxSlot,
          },
          'finalized'
        );

        for (const sigInfo of signatures) {
          try {
            const tx = await this.connection.getTransaction(sigInfo.signature, {
              maxSupportedTransactionVersion: 0,
            });

            if (tx && tx.meta && !tx.meta.err) {
              const logs = tx.meta.logMessages || [];
              const events = this.eventParser.parseLogs(logs);

              for (const event of events) {
                await this.processEvent(event, sigInfo.signature, sigInfo.slot!);
              }
            }
          } catch (error) {
            logger.error(`Error processing transaction ${sigInfo.signature}:`, error);
          }
        }

        currentSlot = maxSlot + 1;
        await this.saveLastProcessedSlot(maxSlot);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info(`✅ Backfill complete: processed ${endSlot - fromSlot} slots`);
    } catch (error) {
      logger.error('Backfill failed:', error);
      throw error;
    }
  }

  public setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Gracefully shutting down event listener...`);
      
      try {
        await this.stopListening();
        
        await SyncStatus.findOneAndUpdate(
          { service: 'event-listener' },
          {
            isHealthy: false,
            lastError: `Shutdown via ${signal}`,
          }
        );
        
        logger.info('Event listener shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
      shutdown('unhandledRejection');
    });
  }

  public getStatus(): {
    isListening: boolean;
    subscriptionId: number | null;
    reconnectAttempts: number;
    lastProcessedSlot: number;
    errorCount: number;
  } {
    return {
      isListening: this.isListening,
      subscriptionId: this.subscriptionId,
      reconnectAttempts: this.reconnectAttempts,
      lastProcessedSlot: this.lastProcessedSlot,
      errorCount: this.errorCount,
    };
  }
}

export const blockchainEventListener = BlockchainEventListenerService.getInstance();