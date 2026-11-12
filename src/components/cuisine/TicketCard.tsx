import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TimerSelector } from './TimerSelector';
import { updateOrderStatus } from '@/lib/firestore';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';

interface TicketCardProps {
  order: Order;
}

/**
 * Kitchen ticket card styled like a physical receipt.
 * VALIDATED → "Commencer" (opens TimerSelector, sets IN_PREPARATION)
 * IN_PREPARATION → shows text countdown + "PRÊT !" button (sets READY)
 */
export function TicketCard({ order }: TicketCardProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);

  // Simple text countdown for IN_PREPARATION
  const [remainingLabel, setRemainingLabel] = useState<string>('');

  useEffect(() => {
    if (order.statut !== OrderStatus.IN_PREPARATION) return;
    // Use prepStartedAt as the anchor; fall back to validatedAt for legacy docs
    const anchor = order.prepStartedAt ?? order.validatedAt;
    if (!anchor || !order.estimatedMinutes) return;

    const update = () => {
      const startMs = anchor.toDate().getTime();
      const endMs = startMs + order.estimatedMinutes! * 60_000;
      const diff = Math.max(0, endMs - Date.now());
      const mins = Math.floor(diff / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      setRemainingLabel(
        diff <= 0
          ? t('order.countdown.ready')
          : `${mins}:${secs.toString().padStart(2, '0')} ${t('cuisine.minutes')}`
      );
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [order.statut, order.prepStartedAt, order.validatedAt, order.estimatedMinutes, t]);

  const handleStart = async (minutes: number) => {
    setTimerOpen(false);
    setLoading(true);
    try {
      await updateOrderStatus(order.id, {
        statut: OrderStatus.IN_PREPARATION,
        estimatedMinutes: minutes,
        prepStartedAt: Timestamp.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReady = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, { statut: OrderStatus.READY });
    } finally {
      setLoading(false);
    }
  };

  const time = order.createdAt
    ? order.createdAt.toDate().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <motion.div
      layout
      className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 shadow-sm"
    >
      {/* Table number — large */}
      <div className="mb-1 text-center">
        <span className="text-3xl font-black text-gray-900">
          T{order.tableId}
        </span>
      </div>

      {/* Client name */}
      <p className="mb-3 text-center text-sm font-medium text-gray-600">
        {order.clientPrenom} · {time}
      </p>

      {/* Items — large text for kitchen readability */}
      <ul className="mb-4 space-y-2 border-t border-dashed border-gray-300 pt-3">
        {order.items.map((item, idx) => (
          <li
            key={`${item.productId}-${idx}`}
            className="flex items-baseline justify-between text-base"
          >
            <span className="font-bold text-gray-900">{item.quantite}×</span>
            <span className="ml-2 flex-1 text-gray-800">
              {i18n.language.startsWith('fr') ? item.nom_fr : item.nom_en}
            </span>
          </li>
        ))}
      </ul>

      {/* Countdown (IN_PREPARATION only) */}
      {order.statut === OrderStatus.IN_PREPARATION && remainingLabel && (
        <p className="mb-3 rounded-lg bg-orange-50 px-3 py-2 text-center text-sm font-semibold text-orange-700">
          ⏱ {remainingLabel}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-2">
        {order.statut === OrderStatus.VALIDATED && (
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={() => setTimerOpen(true)}
          >
            {t('order.action.start_prep')}
          </Button>
        )}

        {order.statut === OrderStatus.IN_PREPARATION && (
          <Button
            variant="secondary"
            size="md"
            loading={loading}
            onClick={() => void handleReady()}
          >
            {t('order.action.mark_ready')} 🎉
          </Button>
        )}
      </div>

      {/* TimerSelector modal */}
      <Modal
        open={timerOpen}
        title={t('cuisine.set_timer')}
        onClose={() => setTimerOpen(false)}
      >
        <TimerSelector
          onSelect={(minutes) => void handleStart(minutes)}
        />
      </Modal>
    </motion.div>
  );
}
