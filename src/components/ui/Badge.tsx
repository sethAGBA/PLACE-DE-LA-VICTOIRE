import { useTranslation } from 'react-i18next';
import { OrderStatus } from '@/types';

interface BadgeProps {
  status: OrderStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type StatusStyle = { bg: string; text: string; dot: string };

const statusColorClasses: Record<OrderStatus, StatusStyle> = {
  [OrderStatus.PENDING]:        { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  [OrderStatus.VALIDATED]:       { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  [OrderStatus.IN_PREPARATION]:  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  [OrderStatus.READY]:           { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  [OrderStatus.SERVED]:          { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500' },
  [OrderStatus.PAID]:            { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  [OrderStatus.REJECTED]:        { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  [OrderStatus.PICKUP]:          { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};

// Statuses considered "active" get an animated (pulsing) dot.
const ACTIVE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.VALIDATED,
  OrderStatus.IN_PREPARATION,
  OrderStatus.READY,
  OrderStatus.SERVED,
];

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

export function Badge({ status, label, size = 'md', className = '' }: BadgeProps) {
  const { t } = useTranslation();
  const displayLabel = label ?? t(`order.status.${status}`);
  const style = statusColorClasses[status];
  const isAnimated = ACTIVE_STATUSES.includes(status);

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-semibold',
        style.bg,
        style.text,
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${style.dot} ${
          isAnimated ? 'animate-pulse' : ''
        }`}
      />
      {displayLabel}
    </span>
  );
}
