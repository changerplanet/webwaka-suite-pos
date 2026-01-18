import { db } from '@/data/db'
import type { StateStorage } from 'zustand/middleware'

interface StorageItem {
  key: string
  value: string
}

declare module '@/data/db' {
  interface POSDatabase {
    storage: import('dexie').Table<StorageItem>
  }
}

db.version(2).stores({
  products: 'id, sku, name, categoryId, barcode, updatedAt',
  carts: 'id, status, createdAt, updatedAt',
  transactions: 'id, cartId, paymentMethod, status, syncStatus, offlineCreatedAt',
  shifts: 'id, registerId, locationId, status, openedAt, syncStatus',
  registers: 'id, locationId, status',
  locations: 'id, name',
  syncQueue: '++id, entityType, entityId, createdAt',
  inventoryAdjustments: 'id, productId, status, createdAt, syncStatus',
  cashMovements: 'id, shiftId, type, status, createdAt, syncStatus',
  storage: 'key',
})

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const item = await (db as unknown as { storage: { get: (key: string) => Promise<StorageItem | undefined> } }).storage.get(name)
      return item?.value ?? null
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await (db as unknown as { storage: { put: (item: StorageItem) => Promise<unknown> } }).storage.put({ key: name, value })
    } catch {
      console.error('Failed to save to IndexedDB:', name)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await (db as unknown as { storage: { delete: (key: string) => Promise<unknown> } }).storage.delete(name)
    } catch {
      console.error('Failed to remove from IndexedDB:', name)
    }
  },
}
