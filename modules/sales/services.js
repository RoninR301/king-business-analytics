import {
  collection, doc, setDoc, getDocs, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

// Normalize a Firestore Timestamp | ISO string | null into milliseconds so
// records can be sorted newest-first on the client.
function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

class SalesService {
  async create(shopId, ownerId, saleData, createdBy) {
    const saleRef = doc(collection(db, COLLECTIONS.SALES));
    const items = (saleData.items || []).map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      const purchasePrice = Number(item.purchasePrice ?? item.costPrice ?? 0);
      // Audit fix: never trust client values — reject negatives / bad numbers.
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new Error('Each item must have a quantity of at least 1.');
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Item price cannot be negative.');
      }
      if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
        throw new Error('Item purchase price cannot be negative.');
      }
      return { ...item, quantity, price, purchasePrice };
    });

    const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
    const subtotal = round2(items.reduce((sum, item) => sum + item.quantity * item.price, 0));
    const totalCost = round2(items.reduce((sum, item) => sum + item.quantity * item.purchasePrice, 0));
    const taxRate = Math.max(0, Number(saleData.taxRate) || 0);
    const taxAmount = round2(subtotal * (taxRate / 100));
    const grandTotal = round2(subtotal + taxAmount);
    // Profit is always computed here, never supplied by the client.
    const profit = round2(subtotal - totalCost);

    const sale = {
      id: saleRef.id,
      shopId,
      ownerId,
      customerId: saleData.customerId || null,
      category: saleData.category,
      customer: {
        name: saleData.customerName,
        mobile: saleData.customerMobile,
        address: saleData.customerAddress || null,
        tableNumber: saleData.tableNumber || null
      },
      items,
      subtotal,
      totalCost,
      taxRate,
      taxAmount,
      grandTotal,
      profit,
      createdBy,
      createdAt: serverTimestamp()
    };

    await setDoc(saleRef, sale);
    eventBus.emit(EVENTS.SALE_CREATED, { ...sale, id: saleRef.id });
    return { ...sale, id: saleRef.id };
  }

  async getByShop(shopId, filters = {}) {
    // Sort newest-first client-side instead of orderBy('createdAt') so the query
    // needs no composite (shopId + createdAt) index to be provisioned.
    const q = query(
      collection(db, COLLECTIONS.SALES),
      where('shopId', '==', shopId)
    );
    const snap = await getDocs(q);
    let sales = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((x, y) => toMillis(y.createdAt) - toMillis(x.createdAt));

    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      sales = sales.filter((s) => {
        const ts = s.createdAt?.toDate?.() || new Date(s.createdAt);
        return ts.getTime() >= start;
      });
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      sales = sales.filter((s) => {
        const ts = s.createdAt?.toDate?.() || new Date(s.createdAt);
        return ts.getTime() <= end;
      });
    }

    return sales;
  }

  async getByOwner(ownerId) {
    const q = query(collection(db, COLLECTIONS.SALES), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export const salesService = new SalesService();
