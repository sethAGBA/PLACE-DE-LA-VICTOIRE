import { useTranslation } from 'react-i18next';

export default function CuisineDashboard() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">{t('cuisine.dashboard')}</h1>
    </div>
  );
}
