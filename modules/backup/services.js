import {
  collection, getDocs, query, where, doc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { toCSV, parseCSV } from '../../utils/csv-utils.js';
import { downloadBlob } from '../../utils/helpers.js';

class BackupService {
  async exportAll(ownerId) {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      ownerId,
      shops: await this.fetchCollection(COLLECTIONS.SHOPS, 'ownerId', ownerId),
      managers: await this.fetchCollection(COLLECTIONS.MANAGERS, 'ownerId', ownerId),
      sales: await this.fetchSalesByOwner(ownerId),
      customers: await this.fetchCollection(COLLECTIONS.CUSTOMERS, 'ownerId', ownerId),
      invoices: await this.fetchInvoicesByOwner(ownerId),
      udhari: await this.fetchUdhariByOwner(ownerId),
      analytics: await this.fetchCollection(COLLECTIONS.ANALYTICS, 'ownerId', ownerId),
      settings: await this.fetchSettings(ownerId)
    };

    await setDoc(doc(collection(db, COLLECTIONS.BACKUP)), {
      ownerId,
      type: 'export',
      recordCount: this.countRecords(data),
      createdAt: serverTimestamp()
    });

    return data;
  }

  async fetchCollection(collectionName, field, value) {
    const q = query(collection(db, collectionName), where(field, '==', value));
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.serializeDoc(d.id, d.data()));
  }

  async fetchSalesByOwner(ownerId) {
    return this.fetchCollection(COLLECTIONS.SALES, 'ownerId', ownerId);
  }

  async fetchInvoicesByOwner(ownerId) {
    const shops = await this.fetchCollection(COLLECTIONS.SHOPS, 'ownerId', ownerId);
    const all = [];
    for (const shop of shops) {
      const q = query(collection(db, COLLECTIONS.INVOICES), where('shopId', '==', shop.id));
      const snap = await getDocs(q);
      all.push(...snap.docs.map((d) => this.serializeDoc(d.id, d.data())));
    }
    return all;
  }

  async fetchUdhariByOwner(ownerId) {
    const shops = await this.fetchCollection(COLLECTIONS.SHOPS, 'ownerId', ownerId);
    const all = [];
    for (const shop of shops) {
      const q = query(collection(db, COLLECTIONS.UDHARI), where('shopId', '==', shop.id));
      const snap = await getDocs(q);
      all.push(...snap.docs.map((d) => this.serializeDoc(d.id, d.data())));
    }
    return all;
  }

  async fetchSettings(ownerId) {
    const snap = await getDocs(query(collection(db, COLLECTIONS.SETTINGS), where('ownerId', '==', ownerId)));
    return snap.docs.map((d) => this.serializeDoc(d.id, d.data()));
  }

  serializeDoc(id, data) {
    const result = { id, ...data };
    Object.keys(result).forEach((key) => {
      if (result[key]?.toDate) {
        result[key] = result[key].toDate().toISOString();
      }
    });
    return result;
  }

  countRecords(data) {
    return ['shops', 'managers', 'sales', 'customers', 'invoices', 'udhari', 'analytics']
      .reduce((sum, key) => sum + (data[key]?.length || 0), 0);
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, filename || `kba-backup-${Date.now()}.json`);
  }

  downloadCSV(data) {
    const salesRows = (data.sales || []).map((s) => ({
      id: s.id,
      shopId: s.shopId,
      customer: s.customer?.name,
      total: s.grandTotal,
      date: s.createdAt
    }));

    const csv = toCSV(salesRows, [
      { label: 'ID', value: (r) => r.id },
      { label: 'Shop ID', value: (r) => r.shopId },
      { label: 'Customer', value: (r) => r.customer },
      { label: 'Total', value: (r) => r.total },
      { label: 'Date', value: (r) => r.date }
    ]);

    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `kba-sales-${Date.now()}.csv`);
  }

  async importJSON(ownerId, jsonData) {
    if (!jsonData.version) throw new Error('Invalid backup format');

    const batch = [];
    const collections = ['shops', 'customers', 'sales', 'invoices', 'udhari', 'analytics'];

    for (const col of collections) {
      const items = jsonData[col] || [];
      for (const item of items) {
        const { id, ...rest } = item;
        if (col === 'shops') rest.ownerId = ownerId;
        if (col === 'customers') rest.ownerId = ownerId;
        if (col === 'sales') rest.ownerId = ownerId;
        batch.push({ collection: col === 'shops' ? COLLECTIONS.SHOPS : this.mapCollection(col), id, data: rest });
      }
    }

    const { writeBatch, doc: docRef } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const chunks = this.chunk(batch, 400);

    for (const chunk of chunks) {
      const b = writeBatch(db);
      chunk.forEach(({ collection: colName, id, data }) => {
        b.set(docRef(db, colName, id), data, { merge: true });
      });
      await b.commit();
    }

    return batch.length;
  }

  mapCollection(name) {
    const map = {
      shops: COLLECTIONS.SHOPS,
      customers: COLLECTIONS.CUSTOMERS,
      sales: COLLECTIONS.SALES,
      invoices: COLLECTIONS.INVOICES,
      udhari: COLLECTIONS.UDHARI,
      analytics: COLLECTIONS.ANALYTICS
    };
    return map[name];
  }

  chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  parseImportFile(text, type) {
    if (type === 'json') return JSON.parse(text);
    const { rows } = parseCSV(text);
    return { sales: rows };
  }
}

export const backupService = new BackupService();
