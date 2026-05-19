import React from 'react';

const SkeletonBlock = ({ className = '' }) => (
  <div className={`animate-pulse rounded-3xl bg-slate-200/80 dark:bg-white/10 ${className}`} />
);

const cardCounts = {
  hero: 3,
  grid: 8,
  list: 5,
};

export const PageSkeleton = ({ variant = 'grid' }) => {
  const totalCards = cardCounts[variant] || cardCounts.grid;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <SkeletonBlock className="h-12 w-44" />
        <SkeletonBlock className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: totalCards }).map((_, index) => (
            <div
              key={index}
              className="rounded-[2rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/5"
            >
              <SkeletonBlock className="h-40 w-full" />
              <SkeletonBlock className="mt-5 h-5 w-2/3" />
              <SkeletonBlock className="mt-3 h-4 w-full" />
              <SkeletonBlock className="mt-2 h-4 w-4/5" />
              <SkeletonBlock className="mt-6 h-10 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;

