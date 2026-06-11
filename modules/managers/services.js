import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  collection, doc, setDoc, getDocs, query, where, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { app, db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { shopService } from '../shops/services.js';

class ManagerService {
  async createManagerAuth(email, password) {
    const secondaryApp = initializeApp(app.options, `Secondary_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      await signOut(secondaryAuth);
      return credential.user.uid;
    } finally {
      await deleteApp(secondaryApp);
    }
  }

  async create({ shopId, ownerId, name, email, password }) {
    const authUid = await this.createManagerAuth(email, password);

    const managerRef = doc(collection(db, COLLECTIONS.MANAGERS));
    const manager = {
      id: managerRef.id,
      shopId,
      ownerId,
      authUid,
      name,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(managerRef, manager);

    await setDoc(doc(db, COLLECTIONS.USERS, authUid), {
      uid: authUid,
      role: 'manager',
      name,
      email,
      mobile: '',
      shopId,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await shopService.linkManager(shopId, managerRef.id);
    return manager;
  }

  async getByShop(shopId) {
    const q = query(collection(db, COLLECTIONS.MANAGERS), where('shopId', '==', shopId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async updateForShop(shopId, ownerId, { name, email, password }) {
    const managers = await this.getByShop(shopId);
    if (!managers.length) {
      return this.create({ shopId, ownerId, name, email, password });
    }

    const manager = managers[0];
    const updates = { name, updatedAt: serverTimestamp() };
    if (email) updates.email = email;

    await updateDoc(doc(db, COLLECTIONS.MANAGERS, manager.id), updates);

    if (manager.authUid) {
      await updateDoc(doc(db, COLLECTIONS.USERS, manager.authUid), {
        name,
        ...(email ? { email } : {}),
        updatedAt: serverTimestamp()
      });
    }
  }
}

export const managerService = new ManagerService();
