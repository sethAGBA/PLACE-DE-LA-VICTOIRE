import { useTranslation } from 'react-i18next';
import { OrderStatus } from '@/types';

interface BadgeProps {
  status: OrderStatus;
  label?: string;
  className?: string;
}

const statusColorClasses: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.VALIDATED]: 'bg-blue-100 text-blue-800',
  [OrderStatus.IN_PREPARATION]: 'bg-orange-100 text-orange-800',
  [OrderStatus.READY]: 'bg-green-100 text-green-800',
  [OrderStatus.SERVED]: 'bg-teal-100 text-teal-800',
  [OrderStatus.PAID]: 'bg-gray-100 text-gray-700',
  [OrderStatus.REJECTED]: 'bg-red-100 text-red-800',
};

export function Badge({ status, label, className = '' }: BadgeProps) {
  const { t } = useTranslation();
  const displayLabel = label ?? t(`order.status.${status}`);

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        statusColorClasses[status],
        className,
      ].join(' ')}
    >
      {displayLabel}
    </span>
  );
}
