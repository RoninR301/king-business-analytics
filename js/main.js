/**
 * Landing page interactions
 */
import { icons } from '../components/icons.js';
import { resolvePath } from '../core/router.js';
import { settingsService } from '../modules/settings/services.js';

document.addEventListener('DOMContentLoaded', () => {
  settingsService.loadTheme();

  const logoEl = document.getElementById('nav-logo');
  if (logoEl) logoEl.innerHTML = icons.logo;

  document.querySelectorAll('[data-href]').forEach((el) => {
    el.addEventListener('click', () => {
      window.location.href = resolvePath(el.dataset.href);
    });
  });

  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  mobileMenuBtn?.addEventListener('click', () => {
    mobileNav?.classList.toggle('is-open');
  });
});
