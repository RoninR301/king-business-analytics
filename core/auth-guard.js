/**
 * Authentication guard — protects pages by role.
 */
import { appState } from './state-manager.js';
import { navigateTo, requireRole } from './router.js';
import { authService } from '../modules/auth/services.js';

export async function initAuthGuard(options = {}) {
  const { roles = [], redirectTo = 'pages/auth/login.html', onReady } = options;

  appState.set({ loading: true });

  try {
    const user = await authService.waitForSession();
    if (!user) {
      navigateTo(redirectTo);
      return null;
    }

    appState.set({ user, loading: false });

    if (roles.length && !roles.includes(user.role)) {
      requireRole(roles);
      return null;
    }

    if (user.role === 'manager' && user.shopId) {
      const { shopService } = await import('../modules/shops/services.js');
      const shop = await shopService.getById(user.shopId);
      appState.set({ shop });
    }

    if (onReady) await onReady(user);
    return user;
  } catch (err) {
    console.error('[AuthGuard]', err);
    navigateTo(redirectTo);
    return null;
  }
}

export function isOwner() {
  return appState.get('user')?.role === 'owner';
}

export function isManager() {
  return appState.get('user')?.role === 'manager';
}

export function getCurrentShopId() {
  const user = appState.get('user');
  if (user?.role === 'manager') return user.shopId;
  return appState.get('shop')?.id || null;
}
