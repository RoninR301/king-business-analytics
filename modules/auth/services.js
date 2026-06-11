import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from '../../firebase/init.js';
import { COLLECTIONS } from '../../database/collections.js';
import { eventBus, EVENTS } from '../../core/event-bus.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this._ready = false;
    this._resolveReady = null;
    this._readyPromise = new Promise((resolve) => { this._resolveReady = resolve; });

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.currentUser = firebaseUser;
        this.userProfile = await this.fetchUserProfile(firebaseUser.uid);
      } else {
        this.currentUser = null;
        this.userProfile = null;
      }
      if (!this._ready) {
        this._ready = true;
        this._resolveReady();
      }
      eventBus.emit(EVENTS.AUTH_STATE_CHANGED, this.userProfile);
    });
  }

  async waitForSession() {
    await this._readyPromise;
    return this.userProfile;
  }

  async fetchUserProfile(uid) {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (!snap.exists()) return null;
    return { uid, ...snap.data() };
  }

  async registerOwner({ name, email, mobile, password }) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });

    const profile = {
      uid: credential.user.uid,
      role: 'owner',
      name,
      email,
      mobile,
      shopId: null,
      ownerId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, COLLECTIONS.USERS, credential.user.uid), profile);
    this.userProfile = profile;
    return profile;
  }

  async login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await this.fetchUserProfile(credential.user.uid);
    if (!profile) throw new Error('User profile not found. Contact support.');
    this.userProfile = profile;
    return profile;
  }

  async loginManager(email, password) {
    const profile = await this.login(email, password);
    if (profile.role !== 'manager') {
      await signOut(auth);
      throw new Error('This account is not a manager account.');
    }
    return profile;
  }

  async logout() {
    await signOut(auth);
    this.userProfile = null;
    this.currentUser = null;
    eventBus.emit(EVENTS.AUTH_LOGOUT);
  }

  async updateProfile(uid, data) {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
    this.userProfile = await this.fetchUserProfile(uid);
    return this.userProfile;
  }
}

export const authService = new AuthService();
