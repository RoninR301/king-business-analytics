import {
  doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { toISODate } from '../../utils/formatters.js';
import { getItemDisplayName } from '../sales/ui.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class AnalyticsService {
  getDocId(shopId, date) {
    return `${shopId}_${date}`;
  }

  async recordSale(shopId, ownerId, sale) {
    const date = toISODate();
    const docId = this.getDocId(shopId, date);
    const ref = doc(db, COLLECTIONS.ANALYTICS, docId);
    const existing = await getDoc(ref);

    const topProducts = existing.exists() ? { ...existing.data().topProducts } : {};
    (sale.items || []).forEach((item) => {
      const name = getItemDisplayName(item);
      topProducts[name] = (topProducts[name] || 0) + (Number(item.quantity) || 1);
    });

    const prev = existing.exists() ? existing.data() : {
      salesCount: 0, revenue: 0, profit: 0, customerCount: 0, invoiceCount: 0
    };

    await setDoc(ref, {
      id: docId,
      shopId,
      ownerId,
      date,
      salesCount: (prev.salesCount || 0) + 1,
      revenue: (prev.revenue || 0) + (sale.grandTotal || 0),
      profit: (prev.profit || 0) + (sale.profit || 0),
      customerCount: prev.customerCount || 0,
      invoiceCount: (prev.invoiceCount || 0) + 1,
      topProducts,
      updatedAt: serverTimestamp()
    }, { merge: true });

    eventBus.emit(EVENTS.ANALYTICS_UPDATED, { shopId, date });
  }

  async getByOwner(ownerId, dateRange = {}) {
    const q = query(collection(db, COLLECTIONS.ANALYTICS), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    let records = snap.docs.map((d) => d.data());

    if (dateRange.start) {
      records = records.filter((r) => r.date >= dateRange.start);
    }
    if (dateRange.end) {
      records = records.filter((r) => r.date <= dateRange.end);
    }

    return records;
  }

  async getDashboardStats(ownerId, dateRange) {
    const { shopService } = await import('../shops/services.js');
    const { customersService } = await import('../customers/services.js');
    const { billingService } = await import('../billing/services.js');

    const shops = await shopService.getByOwner(ownerId);
    const analytics = await this.getByOwner(ownerId, dateRange);
    const customers = await customersService.getByOwner(ownerId);
    const invoices = await billingService.getByOwner(ownerId);

    const shopStats = shops.map((shop) => {
      const shopAnalytics = analytics.filter((a) => a.shopId === shop.id);
      return {
        shopId: shop.id,
        shopName: shop.name,
        shopCode: shop.shopCode,
        revenue: shopAnalytics.reduce((s, a) => s + (a.revenue || 0), 0),
        salesCount: shopAnalytics.reduce((s, a) => s + (a.salesCount || 0), 0),
        customerCount: customers.filter((c) => c.shopId === shop.id).length
      };
    });

    const allProducts = {};
    analytics.forEach((a) => {
      Object.entries(a.topProducts || {}).forEach(([name, count]) => {
        allProducts[name] = (allProducts[name] || 0) + count;
      });
    });

    const topProducts = Object.entries(allProducts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const sortedShops = [...shopStats].sort((a, b) => b.revenue - a.revenue);

    return {
      totalShops: shops.length,
      totalSales: analytics.reduce((s, a) => s + (a.salesCount || 0), 0),
      totalCustomers: customers.length,
      totalInvoices: invoices.length,
      totalRevenue: analytics.reduce((s, a) => s + (a.revenue || 0), 0),
      totalProfit: analytics.reduce((s, a) => s + (a.profit || 0), 0),
      shopStats,
      bestShop: sortedShops[0] || null,
      worstShop: sortedShops[sortedShops.length - 1] || null,
      topProducts,
      dailyData: this.aggregateDaily(analytics),
      weeklyData: this.aggregateWeekly(analytics),
      monthlyData: this.aggregateMonthly(analytics)
    };
  }

  aggregateDaily(analytics) {
    const map = {};
    analytics.forEach((a) => {
      if (!map[a.date]) map[a.date] = { date: a.date, revenue: 0, count: 0 };
      map[a.date].revenue += a.revenue || 0;
      map[a.date].count += a.salesCount || 0;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }

  aggregateWeekly(analytics) {
    const map = {};
    analytics.forEach((a) => {
      const d = new Date(a.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      if (!map[key]) map[key] = { label: `Week of ${key}`, revenue: 0, count: 0 };
      map[key].revenue += a.revenue || 0;
      map[key].count += a.salesCount || 0;
    });
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }

  aggregateMonthly(analytics) {
    const map = {};
    analytics.forEach((a) => {
      const key = a.date.substring(0, 7);
      if (!map[key]) map[key] = { label: key, revenue: 0, count: 0 };
      map[key].revenue += a.revenue || 0;
      map[key].count += a.salesCount || 0;
    });
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }
}

export const analyticsService = new AnalyticsService();
