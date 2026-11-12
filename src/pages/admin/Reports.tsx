import { useState, useEffect, useCallback } from 'react';
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
import type { Order, Product } from '@/types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Printer } from 'lucide-react';

type DateRange = 7 | 30;

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface ProductStat {
  nom_fr: string;
  orderCount: number;
}

interface HourStat {
  hour: string;
  count: number;
}

export default function Reports() {
  const { t } = useTranslation();
  const [range, setRange] = useState<DateRange>(30);
  const [loading, setLoading] = useState(false);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [ordersByHour, setOrdersByHour] = useState<HourStat[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - range);
      since.setHours(0, 0, 0, 0);

      // Load paid orders in range
      const ordersSnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('createdAt', '>=', since),
          orderBy('createdAt', 'asc')
        )
      );
      const orders = ordersSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Order)
      );

      // Daily revenue from PAID orders
      const revMap: Record<string, number> = {};
      for (const o of orders) {
        if (o.statut !== OrderStatus.PAID) continue;
        const dateKey = o.createdAt
          .toDate()
          .toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        let total = 0;
        for (const item of o.items) {
          total += item.prix * item.quantite;
        }
        revMap[dateKey] = (revMap[dateKey] ?? 0) + total;
      }
      const days: DailyRevenue[] = [];
      for (let i = range - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
        });
        days.push({ date: key, revenue: revMap[key] ?? 0 });
      }
      setDailyRevenue(days);

      // Orders by hour
      const hourMap: Record<number, number> = {};
      for (const o of orders) {
        const h = o.createdAt.toDate().getHours();
        hourMap[h] = (hourMap[h] ?? 0) + 1;
      }
      setOrdersByHour(
        Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}h`,
          count: hourMap[i] ?? 0,
        }))
      );

      // Top products
      const prodSnap = await getDocs(
        query(collection(db, 'products'), orderBy('orderCount', 'desc'))
      );
      const prods = prodSnap.docs
        .map((d) => d.data() as Product)
        .slice(0, 10)
        .map((p) => ({ nom_fr: p.nom_fr, orderCount: p.orderCount }));
      setTopProducts(prods);
    } catch (err) {
      console.error('[Reports] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.reports.title')}</h1>
        <div className="flex gap-2">
          {/* Range selector */}
          <div className="flex overflow-hidden rounded-lg border bg-white">
            <button
              onClick={() => setRange(7)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                range === 7
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('admin.reports.last7days')}
            </button>
            <button
              onClick={() => setRange(30)}
              className={`px-3 py-1.5 text-sm transition-colors ${
                range === 30
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t('admin.reports.last30days')}
            </button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => window.print()}>
            <Printer size={15} />
            {t('admin.reports.export')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Daily revenue */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              {t('admin.reports.revenue_by_day')} ({range}j)
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={dailyRevenue}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={range === 30 ? 4 : 0}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${v / 1000}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    [`${value.toLocaleString('fr-FR')} FCFA`, 'Chiffre d\'affaires']
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="#D4580A"
                  radius={[4, 4, 0, 0]}
                  name="CA (FCFA)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 10 products */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              {t('admin.reports.top_products')}
            </h2>
            {topProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                {t('admin.reports.no_data')}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={topProducts}
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="nom_fr"
                    tick={{ fontSize: 10 }}
                    width={130}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="orderCount"
                    fill="#2D7D32"
                    radius={[0, 4, 4, 0]}
                    name="Commandes"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Orders by hour */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              {t('admin.reports.chart_orders_by_hour', { range })}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={ordersByHour}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#6366F1"
                  radius={[4, 4, 0, 0]}
                  name="Commandes"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          nav, header, aside, .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
