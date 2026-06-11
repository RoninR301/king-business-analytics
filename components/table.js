import { escapeHtml } from '../utils/helpers.js';
import { icons } from './icons.js';

export function renderTable({ columns, rows, emptyMessage = 'No data found' }) {
  if (!rows.length) {
    return `<div class="empty-state">${icons.empty}<p>${escapeHtml(emptyMessage)}</p></div>`;
  }

  const headers = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const body = rows.map((row) => {
    const cells = columns.map((c) => {
      const value = c.render ? c.render(row) : escapeHtml(String(row[c.key] ?? '—'));
      return `<td>${value}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead><tr>${headers}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}
