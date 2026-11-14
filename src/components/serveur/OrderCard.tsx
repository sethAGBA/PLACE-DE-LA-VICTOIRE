import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/Badge';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
}

// Colored top strip per status (brief status palette)
const statusBar: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-amber-500',
  [OrderStatus.VALIDATED]: 'bg-blue-500',
  [OrderStatus.IN_PREPARATION]: 'bg-orange-500',
  [OrderStatus.READY]: 'bg-green-500',
  [OrderStatus.SERVED]: 'bg-teal-500',
  [OrderStatus.PAID]: 'bg-gray-400',
  [OrderStatus.REJECTED]: 'bg-red-500',
};

/**
 * Displays one order's details for the waiter — clientPrenom, table number,
 * items, total price, relative createdAt, and current status badge.
 * Uses Framer Motion `layout` so cards reorder smoothly as statuses change.
 */
export function OrderCard({ order }: OrderCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith('fr') ? fr : enUS;

  const total = order.items.reduce(
    (sum, item) => sum + item.prix * item.quantite,
    0
  );

  const relativeTime = order.createdAt
    ? formatDistanceToNow(order.createdAt.toDate(), {
        addSuffix: true,
        locale,
      })
    : '—';

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md"
    >
      {/* Colored status strip */}
      <div className={`h-1.5 ${statusBar[order.statut]}`} />

      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <span className="text-sm font-semibold text-ink">
              {order.clientPrenom}
            </span>
            <span className="ml-2 text-xs text-muted">
              {t('order.table')} #{order.tableId}
            </span>
          </div>
          <Badge status={order.statut} />
        </div>

        {/* Items */}
        <ul className="mb-3 space-y-1">
          {order.items.map((item, idx) => (
            <li key={`${item.productId}-${idx}`} className="flex justify-between text-sm text-gray-700">
              <span>
                <span className="font-medium">{item.quantite}×</span>{' '}
                {i18n.language.startsWith('fr') ? item.nom_fr : item.nom_en}
              </span>
              <span className="text-muted">
                {(item.prix * item.quantite).toLocaleString()} {t('menu.cfa')}
              </span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-2 text-xs text-muted">
          <span>{relativeTime}</span>
          <span className="font-semibold text-primary">
            {total.toLocaleString()} {t('menu.cfa')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
