import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getTables } from '@/lib/firestore';
import { useProducts } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import type { Table } from '@/types';

import { Spinner } from '@/components/ui/Spinner';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { MenuCard } from '@/components/client/MenuCard';
import { CartDrawer } from '@/components/client/CartDrawer';

const CAROUSEL_IMAGES = [
  { src: '/MENU/Soupe%20au%20poulet.jpg', alt: 'Soupe au poulet' },
  { src: '/MENU/Petit%20d%C3%A9jeuner%20complet.jpg', alt: 'Petit déjeuner complet' },
  { src: '/MENU/Soupe%20de%20poisson.webp', alt: 'Soupe de poisson' },
  { src: '/MENU/Atti%C3%A9k%C3%A9.webp', alt: 'Attiéké' },
  { src: '/MENU/Foufou.jpg', alt: 'Foufou' },
  { src: '/MENU/Salade%20verte.webp', alt: 'Salade verte' },
];

export default function TakeawayPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr';

  // ── Cart store ─────────────────────────────────────────────────────────────
  const {
    setTableId,
    setClientPrenom,
    setClientNom,
    setClientTelephone,
    setIsTakeaway,
    items,
  } = useCartStore();

  // ── Local form state ───────────────────────────────────────────────────────
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('+228');
  const [mode, setMode] = useState<'sur_place' | 'a_emporter'>('sur_place');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // ── Phone validation ───────────────────────────────────────────────────────
  const validatePhone = (val: string) => {
    if (val && val !== '+228' && !/^\+228\d{8}$/.test(val)) {
      setPhoneError(t('takeaway.phone_error'));
    } else {
      setPhoneError('');
    }
  };

  // ── Sync form → store ──────────────────────────────────────────────────────
  useEffect(() => { setClientPrenom(prenom); }, [prenom, setClientPrenom]);
  useEffect(() => { setClientNom(nom); }, [nom, setClientNom]);
  useEffect(() => { setClientTelephone(telephone); }, [telephone, setClientTelephone]);

  useEffect(() => {
    if (mode === 'a_emporter') {
      setTableId('takeaway');
      setIsTakeaway(true);
    } else {
      setIsTakeaway(false);
      if (selectedTableId) setTableId(selectedTableId);
    }
  }, [mode, selectedTableId, setTableId, setIsTakeaway]);

  // ── Tables ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = getTables(setTables);
    return () => unsub();
  }, []);

  // Set first table by default when tables load
  useEffect(() => {
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
      setTableId(tables[0].id);
    }
  }, [tables, selectedTableId, setTableId]);

  // ── Products & categories ──────────────────────────────────────────────────
  const { categories, products, loading: productsLoading } = useProducts();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const categoryTabsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLElement>(null);

  // ── Carousel state ─────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (categories.length > 0 && activeCategory === null) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!activeCategory || !categoryTabsRef.current) return;
    const btn = categoryTabsRef.current.querySelector(
      `[data-category="${activeCategory}"]`
    ) as HTMLElement | null;
    btn?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeCategory]);

  // Auto-advance carousel every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Fix 2: search bypasses category filter
  const filteredProducts = products.filter((p) => {
    if (!p.disponible) return false;
    const query = search.trim();
    if (query !== '') {
      return (lang === 'en' ? p.nom_en : p.nom_fr)
        .toLowerCase()
        .includes(query.toLowerCase());
    }
    return activeCategory === null || p.categorieId === activeCategory;
  });

  const cartItemCount = items.reduce((sum, i) => sum + i.quantite, 0);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-r from-primary to-[#E8690F] px-4 py-3 shadow-md">
        <div className="flex flex-col leading-tight min-w-0">
          <span className="truncate text-base font-bold text-white">{t('app.name')}</span>
          <span className="text-xs text-white/80">{t('takeaway.subtitle')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* ── Hero carrousel ──────────────────────────────────────────────────── */}
      <section className="relative h-56 md:h-72 w-full overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentIndex}
            src={CAROUSEL_IMAGES[currentIndex].src}
            alt={CAROUSEL_IMAGES[currentIndex].alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {/* Overlay gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
          aria-hidden="true"
        />

        {/* Centered text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-white">
          <p className="text-2xl font-black tracking-tight drop-shadow">
            🍽️ Place de la Victoire
          </p>
          <p className="text-sm text-white/80">Restaurant – Kara, Togo</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={scrollToForm}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-bold text-primary shadow-lg transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Commander maintenant →
          </motion.button>
        </div>

        {/* Navigation dots */}
        <div
          className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5"
          role="tablist"
          aria-label="Carrousel navigation"
        >
          {CAROUSEL_IMAGES.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Image ${i + 1}`}
              onClick={() => setCurrentIndex(i)}
              className={[
                'h-1.5 rounded-full transition-all duration-300',
                i === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50',
              ].join(' ')}
            />
          ))}
        </div>
      </section>

      {/* ── Coordonnées form ────────────────────────────────────────────────── */}
      <section ref={formRef} className="mx-auto w-full max-w-lg px-4 py-6">
        <div className="rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-4 text-base font-bold text-ink">{t('takeaway.form_title')}</h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Prénom */}
            <div className="space-y-1">
              <label htmlFor="tw-prenom" className="block text-xs font-medium text-gray-700">
                {t('takeaway.firstname')} *
              </label>
              <input
                id="tw-prenom"
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex. Kofi"
                maxLength={30}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Nom */}
            <div className="space-y-1">
              <label htmlFor="tw-nom" className="block text-xs font-medium text-gray-700">
                {t('takeaway.lastname')} *
              </label>
              <input
                id="tw-nom"
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Mensah"
                maxLength={30}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="mt-3 space-y-1">
            <label htmlFor="tw-tel" className="block text-xs font-medium text-gray-700">
              {t('takeaway.phone')} *
            </label>
            <input
              id="tw-tel"
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              onBlur={(e) => validatePhone(e.target.value)}
              onFocus={(e) => {
                const len = e.target.value.length;
                e.target.setSelectionRange(len, len);
              }}
              placeholder={t('takeaway.phone_placeholder')}
              pattern="^\+228\d{8}$"
              maxLength={12}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {phoneError && (
              <p className="text-xs text-red-600">{phoneError}</p>
            )}
          </div>

          {/* Mode */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-700">{t('takeaway.mode')}</p>
            <div className="flex gap-3">
              {(['sur_place', 'a_emporter'] as const).map((m) => {
                const label = m === 'sur_place' ? t('takeaway.on_site') : t('takeaway.to_go');
                const isActive = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={[
                      'flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isActive
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-primary/40',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table select (sur place only) */}
          <AnimatePresence>
            {mode === 'sur_place' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <label htmlFor="tw-table" className="block text-xs font-medium text-gray-700">
                  {t('takeaway.choose_table')}
                </label>
                <select
                  id="tw-table"
                  value={selectedTableId}
                  onChange={(e) => {
                    setSelectedTableId(e.target.value);
                    setTableId(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.id}>
                      {t('table.number')}{tbl.numero} — {t(`table.zone.${tbl.zone}`)}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Menu section ────────────────────────────────────────────────────── */}
      <div ref={menuRef} className="flex flex-1 flex-col">
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
              className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                  'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary to-[#E8690F] text-white shadow-md'
                    : 'bg-white text-muted hover:bg-primary/10 hover:text-primary',
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

      {/* ── Floating cart button ─────────────────────────────────────────────── */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 right-4 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setCartOpen(true)}
            disabled={!!(phoneError && mode === 'a_emporter' && telephone)}
            aria-label={`${t('cart.title')} (${cartItemCount})`}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-[#E8690F] text-white shadow-xl shadow-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
