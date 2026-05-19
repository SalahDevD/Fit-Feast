import React, { useState } from 'react';

import { InlineErrorState } from '../../components/Feedback/InlineErrorState';
import { PageSkeleton } from '../../components/Feedback/PageSkeleton';
import { useAdminStatsQuery } from '../../queries/useAdminQueries';
import { AdminChallenges } from './AdminChallenges';
import { AdminDishes } from './AdminDishes';
import { AdminMenus } from './AdminMenus';
import { AdminOrders } from './AdminOrders';
import { AdminPayments } from './AdminPayments';
import { AdminPosts } from './AdminPosts';
import { AdminStats } from './AdminStats';
import { AdminUsers } from './AdminUsers';

const tabs = [
  { id: 'stats', label: 'Overview' },
  { id: 'payments', label: 'Payments' },
  { id: 'orders', label: 'Orders' },
  { id: 'users', label: 'Users' },
  { id: 'dishes', label: 'Dishes' },
  { id: 'menus', label: 'Menus' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'posts', label: 'Community' },
];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const statsQuery = useAdminStatsQuery();
  const stats = statsQuery.data;

  const renderContent = () => {
    switch (activeTab) {
      case 'payments':
        return <AdminPayments />;
      case 'orders':
        return <AdminOrders />;
      case 'users':
        return <AdminUsers />;
      case 'dishes':
        return <AdminDishes />;
      case 'menus':
        return <AdminMenus />;
      case 'challenges':
        return <AdminChallenges />;
      case 'posts':
        return <AdminPosts />;
      case 'stats':
      default:
        return <AdminStats />;
    }
  };

  if (statsQuery.isPending && !stats) {
    return <PageSkeleton variant="hero" />;
  }

  return (
    <div className="ff-page">
      <div className="ff-page__inner space-y-8">
        <div className="ff-panel ff-panel--strong overflow-hidden px-6 py-6 sm:px-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,38rem)] xl:items-end">
            <div className="mx-auto max-w-3xl text-center lg:text-left xl:mx-0">
              <p className="ff-eyebrow justify-center lg:justify-start xl:justify-start">Fit Feast admin</p>
              <h1 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white sm:text-5xl">
                Operations, revenue, and member activity in one elegant workspace.
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                The dashboard stays query-backed and synchronized, so revenue, orders, and menu
                changes refresh without the old manual reload flow.
              </p>
            </div>

            {stats ? (
              <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-[38rem] xl:justify-self-end">
                <div className="ff-panel--dark min-w-0 rounded-[28px] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Users</p>
                  <p className="mt-2 break-words text-2xl font-semibold leading-tight">{stats.users?.total || 0}</p>
                </div>
                <div className="ff-kpi-card min-w-0 w-full overflow-hidden">
                  <p className="ff-kpi-label">Orders</p>
                  <p className="ff-kpi-value break-words overflow-hidden text-ellipsis">{stats.orders?.total || 0}</p>
                </div>
                <div className="ff-kpi-card min-w-0 w-full overflow-hidden">
                  <p className="ff-kpi-label">Revenue</p>
                  <p className="ff-kpi-value break-words overflow-hidden text-ellipsis">{Number(stats.revenue || 0).toFixed(2)} MAD</p>
                </div>
                <div className="ff-kpi-card min-w-0 w-full overflow-hidden">
                  <p className="ff-kpi-label">Payments</p>
                  <p className="ff-kpi-value break-words overflow-hidden text-ellipsis">{stats.payments?.successful || 0}</p>
                </div>
              </div>
            ) : null}
          </div>

          {statsQuery.isError ? (
            <InlineErrorState
              title="Dashboard summary unavailable"
              description="The headline metrics could not be synchronized right now."
              onRetry={() => statsQuery.refetch()}
              className="mt-6"
            />
          ) : null}

          <div className="mt-6 flex justify-center overflow-x-auto pb-1 lg:justify-start">
            <div className="ff-tab-group min-w-max" aria-label="Admin sections">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                  className="ff-tab-pill"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>{renderContent()}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
