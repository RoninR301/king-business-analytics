import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { db, storage } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { generateShopCode } from '../../utils/helpers.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class ShopService {
  async create(ownerId, data, logoFile = null) {
    const shopRef = doc(collection(db, COLLECTIONS.SHOPS));
    const shopCode = generateShopCode();

    let logoUrl = null;
    if (logoFile) {
      logoUrl = await this.uploadLogo(ownerId, shopRef.id, logoFile);
    }

    const shop = {
      id: shopRef.id,
      ownerId,
      shopCode,
      name: data.name,
      category: data.category,
      customCategory: data.customCategory || null,
      logoUrl,
      address: data.address,
      mobile: data.mobile,
      altMobile: data.altMobile || null,
      email: data.email || null,
      altEmail: data.altEmail || null,
      gstNumber: data.gstNumber || null,
      upiId: data.upiId || null,
      managerId: null,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(shopRef, shop);
    eventBus.emit(EVENTS.SHOP_CREATED, shop);
    return { ...shop, id: shopRef.id };
  }

  async uploadLogo(ownerId, shopId, file) {
    const ext = file.name.split('.').pop();
    const storageRef = ref(storage, `logos/${ownerId}/${shopId}/logo.${ext}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async getByOwner(ownerId) {
    const q = query(collection(db, COLLECTIONS.SHOPS), where('ownerId', '==', ownerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async getById(shopId) {
    const snap = await getDoc(doc(db, COLLECTIONS.SHOPS, shopId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  async update(shopId, data, logoFile = null) {
    const updates = { ...data, updatedAt: serverTimestamp() };
    const existing = await this.getById(shopId);

    if (logoFile && existing) {
      updates.logoUrl = await this.uploadLogo(existing.ownerId, shopId, logoFile);
    }

    await updateDoc(doc(db, COLLECTIONS.SHOPS, shopId), updates);
    const updated = await this.getById(shopId);
    eventBus.emit(EVENTS.SHOP_UPDATED, updated);
    return updated;
  }

  async delete(shopId) {
    const shop = await this.getById(shopId);
    await deleteDoc(doc(db, COLLECTIONS.SHOPS, shopId));
    eventBus.emit(EVENTS.SHOP_DELETED, { shopId, shop });
  }

  async linkManager(shopId, managerId) {
    await updateDoc(doc(db, COLLECTIONS.SHOPS, shopId), {
      managerId,
      updatedAt: serverTimestamp()
    });
  }
}

export const shopService = new ShopService();
