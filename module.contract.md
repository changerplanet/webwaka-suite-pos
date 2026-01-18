# Module Contract: Suite Pos

## Purpose

Point of Sale suite for retail and commerce. Offline-first, Mobile-first, PWA-enabled POS system designed for Nigerian retail environments.

## Capabilities

This module provides the following capabilities:

### Sales Operations
- `pos:sale.create` - Create new sales transactions
- `pos:sale.void` - Void existing sales (requires approval)

### Receipt Management
- `pos:receipt.view` - View transaction receipts
- `pos:receipt.generate` - Generate QR-coded receipts

### Shift Management
- `pos:shift.open` - Open a new shift with opening float
- `pos:shift.close` - Close shift with cash reconciliation
- `pos:shift.xreport` - Generate X-Report (mid-shift summary)
- `pos:shift.zreport` - Generate Z-Report (end-of-day settlement)

### Inventory Operations
- `pos:inventory.adjust` - Adjust inventory (damage, theft, correction, received, return)

### Cash Management
- `pos:cash.movement` - Record cash drops, pickups, and float adjustments

### Administrative
- `pos:approval.grant` - Approve pending adjustments and movements
- `pos:reports.view` - View supervisor dashboard and reports
- `pos:settings.edit` - Modify POS settings

## Dependencies

This module depends on:

- `webwaka-core-identity` - User authentication and session management
- `webwaka-core-permissions` - Role-based access control
- `webwaka-core-audit` - Audit trail logging
- `webwaka-core-receipts` - Receipt generation and storage
- `webwaka-core-payments` - Payment processing integration

## API Surface

### Public Interfaces

#### Cart Management
```typescript
interface Cart {
  id: string
  status: 'active' | 'completed' | 'cancelled'
  lineItems: CartLineItem[]
  subtotal: number
  totalTax: number
  totalDiscount: number
  grandTotal: number
  roundingAdjustment: number
}
```

#### Transaction
```typescript
interface Transaction {
  id: string
  cartId: string
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE'
  paymentAmount: number
  changeGiven: number
  receiptId?: string
  syncStatus: 'pending' | 'synced' | 'failed'
}
```

#### Shift
```typescript
interface Shift {
  id: string
  registerId: string
  locationId: string
  openedBy: string
  openedAt: number
  closedAt?: number
  openingFloat: number
  expectedCash: number
  actualCash?: number
  salesCount: number
  salesTotal: number
  status: 'open' | 'closed'
}
```

### Events

All sensitive actions emit audit events:

- `SALE_COMPLETED` - Sale transaction completed
- `SHIFT_OPENED` - New shift opened
- `SHIFT_CLOSED` - Shift closed with reconciliation
- `INVENTORY_ADJUSTED` - Inventory adjustment recorded
- `CASH_MOVEMENT` - Cash drop/pickup recorded
- `APPROVAL_GRANTED` - Pending item approved

## Data Models

### IndexedDB Tables (Dexie.js)

- `products` - Product catalog cache
- `carts` - Active and completed carts
- `transactions` - Payment transactions
- `shifts` - Shift records
- `registers` - Register configuration
- `locations` - Store locations
- `syncQueue` - Offline sync queue
- `inventoryAdjustments` - Inventory changes
- `cashMovements` - Cash movements

## Security Considerations

- All offline operations queued for sync when online
- No self-approval for adjustments (dual-control enforcement)
- Supervisor approval required for sensitive operations
- Tenant isolation enforced via locationId
- Session tokens stored securely (zustand persist)
- No localStorage usage (IndexedDB only via Dexie.js)

## Performance Expectations

- Offline-capable for all cash transactions
- Sub-100ms cart operations
- Background sync with retry logic
- PWA installable with app shell caching

## Nigeria-Specific Features

- VAT: 7.5% applied to all taxable items
- Cash rounding: ₦5 / ₦10 denominations
- Currency: Nigerian Naira (₦)

## Versioning

This module follows semantic versioning (semver).
