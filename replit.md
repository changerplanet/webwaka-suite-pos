# WebWaka Suite POS

## Overview
Offline-first, Mobile-first Point of Sale system for Nigerian retail and commerce. Part of the WebWaka Modular Rebuild initiative.

**Current State:** Phase 3A Implementation Complete

## Project Structure
```
/
├── src/
│   ├── app/                    # App shell, routing, layout
│   │   ├── App.tsx            # Main app with routes
│   │   ├── Layout.tsx         # Navigation layout
│   │   ├── LoginPage.tsx      # Authentication UI
│   │   └── index.css          # Global styles (Tailwind)
│   ├── modules/
│   │   ├── pos/               # POS module
│   │   │   ├── POSPage.tsx    # Main POS interface
│   │   │   ├── cartStore.ts   # Cart state management
│   │   │   ├── SupervisorDashboard.tsx
│   │   │   └── components/    # Cart, Payment, Search
│   │   ├── catalog/           # Product catalog
│   │   ├── shifts/            # Shift management
│   │   └── payments/          # Payment history
│   ├── shared/
│   │   ├── hooks/             # React hooks
│   │   ├── ui/                # Shared components
│   │   └── utils/             # Currency, calculations
│   ├── data/
│   │   └── db/                # Dexie database schema
│   └── services/
│       └── identity.ts        # Auth service (mock)
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── favicon.svg            # App icon
├── module.manifest.json       # WebWaka module spec
├── module.contract.md         # API contract
└── package.json
```

## Technical Stack
- **Runtime:** Node.js 20
- **Build:** Vite
- **UI:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **State:** Zustand (with persist)
- **Forms:** React Hook Form + Zod
- **Database:** Dexie.js (IndexedDB)
- **PWA:** Service worker with offline caching
- **QR:** qrcode library

## Running the Application
```bash
npm run dev     # Development server (port 5000)
npm run build   # Production build
npm run preview # Preview production build
```

## Test Accounts
| Username   | Password | Role       |
|------------|----------|------------|
| cashier    | 1234     | Cashier    |
| supervisor | 1234     | Supervisor |
| manager    | 1234     | Manager    |

## Key Features
- **Offline-First:** All cash sales work offline
- **VAT 7.5%:** Nigeria VAT auto-calculated
- **Cash Rounding:** ₦5/₦10 denominations
- **Shift Management:** X/Z Reports
- **Inventory Adjustments:** With approval workflow
- **QR Receipts:** Scannable digital receipts

## Recent Changes
- 2026-01-18: Phase 3A POS Suite implementation complete
  - Product search, cart, payments
  - Shift management with reports
  - Inventory adjustments
  - Cash movements
  - Supervisor dashboard

## User Preferences
- Mobile-first responsive design
- Offline-first architecture
- No demo mode / mock bypasses
- All sensitive actions audited
