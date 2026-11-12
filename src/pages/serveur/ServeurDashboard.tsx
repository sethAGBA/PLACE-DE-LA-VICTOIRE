import { useState, useEffect, useRef, useCallback } from 'react';
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

// Statuses the waiter cares about (excludes PAID and REJECTED)
const WAITER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.SERVED,
];

/** Label for each order group header */
const GROUP_ORDER = [
  OrderStatus.PENDING,
  OrderStatus.READY,
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.SERVED,
];

/**
 * Main waiter view.
 * Left panel: table list (TableCard grid)
 * Right panel: orders for selected table (or all orders)
 * Orders grouped by status; PENDING orders slide in from top with pulsing border.
 * Plays notification.mp3 when a new PENDING order arrives.
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

  // Track known PENDING ids to detect new arrivals
  const knownPendingIds = useRef<Set<string>>(new Set());
  const hasInteracted = useRef(false);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Track user interaction for audio autoplay policy
  useEffect(() => {
    const mark = () => { hasInteracted.current = true; };
    window.addEventListener('click', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    return () => {
      window.removeEventListener('click', mark);
      window.removeEventListener('keydown', mark);
    };
  }, []);

  // Subscribe to tables
  useEffect(() => {
    const unsub = getTables(setTables);
    return () => unsub();
  }, []);

  // Detect new PENDING orders → play sound
  useEffect(() => {
    const currentPending = orders.filter((o) => o.statut === OrderStatus.PENDING);
    const newOnes = currentPending.filter((o) => !knownPendingIds.current.has(o.id));

    if (newOnes.length > 0 && hasInteracted.current) {
      try {
        const audio = new Audio('/notification.mp3');
        void audio.play();
      } catch {
        // Audio blocked or file missing — silent failure
      }
    }

    // Update the known set
    knownPendingIds.current = new Set(currentPending.map((o) => o.id));
  }, [orders]);

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
      <header className="flex items-center justify-between gap-4 border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">{t('app.name')}</span>
          <span className="hidden text-sm text-gray-500 sm:inline">
            — {t('serveur.dashboard')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-gray-700 sm:inline">
            {user?.nom}
          </span>
          <span className="font-mono text-sm text-gray-500">{clock}</span>
          <LanguageSwitcher />
          <button
            onClick={() => void logout()}
            aria-label={t('nav.logout')}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — tables */}
        <aside className="w-44 flex-shrink-0 overflow-y-auto border-r bg-white p-3 sm:w-56">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
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
              className="mt-3 w-full rounded-lg border border-gray-200 py-1.5 text-xs text-gray-500 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
            <p className="mt-10 text-center text-sm text-gray-400">
              {t('order.empty')}
            </p>
          ) : (
            <div className="space-y-6">
              {grouped.map(({ status, items }) => (
                <section key={status}>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {t(`order.status.${status}`)}
                    </h3>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold text-gray-600">
                      {items.length}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                      {items.map((order) => (
                        <PendingAwareOrderRow
                          key={order.id}
                          order={order}
                          isPending={order.statut === OrderStatus.PENDING}
                        />
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

// ─── Helper: order row with PENDING animation ─────────────────────────────────

interface PendingAwareOrderRowProps {
  order: Order;
  isPending: boolean;
}

function PendingAwareOrderRow({ order, isPending }: PendingAwareOrderRowProps) {
  return (
    <motion.div
      initial={isPending ? { y: -24, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={
        isPending
          ? 'rounded-xl ring-2 ring-yellow-400 ring-offset-1 animate-pulse-ring'
          : ''
      }
    >
      <OrderCard order={order} />
      <OrderActions order={order} />
    </motion.div>
  );
}
