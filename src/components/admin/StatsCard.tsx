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
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`rounded-lg bg-orange-50 p-2 ${accentColor}`}>
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
      <p className="mt-3 text-sm text-gray-500">{title}</p>
      <p className="mt-0.5 text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
        {unit && <span className="ml-1 text-sm font-normal text-gray-500">{unit}</span>}
      </p>
    </div>
  );
}
