import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Timestamp } from 'firebase/firestore';

interface CountdownTimerProps {
  estimatedMinutes: number;
  startedAt: Timestamp;
}

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CountdownTimer({ estimatedMinutes, startedAt }: CountdownTimerProps) {
  const { t } = useTranslation();

  const totalSeconds = estimatedMinutes * 60;

  function computeRemaining(): number {
    const elapsed = Math.floor((Date.now() - startedAt.toMillis()) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  }

  const [remaining, setRemaining] = useState<number>(computeRemaining);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(computeRemaining());
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimatedMinutes, startedAt]);

  const isAlmostDone = remaining < 60;
  const isDone = remaining === 0;

  const progress = remaining / totalSeconds; // 1 = full, 0 = done
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const strokeColor = isAlmostDone ? '#D4580A' : '#2D7D32';

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="flex flex-col items-center gap-3"
      role="timer"
      aria-live="polite"
      aria-label={`${t('order.countdown.arriving')} ${display}`}
    >
      {/* Circular SVG ring */}
      <div className="relative">
        <svg
          width={120}
          height={120}
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={8}
          />
          {/* Animated progress ring */}
          <motion.circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset, stroke: strokeColor }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {isDone ? (
              <motion.span
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs font-bold leading-tight text-primary"
              >
                {t('order.countdown.ready')}
              </motion.span>
            ) : (
              <motion.span
                key="timer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-xl font-bold tabular-nums ${isAlmostDone ? 'text-primary' : 'text-gray-900'}`}
              >
                {display}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pulsing dot indicator */}
      {!isDone && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <motion.span
            aria-hidden="true"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className={`inline-block h-2.5 w-2.5 rounded-full ${isAlmostDone ? 'bg-primary' : 'bg-secondary'}`}
          />
          <span>{t('order.countdown.arriving')}&nbsp;{display}</span>
        </div>
      )}

      {isDone && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-primary"
        >
          🍽️ {t('order.countdown.ready')}
        </motion.p>
      )}
    </div>
  );
}
