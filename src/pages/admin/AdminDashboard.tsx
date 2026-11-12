import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';
import { StatsCard } from '@/components/admin/StatsCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { seedFirestore } from '@/seed/seedData';
import { seedAccounts } from '@/seed/seedAccounts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShoppingBag,
  Banknote,
  LayoutGrid,
  UtensilsCrossed,
  RefreshCw,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sevenDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

const STATUS_COLORS: Record<string, string> = {
  [OrderStatus.PENDING]: '#F59E0B',
  [OrderStatus.VALIDATED]: '#3B82F6',
  [OrderStatus.IN_PREPARATION]: '#D4580A',
  [OrderStatus.READY]: '#2D7D32',
  [OrderStatus.SERVED]: '#14B8A6',
  [OrderStatus.PAID]: '#6B7280',
  [OrderStatus.REJECTED]: '#EF4444',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardData {
  ordersToday: number;
  revenueToday: number;
  activeTables: number;
  totalProducts: number;
  ordersByHour: { hour: string; count: number }[];
  ordersByStatus: { name: string; value: number; key: OrderStatus }[];
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [seedMenuStatus, setSeedMenuStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [seedAccStatus, setSeedAccStatus] = useState<'idle' | 'running' | 'done'>('idle');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = todayStart();
      const sevenDays = sevenDaysAgo();

      // Orders today
      const ordersSnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('createdAt', '>=', today),
          orderBy('createdAt', 'asc')
        )
      );
      const ordersToday = ordersSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Order)
      );

      // Revenue today (sum of PAID orders)
      let revenueToday = 0;
      for (const o of ordersToday) {
        if (o.statut === OrderStatus.PAID) {
          for (const item of o.items) {
            revenueToday += item.prix * item.quantite;
          }
        }
      }

      // Active tables: tables with at least one non-PAID order today
      const activeTables = new Set(
        ordersToday
          .filter((o) => o.statut !== OrderStatus.PAID && o.statut !== OrderStatus.REJECTED)
          .map((o) => o.tableId)
      ).size;

      // Total products
      const productsSnap = await getDocs(collection(db, 'products'));
      const totalProducts = productsSnap.size;

      // Orders by hour today
      const hourMap: Record<number, number> = {};
      for (const o of ordersToday) {
        const h = o.createdAt.toDate().getHours();
        hourMap[h] = (hourMap[h] ?? 0) + 1;
      }
      const ordersByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}h`,
        count: hourMap[i] ?? 0,
      }));

      // Orders by status (last 7 days)
      const recentSnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('createdAt', '>=', sevenDays),
          orderBy('createdAt', 'asc')
        )
      );
      const statusMap: Record<string, number> = {};
      for (const d of recentSnap.docs) {
        const o = d.data() as Order;
        statusMap[o.statut] = (statusMap[o.statut] ?? 0) + 1;
      }
      const ordersByStatus = Object.entries(statusMap).map(([name, value]) => ({
        name: t(`order.status.${name}`),
        value,
        key: name as OrderStatus,
      }));

      setData({
        ordersToday: ordersToday.length,
        revenueToday,
        activeTables,
        totalProducts,
        ordersByHour,
        ordersByStatus,
      });
    } catch (err) {
      console.error('[AdminDashboard] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load on first render
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSeedMenu() {
    setSeedMenuStatus('running');
    try {
      await seedFirestore();
      setSeedMenuStatus('done');
      void loadData();
    } catch (err) {
      console.error(err);
      setSeedMenuStatus('idle');
    }
  }

  async function handleSeedAccounts() {
    setSeedAccStatus('running');
    try {
      await seedAccounts();
      setSeedAccStatus('done');
    } catch (err) {
      console.error(err);
      setSeedAccStatus('idle');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('admin.dashboard.title')}
        </h1>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void loadData()}
          loading={loading}
        >
          <RefreshCw size={15} />
          {t('admin.dashboard.refresh')}
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard
              icon={ShoppingBag}
              title={t('admin.dashboard.ordersToday')}
              value={data.ordersToday}
            />
            <StatsCard
              icon={Banknote}
              title={t('admin.dashboard.revenueToday')}
              value={data.revenueToday}
              unit="FCFA"
            />
            <StatsCard
              icon={LayoutGrid}
              title={t('admin.dashboard.activeTables')}
              value={data.activeTables}
            />
            <StatsCard
              icon={UtensilsCrossed}
              title={t('admin.dashboard.totalProducts')}
              value={data.totalProducts}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Orders per hour */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                {t('admin.dashboard.chart_orders_by_hour')}
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.ordersByHour} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10 }}
                    interval={3}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#D4580A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Orders by status */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                {t('admin.dashboard.chart_orders_by_status')}
              </h2>
              {data.ordersByStatus.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  {t('admin.dashboard.no_orders_period')}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.ordersByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.ordersByStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.key] ?? `hsl(${(index * 60) % 360}, 60%, 55%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-500">{t('admin.dashboard.click_refresh')}</p>
      )}

      {/* Seed section */}
      <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50 p-5">
        <h2 className="mb-3 text-sm font-semibold text-orange-800">
          {t('admin.dashboard.config_zone_title')}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleSeedMenu()}
            loading={seedMenuStatus === 'running'}
            disabled={seedMenuStatus === 'done'}
          >
            {seedMenuStatus === 'done'
              ? t('admin.seed.done')
              : seedMenuStatus === 'running'
              ? t('admin.seed.running')
              : t('admin.seed.menu')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void handleSeedAccounts()}
            loading={seedAccStatus === 'running'}
            disabled={seedAccStatus === 'done'}
          >
            {seedAccStatus === 'done'
              ? t('admin.seed.done')
              : seedAccStatus === 'running'
              ? t('admin.seed.running')
              : t('admin.seed.accounts')}
          </Button>
        </div>
      </div>
    </div>
  );
}

