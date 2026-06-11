import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class CustomersService {
  async findOrCreate(shopId, ownerId, { name, mobile, address = null }) {
    const q = query(
      collection(db, COLLECTIONS.CUSTOMERS),
      where('shopId', '==', shopId),
      where('mobile', '==', mobile)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    const ref = doc(collection(db, COLLECTIONS.CUSTOMERS));
    const customer = {
      id: ref.id,
      shopId,
      ownerId,
      name,
      mobile,
      address,
      totalPurchases: 0,
      totalSpent: 0,
      lastPurchaseAt: null,
      createdAt: serverTimestamp()
    };

    await setDoc(ref, customer);
    eventBus.emit(EVENTS.CUSTOMER_CREATED, customer);
    return { ...customer, id: ref.id };
  }

  async getByShop(shopId) {
    const q = query(collection(db, COLLECTIONS.CUSTOMERS), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getById(customerId) {
    const snap = await getDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  async update(customerId, data) {
    await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId), data);
    eventBus.emit(EVENTS.CUSTOMER_UPDATED, { customerId, data });
  }

  async recordPurchase(customerId, amount) {
    const customer = await this.getById(customerId);
    if (!customer) return;

    await updateDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId), {
      totalPurchases: (customer.totalPurchases || 0) + 1,
      totalSpent: (customer.totalSpent || 0) + amount,
      lastPurchaseAt: serverTimestamp()
    });
  }

  async getPurchaseHistory(shopId, mobile) {
    const { salesService } = await import('../sales/services.js');
    const sales = await salesService.getByShop(shopId);
    return sales.filter((s) => s.customer?.mobile === mobile);
  }

  async getByOwner(ownerId) {
    const q = query(collection(db, COLLECTIONS.CUSTOMERS), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}

export const customersService = new CustomersService();
