import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

interface TimerSelectorProps {
  onSelect: (minutes: number) => void;
}

const QUICK_TIMES = [10, 15, 20, 25, 30] as const;

/**
 * Kitchen timer selector — quick-select buttons (10/15/20/25/30 min)
 * plus a free-text input for custom minutes (1–120).
 * Calls onSelect(minutes) when user picks or confirms.
 */
export function TimerSelector({ onSelect }: TimerSelectorProps) {
  const { t } = useTranslation();
  const [custom, setCustom] = useState('');

  const handleCustomConfirm = () => {
    const val = parseInt(custom, 10);
    if (!isNaN(val) && val >= 1 && val <= 120) {
      onSelect(val);
      setCustom('');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-700">
        {t('cuisine.timer_presets')}
      </p>

      {/* Quick-select buttons — large for tablet tap */}
      <div className="grid grid-cols-5 gap-2">
        {QUICK_TIMES.map((min) => (
          <button
            key={min}
            onClick={() => onSelect(min)}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-2 py-3 text-center font-bold text-gray-800 transition hover:border-primary hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
          >
            <span className="text-2xl">{min}</span>
            <span className="text-xs text-gray-500">{t('cuisine.minutes')}</span>
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={120}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCustomConfirm();
          }}
          placeholder="…"
          aria-label={t('cuisine.set_timer')}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-sm text-gray-500">{t('cuisine.minutes')}</span>
        <Button
          variant="primary"
          size="sm"
          disabled={!custom || isNaN(parseInt(custom, 10)) || parseInt(custom, 10) < 1}
          onClick={handleCustomConfirm}
        >
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
}
