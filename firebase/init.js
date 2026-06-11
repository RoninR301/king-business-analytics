/**
 * Firebase Initialization
 * Single entry point for all Firebase services.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

let firebaseConfig;
try {
  const configModule = await import('./config.js');
  firebaseConfig = configModule.firebaseConfig;
} catch {
  const templateModule = await import('./config.template.js');
  firebaseConfig = templateModule.firebaseConfig;
  console.warn('[KBA] Using template Firebase config. Copy firebase/config.template.js to firebase/config.js');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const useEmulators = typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.KBA_USE_EMULATORS === true;

if (useEmulators) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { app };
