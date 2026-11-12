import { Suspense, lazy } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import type { UserRole } from '@/types';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const TablePage = lazy(() => import('@/pages/client/TablePage'));
const OrderTracking = lazy(() => import('@/pages/client/OrderTracking'));
const ServeurDashboard = lazy(() => import('@/pages/serveur/ServeurDashboard'));
const CuisineDashboard = lazy(() => import('@/pages/cuisine/CuisineDashboard'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const MenuManagement = lazy(() => import('@/pages/admin/MenuManagement'));
const TableManagement = lazy(() => import('@/pages/admin/TableManagement'));
const UserManagement = lazy(() => import('@/pages/admin/UserManagement'));
const OrderHistory = lazy(() => import('@/pages/admin/OrderHistory'));
const Reports = lazy(() => import('@/pages/admin/Reports'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  );
}

// ─── Root redirect ────────────────────────────────────────────────────────────
function RootRedirect() {
  const { user, loading } = useAuthStore();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const roleRedirects: Record<UserRole, string> = {
    admin: '/admin',
    serveur: '/serveur',
    cuisine: '/cuisine',
    client: '/login',
  };
  return <Navigate to={roleRedirects[user.role]} replace />;
}

// ─── Protected route ──────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  role: UserRole;
}

function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;

  return <Outlet />;
}

// ─── Admin layout ─────────────────────────────────────────────────────────────
function AdminLayout() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  const navItems = [
    { to: '/admin', label: t('admin.sidebar.dashboard') },
    { to: '/admin/menu', label: t('admin.sidebar.menu') },
    { to: '/admin/tables', label: t('admin.sidebar.tables') },
    { to: '/admin/users', label: t('admin.sidebar.users') },
    { to: '/admin/orders', label: t('admin.sidebar.orders') },
    { to: '/admin/reports', label: t('admin.sidebar.reports') },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col bg-white shadow-sm md:flex">
        <div className="border-b px-6 py-4">
          <span className="font-bold text-primary">{t('app.name')}</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4" aria-label={t('admin.sidebar.dashboard')}>
          {navItems.map((item) => (
            <a
              key={item.to}
              href={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-orange-50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="border-t p-4">
          <button
            onClick={() => void logout()}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Client — public, no auth required */}
          <Route path="/table/:tableId" element={<TablePage />} />
          <Route path="/table/:tableId/tracking" element={<OrderTracking />} />

          {/* Serveur */}
          <Route element={<ProtectedRoute role={'serveur' as UserRole} />}>
            <Route path="/serveur" element={<ServeurDashboard />} />
          </Route>

          {/* Cuisine */}
          <Route element={<ProtectedRoute role={'cuisine' as UserRole} />}>
            <Route path="/cuisine" element={<CuisineDashboard />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute role={'admin' as UserRole} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="menu" element={<MenuManagement />} />
              <Route path="tables" element={<TableManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="orders" element={<OrderHistory />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
