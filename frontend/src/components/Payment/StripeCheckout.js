import React, { useState, useEffect } from 'react';
import {
  AddressElement,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiLock, FiLoader } from 'react-icons/fi';


const StripeCheckout = ({ order, customerEmail = '', onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Hide Stripe branding elements
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Hide Stripe floating action button and header */
      .LcvUkwqF__Container,
      .bcaESEAW__FloatingActionButton-wrapper,
      .ORFzI7cA__Header {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const totalAmount = Number(order?.total_amount || 0).toFixed(2);
  const currency = order?.currency || 'MAD';

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || 'Please review your payment information.');
        onError?.(submitError);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/result?order_id=${order?.id}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'The payment could not be confirmed.');
        onError?.(error);
        return;
      }

      if (paymentIntent) {
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      const message = err?.message || 'An unexpected payment error occurred.';
      setErrorMessage(message);
      onError?.(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="ff-panel ff-panel--strong space-y-6 rounded-[2rem] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
            Secure card payment
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Complete your payment
          </h2>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-700">Amount due</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">
            {totalAmount} {currency}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-100 bg-slate-50/85 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiCheckCircle className="text-emerald-600" />
              Link verification email
            </div>
            <LinkAuthenticationElement
              options={{
                defaultValues: {
                  email: customerEmail,
                },
              }}
            />
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/85 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiCheckCircle className="text-emerald-600" />
              Billing details
            </div>
            <AddressElement
              options={{
                mode: 'billing',
                allowedCountries: ['MA'],
                defaultValues: {
                  name: order?.recipient_name || '',
                  address: {
                    line1: order?.addr_line1 || '',
                    line2: order?.addr_line2 || '',
                    city: order?.addr_city || '',
                    state: order?.addr_region || '',
                    postal_code: order?.addr_postal_code || '',
                    country: order?.addr_country_code || 'MA',
                  },
                },
              }}
            />
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/85 p-5 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
              <FiLock className="text-emerald-600" />
              Payment details
            </div>
            <PaymentElement
              options={{
                layout: 'tabs',
                wallets: {
                  applePay: 'never',
                  googlePay: 'never',
                },
              }}
            />
          </div>
        </div>

        <div className="ff-panel--dark flex flex-col justify-between rounded-3xl p-6 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Protection</p>
            <h3 className="mt-3 text-2xl font-semibold">Encrypted checkout powered by Stripe</h3>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Your card data is handled directly by Stripe. We never store full card numbers
              or sensitive authentication details on our servers.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {errorMessage ? (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                3D Secure and Stripe fraud checks are applied automatically when required.
              </div>
            )}

            <button
              type="submit"
              disabled={!stripe || !elements || isProcessing}
              className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold transition ${
                !stripe || !elements || isProcessing
                  ? 'cursor-not-allowed bg-slate-800 text-slate-400'
                  : 'bg-gradient-to-r from-emerald-300 to-emerald-400 text-slate-950 hover:from-emerald-200 hover:to-emerald-300'
              }`}
            >
              {isProcessing ? (
                <>
                  <FiLoader className="animate-spin" />
                  Processing payment...
                </>
              ) : (
                <>
                  <FiLock />
                  Pay {totalAmount} {currency}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
};


export default StripeCheckout;
