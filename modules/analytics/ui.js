import { renderTable } from '../../components/table.js';
import { escapeHtml } from '../../utils/helpers.js';
import { formatCurrency, formatNumber } from '../../utils/formatters.js';

export function renderStatsCards(stats) {
  const cards = [
    { label: 'Total Shops', value: stats.totalShops },
    { label: 'Total Sales', value: formatNumber(stats.totalSales) },
    { label: 'Total Customers', value: formatNumber(stats.totalCustomers) },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue) }
  ];

  return `
    <div class="stats-grid">
      ${cards.map((c) => `
        <div class="card stat-card">
          <span class="stat-card__label">${c.label}</span>
          <span class="stat-card__value">${c.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

export function renderDateFilters(current = '30days') {
  const presets = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: '7 Days' },
    { value: '15days', label: '15 Days' },
    { value: '30days', label: '30 Days' },
    { value: 'custom', label: 'Custom' }
  ];

  return `
    <div class="filter-bar">
      ${presets.map((p) => `
        <button class="btn btn--sm ${current === p.value ? 'btn--primary' : 'btn--outline'} date-filter" data-preset="${p.value}">${p.label}</button>
      `).join('')}
      <div id="custom-date-range" style="display:${current === 'custom' ? 'flex' : 'none'}; gap:var(--space-2); align-items:center">
        <input class="form-input" type="date" id="date-start" />
        <span>to</span>
        <input class="form-input" type="date" id="date-end" />
        <button class="btn btn--sm btn--primary" id="apply-custom-range">Apply</button>
      </div>
    </div>
  `;
}

export function renderShopRankings(stats) {
  return `
    <div class="content-grid content-grid--2">
      <div class="card">
        <div class="card__header"><h3 class="card__title">Best Performing Shop</h3></div>
        ${stats.bestShop ? `
          <p><strong>${escapeHtml(stats.bestShop.shopName)}</strong></p>
          <p>Revenue: ${formatCurrency(stats.bestShop.revenue)}</p>
          <p>Sales: ${stats.bestShop.salesCount}</p>
        ` : '<p>No data yet</p>'}
      </div>
      <div class="card">
        <div class="card__header"><h3 class="card__title">Lowest Performing Shop</h3></div>
        ${stats.worstShop && stats.totalShops > 1 ? `
          <p><strong>${escapeHtml(stats.worstShop.shopName)}</strong></p>
          <p>Revenue: ${formatCurrency(stats.worstShop.revenue)}</p>
          <p>Sales: ${stats.worstShop.salesCount}</p>
        ` : '<p>—</p>'}
      </div>
    </div>
  `;
}

export function renderShopReports(shopStats) {
  return renderTable({
    columns: [
      { label: 'Shop', render: (r) => escapeHtml(r.shopName) },
      { label: 'Shop ID', key: 'shopCode' },
      { label: 'Revenue', render: (r) => formatCurrency(r.revenue) },
      { label: 'Sales', key: 'salesCount' },
      { label: 'Customers', key: 'customerCount' }
    ],
    rows: shopStats,
    emptyMessage: 'No shop data for selected period'
  });
}

export function renderChartSection() {
  return `
    <div class="content-grid" style="margin-top: var(--space-6)">
      <div class="card">
        <div class="card__header"><h3 class="card__title">Daily Sales</h3></div>
        <div class="chart-container"><canvas id="chart-daily"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><h3 class="card__title">Weekly Sales</h3></div>
        <div class="chart-container"><canvas id="chart-weekly"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><h3 class="card__title">Monthly Sales</h3></div>
        <div class="chart-container"><canvas id="chart-monthly"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><h3 class="card__title">Top Products</h3></div>
        <div class="chart-container"><canvas id="chart-products"></canvas></div>
      </div>
    </div>
  `;
}
