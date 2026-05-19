import React, { useState } from 'react';

import { InlineErrorState } from '../../components/Feedback/InlineErrorState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAdminOrderStatusMutation, useAdminOrdersQuery } from '../../queries/useOrderQueries';
import { AdminLayout } from '../../components/Admin/AdminLayout';

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Canceled', value: 'CANCELED' },
  { label: 'Refunded', value: 'REFUNDED' },
];

export const AdminOrders = () => {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const pageSize = 20;

  const ordersQuery = useAdminOrdersQuery({
    page,
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const updateOrderStatus = useAdminOrderStatusMutation();

  const orders = ordersQuery.data?.rows || [];
  const total = ordersQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminLayout title="Orders" subtitle="Monitor the post-payment lifecycle for every order.">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Search order number or customer..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            className="ff-input flex-1"
          />

          <select
            value={filterStatus}
            onChange={(event) => {
              setFilterStatus(event.target.value);
              setPage(1);
            }}
            className="ff-select"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {ordersQuery.isError ? (
          <InlineErrorState
            title="Orders unavailable"
            description="The admin order table could not be synchronized."
            onRetry={() => ordersQuery.refetch()}
          />
        ) : null}

        <div className="ff-table-shell overflow-x-auto">
          <table className="ff-table min-w-full">
            <thead>
              <tr>
                <th className="pb-4 pr-4">Order</th>
                <th className="pb-4 pr-4">Customer</th>
                <th className="pb-4 pr-4">Amount</th>
                <th className="pb-4 pr-4">Payment</th>
                <th className="pb-4 pr-4">Status</th>
                <th className="pb-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.isPending && !orders.length ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-sm text-slate-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-sm text-slate-500">
                    No orders match the current filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-semibold text-slate-900">{order.order_number}</p>
                        <p className="text-xs text-slate-500">{order.delivery_type}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {order.user_details?.full_name || order.user_details?.username || 'Customer'}
                        </p>
                        <p className="text-xs text-slate-500">{order.user_details?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-semibold text-slate-900">
                      {Number(order.total_amount || 0).toFixed(2)} {order.currency || 'MAD'}
                    </td>
                    <td className="py-4 pr-4 text-xs text-slate-500">{order.payment_status || 'N/A'}</td>
                    <td className="py-4 pr-4">
                      <select
                        value={order.status}
                        onChange={(event) => updateOrderStatus.mutate({ orderId: order.id, status: event.target.value })}
                        disabled={updateOrderStatus.isPending}
                        className="ff-select rounded-full px-3 py-2 text-xs font-semibold"
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {Math.min(page, totalPages)} of {totalPages}
            {ordersQuery.isFetching ? ' • syncing' : ''}
          </p>
          <div className="flex gap-2">
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
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
