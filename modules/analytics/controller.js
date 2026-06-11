import { analyticsService } from './services.js';
import { analyticsStore } from './store.js';
import {
  renderStatsCards, renderDateFilters, renderShopRankings,
  renderShopReports, renderChartSection
} from './ui.js';
import { renderChart } from '../../components/chart.js';
import { authStore } from '../auth/store.js';
import { getDateRange } from '../../utils/date-utils.js';
import { toISODate } from '../../utils/formatters.js';

export const analyticsController = {
  currentPreset: '30days',

  async init(container) {
    container.innerHTML = `
      <div class="page-title"><h1>Analytics Dashboard</h1><p>Monitor performance across all shops</p></div>
      <div id="date-filters"></div>
      <div id="stats-cards"></div>
      <div id="rankings"></div>
      <div class="card" style="margin-top: var(--space-6)">
        <div class="card__header"><h3 class="card__title">Shop-wise Reports</h3></div>
        <div id="shop-reports"></div>
      </div>
      <div id="charts">${renderChartSection()}</div>
    `;

    this.bindFilters(container);
    await this.loadData();
  },

  bindFilters(container) {
    const updateFilters = () => {
      document.getElementById('date-filters').innerHTML = renderDateFilters(this.currentPreset);
      this.bindFilterEvents();
    };
    updateFilters();
  },

  bindFilterEvents() {
    document.querySelectorAll('.date-filter').forEach((btn) => {
      btn.addEventListener('click', async () => {
        this.currentPreset = btn.dataset.preset;
        document.getElementById('custom-date-range').style.display =
          this.currentPreset === 'custom' ? 'flex' : 'none';
        if (this.currentPreset !== 'custom') await this.loadData();
        document.querySelectorAll('.date-filter').forEach((b) => {
          b.classList.toggle('btn--primary', b.dataset.preset === this.currentPreset);
          b.classList.toggle('btn--outline', b.dataset.preset !== this.currentPreset);
        });
      });
    });

    document.getElementById('apply-custom-range')?.addEventListener('click', async () => {
      await this.loadData();
    });
  },

  getDateRangeParams() {
    if (this.currentPreset === 'custom') {
      const start = document.getElementById('date-start')?.value;
      const end = document.getElementById('date-end')?.value;
      return { start, end };
    }
    const { start, end } = getDateRange(this.currentPreset);
    return { start: toISODate(start), end: toISODate(end) };
  },

  async loadData() {
    const user = authStore.getUser();
    const range = this.getDateRangeParams();
    const stats = await analyticsService.getDashboardStats(user.uid, range);
    analyticsStore.setStats(stats);

    document.getElementById('stats-cards').innerHTML = renderStatsCards(stats);
    document.getElementById('rankings').innerHTML = renderShopRankings(stats);
    document.getElementById('shop-reports').innerHTML = renderShopReports(stats.shopStats);

    await this.renderCharts(stats);
  },

  async renderCharts(stats) {
    await renderChart(document.getElementById('chart-daily'), {
      type: 'line',
      data: {
        labels: stats.dailyData.map((d) => d.date),
        datasets: [{
          label: 'Revenue',
          data: stats.dailyData.map((d) => d.revenue),
          borderColor: '#1e40af',
          backgroundColor: 'rgba(30, 64, 175, 0.1)',
          fill: true,
          tension: 0.3
        }]
      }
    });

    await renderChart(document.getElementById('chart-weekly'), {
      type: 'bar',
      data: {
        labels: stats.weeklyData.map((d) => d.label),
        datasets: [{
          label: 'Weekly Revenue',
          data: stats.weeklyData.map((d) => d.revenue),
          backgroundColor: '#d97706'
        }]
      }
    });

    await renderChart(document.getElementById('chart-monthly'), {
      type: 'bar',
      data: {
        labels: stats.monthlyData.map((d) => d.label),
        datasets: [{
          label: 'Monthly Revenue',
          data: stats.monthlyData.map((d) => d.revenue),
          backgroundColor: '#059669'
        }]
      }
    });

    await renderChart(document.getElementById('chart-products'), {
      type: 'doughnut',
      data: {
        labels: stats.topProducts.map((p) => p.name),
        datasets: [{
          data: stats.topProducts.map((p) => p.count),
          backgroundColor: ['#1e40af', '#d97706', '#059669', '#dc2626', '#7c3aed', '#0891b2', '#ca8a04', '#be185d']
        }]
      }
    });
  }
};
