import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/firebase';
import { UserRole } from '@/types';

const SEED_APP_NAME = 'seed-accounts';

interface DemoAccount {
  email: string;
  password: string;
  nom: string;
  role: UserRole;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@placelavictoire.com',
    password: 'Admin2024!',
    nom: 'Administrateur',
    role: UserRole.admin,
  },
  {
    email: 'serveur@placelavictoire.com',
    password: 'Serveur2024!',
    nom: 'Serveur Demo',
    role: UserRole.serveur,
  },
  {
    email: 'cuisine@placelavictoire.com',
    password: 'Cuisine2024!',
    nom: 'Cuisine Demo',
    role: UserRole.cuisine,
  },
];

export async function seedAccounts(): Promise<void> {
  for (const account of DEMO_ACCOUNTS) {
    // Always use a fresh secondary app instance
    const existing = getApps().find((a) => a.name === SEED_APP_NAME);
    if (existing) {
      await deleteApp(existing);
    }
    const secondaryApp = initializeApp(firebaseConfig, SEED_APP_NAME);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        account.email,
        account.password
      );
      await signOut(secondaryAuth);

      const uid = credential.user.uid;
      await setDoc(doc(db, 'users', uid), {
        nom: account.nom,
        email: account.email,
        role: account.role,
        actif: true,
      });

      console.log(`[seed] Created account: ${account.email} (${account.role})`);
    } catch (err: unknown) {
      // If the account already exists, skip it
      if (
        err instanceof Error &&
        (err as { code?: string }).code === 'auth/email-already-in-use'
      ) {
        console.warn(`[seed] Account already exists: ${account.email}`);
      } else {
        console.error(`[seed] Failed to create ${account.email}:`, err);
      }
      await signOut(secondaryAuth).catch(() => {});
    } finally {
      await deleteApp(secondaryApp).catch(() => {});
    }
  }

  console.log('[seed] Demo accounts seeding complete.');
}
