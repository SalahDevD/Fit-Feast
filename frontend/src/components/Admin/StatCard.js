import React from 'react';

/**
 * Cartes statistiques pour le dashboard
 */
export const StatCard = ({
  title = 'Statistique',
  value = '0',
  subtitle = '',
  icon = '📊',
  color = 'blue',
  trend = null, // { value: 5, direction: 'up' }
}) => {
  const colorClasses = {
    blue: 'border-sky-200/80 bg-sky-50/90 dark:border-sky-400/20 dark:bg-sky-400/10',
    green: 'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-400/20 dark:bg-emerald-400/10',
    yellow: 'border-amber-200/80 bg-amber-50/90 dark:border-amber-400/20 dark:bg-amber-400/10',
    purple: 'border-violet-200/80 bg-violet-50/90 dark:border-violet-400/20 dark:bg-violet-400/10',
    red: 'border-rose-200/80 bg-rose-50/90 dark:border-rose-400/20 dark:bg-rose-400/10',
  };

  const textColorClasses = {
    blue: 'text-sky-600 dark:text-sky-300',
    green: 'text-emerald-600 dark:text-emerald-300',
    yellow: 'text-amber-600 dark:text-amber-300',
    purple: 'text-violet-600 dark:text-violet-300',
    red: 'text-rose-600 dark:text-rose-300',
  };

  return (
    <div className={`rounded-[28px] border p-6 shadow-[0_18px_48px_-38px_rgba(15,23,42,0.28)] ${colorClasses[color]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`mt-3 flex items-center gap-1 text-sm font-semibold ${
              trend.direction === 'up'
                ? 'text-emerald-600 dark:text-emerald-300'
                : 'text-rose-600 dark:text-rose-300'
            }`}>
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </div>
          )}
        </div>
        <div className={`rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-3xl shadow-sm dark:border-white/10 dark:bg-white/5 ${textColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
