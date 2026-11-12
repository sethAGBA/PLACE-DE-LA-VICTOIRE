import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/Spinner';

export default function TablePage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">{t('common.loading')}</p>
      </div>
    </div>
  );
}
