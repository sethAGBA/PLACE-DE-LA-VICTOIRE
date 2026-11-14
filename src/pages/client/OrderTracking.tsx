import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, ChefHat, Bell, Star, XCircle, PartyPopper } from 'lucide-react';

import { useOrders } from '@/hooks/useOrders';
import { useCartStore } from '@/store/cartStore';
import { OrderStatus, UserRole } from '@/types';
import type { Order } from '@/types';
import { CountdownTimer } from '@/components/client/CountdownTimer';
import { Receipt } from '@/components/shared/Receipt';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// ── Status stepper ─────────────────────────────────────────────────────────────
const STEPS: { status: OrderStatus; icon: React.ReactNode; labelKey: string }[] = [
  { status: OrderStatus.PENDING,        icon: <Clock size={18} />,       labelKey: 'order.status.PENDING' },
  { status: OrderStatus.VALIDATED,      icon: <CheckCircle size={18} />, labelKey: 'order.status.VALIDATED' },
  { status: OrderStatus.IN_PREPARATION, icon: <ChefHat size={18} />,     labelKey: 'order.status.IN_PREPARATION' },
  { status: OrderStatus.READY,          icon: <Bell size={18} />,        labelKey: 'order.status.READY' },
  { status: OrderStatus.SERVED,         icon: <Star size={18} />,        labelKey: 'order.status.SERVED' },
];

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.PAID,
];

function getStepIndex(status: OrderStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : Math.min(idx, STEPS.length - 1);
}

