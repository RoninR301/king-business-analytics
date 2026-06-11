/**
 * Authentication helpers — built on the single Firebase instance.
 *
 * Public API:
 *   loginUser(email, password)
 *   logoutUser()
 *   getCurrentUser()       -> resolves the Firebase user (or null) once auth is ready
 *   getCurrentProfile()    -> resolves the Firestore user profile (or null)
 *   requireAuth(options)   -> guards a protected page, redirects if unauthenticated
 *   onAuthChange(callback)
 */
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const USERS_COLLECTION = 'users';

let _ready = false;
let _currentUser = null;
let _currentProfile = null;
let _resolveReady;
const _readyPromise = new Promise((resolve) => {
  _resolveReady = resolve;
});

onAuthStateChanged(auth, async (user) => {
  _currentUser = user;
  _currentProfile = user ? await fetchProfile(user.uid) : null;
  if (!_ready) {
    _ready = true;
    _resolveReady();
  }
});

async function fetchProfile(uid) {
  try {
    const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
    return snap.exists() ? { uid, ...snap.data() } : null;
  } catch (err) {
    console.error('[KBA][auth] Failed to load profile:', err);
    return null;
  }
}

/** Wait until the first auth-state resolution has happened. */
function waitForReady() {
  return _readyPromise;
}

/**
 * Sign in with email/password. Session persists across reloads.
 * @returns {Promise<{user: import('firebase/auth').User, profile: object|null}>}
 */
export async function loginUser(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, String(email).trim(), password);
  _currentUser = credential.user;
  _currentProfile = await fetchProfile(credential.user.uid);
  return { user: credential.user, profile: _currentProfile };
}

/** Sign the current user out. */
export async function logoutUser() {
  await signOut(auth);
  _currentUser = null;
  _currentProfile = null;
}

/** Resolve the current Firebase user once auth state is known (or null). */
export async function getCurrentUser() {
  await waitForReady();
  return _currentUser;
}

/** Resolve the current Firestore user profile once auth state is known (or null). */
export async function getCurrentProfile() {
  await waitForReady();
  return _currentProfile;
}

/** Subscribe to auth-state changes. Returns an unsubscribe function. */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    const profile = user ? await fetchProfile(user.uid) : null;
    callback(user, profile);
  });
}

/**
 * Protect a page. Redirects unauthenticated users to the login page and,
 * optionally, enforces a set of allowed roles.
 *
 * @param {Object} [options]
 * @param {string[]} [options.roles] Allowed roles (e.g. ['admin','owner']). Empty = any authenticated user.
 * @param {string} [options.loginPath] Path to the login page relative to the document.
 * @returns {Promise<{user: object, profile: object}|null>}
 */
export async function requireAuth(options = {}) {
  const { roles = [], loginPath = resolveLoginPath() } = options;
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = loginPath;
    return null;
  }

  const profile = await getCurrentProfile();

  if (roles.length && (!profile || !roles.includes(profile.role))) {
    // Authenticated but wrong role — send to their own dashboard if known.
    redirectByRole(profile);
    return null;
  }

  return { user, profile };
}

function redirectByRole(profile) {
  const base = computeBase();
  if (profile?.role === 'manager') {
    window.location.href = `${base}pages/manager/dashboard.html`;
  } else {
    window.location.href = `${base}pages/admin/dashboard.html`;
  }
}

/** Best-effort path to the login page from any nesting depth. */
function resolveLoginPath() {
  return `${computeBase()}pages/auth/login.html`;
}

function computeBase() {
  const path = window.location.pathname;
  const idx = path.indexOf('/pages/');
  if (idx !== -1) {
    const root = path.substring(0, idx);
    return root ? `${root}/` : '/';
  }
  // At project root (e.g. /index.html or /firebase-test.html)
  const dir = path.substring(0, path.lastIndexOf('/') + 1);
  return dir || '/';
}
