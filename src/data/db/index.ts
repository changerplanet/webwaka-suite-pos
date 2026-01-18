import Dexie, { Table } from 'dexie'

export interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: number
  taxRate: number
  categoryId: string
  imageUrl?: string
  barcode?: string
  inStock: boolean
  stockQuantity: number
  updatedAt: number
}

export interface CartLineItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
  lineTotal: number
  lineTax: number
}

export interface Cart {
  id: string
  status: 'active' | 'completed' | 'cancelled'
  lineItems: CartLineItem[]
  subtotal: number
  totalTax: number
  totalDiscount: number
  grandTotal: number
  roundingAdjustment: number
  customerRef?: string
  createdAt: number
  updatedAt: number
}

export interface Transaction {
  id: string
  cartId: string
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE'
  paymentAmount: number
  changeGiven: number
  receiptId?: string
  referenceNumber?: string
  proofUrl?: string
  status: 'pending' | 'completed' | 'synced' | 'failed'
  syncStatus: 'pending' | 'synced' | 'failed'
  auditTrail: AuditEntry[]
  offlineCreatedAt: number
  syncedAt?: number
}

export interface AuditEntry {
  action: string
  userId: string
  timestamp: number
  details?: Record<string, unknown>
}

export interface Shift {
  id: string
  registerId: string
  locationId: string
  openedBy: string
  openedByName: string
  openedAt: number
  closedBy?: string
  closedByName?: string
  closedAt?: number
  openingFloat: number
  expectedCash: number
  actualCash?: number
  cashDifference?: number
  salesCount: number
  salesTotal: number
  status: 'open' | 'closed'
  xReports: XReport[]
  zReport?: ZReport
  syncStatus: 'pending' | 'synced'
}

export interface XReport {
  id: string
  generatedAt: number
  generatedBy: string
  salesCount: number
  salesTotal: number
  cashTotal: number
  cardTotal: number
  transferTotal: number
}

export interface ZReport {
  id: string
  generatedAt: number
  generatedBy: string
  approvedBy?: string
  approvedAt?: number
  salesCount: number
  salesTotal: number
  cashTotal: number
  cardTotal: number
  transferTotal: number
  expectedCash: number
  actualCash: number
  variance: number
}

export interface Register {
  id: string
  name: string
  locationId: string
  floatAmount: number
  status: 'available' | 'in_use' | 'offline'
}

export interface Location {
  id: string
  name: string
  address: string
  timezone: string
}

export interface SyncQueueItem {
  id?: number
  entityType: 'transaction' | 'shift' | 'inventory_adjustment' | 'cash_movement'
  entityId: string
  payload: unknown
  retries: number
  createdAt: number
  lastAttempt?: number
}

export interface InventoryAdjustment {
  id: string
  productId: string
  productName: string
  quantityChange: number
  reason: 'damage' | 'theft' | 'correction' | 'received' | 'return'
  notes: string
  createdBy: string
  createdByName: string
  createdAt: number
  approvedBy?: string
  approvedByName?: string
  approvedAt?: number
  status: 'pending' | 'approved' | 'rejected'
  locationId: string
  syncStatus: 'pending' | 'synced'
}

export interface CashMovement {
  id: string
  type: 'drop' | 'pickup' | 'float_adjustment'
  amount: number
  fromLocation: string
  toLocation: string
  reason: string
  createdBy: string
  createdByName: string
  createdAt: number
  approvedBy?: string
  approvedByName?: string
  approvedAt?: number
  shiftId: string
  status: 'pending' | 'approved' | 'rejected'
  syncStatus: 'pending' | 'synced'
}

export class POSDatabase extends Dexie {
  products!: Table<Product>
  carts!: Table<Cart>
  transactions!: Table<Transaction>
  shifts!: Table<Shift>
  registers!: Table<Register>
  locations!: Table<Location>
  syncQueue!: Table<SyncQueueItem>
  inventoryAdjustments!: Table<InventoryAdjustment>
  cashMovements!: Table<CashMovement>

  constructor() {
    super('webwaka-pos')

    this.version(1).stores({
      products: 'id, sku, name, categoryId, barcode, updatedAt',
      carts: 'id, status, createdAt, updatedAt',
      transactions: 'id, cartId, paymentMethod, status, syncStatus, offlineCreatedAt',
      shifts: 'id, registerId, locationId, status, openedAt, syncStatus',
      registers: 'id, locationId, status',
      locations: 'id, name',
      syncQueue: '++id, entityType, entityId, createdAt',
      inventoryAdjustments: 'id, productId, status, createdAt, syncStatus',
      cashMovements: 'id, shiftId, type, status, createdAt, syncStatus',
    })
  }
}

export const db = new POSDatabase()
