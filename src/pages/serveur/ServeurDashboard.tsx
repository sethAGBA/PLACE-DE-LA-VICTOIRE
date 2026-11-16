import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getTables } from '@/lib/firestore';
import { useOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import { TableCard } from '@/components/serveur/TableCard';
import { OrderCard } from '@/components/serveur/OrderCard';
import { OrderActions } from '@/components/serveur/OrderActions';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Spinner } from '@/components/ui/Spinner';
import { OrderStatus, UserRole } from '@/types';
import type { Order, Table } from '@/types';

// PENDING is now handled by the caissier; serveur only sees post-validation statuses
const WAITER_STATUSES = [
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.SERVED,
];

/** Colored dot per status for group headers */
const statusDot: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-amber-500',
  [OrderStatus.VALIDATED]: 'bg-blue-500',
  [OrderStatus.IN_PREPARATION]: 'bg-orange-500',
  [OrderStatus.READY]: 'bg-green-500',
  [OrderStatus.SERVED]: 'bg-teal-500',
  [OrderStatus.PAID]: 'bg-gray-400',
  [OrderStatus.REJECTED]: 'bg-red-500',
};

/** Display order for order groups */
const GROUP_ORDER = [
  OrderStatus.READY,
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.SERVED,
];

/**
 * Main waiter view.
 * Left panel: table list (TableCard grid)
 * Right panel: orders for the selected table (or all orders), grouped by status.
 * PENDING orders are owned by the caissier dashboard and do not appear here.
 */
export default function ServeurDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const { orders, loading } = useOrders({
    role: UserRole.serveur,
    statuses: WAITER_STATUSES,
  });

  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString());

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Subscribe to tables
  useEffect(() => {
    const unsub = getTables(setTables);
    return () => unsub();
  }, []);

  const handleTableClick = useCallback(
    (tableId: string) => {
      setSelectedTableId((prev) => (prev === tableId ? null : tableId));
    },
    []
  );

  // Filter orders by selected table
  const visibleOrders: Order[] = selectedTableId
    ? orders.filter((o) => o.tableId === selectedTableId)
    : orders;

  // Group by status in display order
  const grouped = GROUP_ORDER.map((status) => ({
    status,
    items: visibleOrders.filter((o) => o.statut === status),
  })).filter((g) => g.items.length > 0);

  // Active order count per table
  const orderCountByTable = (tableId: string) =>
    orders.filter((o) => o.tableId === tableId).length;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b bg-gradient-to-r from-white to-[#FFF8F0] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">{t('app.name')}</span>
          <span className="hidden text-sm text-muted sm:inline">
            — {t('serveur.dashboard')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-ink sm:inline">
            {user?.nom}
          </span>
          <span className="font-mono text-sm text-muted">{clock}</span>
          <LanguageSwitcher />
          <button
            onClick={() => void logout()}
            aria-label={t('nav.logout')}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — tables */}
        <aside className="w-44 flex-shrink-0 overflow-y-auto border-r bg-white p-3 shadow-sm sm:w-56">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            {t('table.section_title')}
          </h2>
          {tables.length === 0 ? (
            <Spinner size="sm" />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  activeOrderCount={orderCountByTable(table.id)}
                  selected={selectedTableId === table.id}
                  onClick={() => handleTableClick(table.id)}
                />
              ))}
            </div>
          )}

          {selectedTableId && (
            <button
              onClick={() => setSelectedTableId(null)}
              className="mt-3 w-full rounded-xl border border-gray-200 py-1.5 text-xs text-muted transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {t('common.all')}
            </button>
          )}
        </aside>

        {/* Right panel — orders */}
        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : grouped.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted">
              {t('order.empty')}
            </p>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ status, items }) => (
                <section key={status}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusDot[status]}`} />
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                      {t(`order.status.${status}`)}
                    </h3>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                      {items.length}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                      {items.map((order) => (
                        <OrderRow key={order.id} order={order} />
                      ))}
                    </AnimatePresence>
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Helper: animated order row ───────────────────────────────────────────────

interface OrderRowProps {
  order: Order;
}

function OrderRow({ order }: OrderRowProps) {
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <OrderCard order={order} />
      <OrderActions order={order} role="serveur" />
    </motion.div>
  );
}
