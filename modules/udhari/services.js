import {
  collection, doc, setDoc, getDocs, updateDoc, query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';
import { toISODate } from '../../utils/formatters.js';

class UdhariService {
  computeStatus(amount, paidAmount) {
    const remaining = amount - paidAmount;
    if (remaining <= 0) return 'paid';
    if (paidAmount > 0) return 'partial';
    return 'pending';
  }

  async create(shopId, data) {
    const ref = doc(collection(db, COLLECTIONS.UDHARI));
    const amount = Number(data.amount) || 0;
    const paidAmount = Number(data.paidAmount) || 0;

    const record = {
      id: ref.id,
      shopId,
      customerName: data.customerName,
      mobile: data.mobile,
      amount,
      paidAmount,
      remainingAmount: amount - paidAmount,
      dueDate: data.dueDate || toISODate(),
      status: this.computeStatus(amount, paidAmount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, record);
    eventBus.emit(EVENTS.UDHARI_CREATED, record);
    return { ...record, id: ref.id };
  }

  async getByShop(shopId, status = null) {
    const q = query(collection(db, COLLECTIONS.UDHARI), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    let records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (status) records = records.filter((r) => r.status === status);
    return records.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  async recordPayment(id, paymentAmount) {
    const { getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const docSnap = await getDoc(doc(db, COLLECTIONS.UDHARI, id));
    if (!docSnap.exists()) throw new Error('Record not found');

    const data = docSnap.data();
    const newPaid = (data.paidAmount || 0) + paymentAmount;
    const remaining = data.amount - newPaid;

    await updateDoc(doc(db, COLLECTIONS.UDHARI, id), {
      paidAmount: newPaid,
      remainingAmount: Math.max(0, remaining),
      status: this.computeStatus(data.amount, newPaid),
      updatedAt: serverTimestamp()
    });

    eventBus.emit(EVENTS.UDHARI_UPDATED, { id });
  }

  async update(id, data) {
    const amount = Number(data.amount);
    const paidAmount = Number(data.paidAmount) || 0;
    await updateDoc(doc(db, COLLECTIONS.UDHARI, id), {
      ...data,
      remainingAmount: amount - paidAmount,
      status: this.computeStatus(amount, paidAmount),
      updatedAt: serverTimestamp()
    });
    eventBus.emit(EVENTS.UDHARI_UPDATED, { id });
  }
}

export const udhariService = new UdhariService();
