import { analyticsService } from '../analytics/services.js';
import { salesService } from '../sales/services.js';
import { udhariService } from '../udhari/services.js';
import { authStore } from '../auth/store.js';
import { appState } from '../../core/state-manager.js';
import { renderStatsCards } from '../analytics/ui.js';
import { formatCurrency, formatDateTime } from '../../utils/formatters.js';
import { escapeHtml } from '../../utils/helpers.js';
import { toISODate } from '../../utils/formatters.js';
import { getDateRange } from '../../utils/date-utils.js';

export const dashboardController = {
  async initAdmin(container) {
    const user = authStore.getUser();
    const range = getDateRange('30days');
    const stats = await analyticsService.getDashboardStats(user.uid, {
      start: toISODate(range.start),
      end: toISODate(range.end)
    });

    // Live totals straight from Firestore (revenue & profit reflect actual sales).
    try {
      const allSales = await salesService.getByOwner(user.uid);
      stats.totalSales = allSales.length;
      stats.totalRevenue = allSales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
      stats.totalProfit = allSales.reduce((sum, s) => sum + (Number(s.profit) || 0), 0);
      const { getProducts } = await import('../../js/firestore-service.js');
      const shopIds = [...new Set(allSales.map((s) => s.shopId).filter(Boolean))];
      const productCounts = await Promise.all(shopIds.map((id) => getProducts(id).then((p) => p.length)));
      stats.totalProducts = productCounts.reduce((a, b) => a + b, 0);
    } catch (err) {
      console.warn('[KBA][dashboard] live totals fallback:', err?.message || err);
    }

    container.innerHTML = `
      <div class="page-title"><h1>Owner Dashboard</h1><p>Overview of all your shops</p></div>
      ${renderStatsCards(stats)}
      <div class="card" style="margin-top: var(--space-6)">
        <div class="card__header">
          <h3 class="card__title">Quick Actions</h3>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:var(--space-3)">
          <a href="shops.html" class="btn btn--primary">Manage Shops</a>
          <a href="analytics.html" class="btn btn--outline">View Analytics</a>
          <a href="backup.html" class="btn btn--outline">Backup Data</a>
        </div>
      </div>
      <div class="card" style="margin-top: var(--space-4)">
        <div class="card__header"><h3 class="card__title">Top Performing Shop</h3></div>
        ${stats.bestShop ? `
          <p><strong>${escapeHtml(stats.bestShop.shopName)}</strong> — ${formatCurrency(stats.bestShop.revenue)} revenue</p>
        ` : '<p style="color:var(--color-text-muted)">Create shops and record sales to see rankings</p>'}
      </div>
    `;
  },

  async initManager(container) {
    const shop = appState.get('shop');
    if (!shop) {
      container.innerHTML = '<div class="empty-state"><p>Shop not assigned. Contact owner.</p></div>';
      return;
    }

    const sales = await salesService.getByShop(shop.id);
    const udhari = await udhariService.getByShop(shop.id);
    const pendingUdhari = udhari.filter((u) => u.status !== 'paid');
    const todayRevenue = sales
      .filter((s) => {
        const d = s.createdAt?.toDate?.() || new Date(s.createdAt);
        return d.toDateString() === new Date().toDateString();
      })
      .reduce((sum, s) => sum + (s.grandTotal || 0), 0);

    const recentSales = sales.slice(0, 5);

    container.innerHTML = `
      <div class="page-title"><h1>${escapeHtml(shop.name)}</h1><p>Shop ID: ${escapeHtml(shop.shopCode)}</p></div>
      <div class="stats-grid">
        <div class="card stat-card"><span class="stat-card__label">Today's Revenue</span><span class="stat-card__value">${formatCurrency(todayRevenue)}</span></div>
        <div class="card stat-card"><span class="stat-card__label">Total Sales</span><span class="stat-card__value">${sales.length}</span></div>
        <div class="card stat-card"><span class="stat-card__label">Pending Udhari</span><span class="stat-card__value">${pendingUdhari.length}</span></div>
      </div>
      <div class="content-grid content-grid--2" style="margin-top: var(--space-6)">
        <div class="card">
          <div class="card__header"><h3 class="card__title">Recent Sales</h3></div>
          ${recentSales.length ? `
            <ul style="display:flex; flex-direction:column; gap:var(--space-3)">
              ${recentSales.map((s) => `
                <li style="display:flex; justify-content:space-between; font-size:0.875rem">
                  <span>${escapeHtml(s.customer?.name || 'Walk-in')}</span>
                  <span>${formatCurrency(s.grandTotal)} · ${formatDateTime(s.createdAt)}</span>
                </li>
              `).join('')}
            </ul>
          ` : '<p style="color:var(--color-text-muted)">No sales yet</p>'}
        </div>
        <div class="card">
          <div class="card__header"><h3 class="card__title">Quick Actions</h3></div>
          <div style="display:flex; flex-direction:column; gap:var(--space-3)">
            <a href="sales.html" class="btn btn--primary">New Sale</a>
            <a href="customers.html" class="btn btn--outline">Customers</a>
            <a href="udhari.html" class="btn btn--outline">Udhari</a>
            <a href="invoices.html" class="btn btn--outline">Invoices</a>
          </div>
        </div>
      </div>
    `;
  }
};
