import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import type { Order } from '@/types';

interface OrderStatusProps {
  order: Order;
}

export function OrderStatus({ order }: OrderStatusProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr';

  const itemSummary = order.items
    .map((item) => {
      const name = lang === 'en' ? item.nom_en : item.nom_fr;
      return `${item.quantite}× ${name}`;
    })
    .join(', ');

  return (
    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {order.clientPrenom}
        </span>
        <Badge status={order.statut} />
      </div>

      {itemSummary && (
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
          {itemSummary}
        </p>
      )}

      {order.estimatedMinutes && order.statut === 'IN_PREPARATION' && (
        <p className="mt-1 text-xs text-primary font-medium">
          {t('order.estimated')}&nbsp;{order.estimatedMinutes}&nbsp;{t('order.minutes')}
        </p>
      )}
    </div>
  );
}
