import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiGift,
  FiLoader,
  FiMapPin,
  FiPackage,
  FiShield,
  FiTag,
  FiTruck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { APP_BASE_URL, cartAPI, ordersAPI, paymentAPI } from '../../api/axios';
import StripeCheckout from '../../components/Payment/StripeCheckout';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';


const formatMoney = (value, currency = 'MAD') => `${Number(value || 0).toFixed(2)} ${currency}`;

const resolveImageUrl = (imagePath) => {
  if (!imagePath) {
    return '';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${APP_BASE_URL}${imagePath.startsWith('/') ? imagePath : `/media/${imagePath}`}`;
};

const buildItemName = (item) =>
  item?.item_name ||
  item?.dish_details?.name ||
  item?.custom_dish_details?.name ||
  item?.dish?.name ||
  'Item';

const SETTLED_ORDER_STATUSES = ['PAID', 'PREPARING', 'READY', 'DELIVERED', 'REFUNDED'];

const isOrderPayable = (targetOrder) => {
  if (!targetOrder) {
    return false;
  }

  if (typeof targetOrder.can_pay === 'boolean') {
    return targetOrder.can_pay;
  }

  return targetOrder.status === 'PENDING';
};

const ReductionSection = ({
  reductions,
  selectedReductionId,
  onSelect,
  loading,
  disabled = false,
}) => {
  const availableReductions = reductions?.available_reductions || [];
  const selectedReduction =
    reductions?.selected_reduction ||
    availableReductions.find((option) => String(option.reward_id) === String(selectedReductionId)) ||
    null;

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-slate-50/75 p-5 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            <FiGift />
            Claimed rewards
          </div>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">Use a reward you already claimed</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Rewards must be claimed from the loyalty page before they can be selected here.
          </p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm dark:bg-slate-900/60">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Loyalty balance</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {reductions?.loyalty_balance ?? 0} pts
          </p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-slate-600 shadow-sm dark:bg-slate-900/60">
            <FiLoader className="animate-spin text-emerald-600" />
            Loading your available reductions...
          </div>
        ) : availableReductions.length ? (
          <>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FiTag className="text-emerald-600" />
                Apply a Reduction
              </span>
              <select
                value={selectedReductionId}
                onChange={onSelect}
                disabled={disabled}
                className="ff-input"
              >
                <option value="">No reduction</option>
                {availableReductions.map((option) => (
                  <option key={option.reward_id} value={option.reward_id}>
                    {option.display_label}
                  </option>
                ))}
              </select>
            </label>

            {selectedReduction ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reduction type</p>
                  <p className="mt-2 font-semibold text-slate-900">{selectedReduction.reduction_type_label}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedReduction.source_label}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Reduction value</p>
                  <p className="mt-2 font-semibold text-slate-900">{selectedReduction.reduction_value}</p>
                  <p className="mt-1 text-sm text-emerald-600">
                    -{formatMoney(selectedReduction.discount_amount, reductions?.currency || 'MAD')}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Updated total</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {formatMoney(selectedReduction.updated_total, reductions?.currency || 'MAD')}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/60">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Remaining loyalty balance</p>
                  <p className="mt-2 font-semibold text-slate-900">
                    {selectedReduction.remaining_loyalty_balance} pts
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/85 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/40">
                No reduction selected. Your checkout stays fully manual until you choose one.
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/85 px-4 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/40">
            <p>You do not currently have a claimed reward for this checkout.</p>
            <Link to="/loyalty" className="mt-3 inline-flex font-semibold text-emerald-600 transition hover:text-emerald-700">
              Claim a reward from loyalty
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user } = useAuth();
  const { refreshCount, setCart: syncCartState } = useCart();

  const [stripePromise, setStripePromise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentBooting, setPaymentBooting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [cart, setCart] = useState(null);
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [checkoutReductions, setCheckoutReductions] = useState(null);
  const [reductionLoading, setReductionLoading] = useState(false);
  const [reductionSubmitting, setReductionSubmitting] = useState(false);
  const [selectedReductionId, setSelectedReductionId] = useState('');
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    delivery_type: 'DELIVERY',
    addr_line1: '',
    addr_line2: '',
    addr_city: '',
    addr_region: '',
    addr_postal_code: '',
    addr_country_code: 'MA',
    notes: '',
    requested_delivery_at: '',
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((current) => ({
      ...current,
      recipient_name:
        current.recipient_name ||
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        user.username ||
        '',
      recipient_phone: current.recipient_phone || user.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    const bootstrapCheckout = async () => {
      setLoading(true);
      setPageError('');

      try {
        const dataResponse = await (orderId ? ordersAPI.getById(orderId) : cartAPI.getCart());

        if (orderId) {
          setOrder(dataResponse.data);
        } else {
          setCart(dataResponse.data);
        }
      } catch (error) {
        console.error('Checkout bootstrap error:', error);
        setPageError(
          error.response?.data?.error ||
            error.message ||
            'Unable to load the checkout right now.'
        );
      } finally {
        setLoading(false);
      }
    };

    bootstrapCheckout();
  }, [orderId]);

  const ensureStripePromise = useCallback(async () => {
    if (stripePromise) {
      return stripePromise;
    }

    const configResponse = await paymentAPI.getStripeConfig();
    const publishableKey = configResponse.data?.publishable_key;
    if (!publishableKey) {
      throw new Error('Stripe publishable key is not configured.');
    }

    const nextStripePromise = loadStripe(publishableKey);
    setStripePromise(nextStripePromise);
    return nextStripePromise;
  }, [stripePromise]);

  const fetchCartReductions = useCallback(async (deliveryType) => {
    setReductionLoading(true);

    try {
      const response = await ordersAPI.getCheckoutReductions(deliveryType);
      setCheckoutReductions(response.data);
      setSelectedReductionId((current) => {
        const currentStillAvailable = (response.data?.available_reductions || []).some(
          (option) => String(option.reward_id) === String(current)
        );
        if (currentStillAvailable) {
          return current;
        }
        return response.data?.selected_reduction?.reward_id || '';
      });
    } catch (error) {
      console.error('Cart reduction load error:', error);
      setCheckoutReductions(null);
    } finally {
      setReductionLoading(false);
    }
  }, []);

  const fetchOrderReductions = useCallback(async (targetOrderId) => {
    setReductionLoading(true);

    try {
      const response = await ordersAPI.getOrderCheckoutReductions(targetOrderId);
      setCheckoutReductions(response.data);
      setSelectedReductionId(response.data?.selected_reduction?.reward_id || '');
    } catch (error) {
      console.error('Order reduction load error:', error);
      setCheckoutReductions(null);
    } finally {
      setReductionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading || orderId || !cart?.items?.length) {
      return;
    }
    fetchCartReductions(formData.delivery_type);
  }, [cart?.id, cart?.items?.length, fetchCartReductions, formData.delivery_type, loading, orderId]);

  useEffect(() => {
    if (loading || !orderId || !order?.id || clientSecret) {
      return;
    }
    fetchOrderReductions(order.id);
  }, [clientSecret, fetchOrderReductions, loading, order?.id, orderId]);

  const initializePayment = useCallback(
    async (targetOrderId) => {
      setPaymentBooting(true);
      setPaymentError('');

      try {
        await ensureStripePromise();
        const response = await paymentAPI.createPaymentIntent(targetOrderId);
        if (response.data?.status === 'succeeded' && !response.data?.client_secret) {
          setClientSecret('');
          navigate(`/checkout/result?order_id=${targetOrderId}`, { replace: true });
          return;
        }
        setClientSecret(response.data.client_secret);
      } catch (error) {
        console.error('Payment intent initialization error:', error);
        setPaymentError(
          error.response?.data?.error ||
            'The payment session could not be started. You can retry from your orders page.'
        );
      } finally {
        setPaymentBooting(false);
      }
    },
    [ensureStripePromise, navigate]
  );

  const summaryItems = useMemo(() => {
    if (order?.items?.length) {
      return order.items;
    }
    return cart?.items || [];
  }, [cart, order]);

  const selectedCartReduction = useMemo(() => {
    if (!checkoutReductions?.available_reductions?.length || !selectedReductionId) {
      return null;
    }
    return (
      checkoutReductions.available_reductions.find(
        (option) => String(option.reward_id) === String(selectedReductionId)
      ) || null
    );
  }, [checkoutReductions, selectedReductionId]);

  const selectedReduction = order?.id
    ? checkoutReductions?.selected_reduction || order?.applied_reward || null
    : selectedCartReduction;

  const summaryCurrency = order?.currency || checkoutReductions?.currency || 'MAD';
  const summarySubtotal = order?.subtotal ?? checkoutReductions?.subtotal ?? cart?.subtotal ?? 0;
  const summaryDelivery = order?.delivery_fee ?? checkoutReductions?.delivery_fee ?? 0;
  const summaryTax = order?.tax_amount ?? checkoutReductions?.tax_amount ?? 0;
  const summaryDiscount = selectedReduction?.discount_amount ?? order?.discount_amount ?? 0;
  const summaryTotal =
    selectedReduction?.updated_total ??
    order?.total_amount ??
    checkoutReductions?.updated_total ??
    checkoutReductions?.base_total ??
    cart?.subtotal ??
    0;

  const validateForm = () => {
    const requiredFields = [
      ['recipient_name', 'Recipient name'],
      ['recipient_phone', 'Phone number'],
      ['addr_line1', 'Address line'],
      ['addr_city', 'City'],
    ];

    const missingField = requiredFields.find(([field]) => !String(formData[field] || '').trim());
    if (missingField) {
      toast.error(`${missingField[1]} is required.`);
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setPageError('');
    setPaymentError('');

    try {
      const orderPayload = {
        ...formData,
        requested_delivery_at: formData.requested_delivery_at || null,
        reward_id: selectedReductionId || null,
      };

      const response = await ordersAPI.create(orderPayload);
      const createdOrder = response.data;

      setOrder(createdOrder);
      setSelectedReductionId(createdOrder?.applied_reward?.reward_id || '');
      syncCartState(null, 0);
      refreshCount().catch(() => {});

      if (!isOrderPayable(createdOrder) || Number(createdOrder?.total_amount || 0) <= 0) {
        toast.success('Order confirmed. No card payment is required.');
        navigate(`/checkout/result?order_id=${createdOrder.id}`, { replace: true });
        return;
      }

      await initializePayment(createdOrder.id);
      toast.success('Secure checkout is ready.');
    } catch (error) {
      console.error('Order creation error:', error);
      setPageError(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          'We could not create the order.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderReductionChange = async (event) => {
    const nextRewardId = event.target.value;
    setSelectedReductionId(nextRewardId);

    if (!order?.id) {
      return;
    }

    setReductionSubmitting(true);
    setPaymentError('');

    try {
      const response = await ordersAPI.applyReduction(order.id, {
        reward_id: nextRewardId || null,
      });
      setOrder(response.data.order);
      setCheckoutReductions(response.data.checkout_reductions);
      setSelectedReductionId(response.data.checkout_reductions?.selected_reduction?.reward_id || '');
      toast.success(nextRewardId ? 'Reduction applied.' : 'Reduction removed.');
    } catch (error) {
      console.error('Reduction apply error:', error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.reward_id?.[0] ||
          'The reduction could not be applied.'
      );
      setSelectedReductionId(checkoutReductions?.selected_reduction?.reward_id || '');
    } finally {
      setReductionSubmitting(false);
    }
  };

  const handleStripeSuccess = async (paymentIntent) => {
    if (!order?.id) {
      return;
    }

    try {
      const response = await paymentAPI.confirmPayment(paymentIntent.id);
      if (response.data?.status === 'succeeded') {
        toast.success('Payment confirmed successfully.');
      } else if (response.data?.status === 'processing') {
        toast.success('Payment received and still processing.');
      }
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.error_message ||
        'The payment could not be synchronized yet.';
      toast.error(message);
    } finally {
      navigate(`/checkout/result?order_id=${order.id}&payment_intent=${paymentIntent.id}`);
    }
  };

  const handleStripeError = (error) => {
    const message = error?.message || 'The payment could not be completed.';
    setPaymentError(message);
    toast.error(message);
  };

  const handleStartExistingOrderPayment = async () => {
    if (!order?.id) {
      return;
    }

    if (order.status && order.status !== 'PENDING') {
      if (SETTLED_ORDER_STATUSES.includes(order.status)) {
        navigate(`/checkout/result?order_id=${order.id}`, { replace: true });
        return;
      }

      setPaymentError('This order is not in a payable state anymore.');
      return;
    }

    await initializePayment(order.id);
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4 shadow-lg">
          <FiLoader className="animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">Preparing your checkout...</span>
        </div>
      </div>
    );
  }

  if (!orderId && (!cart || !cart.items?.length)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
          <FiPackage className="mx-auto text-5xl text-emerald-500" />
          <h1 className="mt-6 text-3xl font-semibold text-slate-900">Your cart is empty</h1>
          <p className="mt-3 text-slate-600">
            Add a few meals first, then come back here to complete your payment securely.
          </p>
          <Link
            to="/menu"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Browse the menu
            <FiArrowRight />
          </Link>
        </div>
      </div>
    );
  }

  const isPaymentStep = Boolean(order && clientSecret);
  const showManualPaymentStart = Boolean(orderId && order && !isPaymentStep && isOrderPayable(order));

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ff-panel--dark mb-10 overflow-hidden rounded-[2.5rem] px-6 py-8 sm:px-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-emerald-300">
                Fit Feast payments
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
                Checkout that stays manual, clear, and secure.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Choose your reduction yourself, confirm the updated total, then hand off card
                collection to Stripe only after everything looks right.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Order review', icon: FiPackage, active: true },
                { label: 'Apply reduction', icon: FiGift, active: true },
                { label: 'Stripe payment', icon: FiShield, active: isPaymentStep },
              ].map(({ label, icon: Icon, active }) => (
                <div
                  key={label}
                  className={`rounded-3xl border px-4 py-5 ${
                    active
                      ? 'border-emerald-400/40 bg-emerald-400/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <Icon className="text-2xl text-emerald-300" />
                  <p className="mt-4 text-sm font-medium text-white">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.12fr,0.88fr]">
          <div className="space-y-6">
            {pageError ? (
              <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-800">
                <h2 className="text-xl font-semibold">Checkout unavailable</h2>
                <p className="mt-2 text-sm leading-6">{pageError}</p>
              </div>
            ) : null}

            {!orderId && !isPaymentStep ? (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="ff-panel ff-panel--strong rounded-[2rem] p-6 sm:p-8"
              >
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                      Delivery details
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                      Confirm where this order should go
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <FiMapPin className="text-2xl" />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  {[
                    ['recipient_name', 'Recipient name', 'text'],
                    ['recipient_phone', 'Phone number', 'tel'],
                    ['addr_line1', 'Address line 1', 'text'],
                    ['addr_line2', 'Address line 2', 'text'],
                    ['addr_city', 'City', 'text'],
                    ['addr_region', 'Region', 'text'],
                    ['addr_postal_code', 'Postal code', 'text'],
                    ['requested_delivery_at', 'Requested delivery time', 'datetime-local'],
                  ].map(([field, label, type]) => (
                    <label key={field} className={field === 'addr_line2' ? 'md:col-span-2' : ''}>
                      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
                      <input
                        type={type}
                        value={formData[field]}
                        onChange={(event) =>
                          setFormData((current) => ({ ...current, [field]: event.target.value }))
                        }
                        className="ff-input"
                      />
                    </label>
                  ))}

                  <label>
                    <span className="mb-2 block text-sm font-medium text-slate-700">Delivery type</span>
                    <select
                      value={formData.delivery_type}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, delivery_type: event.target.value }))
                      }
                      className="ff-input"
                    >
                      <option value="DELIVERY">Delivery</option>
                      <option value="PICKUP">Pickup</option>
                      <option value="COMPANY">Company delivery</option>
                    </select>
                  </label>

                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Delivery notes</span>
                    <textarea
                      rows="4"
                      value={formData.notes}
                      onChange={(event) =>
                        setFormData((current) => ({ ...current, notes: event.target.value }))
                      }
                      className="ff-textarea"
                      placeholder="Gate code, office floor, pickup instructions..."
                    />
                  </label>
                </div>

                <div className="mt-8">
                  <ReductionSection
                    reductions={checkoutReductions}
                    selectedReductionId={selectedReductionId}
                    onSelect={(event) => setSelectedReductionId(event.target.value)}
                    loading={reductionLoading}
                    disabled={submitting}
                  />
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Link to="/cart" className="text-sm font-medium text-slate-500 transition hover:text-slate-800">
                    Back to cart
                  </Link>
                  <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={submitting}
                    className={`ff-button-primary ${submitting ? 'cursor-not-allowed opacity-55' : ''}`}
                  >
                    {submitting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Creating secure checkout...
                      </>
                    ) : (
                      <>
                        Continue to payment
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : null}

            {showManualPaymentStart ? (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="ff-panel ff-panel--strong rounded-[2rem] p-6 sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                      Payment review
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                      Finalize the reduction before payment
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      The order total stays editable here until you explicitly continue to Stripe.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                    <FiTruck className="text-2xl" />
                  </div>
                </div>

                <div className="mt-8">
                  <ReductionSection
                    reductions={checkoutReductions}
                    selectedReductionId={selectedReductionId}
                    onSelect={handleOrderReductionChange}
                    loading={reductionLoading || reductionSubmitting}
                    disabled={paymentBooting || reductionSubmitting}
                  />
                </div>

                <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Link to="/orders" className="text-sm font-medium text-slate-500 transition hover:text-slate-800">
                    Back to orders
                  </Link>
                  <button
                    type="button"
                    onClick={handleStartExistingOrderPayment}
                    disabled={paymentBooting || reductionSubmitting}
                    className={`ff-button-primary ${
                      paymentBooting || reductionSubmitting ? 'cursor-not-allowed opacity-55' : ''
                    }`}
                  >
                    {paymentBooting ? (
                      <>
                        <FiLoader className="animate-spin" />
                        Opening secure payment...
                      </>
                    ) : (
                      <>
                        Continue to Stripe
                        <FiArrowRight />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : null}

            {paymentError ? (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                <h2 className="text-lg font-semibold">Payment session needs attention</h2>
                <p className="mt-2 text-sm leading-6">{paymentError}</p>
                {order?.id && !clientSecret ? (
                  <button
                    type="button"
                    onClick={handleStartExistingOrderPayment}
                    className="ff-button-secondary mt-4 border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                  >
                    Retry secure payment
                    <FiArrowRight />
                  </button>
                ) : null}
              </div>
            ) : null}

            {isPaymentStep && stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#10b981',
                      colorBackground: '#ffffff',
                      colorText: '#0f172a',
                      colorDanger: '#dc2626',
                      borderRadius: '18px',
                    },
                  },
                  defaultValues: {
                    billingDetails: {
                      name: order?.recipient_name || '',
                      email: order?.user_details?.email || user?.email || '',
                      phone: order?.recipient_phone || user?.phone || '',
                      address: {
                        line1: order?.addr_line1 || '',
                        line2: order?.addr_line2 || '',
                        city: order?.addr_city || '',
                        state: order?.addr_region || '',
                        postal_code: order?.addr_postal_code || '',
                        country: order?.addr_country_code || 'MA',
                      },
                    },
                  },
                }}
              >
                <StripeCheckout
                  order={order}
                  customerEmail={order?.user_details?.email || user?.email || ''}
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                />
              </Elements>
            ) : null}
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="ff-panel ff-panel--strong overflow-hidden rounded-[2rem]">
              <div className="border-b border-slate-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                  Order summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {order?.order_number ? `Order ${order.order_number}` : 'Current cart'}
                </h2>
              </div>

              <div className="max-h-[28rem] space-y-4 overflow-y-auto px-6 py-5">
                {summaryItems.map((item) => {
                  const imageUrl = resolveImageUrl(
                    item?.dish_details?.image ||
                      item?.dish_details?.image_url ||
                      item?.custom_dish_details?.image_url ||
                      item?.custom_dish_details?.image ||
                      item?.dish?.image
                  );
                  const lineTotal =
                    item?.line_total ??
                    item?.total ??
                    Number(item?.unit_price || item?.price || 0) * Number(item?.quantity || 0);

                  return (
                    <div key={item.id} className="flex gap-4 rounded-3xl border border-slate-100 bg-slate-50/85 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-200">
                        {imageUrl ? (
                          <img src={imageUrl} alt={buildItemName(item)} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{buildItemName(item)}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Qty {item.quantity} | {formatMoney(item.unit_price || item.price, summaryCurrency)}
                        </p>
                      </div>
                      <div className="text-right text-sm font-semibold text-slate-900">
                        {formatMoney(lineTotal, summaryCurrency)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t border-slate-100 px-6 py-5 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-900">{formatMoney(summarySubtotal, summaryCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span className="font-medium text-slate-900">{formatMoney(summaryDelivery, summaryCurrency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span className="font-medium text-slate-900">{formatMoney(summaryTax, summaryCurrency)}</span>
                </div>
                {Number(summaryDiscount || 0) > 0 ? (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Reduction</span>
                    <span className="font-semibold">
                      -{formatMoney(summaryDiscount, summaryCurrency)}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(summaryTotal, summaryCurrency)}</span>
                </div>
              </div>
            </div>

            {selectedReduction ? (
              <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  <FiGift />
                  Selected reduction
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">{selectedReduction.display_label || selectedReduction.reward_name}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Type</span>
                    <span className="font-medium text-slate-900">{selectedReduction.reduction_type_label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Value</span>
                    <span className="font-medium text-slate-900">{selectedReduction.reduction_value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Remaining balance</span>
                    <span className="font-medium text-slate-900">
                      {selectedReduction.remaining_loyalty_balance} pts
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="ff-panel--dark rounded-[2rem] p-6 text-white">
              <div className="flex items-center gap-3 text-emerald-300">
                <FiShield />
                <span className="text-sm font-semibold uppercase tracking-[0.24em]">Security</span>
              </div>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
                <li>Reductions are selected manually and validated on the server before payment.</li>
                <li>Orders stay on your backend and payment confirmation is verified server-side.</li>
                <li>Webhook events keep transaction history reliable even after redirects or browser closes.</li>
              </ul>
            </div>

            {order?.shipping_address ? (
              <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  <FiMapPin />
                  Delivery destination
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-700">{order.shipping_address}</p>
              </div>
            ) : null}
          </motion.aside>
        </div>
      </div>
    </div>
  );
};


export default Checkout;
