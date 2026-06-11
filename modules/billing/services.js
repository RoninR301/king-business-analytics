import {
  collection, doc, setDoc, getDocs, query, where, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class BillingService {
  async generateInvoiceNumber(shopId) {
    const q = query(collection(db, COLLECTIONS.INVOICES), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    const count = snap.size + 1;
    const date = new Date();
    const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `INV-${prefix}-${String(count).padStart(5, '0')}`;
  }

  async create(shopId, sale, shop, manager = null, settings = {}) {
    const invoiceRef = doc(collection(db, COLLECTIONS.INVOICES));
    const invoiceNumber = await this.generateInvoiceNumber(shopId);

    const invoice = {
      id: invoiceRef.id,
      shopId,
      saleId: sale.id,
      invoiceNumber,
      shop: {
        name: shop.name,
        address: shop.address,
        mobile: shop.mobile,
        email: shop.email,
        gstNumber: shop.gstNumber,
        logoUrl: shop.logoUrl,
        upiId: shop.upiId
      },
      customer: sale.customer,
      items: sale.items,
      subtotal: sale.subtotal,
      taxAmount: sale.taxAmount,
      taxRate: sale.taxRate,
      grandTotal: sale.grandTotal,
      manager: settings.showManagerOnInvoice && manager ? {
        name: manager.name,
        mobile: manager.mobile || ''
      } : null,
      createdAt: serverTimestamp()
    };

    await setDoc(invoiceRef, invoice);
    eventBus.emit(EVENTS.INVOICE_CREATED, { ...invoice, id: invoiceRef.id });
    return { ...invoice, id: invoiceRef.id };
  }

  async getByShop(shopId) {
    const q = query(
      collection(db, COLLECTIONS.INVOICES),
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getByOwner(ownerId) {
    const shops = await import('../shops/services.js').then((m) => m.shopService.getByOwner(ownerId));
    const all = [];
    for (const shop of shops) {
      const invoices = await this.getByShop(shop.id);
      all.push(...invoices);
    }
    return all;
  }
}

export const billingService = new BillingService();
