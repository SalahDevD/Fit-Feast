import React from 'react';

const EmptyState = ({
  action = null,
  className = '',
  description,
  icon: Icon,
  title,
}) => (
  <div className={`ff-empty-state ${className}`.trim()}>
    {Icon ? (
      <div className="ff-empty-state__icon">
        <Icon />
      </div>
    ) : null}
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{title}</h2>
      {description ? (
        <p className="mx-auto max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
    {action ? <div className="pt-2">{action}</div> : null}
  </div>
);

export default EmptyState;
