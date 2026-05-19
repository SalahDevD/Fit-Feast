import React from 'react';

export const InlineErrorState = ({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  onRetry,
  className = '',
}) => (
  <div
    className={`rounded-[2rem] border border-rose-200 bg-rose-50/80 p-6 text-rose-800 shadow-sm dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100 ${className}`}
  >
    <p className="text-lg font-semibold">{title}</p>
    <p className="mt-2 text-sm leading-6 opacity-90">{description}</p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-300/20 dark:bg-white/10 dark:text-rose-50"
      >
        Retry
      </button>
    ) : null}
  </div>
);

export default InlineErrorState;
