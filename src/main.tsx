import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

// i18n must be initialised before the app renders
import './i18n';

import './index.css';
import App from './App';
import { Spinner } from './components/ui/Spinner';

// Register the PWA service worker (vite-plugin-pwa virtual module)
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Spinner size="lg" />
        </div>
      }
    >
      <App />
    </Suspense>
  </React.StrictMode>
);
