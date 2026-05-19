import React from 'react';

export const AdminLayout = ({ children, title, subtitle = '' }) => {
  return (
    <div className="space-y-6 py-2">
      <div className="ff-panel ff-panel--strong overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8">
        <p className="ff-eyebrow">Admin control center</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="ff-panel ff-panel--strong overflow-visible rounded-[2rem] p-6 sm:p-7">
        {children}
      </div>
    </div>
  );
};
