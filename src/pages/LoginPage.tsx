import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import type { AppUser } from '@/types';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, setFirebaseUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', credential.user.uid));

      if (!snap.exists()) throw new Error('no_user_doc');

      const appUser = { id: snap.id, ...snap.data() } as AppUser;
      setUser(appUser);
      setFirebaseUser(credential.user);

      // Redirect based on role
      const roleRedirects: Record<string, string> = {
        admin: '/admin',
        serveur: '/serveur',
        cuisine: '/cuisine',
      };
      navigate(roleRedirects[appUser.role] ?? '/');
    } catch (err) {
      if (err instanceof Error && err.message === 'no_user_doc') {
        setError(t('auth.error_generic'));
      } else {
        setError(t('auth.error_invalid'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {/* Branding */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black tracking-tight text-primary">
              {t('app.name')}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{t('app.tagline')}</p>
            <hr className="my-4 border-gray-100" />
            <h2 className="text-lg font-bold text-gray-900">
              {t('auth.login_title')}
            </h2>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full"
            >
              {t('auth.login_button')}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          {t('app.name')} — {t('app.tagline')}
        </p>
      </div>
    </div>
  );
}
