import { icons } from './icons.js';
import { escapeHtml } from '../utils/helpers.js';
import { appState } from '../core/state-manager.js';

export function renderHeader(title, subtitle = '') {
  const user = appState.get('user');
  return `
    <header class="app-header">
      <div style="display: flex; align-items: center; gap: var(--space-3)">
        <button type="button" class="btn btn--ghost sidebar-toggle" id="sidebar-toggle" aria-label="Open menu">${icons.menu}</button>
        <div>
          <h2 style="font-size: 1.125rem; margin: 0">${escapeHtml(title)}</h2>
          ${subtitle ? `<p style="font-size: 0.8125rem; color: var(--color-text-muted); margin: 0">${escapeHtml(subtitle)}</p>` : ''}
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: var(--space-3)">
        ${user ? `<span style="font-size: 0.875rem; color: var(--color-text-muted)">${escapeHtml(user.name)}</span>` : ''}
      </div>
    </header>
  `;
}
