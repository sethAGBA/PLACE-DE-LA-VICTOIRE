import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getTableById } from '@/lib/firestore';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useCartStore } from '@/store/cartStore';
import { OrderStatus, UserRole } from '@/types';
import type { Table } from '@/types';

import { Spinner } from '@/components/ui/Spinner';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { MenuCard } from '@/components/client/MenuCard';
import { CartDrawer } from '@/components/client/CartDrawer';
import { OrderStatus as OrderStatusComp } from '@/components/client/OrderStatus';
import { CountdownTimer } from '@/components/client/CountdownTimer';

const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.SERVED,
];

export default function TablePage() {
  const { tableId = '' } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const trackingSession = searchParams.get('tracking');

  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr';

  // ── Table loading ──────────────────────────────────────────────────────────
  const [table, setTable] = useState<Table | null>(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(false);

  useEffect(() => {
    if (!tableId) { setTableError(true); setTableLoading(false); return; }
    getTableById(tableId)
      .then((t) => {
        if (!t) setTableError(true);
        else setTable(t);
      })
      .catch(() => setTableError(true))
      .finally(() => setTableLoading(false));
  }, [tableId]);

  // ── Cart store ─────────────────────────────────────────────────────────────
  const { setTableId, items, sessionId } = useCartStore();

  useEffect(() => {
    if (tableId) setTableId(tableId);
  }, [tableId, setTableId]);

  // ── Orders for this session ────────────────────────────────────────────────
  const { orders } = useOrders({
    role: UserRole.client,
    tableId,
    sessionId: trackingSession ?? sessionId,
  });

  const activeOrder = orders.find((o) => ACTIVE_STATUSES.includes(o.statut));

  // ── Products & categories ──────────────────────────────────────────────────
  const { categories, products, loading: productsLoading } = useProducts();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const categoryTabsRef = useRef<HTMLDivElement>(null);

  // Set initial category once categories load
  useEffect(() => {
    if (categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!activeCategory || !categoryTabsRef.current) return;
    const btn = categoryTabsRef.current.querySelector(
      `[data-category="${activeCategory}"]`
    ) as HTMLElement | null;
    btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeCategory]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const inCategory = activeCategory === null || p.categorieId === activeCategory;
    const matchesSearch =
      search.trim() === '' ||
      (lang === 'en' ? p.nom_en : p.nom_fr)
        .toLowerCase()
        .includes(search.toLowerCase());
    return inCategory && matchesSearch && p.disponible;
  });

  const cartItemCount = items.reduce((sum, i) => sum + i.quantite, 0);

  // ── Render guards ──────────────────────────────────────────────────────────
  if (tableLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (tableError || !table) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-gray-900">{t('errors.table_not_found')}</h1>
        <p className="text-sm text-gray-500">{t('table.scan_qr')}</p>
      </div>
    );
  }

  const zoneLabel = t(`table.zone.${table.zone}`);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col leading-tight min-w-0">
          <span className="truncate text-base font-bold text-primary">{t('app.name')}</span>
          <span className="text-xs text-gray-500">
            {t('table.number')}{table.numero}&nbsp;·&nbsp;
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-primary">
              {zoneLabel}
            </span>
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* ── Active order banner ──────────────────────────────────────────────── */}
      {activeOrder && (
        <div className="px-4 pt-4">
          <OrderStatusComp order={activeOrder} />
          {activeOrder.statut === OrderStatus.IN_PREPARATION &&
            activeOrder.estimatedMinutes &&
            activeOrder.validatedAt && (
              <div className="mt-4 flex justify-center">
                <CountdownTimer
                  estimatedMinutes={activeOrder.estimatedMinutes}
                  startedAt={activeOrder.validatedAt}
                />
              </div>
            )}
        </div>
      )}

      {/* ── Menu (only shown when no active order OR order is tracking-only) ── */}
      {!activeOrder && (
        <div className="flex flex-1 flex-col">
          {/* Search bar */}
          <div className="sticky top-16 z-20 bg-background px-4 pt-3 pb-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('menu.search_placeholder')}
                aria-label={t('menu.search_placeholder')}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div
            ref={categoryTabsRef}
            className="sticky top-[6.5rem] z-20 flex gap-2 overflow-x-auto bg-background px-4 pb-2 scrollbar-hide"
            role="tablist"
            aria-label={t('menu.title')}
          >
            {categories.map((cat) => {
              const name = lang === 'en' ? cat.nom_en : cat.nom_fr;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  data-category={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveCategory(cat.id)}
                  className={[
                    'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  ].join(' ')}
                >
                  {cat.icon && <span aria-hidden="true" className="mr-1">{cat.icon}</span>}
                  {name}
                </button>
              );
            })}
          </div>

          {/* Product grid */}
          <main className="flex-1 px-4 pb-28 pt-2">
            {productsLoading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-gray-400">
                <span className="text-4xl">🍽️</span>
                <p className="text-sm">{t('menu.no_results')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredProducts.map((product) => (
                  <MenuCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* ── Floating cart button ─────────────────────────────────────────────── */}
      {!activeOrder && cartItemCount > 0 && (
        <div className="fixed bottom-6 right-4 z-30">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setCartOpen(true)}
            aria-label={`${t('cart.title')} (${cartItemCount})`}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            <ShoppingCart size={24} />
            <AnimatePresence>
              <motion.span
                key={cartItemCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-primary shadow"
              >
                {cartItemCount}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      )}

      {/* ── Cart drawer ──────────────────────────────────────────────────────── */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
