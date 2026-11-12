import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, ChefHat, Bell, Star, XCircle } from 'lucide-react';

import { useOrders } from '@/hooks/useOrders';
import { useCartStore } from '@/store/cartStore';
import { OrderStatus, UserRole } from '@/types';
import type { Order } from '@/types';
import { CountdownTimer } from '@/components/client/CountdownTimer';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

// ── Status stepper definition ─────────────────────────────────────────────────
const STEPS: { status: OrderStatus; icon: React.ReactNode; labelKey: string }[] = [
  { status: OrderStatus.PENDING, icon: <Clock size={18} />, labelKey: 'order.status.PENDING' },
  { status: OrderStatus.VALIDATED, icon: <CheckCircle size={18} />, labelKey: 'order.status.VALIDATED' },
  { status: OrderStatus.IN_PREPARATION, icon: <ChefHat size={18} />, labelKey: 'order.status.IN_PREPARATION' },
  { status: OrderStatus.READY, icon: <Bell size={18} />, labelKey: 'order.status.READY' },
  { status: OrderStatus.SERVED, icon: <Star size={18} />, labelKey: 'order.status.SERVED' },
];

const STATUS_ORDER: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.SERVED,
];

function getStepIndex(status: OrderStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ── Celebration particles ─────────────────────────────────────────────────────
function CelebrationParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-3 w-3 rounded-full"
          style={{
            background: i % 2 === 0 ? '#D4580A' : '#2D7D32',
            left: `${10 + i * 11}%`,
            top: '-10%',
          }}
          animate={{ y: ['0%', '110vh'], opacity: [1, 0], rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)] }}
          transition={{ duration: 1.5 + i * 0.2, repeat: Infinity, repeatDelay: 1, ease: 'easeIn' }}
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
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr';

  const cartSessionId = useCartStore((s) => s.sessionId);
  const clearCart = useCartStore((s) => s.clearCart);

  // prefer tracking param, fall back to cart session
  const sessionId = searchParams.get('tracking') ?? cartSessionId;

  const { orders, loading } = useOrders({
    role: UserRole.client,
    tableId,
    sessionId,
  });

  // Most recent order for this session
  const order: Order | undefined = orders[0];

  // Redirect to menu if no order after a moment
  useEffect(() => {
    if (!loading && orders.length === 0 && tableId) {
      navigate(`/table/${tableId}`, { replace: true });
    }
  }, [loading, orders.length, tableId, navigate]);

  function handleBackToMenu() {
    clearCart();
    // Generate new sessionId
    const key = 'pdv-session-id';
    const newId = crypto.randomUUID();
    sessionStorage.setItem(key, newId);
    navigate(`/table/${tableId}`, { replace: true });
    // Force a page reload so the new sessionId is picked up from sessionStorage
    window.location.href = `/table/${tableId}`;
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
  const isReady = order.statut === OrderStatus.READY;
  const isServed = order.statut === OrderStatus.SERVED;

  const orderTotal = order.items.reduce((sum, i) => sum + i.prix * i.quantite, 0);

  return (
    <div className="relative min-h-screen bg-background pb-10">
      {/* Celebration particles when READY */}
      <AnimatePresence>{isReady && <CelebrationParticles />}</AnimatePresence>

      {/* Top header */}
      <header className="bg-white px-4 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-primary">{t('order.my_orders')}</h1>
        <p className="text-sm text-gray-500">
          {t('order.table')}&nbsp;{order.tableId}&nbsp;·&nbsp;{order.clientPrenom}
        </p>
      </header>

      <div className="mx-auto max-w-md space-y-6 px-4 pt-6">
        {/* ── Celebration / status message ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
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
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
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

          {isServed && (
            <motion.div
              key="served"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-teal-50 p-5 text-center"
            >
              <span className="text-4xl" role="img" aria-label="Bon appétit">
                🍽️
              </span>
              <p className="mt-2 text-base font-bold text-teal-700">
                {t('order.countdown.served')}
              </p>
            </motion.div>
          )}

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

        {/* ── Countdown timer ───────────────────────────────────────────────── */}
        {order.statut === OrderStatus.IN_PREPARATION &&
          order.estimatedMinutes &&
          order.validatedAt && (
            <div className="flex justify-center rounded-2xl bg-white p-6 shadow-sm">
              <CountdownTimer
                estimatedMinutes={order.estimatedMinutes}
                startedAt={order.validatedAt}
              />
            </div>
          )}

        {/* ── Status stepper ────────────────────────────────────────────────── */}
        {!isRejected && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('order.title')}
            </h2>
            <ol className="relative border-l border-gray-200 pl-5 space-y-5">
              {STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <li key={step.status} className="relative">
                    {/* Circle on the line */}
                    <span
                      className={[
                        'absolute -left-[1.65rem] flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                        isCompleted
                          ? 'border-secondary bg-secondary text-white'
                          : isCurrent
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 bg-white text-gray-400',
                      ].join(' ')}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {step.icon}
                    </span>
                    <p
                      className={[
                        'pt-0.5 text-sm font-medium',
                        isCompleted ? 'text-secondary' : isCurrent ? 'text-primary' : 'text-gray-400',
                      ].join(' ')}
                    >
                      {t(step.labelKey)}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {/* ── Order items ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {t('cart.title')}
          </h2>
          <ul className="divide-y divide-gray-100">
            {order.items.map((item, idx) => {
              const name = lang === 'en' ? item.nom_en : item.nom_fr;
              return (
                <li key={idx} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">
                    {item.quantite}×&nbsp;{name}
                  </span>
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
              {orderTotal.toLocaleString('fr-FR')}&nbsp;{t('menu.cfa')}
            </span>
          </div>
        </div>

        {/* ── Back to menu ─────────────────────────────────────────────────── */}
        {(isServed || isRejected) && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleBackToMenu}
          >
            {t('common.back')} — {t('menu.title')}
          </Button>
        )}
      </div>
    </div>
  );
}
