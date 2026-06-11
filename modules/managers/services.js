import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { app, auth, db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { shopService } from '../shops/services.js';

class ManagerService {
  async createManagerAuth(email, password, profile = null) {
    // Create the manager's Auth account on a secondary app so the owner's own
    // session is never disturbed. The manager's users/{uid} profile is written
    // through this same secondary (manager-authenticated) connection so the
    // write satisfies the `request.auth.uid == userId` self-create rule — an
    // owner is not permitted to create another account's profile document.
    const secondaryApp = initializeApp(app.options, `Secondary_${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = credential.user.uid;
      if (profile) {
        const secondaryDb = getFirestore(secondaryApp);
        await setDoc(doc(secondaryDb, COLLECTIONS.USERS, uid), {
          uid,
          role: 'manager',
          name: profile.name,
          email,
          mobile: profile.mobile || '',
          shopId: profile.shopId,
          ownerId: profile.ownerId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      await signOut(secondaryAuth);
      return uid;
    } finally {
      await deleteApp(secondaryApp);
    }
  }

  async create({ shopId, ownerId, name, email, password }) {
    // Auth account + the manager's own users/{uid} profile are provisioned
    // together through the secondary manager-authenticated connection.
    const authUid = await this.createManagerAuth(email, password, { name, shopId, ownerId });

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
    await shopService.linkManager(shopId, managerRef.id);
    return manager;
  }

  async getByShop(shopId, ownerId = null) {
    // Owner-side reads must be scoped by ownerId so the query matches the
    // security rule (which authorizes manager reads off `ownerId`). Without
    // the ownerId filter Firestore rejects the list query.
    const clauses = [where('shopId', '==', shopId)];
    if (ownerId) clauses.push(where('ownerId', '==', ownerId));
    const q = query(collection(db, COLLECTIONS.MANAGERS), ...clauses);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async updateForShop(shopId, ownerId, { name, email, password }) {
    const managers = await this.getByShop(shopId, ownerId);
    if (!managers.length) {
      if (!password) {
        throw new Error('A password is required to create the manager account.');
      }
      return this.create({ shopId, ownerId, name, email, password });
    }

    const manager = managers[0];
    const updates = { name, updatedAt: serverTimestamp() };
    if (email) updates.email = email;

    await updateDoc(doc(db, COLLECTIONS.MANAGERS, manager.id), updates);

    // The manager's users/{uid} profile can only be written by the manager
    // themselves (self-write rule). Syncing the display name/email from the
    // owner side is best-effort: the managers doc above is the source of truth
    // for the owner UI, so an owner edit must never fail if this sync is denied.
    if (manager.authUid) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, manager.authUid), {
          name,
          ...(email ? { email } : {}),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('[KBA][managers] manager profile name sync skipped:', err?.code || err?.message || err);
      }
    }
  }

  async getById(managerId) {
    const snap = await getDoc(doc(db, COLLECTIONS.MANAGERS, managerId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }

  /**
   * Reset a manager's password (audit fix — this system was missing).
   *
   * A web client cannot directly set another user's password (that needs the
   * Firebase Admin SDK / a Cloud Function). The production-safe client path is
   * to email the manager a password-reset link. We stamp the manager doc so the
   * owner has an audit trail of the request.
   */
  async updateManagerPassword(managerId) {
    const manager = await this.getById(managerId);
    if (!manager) throw new Error('Manager not found.');
    if (!manager.email) throw new Error('Manager has no email on file.');

    await sendPasswordResetEmail(auth, manager.email);
    await updateDoc(doc(db, COLLECTIONS.MANAGERS, managerId), {
      passwordResetRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { email: manager.email, method: 'reset-email' };
  }

  /** Enable/disable a manager at the application level. */
  async setDisabled(managerId, disabled = true) {
    await updateDoc(doc(db, COLLECTIONS.MANAGERS, managerId), {
      disabled: !!disabled,
      updatedAt: serverTimestamp()
    });
    return true;
  }
}

export const managerService = new ManagerService();
