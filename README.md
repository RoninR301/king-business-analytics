# KING BUSINESS ANALYTICS

Cloud-based **Multi-Shop Business Management Platform** built with vanilla HTML, CSS, JavaScript (ES Modules) and Firebase.

## Features

- **Multi-shop management** — One owner, unlimited shops, unique Shop IDs
- **Role-based access** — Owner dashboard + per-shop manager logins
- **Dynamic sales forms** — Category-specific fields (Clothing, Mobile, Medical, Restaurant, etc.)
- **Customer & Udhari modules** — Purchase history, credit tracking
- **Professional invoicing** — PDF download and print via jsPDF
- **Analytics dashboard** — Chart.js charts, date filters, shop rankings
- **Backup & restore** — JSON and CSV export/import
- **Responsive UI** — Mobile-first, works on all devices
- **Dark theme ready** — CSS variable architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JS (ES Modules) |
| Backend | Firebase Auth, Firestore, Storage |
| Charts | Chart.js |
| PDF | jsPDF |

## Quick Start

1. Copy `firebase/config.template.js` → `firebase/config.js` and add your Firebase credentials
2. Deploy Firestore and Storage rules from `firebase/`
3. Run a local server: `npx serve .`
4. Open `http://localhost:3000`

See [docs/SETUP.md](docs/SETUP.md) for full instructions.

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Firestore Schema](docs/SCHEMA.md)
- [Development Roadmap](docs/ROADMAP.md)

## Project Structure

```
king-business-analytics/
├── assets/           # Static assets
├── css/              # Design system
├── js/               # App bootstrap
├── pages/            # HTML pages (admin, manager, auth)
├── firebase/         # Config, rules, init
├── components/       # Shared UI components
├── modules/          # Feature modules (auth, shops, sales, ...)
├── core/             # Router, auth-guard, event-bus
├── utils/            # Helpers, PDF, CSV, validators
├── database/         # Collection schema definitions
└── docs/             # Documentation
```

## License

Proprietary — KING BUSINESS ANALYTICS
