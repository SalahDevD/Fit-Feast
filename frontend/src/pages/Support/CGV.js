import React from 'react';

import SupportPageShell from './SupportPageShell';

const CGV = () => {
  return (
    <SupportPageShell
      eyebrow="Terms"
      title="Platform terms overview"
      subtitle="This page summarizes the main platform rules applied to ordering, payments, reductions, and service tracking across the online experience."
      highlights={[
        {
          label: 'Order creation',
          value: 'An order is stored on the backend before payment so its lifecycle can be tracked reliably.',
        },
        {
          label: 'Payment',
          value: 'Card payments are processed by Stripe. Payment confirmation and webhooks are the reference for order synchronization.',
        },
        {
          label: 'Statuses',
          value: 'Order and payment statuses are the source of truth for preparation, handoff, cancellations, and refunds.',
        },
      ]}
      sections={[
        {
          title: 'Orders and fulfillment',
          body: [
            'Confirming an order assumes the delivery, contact, and payment details provided by the user are accurate.',
            'An order does not move into preparation until the system has a payment state that supports fulfillment.',
          ],
        },
        {
          title: 'Payment, cancellation, and refunds',
          body: [
            'Payment status is kept inside the application to trace confirmations, failures, cancellations, and potential refunds.',
            'If a payment fails, the user can restart checkout while the order is still payable. If a refund occurs, the matching status should appear in tracking.',
          ],
        },
      ]}
      ctas={[
        { label: 'Open the menu', to: '/menu', primary: true },
        { label: 'Track my orders', to: '/orders' },
        { label: 'Contact support', to: '/contact' },
      ]}
    />
  );
};

export default CGV;
