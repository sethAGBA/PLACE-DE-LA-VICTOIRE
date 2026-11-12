import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/Badge';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
}

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
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-gray-900">
            {order.clientPrenom}
          </span>
          <span className="ml-2 text-xs text-gray-500">
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
            <span className="text-gray-500">
              {(item.prix * item.quantite).toLocaleString()} {t('menu.cfa')}
            </span>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="flex items-center justify-between border-t pt-2 text-xs text-gray-500">
        <span>{relativeTime}</span>
        <span className="font-semibold text-gray-800">
          {total.toLocaleString()} {t('menu.cfa')}
        </span>
      </div>
    </motion.div>
  );
}