// ── Celebration particles ──────────────────────────────────────────────────────
function CelebrationParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-3 w-3 rounded-full"
          style={{
            background: i % 3 === 0 ? '#D4580A' : i % 3 === 1 ? '#2D7D32' : '#FFC107',
            left: `${5 + i * 9}%`,
            top: '-10%',
          }}
          animate={{ y: ['0%', '110vh'], opacity: [1, 0], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)] }}
          transition={{ duration: 1.5 + i * 0.15, repeat: Infinity, repeatDelay: 0.8, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OrderTracking() {
  const { tableId = '' } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const cartSessionId = useCartStore((s) => s.sessionId);
  const clearCart = useCartStore((s) => s.clearCart);

  const sessionId = searchParams.get('tracking') ?? cartSessionId;

  const { orders, loading } = useOrders({
    role: UserRole.client,
    tableId,
    sessionId,
  });

  const [receiptOpen, setReceiptOpen] = useState(false);

  const order: Order | undefined = orders[0];

  // Redirect to menu only if truly no order and not loading
  useEffect(() => {
    if (!loading && orders.length === 0 && tableId) {
      const timer = setTimeout(() => {
        navigate(`/table/${tableId}`, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, orders.length, tableId, navigate]);

  function handleBackToMenu() {
    clearCart();
    navigate(`/table/${tableId}`, { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) return null;

  const currentStepIdx = getStepIndex(order.statut);
  const isRejected = order.statut === OrderStatus.REJECTED;
  const isReady    = order.statut === OrderStatus.READY;
  const isServed   = order.statut === OrderStatus.SERVED;
  const isPaid     = order.statut === OrderStatus.PAID;

  return (
    <div className="relative min-h-screen bg-background pb-10">
      {/* Particles — READY ou PAID */}
      <AnimatePresence>
        {(isReady || isPaid) && <CelebrationParticles />}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white px-4 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-primary">{t('order.my_orders')}</h1>
        <p className="text-sm text-gray-500">
          {t('order.table')}&nbsp;{order.tableId}&nbsp;·&nbsp;{order.clientPrenom}
        </p>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 pt-6">

        {/* ── PAID : page de remerciement ─────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isPaid && (
            <motion.div
              key="paid"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-green-50 p-6 text-center shadow-sm"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                className="text-5xl"
                aria-hidden="true"
              >
                🎉
              </motion.div>
              <p className="mt-3 text-xl font-black text-green-700">
                {t('receipt.thanks')}
              </p>
              <p className="mt-1 text-sm text-green-600">
                {t('receipt.paid_message')}
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full gap-2"
                  onClick={() => setReceiptOpen(true)}
                >
                  <PartyPopper size={16} />
                  {t('receipt.view')}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={handleBackToMenu}
                >
                  {t('receipt.back_to_menu')}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── READY ───────────────────────────────────────────────────────── */}
          {isReady && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-green-50 p-5 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-4xl"
                aria-hidden="true"
              >
                🛎️
              </motion.div>
              <p className="mt-2 text-base font-bold text-green-700">
                {t('order.countdown.ready')}
              </p>
            </motion.div>
          )}

          {/* ── SERVED ──────────────────────────────────────────────────────── */}
          {isServed && (
            <motion.div
              key="served"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-teal-50 p-5 text-center"
            >
              <span className="text-4xl" role="img" aria-label="Bon appétit">🍽️</span>
              <p className="mt-2 text-base font-bold text-teal-700">
                {t('order.countdown.served')}
              </p>
            </motion.div>
          )}

          {/* ── REJECTED ────────────────────────────────────────────────────── */}
          {isRejected && (
            <motion.div
              key="rejected"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-2xl bg-red-50 p-5"
            >
              <XCircle size={22} className="mt-0.5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold text-red-700">{t('order.status.REJECTED')}</p>
                {order.rejectedReason && (
                  <p className="mt-1 text-sm text-red-600">{order.rejectedReason}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Countdown ───────────────────────────────────────────────────── */}
        {order.statut === OrderStatus.IN_PREPARATION &&
          order.estimatedMinutes &&
          order.validatedAt && (
            <div className="flex justify-center rounded-2xl bg-white p-6 shadow-sm">
              <CountdownTimer
                estimatedMinutes={order.estimatedMinutes}
                startedAt={order.prepStartedAt ?? order.validatedAt}
              />
            </div>
          )}

        {/* ── Stepper (caché quand PAID) ───────────────────────────────────── */}
        {!isRejected && !isPaid && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
              {t('order.title')}
            </h2>
            <ol className="relative space-y-5 border-l border-gray-200 pl-5">
              {STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent   = idx === currentStepIdx;
                return (
                  <li key={step.status} className="relative">
                    <span
                      className={[
                        'absolute -left-[1.65rem] flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                        isCompleted ? 'border-secondary bg-secondary text-white'
                          : isCurrent ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 bg-white text-gray-400',
                      ].join(' ')}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {step.icon}
                    </span>
                    <p className={[
                      'pt-0.5 text-sm font-medium',
                      isCompleted ? 'text-secondary' : isCurrent ? 'text-primary' : 'text-gray-400',
                    ].join(' ')}>
                      {t(step.labelKey)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* ── Récapitulatif commande (caché quand PAID, le reçu le remplace) ─ */}
        {!isPaid && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
              {t('cart.title')}
            </h2>
            <ul className="divide-y divide-gray-100">
              {order.items.map((item, idx) => {
                const name = i18n.language.startsWith('en') ? item.nom_en : item.nom_fr;
                return (
                  <li key={idx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700">{item.quantite}×&nbsp;{name}</span>
                    <span className="text-sm font-semibold text-primary">
                      {(item.prix * item.quantite).toLocaleString('fr-FR')}&nbsp;{t('menu.cfa')}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-sm font-bold text-gray-900">{t('cart.total')}</span>
              <span className="text-base font-bold text-primary">
                {order.items.reduce((s, i) => s + i.prix * i.quantite, 0).toLocaleString('fr-FR')}&nbsp;{t('menu.cfa')}
              </span>
            </div>
          </div>
        )}

        {/* ── Retour menu (SERVED ou REJECTED) ────────────────────────────── */}
        {(isServed || isRejected) && (
          <Button variant="ghost" className="w-full" onClick={handleBackToMenu}>
            {t('common.back')} — {t('menu.title')}
          </Button>
        )}
      </div>

      {/* ── Modal reçu ──────────────────────────────────────────────────────── */}
      <Modal
        open={receiptOpen}
        title={t('receipt.title')}
        onClose={() => setReceiptOpen(false)}
      >
        <Receipt order={order} showActions />
        <div className="mt-4">
          <Button variant="ghost" className="w-full" onClick={handleBackToMenu}>
            {t('receipt.back_to_menu')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Need i18n in JSX above — re-export hook usage inline
// The variable `i18n` is destructured from useTranslation above
