import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const toggle = () => {
    const next = isEn ? 'fr' : 'en';
    void i18n.changeLanguage(next);
    localStorage.setItem('pdv-lang', next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={t('language.switch')}
      title={t('language.switch')}
      className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span aria-hidden="true">{isEn ? '🇫🇷' : '🇬🇧'}</span>
      <span>{isEn ? t('language.fr') : t('language.en')}</span>
    </button>
  );
}
