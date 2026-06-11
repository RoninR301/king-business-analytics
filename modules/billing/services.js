import {
  collection, doc, setDoc, getDocs, query, where, orderBy, limit, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class BillingService {
  /**
   * Generate a unique invoice number.
   *
   * Audit fix: count-based numbering (snap.size + 1) produces duplicates
   * under concurrency. Use a timestamp + random suffix instead and verify
   * uniqueness before returning, e.g. INV-20260611-AB12
   */
  buildInvoiceNumber() {
    const now = new Date();
    const datePart =
      `${now.getFullYear()}` +
      `${String(now.getMonth() + 1).padStart(2, '0')}` +
      `${String(now.getDate()).padStart(2, '0')}`;
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `INV-${datePart}-${suffix}`;
  }

  async invoiceNumberExists(invoiceNumber) {
    const q = query(
      collection(db, COLLECTIONS.INVOICES),
      where('invoiceNumber', '==', invoiceNumber),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  }

  async generateInvoiceNumber() {
    let invoiceNumber = this.buildInvoiceNumber();
    for (let attempt = 0; attempt < 5 && (await this.invoiceNumberExists(invoiceNumber)); attempt++) {
      invoiceNumber = this.buildInvoiceNumber();
    }
    return invoiceNumber;
  }

  async create(shopId, sale, shop, manager = null, settings = {}) {
    const invoiceRef = doc(collection(db, COLLECTIONS.INVOICES));
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = {
      id: invoiceRef.id,
      shopId,
      // Store ownerId on the invoice so owner-wide queries don't have to fan
      // out across every shop (audit fix). Fall back to the sale's ownerId.
      ownerId: shop.ownerId || sale.ownerId || null,
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
    // Primary path: invoices created after the audit fix carry ownerId.
    const q = query(collection(db, COLLECTIONS.INVOICES), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    const direct = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (direct.length) return direct;

    // Fallback for legacy invoices without ownerId: fan out across shops.
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
