import { useTranslation } from 'react-i18next';
import { TableZone } from '@/types';
import type { Table } from '@/types';

interface TableCardProps {
  table: Table;
  activeOrderCount: number;
  selected: boolean;
  onClick: () => void;
}

const zoneColors: Record<TableZone, string> = {
  [TableZone.salle]: 'bg-blue-100 text-blue-800',
  [TableZone.paillote]: 'bg-yellow-100 text-yellow-800',
  [TableZone.jardin]: 'bg-green-100 text-green-800',
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
        'w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'border-primary bg-orange-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-primary/50 hover:shadow-sm',
      ].join(' ')}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900">
          {t('table.number')}{table.numero}
        </span>
        <span
          className={[
            'rounded-full px-2 py-0.5 text-xs font-semibold',
            zoneColors[table.zone],
          ].join(' ')}
        >
          {t(`table.zone.${table.zone}`)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span
          className={
            table.statut === 'occupee'
              ? 'text-orange-600 font-medium'
              : 'text-green-600 font-medium'
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
