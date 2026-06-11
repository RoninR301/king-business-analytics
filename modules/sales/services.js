import {
  collection, doc, setDoc, getDocs, query, where, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class SalesService {
  async create(shopId, ownerId, saleData, createdBy) {
    const saleRef = doc(collection(db, COLLECTIONS.SALES));
    const items = saleData.items || [];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const taxRate = Number(saleData.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    const sale = {
      id: saleRef.id,
      shopId,
      ownerId,
      customerId: saleData.customerId || null,
      category: saleData.category,
      customer: {
        name: saleData.customerName,
        mobile: saleData.customerMobile,
        tableNumber: saleData.tableNumber || null
      },
      items,
      subtotal,
      taxRate,
      taxAmount,
      grandTotal,
      createdBy,
      createdAt: serverTimestamp()
    };

    await setDoc(saleRef, sale);
    eventBus.emit(EVENTS.SALE_CREATED, { ...sale, id: saleRef.id });
    return { ...sale, id: saleRef.id };
  }

  async getByShop(shopId, filters = {}) {
    let q = query(
      collection(db, COLLECTIONS.SALES),
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    let sales = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

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
