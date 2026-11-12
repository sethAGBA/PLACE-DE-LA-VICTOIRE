import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { TableForm } from '@/components/admin/TableForm';
import { QRCodeDisplay } from '@/components/admin/QRCodeDisplay';
import { OrderStatus, TableZone } from '@/types';
import type { Table, Order } from '@/types';
import { Plus, QrCode, RotateCcw } from 'lucide-react';

const ZONE_STYLES: Record<TableZone, string> = {
  [TableZone.salle]: 'bg-blue-100 text-blue-700',
  [TableZone.paillote]: 'bg-yellow-100 text-yellow-700',
  [TableZone.jardin]: 'bg-green-100 text-green-700',
};

export default function TableManagement() {
  const { t } = useTranslation();
  const [tables, setTables] = useState<Table[]>([]);
  const [activeOrderCount, setActiveOrderCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [qrTable, setQrTable] = useState<Table | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [tableSnap, orderSnap] = await Promise.all([
        getDocs(query(collection(db, 'tables'), orderBy('numero', 'asc'))),
        getDocs(
          query(
            collection(db, 'orders'),
            where('statut', 'not-in', [OrderStatus.PAID, OrderStatus.REJECTED])
          )
        ),
      ]);

      const tArr = tableSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Table));
      setTables(tArr);

      const counts: Record<string, number> = {};
      for (const d of orderSnap.docs) {
        const o = d.data() as Order;
        counts[o.tableId] = (counts[o.tableId] ?? 0) + 1;
      }
      setActiveOrderCount(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleReset(tableId: string) {
    try {
      await updateDoc(doc(db, 'tables', tableId), { statut: 'libre' });
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, statut: 'libre' } : t))
      );
    } catch (err) {
      console.error(err);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.tables.title')}</h1>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={15} />
          {t('admin.tables.add')}
        </Button>
      </div>

      {tables.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Aucune table. Ajoutez-en une ou lancez le seed.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {tables.map((table) => {
            const activeOrders = activeOrderCount[table.id] ?? 0;
            return (
              <div
                key={table.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                {/* Zone badge */}
                <div className="mb-3 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ZONE_STYLES[table.zone]}`}
                  >
                    {t(`table.zones.${table.zone}`)}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      table.statut === 'occupee' ? 'text-orange-600' : 'text-green-600'
                    }`}
                  >
                    {t(`table.status.${table.statut}`)}
                  </span>
                </div>

                {/* Table number */}
                <p className="text-3xl font-bold text-gray-900">
                  {t('table.number')}{table.numero}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {table.capacite} pers. · {activeOrders} commande(s) active(s)
                </p>

                {/* Actions */}
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setQrTable(table)}
                    className="flex-1"
                  >
                    <QrCode size={13} />
                    {t('admin.tables.generateQr')}
                  </Button>
                  {table.statut === 'occupee' && (
                    <button
                      onClick={() => void handleReset(table.id)}
                      title={t('admin.tables.reset')}
                      className="rounded-lg border p-1.5 text-gray-500 hover:bg-orange-50 hover:text-primary"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add table modal */}
      <Modal open={addOpen} title={t('admin.tables.add')} onClose={() => setAddOpen(false)}>
        <TableForm
          onCreated={(tableId, numero) => {
            setAddOpen(false);
            void loadData();
            // Open QR right away
            setQrTable({ id: tableId, numero, zone: TableZone.salle, capacite: 4, statut: 'libre', qrCodeUrl: '' });
          }}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>

      {/* QR modal */}
      <Modal
        open={!!qrTable}
        title={`QR Code — Table ${qrTable?.numero ?? ''}`}
        onClose={() => setQrTable(null)}
      >
        {qrTable && (
          <QRCodeDisplay tableId={qrTable.id} numero={qrTable.numero} />
        )}
      </Modal>
    </div>
  );
}
