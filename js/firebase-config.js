/**
 * Firebase Configuration & Initialization — Single Source of Truth
 *
 * This is the ONLY place Firebase is initialized. Every module must import
 * `app`, `auth`, and `db` (and `storage`) from this file. Do NOT call
 * initializeApp / getAuth / getFirestore anywhere else.
 *
 * NOTE: A Firebase Web (client) config is not a secret — it only identifies
 * the project. Access is enforced by Firestore/Storage security rules.
 */
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyAcSwm4215SiXq5U6egxoGnGhM6yA8b3ik',
  authDomain: 'king-business-analytics.firebaseapp.com',
  projectId: 'king-business-analytics',
  storageBucket: 'king-business-analytics.firebasestorage.app',
  messagingSenderId: '956492998028',
  appId: '1:956492998028:web:f915dcf049d5cd672de2a9',
  measurementId: 'G-GEW617VDVB'
};

// Reuse an existing app instance if one already exists (prevents duplicate-init
// errors during hot reloads or when multiple entry points load this module).
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Keep the user signed in across page reloads / tabs.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[KBA] Could not set auth persistence:', err?.message || err);
});

// Optional local emulator support — opt in with `window.KBA_USE_EMULATORS = true`.
const useEmulators =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  window.KBA_USE_EMULATORS === true;

if (useEmulators) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}
