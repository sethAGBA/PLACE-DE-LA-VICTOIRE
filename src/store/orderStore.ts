import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types';

interface OrderState {
  orders: Order[];
  activeOrders: Order[];
  setOrders: (orders: Order[]) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
}

const ACTIVE_STATUSES: OrderStatus[] = [
  'PENDING' as OrderStatus,
  'VALIDATED' as OrderStatus,
  'IN_PREPARATION' as OrderStatus,
  'READY' as OrderStatus,
];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrders: [],

  setOrders: (orders) => {
    set({
      orders,
      activeOrders: orders.filter((o) =>
        ACTIVE_STATUSES.includes(o.statut)
      ),
    });
  },

  updateOrder: (id, patch) => {
    const updated = get().orders.map((o) =>
      o.id === id ? { ...o, ...patch } : o
    );
    set({
      orders: updated,
      activeOrders: updated.filter((o) =>
        ACTIVE_STATUSES.includes(o.statut)
      ),
    });
  },
}));
