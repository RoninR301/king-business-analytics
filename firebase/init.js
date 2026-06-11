/**
 * Firebase Initialization (compatibility shim)
 *
 * Firebase is now initialized exactly once in `js/firebase-config.js`.
 * This file simply re-exports those singletons so existing modules that
 * import from `../../firebase/init.js` keep working without duplicating
 * initialization.
 */
export { app, auth, db, storage, firebaseConfig } from '../js/firebase-config.js';
