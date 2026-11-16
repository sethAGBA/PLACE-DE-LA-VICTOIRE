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

// Passwords are read from environment variables so they are never embedded in
// the production bundle as plaintext.  Set these in .env.local for local dev;
// they are intentionally absent from .env (which is committed to source control).
const adminPwd = import.meta.env.VITE_SEED_ADMIN_PASSWORD as string | undefined;
const serveurPwd = import.meta.env.VITE_SEED_SERVEUR_PASSWORD as string | undefined;
const cuisinePwd = import.meta.env.VITE_SEED_CUISINE_PASSWORD as string | undefined;
const caissierPwd = import.meta.env.VITE_SEED_CAISSIER_PASSWORD as string | undefined;

function getDemoAccounts(): DemoAccount[] {
  if (!adminPwd || !serveurPwd || !cuisinePwd || !caissierPwd) {
    throw new Error(
      'Seed passwords are not set. ' +
        'Add VITE_SEED_ADMIN_PASSWORD, VITE_SEED_SERVEUR_PASSWORD, ' +
        'VITE_SEED_CUISINE_PASSWORD, and VITE_SEED_CAISSIER_PASSWORD ' +
        'to your .env.local file before running the seed.'
    );
  }
  return [
    {
      email: 'admin@placelavictoire.com',
      password: adminPwd,
      nom: 'Administrateur',
      role: UserRole.admin,
    },
    {
      email: 'serveur@placelavictoire.com',
      password: serveurPwd,
      nom: 'Serveur Demo',
      role: UserRole.serveur,
    },
    {
      email: 'cuisine@placelavictoire.com',
      password: cuisinePwd,
      nom: 'Cuisine Demo',
      role: UserRole.cuisine,
    },
    {
      email: 'caissier@placelavictoire.com',
      password: caissierPwd,
      nom: 'Caissier Demo',
      role: UserRole.caissier,
    },
  ];
}

export async function seedAccounts(): Promise<void> {
  const accounts = getDemoAccounts(); // throws if env vars are missing

  for (const account of accounts) {
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
