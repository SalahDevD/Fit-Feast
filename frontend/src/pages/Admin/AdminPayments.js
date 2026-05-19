import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { FiDollarSign, FiRefreshCw, FiTrendingUp, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

import { adminAPI } from '../../api/axios';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { StatCard } from '../../components/Admin/StatCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} MAD`;

export const AdminPayments = () => {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [days, setDays] = useState(30);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const pageSize = 20;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        days,
        ordering,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      };

      const [analyticsResponse, transactionsResponse] = await Promise.all([
        adminAPI.getPaymentAnalytics(params),
        adminAPI.listPayments(params),
      ]);

      setAnalytics(analyticsResponse.data);
      setTransactions(transactionsResponse.data.results || transactionsResponse.data || []);
      setTotal(transactionsResponse.data.count || transactionsResponse.data.length || 0);
    } catch (error) {
      console.error('Payment analytics error:', error);
      toast.error('Unable to load payment analytics.');
      setAnalytics(null);
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [days, ordering, page, searchQuery, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const overview = analytics?.overview || {};
  const trends = analytics?.trends || {
    labels: [],
    revenue: [],
    transactions: [],
    active_users: [],
  };

  const revenueChartData = useMemo(
    () => ({
      labels: trends.labels,
      datasets: [
        {
          label: 'Revenue',
          data: trends.revenue,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.18)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [trends.labels, trends.revenue]
  );

  const activityChartData = useMemo(
    () => ({
      labels: trends.labels,
      datasets: [
        {
          label: 'Transactions',
          data: trends.transactions,
          backgroundColor: '#0f766e',
          borderRadius: 12,
        },
        {
          label: 'Active customers',
          data: trends.active_users,
          backgroundColor: '#94a3b8',
          borderRadius: 12,
        },
      ],
    }),
    [trends.active_users, trends.labels, trends.transactions]
  );

  const statusChartData = useMemo(
    () => ({
      labels: (analytics?.status_breakdown || []).map((item) => item.status),
      datasets: [
        {
          data: (analytics?.status_breakdown || []).map((item) => item.count),
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#64748b', '#14b8a6'],
          borderWidth: 0,
        },
      ],
    }),
    [analytics?.status_breakdown]
  );

  const cartesianChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#64748b',
            boxWidth: 12,
          },
        },
      },
    }),
    []
  );

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#64748b',
            boxWidth: 12,
          },
        },
      },
    }),
    []
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout
      title="Payments Analytics"
      subtitle="Stripe transactions, revenue trends, and customer payment activity."
    >
      <div className="space-y-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value));
                setPage(1);
              }}
              className="ff-select"
            >
              {[7, 14, 30, 90].map((value) => (
                <option key={value} value={value}>
                  Last {value} days
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="ff-select"
            >
              <option value="">All statuses</option>
              <option value="CREATED">Created</option>
              <option value="REQUIRES_ACTION">Requires action</option>
              <option value="SUCCEEDED">Succeeded</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELED">Canceled</option>
            </select>

            <select
              value={ordering}
              onChange={(event) => setOrdering(event.target.value)}
              className="ff-select"
            >
              <option value="-created_at">Newest first</option>
              <option value="created_at">Oldest first</option>
              <option value="-amount">Highest amount</option>
              <option value="amount">Lowest amount</option>
            </select>

            <button type="button" onClick={fetchPayments} className="ff-button-secondary">
              <FiRefreshCw />
              Refresh
            </button>
          </div>

          <input
            type="text"
            placeholder="Search order, customer, payment intent..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            className="ff-input xl:max-w-md"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Gross revenue"
            value={formatMoney(overview.gross_revenue)}
            subtitle={`${overview.revenue_change_pct || 0}% vs previous period`}
            icon="Gross"
            color="green"
          />
          <StatCard
            title="Transactions"
            value={overview.total_transactions || 0}
            subtitle={`${overview.transaction_change_pct || 0}% period change`}
            icon="Flow"
            color="blue"
          />
          <StatCard
            title="Success rate"
            value={`${overview.conversion_rate || 0}%`}
            subtitle={`${overview.failed_transactions || 0} failed`}
            icon="Rate"
            color="yellow"
          />
          <StatCard
            title="Active customers"
            value={overview.active_customers || 0}
            subtitle={`Avg order ${formatMoney(overview.average_transaction_value)}`}
            icon="Users"
            color="purple"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <div className="ff-panel ff-panel--strong p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Revenue trend</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Revenue over time</h3>
                  </div>
                  <FiTrendingUp className="text-2xl text-emerald-500" />
                </div>
                <div className="h-[320px] overflow-hidden">
                  <Line
                    data={revenueChartData}
                    options={{
                      ...cartesianChartOptions,
                      plugins: {
                        ...cartesianChartOptions.plugins,
                        legend: { display: false },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="ff-panel ff-panel--strong p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Breakdown</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Payment statuses</h3>
                  </div>
                  <FiDollarSign className="text-2xl text-emerald-500" />
                </div>
                <div className="h-[320px] overflow-hidden">
                  <Doughnut data={statusChartData} options={doughnutOptions} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
              <div className="ff-panel ff-panel--strong p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Activity</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Transactions and users</h3>
                  </div>
                  <FiUsers className="text-2xl text-emerald-500" />
                </div>
                <div className="h-[320px] overflow-hidden">
                  <Bar data={activityChartData} options={cartesianChartOptions} />
                </div>
              </div>

              <div className="ff-panel ff-panel--strong p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Top customers</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Highest revenue contributors</h3>
                <div className="mt-6 space-y-3">
                  {(analytics?.top_customers || []).map((customer) => (
                    <div
                      key={customer.email}
                      className="flex items-center justify-between rounded-3xl bg-slate-50/85 px-4 py-3 dark:bg-white/5"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">{formatMoney(customer.revenue)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{customer.transactions} payments</p>
                      </div>
                    </div>
                  ))}
                  {!(analytics?.top_customers || []).length ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No successful payments in this range yet.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="ff-panel ff-panel--strong p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Transactions</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Filtered payment records</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Page {Math.min(page, totalPages)} of {totalPages}
                </p>
              </div>

              <div className="ff-table-shell mt-6 overflow-x-auto">
                <table className="ff-table min-w-full">
                  <thead>
                    <tr>
                      <th className="pb-4 pr-4">Order</th>
                      <th className="pb-4 pr-4">Customer</th>
                      <th className="pb-4 pr-4">Amount</th>
                      <th className="pb-4 pr-4">Status</th>
                      <th className="pb-4 pr-4">Provider ref</th>
                      <th className="pb-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="py-4 pr-4">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{transaction.order_number}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.order_status_display}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{transaction.customer_name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{transaction.customer_email}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4 font-semibold text-slate-900 dark:text-white">
                          {formatMoney(transaction.amount)}
                        </td>
                        <td className="py-4 pr-4">
                          <span className="ff-status-badge bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                            {transaction.status_display}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-xs text-slate-500 dark:text-slate-400">{transaction.provider_reference}</td>
                        <td className="py-4 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(transaction.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="ff-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="ff-button-secondary px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
