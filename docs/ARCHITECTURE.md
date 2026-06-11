# Architecture Documentation

## Overview

KING BUSINESS ANALYTICS is a modular vanilla JavaScript SaaS platform using Firebase as the single source of truth.

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  index.html │ pages/admin/* │ pages/manager/* │ auth   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    Application Layer                     │
│  js/app.js │ core/router │ core/auth-guard │ components │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                     Feature Modules                      │
│  auth │ shops │ managers │ sales │ billing │ customers  │
│  udhari │ analytics │ backup │ settings │ [future]     │
└──────────────────────────┬──────────────────────────────┘
                           │ Event Bus (decoupled)
┌──────────────────────────▼──────────────────────────────┐
│                      Firebase Layer                      │
│  Auth │ Firestore │ Storage                             │
└─────────────────────────────────────────────────────────┘
```

## Module Pattern

Each feature module contains:

| File | Responsibility |
|------|----------------|
| `services.js` | Firebase CRUD, business logic |
| `store.js` | Client-side cache/state |
| `ui.js` | HTML template rendering |
| `controller.js` | Page wiring, events |

## Decoupling Strategy

- **Event Bus** (`core/event-bus.js`) — modules emit events instead of direct calls
- **Sales → Analytics** — sale created emits event; analytics listens and aggregates
- **Sales → Billing** — orchestrated in sales controller, but billing service is independent
- **Customer module** — standalone; sales calls `findOrCreate` via service import only

## Role-Based Access

| Role | Access |
|------|--------|
| `owner` | All shops, analytics, settings, backup |
| `manager` | Assigned shop only (enforced by Firestore rules + auth-guard) |

## Data Relationships

```
users (owner/manager)
  └── shops (ownerId)
        ├── managers (shopId)
        ├── sales (shopId)
        ├── customers (shopId)
        ├── invoices (shopId)
        ├── udhari (shopId)
        └── analytics (shopId + date)
settings (ownerId)
backup (ownerId)
```

## Future Modules

Placeholder modules in `modules/inventory/`, `barcode/`, `expenses/`, etc. are registered in `core/module-loader.js` with `enabled: false`. Enable when implementing:

```javascript
FUTURE_MODULES.inventory.enabled = true;
```

## CSS Architecture

- `css/variables.css` — design tokens, light/dark themes
- `css/base.css` — reset, typography
- `css/components.css` — reusable UI components
- `css/layout.css` — app shell, landing page
- `css/responsive.css` — mobile-first breakpoints

## Scalability Considerations

- Firestore composite indexes for query performance
- Analytics pre-aggregated by shop+date (avoids full collection scans)
- Batch writes for backup import (400 docs per batch)
- Lazy-loaded Chart.js and jsPDF via CDN ESM imports
