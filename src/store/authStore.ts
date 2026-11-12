import { create } from 'zustand';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { AppUser } from '@/types';

interface AuthState {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  setFirebaseUser: (firebaseUser: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,

  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (loading) => set({ loading }),

  logout: async () => {
    await signOut(auth);
    set({ user: null, firebaseUser: null });
  },
}));

// Subscribe to Firebase auth state on module load
onAuthStateChanged(auth, (firebaseUser) => {
  useAuthStore.getState().setFirebaseUser(firebaseUser);
  useAuthStore.getState().setLoading(false);
  if (!firebaseUser) {
    useAuthStore.getState().setUser(null);
  }
});
