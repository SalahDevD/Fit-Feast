import React from 'react';

import SupportPageShell from './SupportPageShell';

const Livraison = () => {
  return (
    <SupportPageShell
      eyebrow="Delivery"
      title="Delivery information"
      subtitle="Use this page to understand the main Fit Feast delivery rules, expected timing, and the information that matters most during checkout."
      highlights={[
        {
          label: 'Typical timing',
          value: 'The current delivery guidance indicates a general estimate of 30 to 60 minutes depending on the zone and order volume.',
        },
        {
          label: 'Address quality',
          value: 'Provide a full name, phone number, address line, and city to reduce failed handoffs.',
        },
        {
          label: 'Payment state',
          value: 'Preparation only begins once the payment is confirmed or the offline flow is validated for the selected order type.',
        },
      ]}
      sections={[
        {
          title: 'Before confirmation',
          body: [
            'Verify the delivery address, phone number, and any access instructions before starting payment.',
            'If you are ordering a custom meal, make sure the nutrition choices and allergen constraints still match your needs.',
          ],
        },
        {
          title: 'After payment',
          body: [
            'A paid order then moves through preparation, ready, and delivered states. You can track that progression from the Orders area.',
            'If payment is cancelled or fails, the order remains available for another attempt without being sent into preparation.',
          ],
        },
      ]}
      ctas={[
        { label: 'Open checkout', to: '/cart', primary: true },
        { label: 'Open the FAQ', to: '/faq' },
        { label: 'Contact support', to: '/contact' },
      ]}
    />
  );
};

export default Livraison;
