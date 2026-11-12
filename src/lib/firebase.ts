import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Guard against double-initialisation (e.g. HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable offline persistence for multi-tab support
try {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  enableMultiTabIndexedDbPersistence(db);
} catch (err) {
  // Persistence may fail if already enabled or in environments that don't support it
  console.warn('[firebase] persistence not enabled:', err);
}
