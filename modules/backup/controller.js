import { backupService } from './services.js';
import { backupStore } from './store.js';
import { renderBackupPanel } from './ui.js';
import { showToast } from '../../components/toast.js';
import { authStore } from '../auth/store.js';
import { readFileAsText } from '../../utils/helpers.js';

export const backupController = {
  async init(container) {
    container.innerHTML = `
      <div class="page-title"><h1>Backup & Restore</h1><p>Export and import your business data</p></div>
      ${renderBackupPanel()}
    `;

    document.getElementById('export-json').addEventListener('click', () => this.exportJSON());
    document.getElementById('export-csv').addEventListener('click', () => this.exportCSV());
    document.getElementById('import-data').addEventListener('click', () => this.importData());
  },

  async exportJSON() {
    const btn = document.getElementById('export-json');
    btn.disabled = true;
    btn.textContent = 'Exporting...';

    try {
      const user = authStore.getUser();
      const data = await backupService.exportAll(user.uid);
      backupStore.setLastExport(data);
      backupService.downloadJSON(data);
      document.getElementById('export-status').textContent =
        `Exported ${backupService.countRecords(data)} records`;
      showToast('JSON backup downloaded', 'success');
    } catch (err) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Export JSON';
    }
  },

  async exportCSV() {
    try {
      const user = authStore.getUser();
      const data = backupStore.getLastExport() || await backupService.exportAll(user.uid);
      backupService.downloadCSV(data);
      showToast('CSV exported', 'success');
    } catch (err) {
      showToast(err.message || 'CSV export failed', 'error');
    }
  },

  async importData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) return showToast('Select a file first', 'error');

    if (!confirm('This will merge imported data with existing records. Continue?')) return;

    try {
      const text = await readFileAsText(file);
      const type = file.name.endsWith('.csv') ? 'csv' : 'json';
      const data = backupService.parseImportFile(text, type);
      const user = authStore.getUser();
      const count = await backupService.importJSON(user.uid, data);
      showToast(`Imported ${count} records`, 'success');
    } catch (err) {
      showToast(err.message || 'Import failed', 'error');
    }
  }
};
