/**
 * Optimistic update helper
 * Allows UI to update immediately while API call is in progress
 */

export interface OptimisticUpdateConfig<T> {
  /** Original data before update */
  originalData: T;
  /** Updated data to show optimistically */
  optimisticData: T;
  /** Function to revert data if API call fails */
  onRevert?: (data: T) => void;
  /** Function to confirm data after API succeeds */
  onConfirm?: (data: T) => void;
}

export class OptimisticUpdateManager<T> {
  private originalData: T;
  private optimisticData: T;
  private isOptimistic: boolean = false;
  private onRevert?: (data: T) => void;
  private onConfirm?: (data: T) => void;

  constructor(config: OptimisticUpdateConfig<T>) {
    this.originalData = config.originalData;
    this.optimisticData = config.optimisticData;
    this.onRevert = config.onRevert;
    this.onConfirm = config.onConfirm;
  }

  /**
   * Apply optimistic update to UI
   */
  applyOptimistic(): T {
    this.isOptimistic = true;
    return this.optimisticData;
  }

  /**
   * Confirm optimistic update (API succeeded)
   */
  confirm(): T {
    this.isOptimistic = false;
    if (this.onConfirm) {
      this.onConfirm(this.optimisticData);
    }
    return this.optimisticData;
  }

  /**
   * Revert optimistic update (API failed)
   */
  revert(): T {
    this.isOptimistic = false;
    if (this.onRevert) {
      this.onRevert(this.originalData);
    }
    return this.originalData;
  }

  /**
   * Check if currently showing optimistic data
   */
  isOptimisticUpdate(): boolean {
    return this.isOptimistic;
  }
}

/**
 * Helper to create optimistic list update (add item)
 */
export function optimisticAddItem<T extends { id?: string }>(
  items: T[],
  newItem: T,
  optimisticId?: string
): T[] {
  const itemToAdd = { ...newItem };
  if (optimisticId && !itemToAdd.id) {
    itemToAdd.id = optimisticId;
  }
  return [itemToAdd, ...items];
}

/**
 * Helper to create optimistic list update (remove item)
 */
export function optimisticRemoveItem<T extends { id?: string }>(
  items: T[],
  itemId: string
): T[] {
  return items.filter((item) => item.id !== itemId);
}

/**
 * Helper to create optimistic list update (update item)
 */
export function optimisticUpdateItem<T extends { id?: string }>(
  items: T[],
  itemId: string,
  updates: Partial<T>
): T[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );
}

/**
 * Helper to batch optimistic updates
 */
export function batchOptimisticUpdates<T extends { id?: string }>(
  items: T[],
  updates: Array<{ action: 'add' | 'remove' | 'update'; id?: string; data?: T | Partial<T> }>
): T[] {
  return updates.reduce((acc, update) => {
    if (update.action === 'add' && update.data) {
      return optimisticAddItem(acc, update.data as T);
    } else if (update.action === 'remove' && update.id) {
      return optimisticRemoveItem(acc, update.id);
    } else if (update.action === 'update' && update.id && update.data) {
      return optimisticUpdateItem(acc, update.id, update.data as Partial<T>);
    }
    return acc;
  }, items);
}
