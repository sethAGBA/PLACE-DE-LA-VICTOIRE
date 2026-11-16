import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import { OrderCard } from '@/components/serveur/OrderCard';
import { OrderActions } from '@/components/serveur/OrderActions';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Spinner } from '@/components/ui/Spinner';
import { OrderStatus, UserRole } from '@/types';
import type { Order } from '@/types';

/**
 * Caissier dashboard — shows only PENDING orders grouped by table.
 * Plays a notification sound when new PENDING orders arrive.
 * The caissier validates or rejects each order; the waiter never sees PENDING.
 */
export default function CaissierDashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const { orders, loading } = useOrders({
    role: UserRole.caissier,
    statuses: [OrderStatus.PENDING, OrderStatus.PICKUP],
  });

  const [clock, setClock] = useState(() => new Date().toLocaleTimeString());

  // Track known PENDING ids for sound notification
  const knownPendingIds = useRef<Set<string>>(new Set());
  const hasInteracted = useRef(false);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Track first user interaction to satisfy browser autoplay policy
  useEffect(() => {
    const mark = () => { hasInteracted.current = true; };
    window.addEventListener('click', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    return () => {
      window.removeEventListener('click', mark);
      window.removeEventListener('keydown', mark);
    };
  }, []);

  // Detect new PENDING orders → play notification sound
  useEffect(() => {
    const currentPending = orders.filter((o) =>
      o.statut === OrderStatus.PENDING || o.statut === OrderStatus.PICKUP
    );
    const newOnes = currentPending.filter((o) => !knownPendingIds.current.has(o.id));

    if (newOnes.length > 0 && hasInteracted.current) {
      try {
        const audio = new Audio('/notification.mp3');
        void audio.play();
      } catch {
        // Audio blocked or file missing — silent failure
      }
    }

    knownPendingIds.current = new Set(currentPending.map((o) => o.id));
  }, [orders]);

  // Group orders by tableId
  const groupedByTable = orders.reduce<Map<string, Order[]>>((map, order) => {
    const list = map.get(order.tableId) ?? [];
    list.push(order);
    map.set(order.tableId, list);
    return map;
  }, new Map());

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b bg-gradient-to-r from-white to-[#FFF8F0] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary">{t('app.name')}</span>
          <span className="hidden text-sm text-muted sm:inline">
            — {t('caissier.dashboard')}
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : groupedByTable.size === 0 ? (
          <p className="mt-10 text-center text-sm text-muted">
            {t('caissier.no_pending')}
          </p>
        ) : (
          <div className="space-y-8">
            {Array.from(groupedByTable.entries()).map(([tableId, tableOrders]) => (
              <section key={tableId}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ink">
                    {tableId === 'takeaway'
                      ? 'Commandes à emporter'
                      : t('table.number', { number: tableOrders[0]?.tableId ?? tableId })}
                  </h3>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                    {tableOrders.length}
                  </span>
                  {tableId === 'takeaway' && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                      🛍️ À emporter
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {tableOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ y: -24, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="rounded-xl ring-2 ring-amber-400 ring-offset-1"
                      >
                        <OrderCard order={order} />
                        <OrderActions order={order} role="caissier" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
