import { settingsService } from './services.js';
import { settingsStore } from './store.js';
import { renderSettingsForm } from './ui.js';
import { getFormData } from '../../components/form.js';
import { showToast } from '../../components/toast.js';
import { authStore } from '../auth/store.js';

export const settingsController = {
  async init(container) {
    const user = authStore.getUser();
    const settings = await settingsService.get(user.uid);
    settingsStore.set(settings);

    container.innerHTML = `
      <div class="page-title"><h1>Settings</h1><p>Configure platform preferences</p></div>
      ${renderSettingsForm(settings)}
    `;

    document.getElementById('settings-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = getFormData(e.target);
      data.showManagerOnInvoice = e.target.showManagerOnInvoice?.checked ?? false;
      data.defaultTaxRate = Number(data.defaultTaxRate) || 0;

      try {
        const updated = await settingsService.save(user.uid, data);
        settingsStore.set(updated);
        settingsService.applyTheme(data.theme);
        showToast('Settings saved', 'success');
      } catch (err) {
        showToast(err.message || 'Save failed', 'error');
      }
    });
  }
};
