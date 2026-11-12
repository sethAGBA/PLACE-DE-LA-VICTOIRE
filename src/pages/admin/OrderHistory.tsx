import { useTranslation } from 'react-i18next';

export default function OrderHistory() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">{t('admin.orders.title')}</h1>
    </div>
  );
}
