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

  const isAlmostDone = remaining < 120; // < 2 min → pulse
  const isDone = remaining === 0;

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0; // 1 = full, 0 = done
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Phase color by remaining time: >50% green, 20–50% amber, <20% red
  const textPhase =
    progress > 0.5 ? 'text-secondary' : progress > 0.2 ? 'text-gold' : 'text-primary';
  const dotPhase =
    progress > 0.5 ? 'bg-secondary' : progress > 0.2 ? 'bg-gold' : 'bg-primary';

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
      <motion.div
        className="relative"
        animate={!isDone && isAlmostDone ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={
          !isDone && isAlmostDone
            ? { repeat: Infinity, duration: 1.2 }
            : { duration: 0.3 }
        }
      >
        <svg
          width={120}
          height={120}
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="-rotate-90"
        >
          <defs>
            <linearGradient id="countdown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2D7D32" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D4580A" />
            </linearGradient>
          </defs>
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
            stroke="url(#countdown-grad)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset }}
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
                className={`text-2xl font-bold tabular-nums ${textPhase}`}
              >
                {display}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Status line */}
      {!isDone && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <motion.span
            aria-hidden="true"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className={`inline-block h-2.5 w-2.5 rounded-full ${dotPhase}`}
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
