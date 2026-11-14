import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TicketCard } from './TicketCard';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';

interface KanbanBoardProps {
  orders: Order[];
}

/**
 * Two-column Kanban for the kitchen:
 * - Left: "En attente / Waiting" (VALIDATED orders)
 * - Right: "En préparation / In Preparation" (IN_PREPARATION orders)
 * AnimatePresence handles enter/exit when tickets move columns.
 */
export function KanbanBoard({ orders }: KanbanBoardProps) {
  const { t } = useTranslation();

  const validated = orders.filter((o) => o.statut === OrderStatus.VALIDATED);
  const inPrep = orders.filter((o) => o.statut === OrderStatus.IN_PREPARATION);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Column: VALIDATED */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 shadow-md">
          <span className="font-semibold text-white">
            {t('order.status.VALIDATED')}
          </span>
          <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold text-white">
            {validated.length}
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {validated.map((order) => (
              <TicketCard key={order.id} order={order} />
            ))}
          </AnimatePresence>

          {validated.length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-sm text-muted">
              {t('order.empty')}
            </p>
          )}
        </div>
      </div>

      {/* Column: IN_PREPARATION */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-primary px-4 py-2 shadow-md">
          <span className="font-semibold text-white">
            {t('order.status.IN_PREPARATION')}
          </span>
          <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs font-bold text-white">
            {inPrep.length}
          </span>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {inPrep.map((order) => (
              <TicketCard key={order.id} order={order} />
            ))}
          </AnimatePresence>

          {inPrep.length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-sm text-muted">
              {t('order.empty')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
