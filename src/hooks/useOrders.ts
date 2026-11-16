import { useState, useEffect, useCallback } from 'react';
import {
  getOrdersByTable,
  getOrdersByStatus,
  getAllOrders,
  getOrdersBySessionId,
} from '@/lib/firestore';
import type { Order, OrderStatus, UserRole } from '@/types';

interface OrderFilterConfig {
  role: UserRole;
  tableId?: string;
  sessionId?: string;
  statuses?: OrderStatus[];
}

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
}

/**
 * Subscribes to Firestore orders based on the caller's role.
 * - client: listens to orders for the given tableId (filtered by sessionId client-side)
 * - serveur: listens to all orders or by status
 * - cuisine: listens to orders by status (IN_PREPARATION, etc.)
 * - admin: listens to all orders
 *
 * Cleans up the onSnapshot listener on unmount.
 */
export function useOrders({
  role,
  tableId,
  sessionId,
  statuses,
}: OrderFilterConfig): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const handleOrders = useCallback(
    (incoming: Order[]) => {
      // Client-side filter: a client only sees their own session orders
      const filtered =
        role === 'client' && sessionId
          ? incoming.filter((o) => o.sessionId === sessionId)
          : incoming;
      setOrders(filtered);
      setLoading(false);
    },
    [role, sessionId]
  );

  useEffect(() => {
    if (role === 'client' && tableId) {
      const unsub = getOrdersByTable(tableId, handleOrders);
      return () => unsub();
    }

    // Takeaway tracking: no tableId but we have a sessionId — query by sessionId directly
    if (role === 'client' && !tableId && sessionId) {
      const unsub = getOrdersBySessionId(sessionId, handleOrders);
      return () => unsub();
    }

    if (['cuisine', 'serveur', 'caissier'].includes(role) && statuses && statuses.length > 0) {
      const unsub = getOrdersByStatus(statuses, handleOrders);
      return () => unsub();
    }

    // admin or serveur without status filter — all orders
    const unsub = getAllOrders(handleOrders);
    return () => unsub();
  }, [role, tableId, sessionId, statuses, handleOrders]);

  return { orders, loading };
}
