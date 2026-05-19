import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiRefreshCw,
  FiTruck,
} from 'react-icons/fi';

import EmptyState from '../../components/Common/EmptyState';
import InlineErrorState from '../../components/Feedback/InlineErrorState';
import PageSkeleton from '../../components/Feedback/PageSkeleton';
import { useMyOrdersQuery } from '../../queries/useOrderQueries';

const statusMap = {
  PENDING: { label: 'Pending payment', icon: FiClock, className: 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200' },
  PAID: { label: 'Paid', icon: FiCheckCircle, className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200' },
  PREPARING: { label: 'Preparing', icon: FiBox, className: 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200' },
  READY: { label: 'Ready', icon: FiCheckCircle, className: 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200' },
  DELIVERED: { label: 'Delivered', icon: FiTruck, className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200' },
  CANCELED: { label: 'Canceled', icon: FiRefreshCw, className: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200' },
  REFUNDED: { label: 'Refunded', icon: FiRefreshCw, className: 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200' },
};

const Orders = () => {
  const navigate = useNavigate();
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const ordersQuery = useMyOrdersQuery();
  const orders = ordersQuery.data || [];

  if (ordersQuery.isPending && !orders.length) {
    return <PageSkeleton variant="list" />;
  }

  if (ordersQuery.isError) {
    return (
      <div className="ff-page">
        <div className="ff-page__inner ff-page__inner--narrow">
          <InlineErrorState
            title="Vos commandes ne peuvent pas etre chargees"
            description="Le suivi des commandes n'a pas pu etre synchronise. Vous pouvez relancer la requete."
            onRetry={() => ordersQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <div className="ff-page__inner ff-page__inner--narrow">
        <div className="ff-panel--dark mb-10 rounded-[2.5rem] px-6 py-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">Orders</p>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Track every payment and delivery step.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Admin-side status updates flow back here automatically, so the customer view stays
                synchronized without a manual refresh.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-emerald-50/90">
              {ordersQuery.isFetching ? 'Refreshing status...' : 'Live sync active'}
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={FiBox}
            title="No orders yet"
            description="Your next paid order will appear here automatically."
            action={(
              <button type="button" onClick={() => navigate('/menu')} className="ff-button-primary">
                Browse meals
                <FiArrowRight />
              </button>
            )}
          />
        ) : (
          <div className="space-y-5">
            {orders.map((order, index) => {
              const statusMeta = statusMap[order.status] || statusMap.PENDING;
              const StatusIcon = statusMeta.icon;
              const isExpanded = expandedOrderId === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="ff-panel ff-panel--strong rounded-[2rem] p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{order.order_number}</p>
                      <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                        {Number(order.total_amount || 0).toFixed(2)} {order.currency || 'MAD'}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${statusMeta.className}`}>
                        <StatusIcon />
                        {statusMeta.label}
                      </div>

                      {order.can_pay ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/checkout/${order.id}`)}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                        >
                          <FiCreditCard />
                          Pay now
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 dark:border-white/10 dark:text-slate-200 dark:hover:border-emerald-400/20 dark:hover:text-emerald-200"
                      >
                        {isExpanded ? 'Hide details' : 'View details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 dark:border-white/10 lg:grid-cols-[1fr,0.9fr]">
                      <div className="space-y-3">
                        {(order.items || []).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200"
                          >
                            <span>
                              {item.quantity} x {item.item_name}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {Number(item.line_total || item.total || 0).toFixed(2)} {order.currency || 'MAD'}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Delivery</p>
                        <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                          {order.shipping_address || 'Address will be confirmed during delivery handling.'}
                        </p>
                        {order.notes ? (
                          <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                            <span className="font-semibold text-slate-900 dark:text-white">Notes:</span> {order.notes}
                          </p>
                        ) : null}
                        {order.payment_status ? (
                          <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
                            <span className="font-semibold text-slate-900 dark:text-white">Payment record:</span> {order.payment_status}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
