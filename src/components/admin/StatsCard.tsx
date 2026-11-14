import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  unit?: string;
  trend?: {
    value: number; // percent
    direction: 'up' | 'down';
  };
  accentColor?: string;
}

export function StatsCard({
  icon: Icon,
  title,
  value,
  unit,
  trend,
  accentColor = 'text-primary',
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border-l-4 border-primary/60 bg-white p-5 shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`flex items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-gold/15 p-2.5 ${accentColor}`}
        >
          <Icon size={22} />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp size={13} />
            ) : (
              <TrendingDown size={13} />
            )}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">{title}</p>
      <p className="mt-0.5 text-3xl font-bold text-ink">
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        {unit && <span className="ml-1 text-sm font-normal text-muted">{unit}</span>}
      </p>
    </div>
  );
}
