import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/store/authStore';
import { KanbanBoard } from '@/components/cuisine/KanbanBoard';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Spinner } from '@/components/ui/Spinner';
import { OrderStatus, UserRole } from '@/types';

const KITCHEN_STATUSES = [OrderStatus.VALIDATED, OrderStatus.IN_PREPARATION];

/**
 * Kitchen view.
 * Shows VALIDATED + IN_PREPARATION orders in a Kanban board (oldest first).
 * Plays a notification sound when a new VALIDATED order arrives.
 */
export default function CuisineDashboard() {
  const { t } = useTranslation();
  const { logout } = useAuthStore();

  const { orders, loading } = useOrders({
    role: UserRole.cuisine,
    statuses: KITCHEN_STATUSES,
  });

  const knownValidatedIds = useRef<Set<string>>(new Set());
  const hasInteracted = useRef(false);

  // Track user interaction for audio autoplay policy
  useEffect(() => {
    const mark = () => { hasInteracted.current = true; };
    window.addEventListener('click', mark, { once: true });
    window.addEventListener('keydown', mark, { once: true });
    return () => {
      window.removeEventListener('click', mark);
      window.removeEventListener('keydown', mark);
    };
  }, []);

  // Detect new VALIDATED orders → play sound
  useEffect(() => {
    const currentValidated = orders.filter((o) => o.statut === OrderStatus.VALIDATED);
    const newOnes = currentValidated.filter(
      (o) => !knownValidatedIds.current.has(o.id)
    );

    if (newOnes.length > 0 && hasInteracted.current) {
      try {
        const audio = new Audio('/notification.mp3');
        void audio.play();
      } catch {
        // Audio blocked or file missing — silent failure
      }
    }

    knownValidatedIds.current = new Set(currentValidated.map((o) => o.id));
  }, [orders]);

  // Orders already sorted ASC by Firestore (oldest = highest priority)
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b bg-gradient-to-r from-[#8a3a06] to-primary px-4 py-3 shadow-md">
        <span className="text-lg font-bold text-white">
          {t('cuisine.dashboard')}
        </span>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => void logout()}
            aria-label={t('nav.logout')}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <KanbanBoard orders={orders} />
        )}
      </main>
    </div>
  );
}
