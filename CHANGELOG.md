# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- ESC/POS printer integration
- Barcode scanner support
- Customer display integration
- Multi-currency support

## [0.1.0] - 2026-01-18

### Added

#### Phase 3A.1 - POS Core (Offline-First Sales)
- Product search with offline cache (IndexedDB via Dexie.js)
- Cart management with add, update, remove operations
- Quantity and price calculations
- VAT 7.5% (Nigeria) automatic calculation
- ₦5 / ₦10 cash rounding
- IndexedDB persistence for cart state
- Resume cart after refresh / power loss
- Offline sales completion with CASH payment

#### Phase 3A.2 - Payments & Receipts Integration
- CASH payment (offline allowed)
- BANK_TRANSFER payment with reference number (offline allowed)
- CARD payment (online only)
- MOBILE payment (online only)
- QR code receipt generation
- Transaction sync queue for offline operations

#### Phase 3A.3 - Shifts, Registers & Reconciliation
- Open shift with location and float
- Close shift with cash reconciliation
- X-Report generation (mid-shift summary)
- Z-Report generation (end-of-day settlement)
- Cash variance tracking
- Supervisor approval workflow

#### Phase 3A.4 - Advanced POS Operations
- Inventory adjustments (damage, theft, correction, received, return)
- Cash movements (drop, pickup, float adjustment)
- Supervisor dashboard (read-only view)
- Multi-location awareness
- Dual-control enforcement (no self-approval)

#### Infrastructure
- Vite + React + TypeScript setup
- Tailwind CSS for mobile-first UI
- PWA with service worker
- Zustand for state management
- React Hook Form + Zod for form validation
- Dexie.js for IndexedDB operations
- QRCode generation for receipts

### Security
- All actions emit audit events
- Permission-based access control
- No localStorage usage
- Offline operations queued for sync
