import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OrderItem } from '@/types';

export type CartItem = OrderItem;

// Generate or reuse a session UUID for this browser tab
function getOrCreateSessionId(): string {
  const key = 'pdv-session-id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  sessionId: string;
  clientPrenom: string;
  setTableId: (tableId: string) => void;
  setClientPrenom: (prenom: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantite: number) => void;
  clearCart: () => void;
  resetSession: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      sessionId: getOrCreateSessionId(),
      clientPrenom: '',

      setTableId: (tableId) => set({ tableId }),

      setClientPrenom: (clientPrenom) => set({ clientPrenom }),

      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantite: i.quantite + item.quantite }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),

      updateQuantity: (productId, quantite) => {
        if (quantite <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantite } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      resetSession: () => {
        const key = 'pdv-session-id';
        const newId = crypto.randomUUID();
        sessionStorage.setItem(key, newId);
        set({ items: [], sessionId: newId, clientPrenom: '' });
      },

      total: () =>
        get().items.reduce((sum, i) => sum + i.prix * i.quantite, 0),
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => sessionStorage),
      // Key is per-table, regenerated when tableId changes
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
        sessionId: state.sessionId,
        clientPrenom: state.clientPrenom,
      }),
    }
  )
);
