/**
 * Client-side route guard and navigation utilities.
 */
import { appState } from './state-manager.js';

const BASE_PATH = getBasePath();

function getBasePath() {
  const path = window.location.pathname;
  // Pages live under `/pages/...`; everything before that segment is the
  // site root (handles both GitHub Pages project sites and local servers).
  const idx = path.indexOf('/pages/');
  if (idx !== -1) return path.substring(0, idx);
  // Otherwise we are at a root-level document — an actual file
  // (index.html, firebase-test.html) OR a directory URL such as
  // `/repo/` (GitHub Pages) or `/` (local). In every case the base is the
  // directory that contains the current document.
  return path.substring(0, path.lastIndexOf('/'));
}

/**
 * Resolve an app-relative path (e.g. `pages/auth/login.html`) to an absolute
 * URL path rooted at the deployment base. Returning an absolute path means the
 * result is correct no matter how deep the current page is, which is what makes
 * navigation reliable on GitHub Pages project sites and on bare directory URLs.
 */
export function resolvePath(relativePath) {
  if (relativePath.startsWith('http') || relativePath.startsWith('/')) {
    return relativePath;
  }
  const clean = relativePath.replace(/^\.\//, '');
  return `${BASE_PATH}/${clean}`;
}

export function navigateTo(path) {
  window.location.href = resolvePath(path);
}

export function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

export function requireRole(allowedRoles) {
  const user = appState.get('user');
  if (!user) {
    navigateTo('pages/auth/login.html');
    return false;
  }
  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'owner') {
      navigateTo('pages/admin/dashboard.html');
    } else {
      navigateTo('pages/manager/dashboard.html');
    }
    return false;
  }
  return true;
}

export function redirectByRole() {
  const user = appState.get('user');
  if (!user) return;
  if (user.role === 'owner') {
    navigateTo('pages/admin/dashboard.html');
  } else if (user.role === 'manager') {
    navigateTo('pages/manager/dashboard.html');
  }
}

export { BASE_PATH };
