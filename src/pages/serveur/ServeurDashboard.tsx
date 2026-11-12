import { useTranslation } from 'react-i18next';

export default function ServeurDashboard() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">{t('serveur.dashboard')}</h1>
    </div>
  );
}
