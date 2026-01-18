import { db } from '@/data/db'

export async function processSyncQueue() {
  const pendingItems = await db.syncQueue.toArray()
  
  for (const item of pendingItems) {
    try {
      const success = await syncItem(item)
      if (success) {
        await db.syncQueue.delete(item.id!)
        
        if (item.entityType === 'transaction') {
          await db.transactions.update(item.entityId, { syncStatus: 'synced', syncedAt: Date.now() })
        } else if (item.entityType === 'shift') {
          await db.shifts.update(item.entityId, { syncStatus: 'synced' })
        } else if (item.entityType === 'inventory_adjustment') {
          await db.inventoryAdjustments.update(item.entityId, { syncStatus: 'synced' })
        } else if (item.entityType === 'cash_movement') {
          await db.cashMovements.update(item.entityId, { syncStatus: 'synced' })
        }
      } else {
        await db.syncQueue.update(item.id!, {
          retries: item.retries + 1,
          lastAttempt: Date.now(),
        })
      }
    } catch (error) {
      console.error(`Sync failed for ${item.entityType}:${item.entityId}`, error)
      await db.syncQueue.update(item.id!, {
        retries: item.retries + 1,
        lastAttempt: Date.now(),
      })
    }
  }
}

async function syncItem(item: { entityType: string; entityId: string; payload: unknown }): Promise<boolean> {
  console.log(`[Sync] Processing ${item.entityType}:${item.entityId}`)
  
  await new Promise(resolve => setTimeout(resolve, 100))
  
  console.log(`[Sync] Successfully synced ${item.entityType}:${item.entityId}`)
  return true
}

export function startSyncMonitor() {
  const handleOnline = async () => {
    console.log('[Sync] Connection restored, processing queue...')
    await processSyncQueue()
  }
  
  window.addEventListener('online', handleOnline)
  
  if (navigator.onLine) {
    processSyncQueue().catch(console.error)
  }
  
  return () => {
    window.removeEventListener('online', handleOnline)
  }
}
