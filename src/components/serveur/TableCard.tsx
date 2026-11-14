import { useTranslation } from 'react-i18next';
import { TableZone } from '@/types';
import type { Table } from '@/types';

interface TableCardProps {
  table: Table;
  activeOrderCount: number;
  selected: boolean;
  onClick: () => void;
}

const zoneBadge: Record<TableZone, string> = {
  [TableZone.salle]: 'bg-blue-100 text-blue-700',
  [TableZone.paillote]: 'bg-amber-100 text-amber-700',
  [TableZone.jardin]: 'bg-green-100 text-green-700',
};

const zoneBorder: Record<TableZone, string> = {
  [TableZone.salle]: 'border-l-blue-500',
  [TableZone.paillote]: 'border-l-amber-500',
  [TableZone.jardin]: 'border-l-green-500',
};

/**
 * Summary card for a table: number, zone badge, active order count,
 * and table status (libre / occupée). Clicking filters orders to this table.
 */
export function TableCard({
  table,
  activeOrderCount,
  selected,
  onClick,
}: TableCardProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'w-full rounded-2xl border border-l-4 p-3 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'border-primary border-l-primary bg-primary/5 shadow-md'
          : `border-gray-200 ${zoneBorder[table.zone]} bg-white hover:shadow-sm hover:border-primary/50`,
      ].join(' ')}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-bold text-ink">
          {t('table.number')}{table.numero}
        </span>
        <span
          className={[
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            zoneBadge[table.zone],
          ].join(' ')}
        >
          {t(`table.zone.${table.zone}`)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span
          className={
            table.statut === 'occupee'
              ? 'font-medium text-orange-600'
              : 'font-medium text-green-600'
          }
        >
          {t(`table.status.${table.statut}`)}
        </span>
        {activeOrderCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
            {activeOrderCount}
          </span>
        )}
      </div>
    </button>
  );
}
