export function renderBackupPanel() {
  return `
    <div class="content-grid content-grid--2">
      <div class="card">
        <div class="card__header"><h3 class="card__title">Export Data</h3></div>
        <p style="color: var(--color-text-muted); margin-bottom: var(--space-4); font-size: 0.9375rem">
          Download a complete backup of all your business data.
        </p>
        <div style="display:flex; flex-wrap:wrap; gap:var(--space-3)">
          <button class="btn btn--primary" id="export-json">Export JSON</button>
          <button class="btn btn--outline" id="export-csv">Export CSV (Sales)</button>
        </div>
        <div id="export-status" style="margin-top: var(--space-4); font-size: 0.875rem; color: var(--color-text-muted)"></div>
      </div>
      <div class="card">
        <div class="card__header"><h3 class="card__title">Import / Restore</h3></div>
        <p style="color: var(--color-text-muted); margin-bottom: var(--space-4); font-size: 0.9375rem">
          Restore data from a previous JSON or CSV backup.
        </p>
        <div class="form-group">
          <label class="form-label">Select backup file</label>
          <input class="form-input" type="file" id="import-file" accept=".json,.csv" />
        </div>
        <button class="btn btn--accent" id="import-data">Import & Restore</button>
        <p class="form-hint" style="margin-top: var(--space-3)">JSON restores full data. CSV imports sales records only.</p>
      </div>
    </div>
  `;
}
