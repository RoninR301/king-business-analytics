/**
 * KING BUSINESS ANALYTICS — Application Bootstrap
 */
import { initAuthGuard } from '../core/auth-guard.js';
import { renderSidebar, initSidebar } from '../components/sidebar.js';
import { renderHeader } from '../components/header.js';
import { authController } from '../modules/auth/controller.js';
import { authStore } from '../modules/auth/store.js';
import { settingsService } from '../modules/settings/services.js';
import '../components/toast.js';

export async function initApp(config) {
  const { roles = [], title = '', subtitle = '', controller } = config;

  settingsService.loadTheme();

  const user = await initAuthGuard({ roles });
  if (!user) return;

  authStore.setUser(user);

  const shell = document.getElementById('app-shell');
  if (shell) {
    shell.innerHTML = `
      ${renderSidebar(user.role)}
      <div class="app-main">
        <div id="app-header"></div>
        <main class="app-content" id="app-content"></main>
      </div>
    `;
    document.getElementById('app-header').innerHTML = renderHeader(title, subtitle);
    initSidebar();

    document.getElementById('logout-btn')?.addEventListener('click', () => authController.handleLogout());
  }

  const container = document.getElementById('app-content');
  if (controller && container) {
    await controller.init(container);
  }
}
