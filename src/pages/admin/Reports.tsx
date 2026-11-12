import { useTranslation } from 'react-i18next';

export default function Reports() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">{t('admin.reports.title')}</h1>
    </div>
  );
}
