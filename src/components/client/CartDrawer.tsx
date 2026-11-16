import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cartStore';
import { createOrder } from '@/lib/firestore';
import { OrderStatus } from '@/types';
import { Button } from '@/components/ui/Button';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr';
  const navigate = useNavigate();

  const { items, tableId, sessionId, updateQuantity, removeItem, clearCart, total,
    clientNom, clientTelephone, isTakeaway } =
    useCartStore();

  const storePrenom = useCartStore((s) => s.clientPrenom);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [prenom, setPrenom] = useState(storePrenom ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlaceOrder() {
    if (!tableId || !prenom.trim()) return;
    if (isTakeaway && !/^\+228\d{8}$/.test(clientTelephone ?? '')) {
      setError('Numéro de téléphone invalide. Format attendu : +228XXXXXXXX (8 chiffres après +228).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createOrder({
        tableId,
        sessionId,
        clientPrenom: prenom.trim(),
        clientNom: clientNom || undefined,
        clientTelephone: clientTelephone || undefined,
        isTakeaway: isTakeaway || undefined,
        statut: OrderStatus.PENDING,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createdAt: serverTimestamp() as any,
        items,
      });
      clearCart();
      setConfirmOpen(false);
      onClose();
      if (tableId === 'takeaway') {
        navigate(`/commander/tracking?tracking=${sessionId}`);
      } else {
        navigate(`/table/${tableId}/tracking?tracking=${sessionId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }

  const grandTotal = total();

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="cart-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t('cart.title')}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary to-[#E8690F] px-5 py-4">
              <h2 className="text-lg font-bold text-white">{t('cart.title')}</h2>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-gray-400">
                  <ShoppingBag size={48} strokeWidth={1} />
                  <p className="text-sm">{t('cart.empty')}</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {items.map((item) => {
                    const name = lang === 'en' ? item.nom_en : item.nom_fr;
                    return (
                      <li
                        key={item.productId}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 border-l-4 border-l-primary/40 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{name}</p>
                          <p className="text-xs text-primary font-semibold">
                            {(item.prix * item.quantite).toLocaleString('fr-FR')}&nbsp;{t('menu.cfa')}
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantite - 1)}
                            aria-label={`Réduire ${name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-sm font-bold text-ink">{item.quantite}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantite + 1)}
                            aria-label={`Augmenter ${name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition hover:bg-[#E8690F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.productId)}
                          aria-label={`Supprimer ${name}`}
                          className="rounded-lg p-1 text-gray-400 transition hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-xl font-bold text-ink">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary">
                    {grandTotal.toLocaleString('fr-FR')}&nbsp;{t('menu.cfa')}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setConfirmOpen(true)}
                >
                  {t('cart.order_button')}
                </Button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div
              key="confirm-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50"
              aria-hidden="true"
              onClick={() => setConfirmOpen(false)}
            />
            <motion.div
              key="confirm-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-order-title"
            >
              <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl px-6 py-6 space-y-4">
                <h3 id="confirm-order-title" className="text-lg font-bold text-ink">
                  {t('cart.confirm_title')}
                </h3>
                <p className="text-sm text-muted">{t('cart.confirm_message')}</p>

                <div className="space-y-1">
                  <label
                    htmlFor="client-prenom"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('cart.your_name')}
                  </label>
                  <input
                    id="client-prenom"
                    type="text"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    placeholder={t('cart.name_placeholder')}
                    maxLength={30}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setConfirmOpen(false)}
                    disabled={loading}
                  >
                    {t('cart.cancel')}
                  </Button>
                  <Button
                    className="flex-1"
                    loading={loading}
                    disabled={!prenom.trim()}
                    onClick={() => void handlePlaceOrder()}
                  >
                    {t('cart.confirm')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
