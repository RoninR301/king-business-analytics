# KING BUSINESS ANALYTICS — Setup Guide

## Prerequisites

- Node.js 18+ (for local dev server)
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- Modern browser (Chrome, Firefox, Edge, Safari)

## 1. Firebase Project Setup

1. Create a new Firebase project
2. Enable **Authentication** → Email/Password sign-in
3. Create **Firestore Database** (production mode)
4. Create **Storage** bucket
5. Register a **Web App** and copy config values

## 2. Configure the Application

```bash
cp firebase/config.template.js firebase/config.js
```

Edit `firebase/config.js` with your Firebase credentials.

> **Important:** Add `firebase/config.js` to `.gitignore` (already configured). Never commit real API keys.

## 3. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools
firebase login
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage
```

Copy rules from:
- `firebase/firestore.rules`
- `firebase/storage.rules`

## 4. Firestore Indexes

Create composite indexes when prompted by Firebase console errors:

| Collection | Fields |
|------------|--------|
| sales | shopId ASC, createdAt DESC |
| invoices | shopId ASC, createdAt DESC |
| analytics | ownerId ASC, date ASC |

## 5. Run Locally

ES modules require a local HTTP server (not `file://`):

```bash
# Option A: npx serve
npx serve .

# Option B: Python
python -m http.server 8080

# Option C: VS Code Live Server extension
```

Open `http://localhost:3000` (or your port).

## 6. First Use

1. Open the landing page
2. Click **Sign Up** → Register as owner
3. Login → **Shops** → Create your first shop with manager account
4. Manager logs in at **Login → Manager Login**
5. Manager records sales, customers, udhari, invoices

## 7. Production Deployment

Deploy static files to:
- Firebase Hosting (recommended)
- Netlify / Vercel / Cloudflare Pages

```bash
firebase init hosting
firebase deploy --only hosting
```

## Environment Notes

- Data persists in Firebase (cross-device, cross-browser)
- Manager accounts are created via secondary Firebase app instance (owner session preserved)
- For enterprise scale, migrate manager creation to Cloud Functions + Admin SDK
