import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

const PAGE_SIZE = 25;

type FilterStatus = OrderStatus | 'all';

export default function OrderHistory() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Filters
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterTable, setFilterTable] = useState('');

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      );
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ─── Filtering ──────────────────────────────────────────────────────────────

  const filtered = orders.filter((o) => {
    if (filterStatus !== 'all' && o.statut !== filterStatus) return false;
    if (filterTable && !String(o.tableId).includes(filterTable)) return false;
    const ts = o.createdAt.toDate();
    if (filterFrom && ts < new Date(filterFrom)) return false;
    if (filterTo) {
      const toDate = new Date(filterTo);
      toDate.setDate(toDate.getDate() + 1);
      if (ts >= toDate) return false;
    }
    return true;
  });

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function orderTotal(o: Order): number {
    return o.items.reduce((sum, item) => sum + item.prix * item.quantite, 0);
  }

  // ─── CSV Export ─────────────────────────────────────────────────────────────

  function exportCsv() {
    const header = 'ID,Table,Client,Statut,Articles,Total,Créée,Payée\n';
    const rows = filtered
      .map((o) =>
        [
          o.id.slice(0, 8),
          o.tableId,
          o.clientPrenom,
          o.statut,
          o.items.length,
          orderTotal(o),
          o.createdAt.toDate().toLocaleString('fr-FR'),
          o.paidAt ? o.paidAt.toDate().toLocaleString('fr-FR') : '',
        ]
          .map((v) => `"${v}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.orders.title')}</h1>
        <Button size="sm" variant="ghost" onClick={exportCsv}>
          <Download size={15} />
          {t('admin.orders.export')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs text-gray-500">Du</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(0); }}
            className="rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Au</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(0); }}
            className="rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Statut</label>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as FilterStatus); setPage(0); }}
            className="rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t('common.all')}</option>
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>{t(`order.status.${s}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Table</label>
          <input
            type="text"
            value={filterTable}
            placeholder="ID ou nom…"
            onChange={(e) => { setFilterTable(e.target.value); setPage(0); }}
            className="rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filtered.length} commande(s)
      </p>

      {paged.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Aucune commande.</p>
      ) : (
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Table</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Articles</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-left">Créée</th>
                <th className="px-4 py-3 text-left" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {order.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">{order.tableId}</td>
                    <td className="px-4 py-3">{order.clientPrenom}</td>
                    <td className="px-4 py-3">
                      <Badge status={order.statut} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{order.items.length}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {orderTotal(order).toLocaleString('fr-FR')} F
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {order.createdAt.toDate().toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {expanded.has(order.id) ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </td>
                  </tr>
                  {expanded.has(order.id) && (
                    <tr key={`${order.id}-detail`} className="bg-orange-50">
                      <td colSpan={8} className="px-6 py-3">
                        <ul className="space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-xs">
                              <span>
                                {item.quantite}× {item.nom_fr}
                              </span>
                              <span className="font-medium">
                                {(item.prix * item.quantite).toLocaleString('fr-FR')} F
                              </span>
                            </li>
                          ))}
                        </ul>
                        {order.paidAt && (
                          <p className="mt-2 text-xs text-gray-500">
                            Payée le{' '}
                            {order.paidAt.toDate().toLocaleString('fr-FR')}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} / {pageCount}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </Button>
        </div>
      )}
    </div>
  );
}
