/**
 * Client-side route guard and navigation utilities.
 */
import { appState } from './state-manager.js';

const BASE_PATH = getBasePath();

function getBasePath() {
  const path = window.location.pathname;
  const idx = path.indexOf('/pages/');
  if (idx === -1) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1 && parts[parts.length - 1].endsWith('.html')) {
      return '/' + parts.slice(0, -1).join('/');
    }
    return '';
  }
  return path.substring(0, idx);
}

export function resolvePath(relativePath) {
  if (relativePath.startsWith('http') || relativePath.startsWith('/')) {
    return relativePath;
  }
  const clean = relativePath.replace(/^\.\//, '');
  if (BASE_PATH) {
    return `${BASE_PATH}/${clean}`;
  }
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  const prefix = depth > 0 ? '../'.repeat(depth) : '';
  return `${prefix}${clean}`;
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
