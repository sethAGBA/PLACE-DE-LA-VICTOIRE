import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Receipt } from '@/components/shared/Receipt';
import { updateOrderStatus, incrementProductOrderCount } from '@/lib/firestore';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';

interface OrderActionsProps {
  order: Order;
  role?: 'serveur' | 'caissier';
}

/**
 * Action buttons for a given order status:
 * - PENDING  → Valider (green) + Rejeter (red, modal for reason)
 * - READY    → Marquer SERVI
 * - SERVED   → Paiement encaissé
 * - PAID     → Voir le reçu
 */
export function OrderActions({ order, role = 'serveur' }: OrderActionsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectedReason, setRejectedReason] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);

  const run = async (patch: Partial<Order>) => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, patch);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    try {
      await updateOrderStatus(order.id, {
        statut: OrderStatus.VALIDATED,
        validatedAt: Timestamp.now(),
      });
      await Promise.all(
        order.items.map((item) =>
          incrementProductOrderCount(item.productId, item.quantite)
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setRejectModalOpen(false);
    await run({
      statut: OrderStatus.REJECTED,
      rejectedReason: rejectedReason.trim() || undefined,
    });
    setRejectedReason('');
  };

  const handleServed = () => run({ statut: OrderStatus.SERVED, servedAt: Timestamp.now() });
  const handlePaid   = () => run({ statut: OrderStatus.PAID,   paidAt:  Timestamp.now() });
  const handlePickup = () => run({ statut: OrderStatus.PICKUP });

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {role === 'caissier' ? (
          <>
            {order.isTakeaway && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                🛍️ À emporter
              </span>
            )}
            {order.statut === OrderStatus.PENDING && (
              <>
                <Button variant="secondary" size="sm" loading={loading} onClick={() => void handleValidate()}>
                  ✅ {t('order.action.validate')}
                </Button>
                <Button variant="danger" size="sm" disabled={loading} onClick={() => setRejectModalOpen(true)}>
                  ❌ {t('order.action.reject')}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            {order.isTakeaway && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                🛍️ À emporter
              </span>
            )}
            {order.statut === OrderStatus.READY && (
              order.isTakeaway ? (
                <Button variant="primary" size="sm" loading={loading} onClick={() => void handlePickup()}>
                  🛍️ {t('order.action.mark_retrieved')}
                </Button>
              ) : (
                <Button variant="primary" size="sm" loading={loading} onClick={() => void handleServed()}>
                  🍽️ {t('order.action.mark_served')}
                </Button>
              )
            )}

            {order.statut === OrderStatus.SERVED && (
              <Button variant="primary" size="sm" loading={loading} onClick={() => void handlePaid()}>
                💰 {t('order.action.mark_paid')}
              </Button>
            )}

            {order.statut === OrderStatus.PICKUP && (
              <Button variant="primary" size="sm" loading={loading} onClick={() => void handlePaid()}>
                💰 {t('order.action.mark_paid')}
              </Button>
            )}

            {order.statut === OrderStatus.PAID && (
              <Button variant="ghost" size="sm" onClick={() => setReceiptOpen(true)}>
                🧾 {t('receipt.view')}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Reject modal */}
      <Modal open={rejectModalOpen} title={t('order.action.reject')} onClose={() => setRejectModalOpen(false)}>
        <div className="space-y-4">
          <label className="block text-sm text-gray-700">
            {t('order.action.confirm_reject')}
            <textarea
              value={rejectedReason}
              onChange={(e) => setRejectedReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRejectModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="sm" loading={loading} onClick={() => void handleReject()}>
              {t('order.action.reject')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receipt modal */}
      <Modal open={receiptOpen} title={t('receipt.title')} onClose={() => setReceiptOpen(false)}>
        <Receipt order={order} showActions />
      </Modal>
    </>
  );
}
