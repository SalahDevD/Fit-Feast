import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiRefreshCw,
  FiXCircle,
} from 'react-icons/fi';

import { ordersAPI, paymentAPI } from '../../api/axios';

const normalizeState = (order, paymentData, redirectStatus) => {
  const localStatus = String(paymentData?.status || '').toUpperCase();
  const stripeStatus = String(paymentData?.stripe_status || '').toLowerCase();
  const orderStatus = String(order?.status || '').toUpperCase();
  const redirect = String(redirectStatus || '').toLowerCase();

  if (['PAID', 'PREPARING', 'READY', 'DELIVERED'].includes(orderStatus) || localStatus === 'SUCCEEDED') {
    return 'success';
  }
  if (stripeStatus === 'not_required') {
    return 'success';
  }
  if (localStatus === 'FAILED' || stripeStatus === 'failed' || redirect === 'failed') {
    return 'failed';
  }
  if (localStatus === 'CANCELED' || stripeStatus === 'canceled' || redirect === 'canceled') {
    return 'canceled';
  }
  if (
    localStatus === 'CREATED' ||
    localStatus === 'REQUIRES_ACTION' ||
    stripeStatus === 'processing' ||
    stripeStatus === 'requires_action' ||
    redirect === 'processing'
  ) {
    return 'processing';
  }

  return 'failed';
};

const variantContent = {
  success: {
    icon: FiCheckCircle,
    iconClass: 'text-emerald-500',
    title: 'Payment confirmed',
    description: 'Your order is secured and the kitchen can start preparing it.',
    panelClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10',
  },
  processing: {
    icon: FiClock,
    iconClass: 'text-amber-500',
    title: 'Payment is processing',
    description: 'Stripe is still finalizing the payment. Refresh or check again in a moment.',
    panelClass: 'border-amber-200 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-400/10',
  },
  canceled: {
    icon: FiXCircle,
    iconClass: 'text-slate-500',
    title: 'Payment canceled',
    description: 'No charge was completed. You can return and try again when you are ready.',
    panelClass: 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5',
  },
  failed: {
    icon: FiAlertTriangle,
    iconClass: 'text-rose-500',
    title: 'Payment needs attention',
    description: 'The payment was not completed. You can retry checkout for this order.',
    panelClass: 'border-rose-200 bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/10',
  },
};

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get('order_id');
  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [order, setOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const viewState = useMemo(
    () => normalizeState(order, paymentData, redirectStatus),
    [order, paymentData, redirectStatus]
  );

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);

      try {
        if (paymentIntentId) {
          try {
            await paymentAPI.confirmPayment(paymentIntentId);
          } catch (_error) {}
        }

        const orderResponse = orderId ? await ordersAPI.getById(orderId) : null;
        const nextOrder = orderResponse?.data || null;
        setOrder(nextOrder);

        const shouldSkipPaymentLookup =
          !paymentIntentId &&
          nextOrder &&
          Number(nextOrder.total_amount || 0) <= 0 &&
          ['PAID', 'PREPARING', 'READY', 'DELIVERED'].includes(String(nextOrder.status || '').toUpperCase());

        if (shouldSkipPaymentLookup) {
          setPaymentData({
            status: 'SUCCEEDED',
            stripe_status: 'not_required',
            amount: nextOrder.total_amount,
            currency: nextOrder.currency,
            order_id: nextOrder.id,
          });
        } else {
          const paymentResponse = await paymentAPI.getPaymentStatus({
            orderId,
            paymentIntentId,
            refresh: !paymentIntentId,
          });
          setPaymentData(paymentResponse.data);
        }
      } catch (error) {
        console.error('Checkout result error:', error);
        setPaymentData({
          status: 'FAILED',
          stripe_status: redirectStatus || 'failed',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [orderId, paymentIntentId, redirectStatus]);

  if (loading) {
    return (
      <div className="ff-page flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/90 px-6 py-4 shadow-lg dark:border-white/10 dark:bg-slate-950/80">
          <FiLoader className="animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-100">Checking your payment status...</span>
        </div>
      </div>
    );
  }

  const activeVariant = variantContent[viewState];
  const Icon = activeVariant.icon;

  return (
    <div className="ff-page">
      <div className="ff-page__inner ff-page__inner--narrow">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`overflow-hidden rounded-[2.5rem] border p-8 shadow-[0_30px_120px_-70px_rgba(15,118,110,0.45)] ${activeVariant.panelClass}`}
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Icon className={`text-6xl ${activeVariant.iconClass}`} />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                Stripe payment result
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-900 dark:text-white">{activeVariant.title}</h1>
              <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200 sm:text-base">
                {activeVariant.description}
              </p>
              {paymentData?.error_message ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
                  {paymentData.error_message}
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Current status</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {paymentData?.status || order?.status || 'Unknown'}
              </p>
              {paymentData?.amount ? (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  Amount:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {paymentData.amount} {paymentData.currency}
                  </span>
                </p>
              ) : null}
              {order?.order_number ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Order:{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {order.order_number}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            className="ff-panel ff-panel--strong rounded-[2rem] p-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/10">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">What happens next</h2>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="ff-button-secondary px-4 py-2 text-sm"
              >
                <FiRefreshCw />
                Refresh
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
              {viewState === 'success' ? (
                <>
                  <p>Your transaction was recorded on the backend and will appear in the admin payment analytics dashboard.</p>
                  <p>The order timeline can now progress from paid to preparing, ready, and delivered without another payment step.</p>
                </>
              ) : null}

              {viewState === 'processing' ? (
                <>
                  <p>Your bank may still be authorizing the payment. Keep this page open or return from your orders page shortly.</p>
                  <p>The webhook listener will also update the transaction as soon as Stripe sends the final event.</p>
                </>
              ) : null}

              {viewState === 'canceled' ? (
                <>
                  <p>Your order remains available to pay again if you still want to complete it.</p>
                  <p>We did not mark the order as paid, so the kitchen will not start preparing it yet.</p>
                </>
              ) : null}

              {viewState === 'failed' ? (
                <>
                  <p>The payment attempt was stored, including the failure state, so the admin team can investigate if needed.</p>
                  <p>You can return to the checkout page and retry safely with a fresh Stripe payment session.</p>
                </>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => navigate('/orders')} className="ff-button-primary">
                View my orders
                <FiArrowRight />
              </button>

              {orderId && Number(order?.total_amount || 0) > 0 ? (
                <button
                  type="button"
                  onClick={() => navigate(`/checkout/${orderId}`)}
                  className="ff-button-secondary"
                >
                  Retry payment
                </button>
              ) : null}

              <button type="button" onClick={() => navigate('/menu')} className="ff-button-secondary">
                Back to menu
              </button>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 }}
            className="ff-panel ff-panel--strong rounded-[2rem] p-6"
          >
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Order snapshot</h2>

            {order ? (
              <div className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50/85 p-4 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Placed on</p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50/85 p-4 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total</p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {Number(order.total_amount || 0).toFixed(2)} {order.currency || 'MAD'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-5 dark:border-white/10">
                  {(order.items || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-3xl bg-slate-50/85 px-4 py-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-200"
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

                {order.shipping_address ? (
                  <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Delivery address</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{order.shipping_address}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
                The payment status is available, but the order details could not be loaded.
              </p>
            )}
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
