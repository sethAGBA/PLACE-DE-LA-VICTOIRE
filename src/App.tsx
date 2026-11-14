import { Suspense, lazy, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  NavLink,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { Menu, X, LayoutGrid, UtensilsCrossed, Table2, Users, ClipboardList, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
  // Redirect disabled accounts back to login
  if (user.actif === false)
    return <Navigate to="/login" state={{ error: 'account_disabled' }} replace />;
  if (user.role !== role) return <Navigate to="/login" replace />;

  return <Outlet />;
}

// ─── Admin layout ─────────────────────────────────────────────────────────────
function AdminLayout() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { to: string; label: string; end: boolean; icon: LucideIcon }[] = [
    { to: '/admin', label: t('admin.sidebar.dashboard'), end: true, icon: LayoutGrid },
    { to: '/admin/menu', label: t('admin.sidebar.menu'), end: false, icon: UtensilsCrossed },
    { to: '/admin/tables', label: t('admin.sidebar.tables'), end: false, icon: Table2 },
    { to: '/admin/users', label: t('admin.sidebar.users'), end: false, icon: Users },
    { to: '/admin/orders', label: t('admin.sidebar.orders'), end: false, icon: ClipboardList },
    { to: '/admin/reports', label: t('admin.sidebar.reports'), end: false, icon: BarChart3 },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      isActive
        ? 'border-primary bg-primary/10 text-primary font-semibold'
        : 'border-transparent text-muted hover:bg-primary/5 hover:text-primary',
    ].join(' ');

  const SidebarContent = () => (
    <>
      <div className="bg-gradient-to-r from-primary to-[#E8690F] px-6 py-4">
        <span className="font-bold text-white">{t('app.name')}</span>
      </div>
      <nav
        className="flex flex-1 flex-col gap-1 p-4"
        aria-label={t('admin.sidebar.dashboard')}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={navLinkClass}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 flex-col bg-white shadow-md md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-r from-primary to-[#E8690F] px-4 py-3 shadow-md md:hidden">
        <span className="font-bold text-white">{t('app.name')}</span>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menu"
          className="rounded-lg p-1.5 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white shadow-xl md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6 md:pt-6">
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
