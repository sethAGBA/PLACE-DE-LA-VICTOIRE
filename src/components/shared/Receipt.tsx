import { useTranslation } from 'react-i18next';
import { Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';

interface ReceiptProps {
  order: Order;
  /** If true, shows print/download buttons */
  showActions?: boolean;
}

/**
 * Reçu de commande imprimable — utilisé côté client (OrderTracking)
 * et côté serveur (OrderActions après PAID).
 * Généré entièrement côté client, aucune dépendance externe.
 */
export function Receipt({ order, showActions = true }: ReceiptProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr';

  const total = order.items.reduce((sum, i) => sum + i.prix * i.quantite, 0);

  const dateStr = order.createdAt
    ? order.createdAt.toDate().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';

  const paidStr = order.paidAt
    ? order.paidAt.toDate().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const lines: string[] = [
      '============================',
      '    PLACE DE LA VICTOIRE    ',
      '    Restaurant – Kara, Togo ',
      '============================',
      '',
      `${t('receipt.table')} : ${order.tableId}`,
      `${t('receipt.client')} : ${order.clientPrenom || '—'}`,
      `${t('receipt.date')} : ${dateStr}`,
      `${t('receipt.paid_at')} : ${paidStr}`,
      '',
      '----------------------------',
      ...order.items.map(
        (item) =>
          `${item.quantite}x ${lang === 'fr' ? item.nom_fr : item.nom_en}`.padEnd(22) +
          `${(item.prix * item.quantite).toLocaleString('fr-FR')} FCFA`
      ),
      '----------------------------',
      `${'TOTAL'.padEnd(22)}${total.toLocaleString('fr-FR')} FCFA`,
      '============================',
      '',
      t('receipt.thanks'),
      '',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-table-${order.tableId}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="receipt-container font-mono">
      {/* Receipt card */}
      <div
        id="receipt-print"
        className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm shadow-md"
      >
        {/* Header */}
        <div className="mb-4 text-center">
          <p className="text-base font-black uppercase tracking-widest text-primary">
            Place de la Victoire
          </p>
          <p className="text-xs text-gray-500">Restaurant – Kara, Togo</p>
          <p className="mt-1 text-xs text-gray-400">
            ════════════════════════
          </p>
        </div>

        {/* Meta */}
        <div className="mb-3 space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span className="font-semibold">{t('receipt.table')}</span>
            <span>{order.tableId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t('receipt.client')}</span>
            <span>{order.clientPrenom || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">{t('receipt.date')}</span>
            <span>{dateStr}</span>
          </div>
          {order.paidAt && (
            <div className="flex justify-between">
              <span className="font-semibold">{t('receipt.paid_at')}</span>
              <span>{paidStr}</span>
            </div>
          )}
        </div>

        <p className="mb-3 border-t border-dashed border-gray-200 pt-3 text-xs text-gray-400">
          ————————————————————
        </p>

        {/* Items */}
        <ul className="mb-3 space-y-1.5">
          {order.items.map((item, idx) => {
            const name = lang === 'fr' ? item.nom_fr : item.nom_en;
            const lineTotal = item.prix * item.quantite;
            return (
              <li key={idx} className="flex items-baseline justify-between gap-2">
                <span className="text-gray-800">
                  <span className="font-bold text-primary">{item.quantite}×</span> {name}
                </span>
                <span className="shrink-0 font-semibold text-gray-900">
                  {lineTotal.toLocaleString('fr-FR')}&nbsp;FCFA
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mb-3 border-t border-dashed border-gray-200 pt-3 text-xs text-gray-400">
          ————————————————————
        </p>

        {/* Total */}
        <div className="flex items-center justify-between text-base font-black">
          <span className="text-gray-900">{t('cart.total')}</span>
          <span className="text-primary">{total.toLocaleString('fr-FR')}&nbsp;FCFA</span>
        </div>

        {/* Footer */}
        <p className="mt-4 border-t border-dashed border-gray-200 pt-3 text-center text-xs text-gray-500">
          {t('receipt.thanks')}
        </p>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handlePrint}
          >
            <Printer size={15} />
            {t('receipt.print')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={handleDownload}
          >
            <Download size={15} />
            {t('receipt.download')}
          </Button>
        </div>
      )}

      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(.receipt-container) { display: none !important; }
          .receipt-container { position: fixed; inset: 0; padding: 1rem; }
          #receipt-print { border: none; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
