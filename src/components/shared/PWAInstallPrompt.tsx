import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Bannière d'installation PWA — apparaît en bas de l'écran
 * quand le navigateur déclenche l'événement beforeinstallprompt.
 * Fonctionne sur Android Chrome. Sur iOS, affiche les instructions manuelles.
 */
export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà installé ou déjà rejeté cette session
    const alreadyDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (alreadyDismissed) return;

    // Détecter iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    if (standalone) return; // déjà installé

    if (ios) {
      setIsIOS(true);
      // Sur iOS, montrer après 3 secondes
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Android / Chrome — attendre l'événement
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            {/* Bande de couleur en haut */}
            <div className="h-1 w-full bg-gradient-to-r from-primary to-[#E8690F]" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Icône app */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#E8690F] shadow-md">
                  <img
                    src="/icons/pwa-192x192.png"
                    alt="Place de la Victoire"
                    className="h-10 w-10 rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">
                    {t('pwa.install_title')}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                    {isIOS ? t('pwa.install_ios') : t('pwa.install_android')}
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              </div>

              {isIOS ? (
                /* Instructions iOS */
                <div className="mt-3 rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                  <p>1. Appuie sur <span className="font-semibold">Partager</span> <span className="text-base">⎙</span> en bas de Safari</p>
                  <p>2. Sélectionne <span className="font-semibold">"Sur l'écran d'accueil"</span> <span className="text-base">➕</span></p>
                  <p>3. Appuie sur <span className="font-semibold">Ajouter</span></p>
                </div>
              ) : (
                /* Bouton Android */
                <button
                  onClick={() => void handleInstall()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#E8690F] py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:shadow-md active:scale-95"
                >
                  <Download size={15} />
                  {t('pwa.install_button')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
