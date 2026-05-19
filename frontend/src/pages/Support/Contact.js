import React from 'react';

import SupportPageShell from './SupportPageShell';

const supportEmail = process.env.REACT_APP_SUPPORT_EMAIL || 'support@fitfeast.local';

const Contact = () => {
  return (
    <SupportPageShell
      eyebrow="Support"
      title="Contact the Fit Feast team"
      subtitle="Need help with an order, a payment, a dietary question, or your account? This page keeps the right support entry points in one polished place."
      highlights={[
        {
          label: 'Order support',
          value: 'For live order follow-up, open the Orders page as well so you can reference the order number and payment status.',
        },
        {
          label: 'Nutrition support',
          value: 'Questions about allergens, diets, and custom meals are easier to resolve when you include the meal name and context.',
        },
        {
          label: 'Account support',
          value: `For account access or password resets, you can use the built-in flows or write to ${supportEmail}.`,
        },
      ]}
      sections={[
        {
          title: 'When to contact us',
          body: [
            'Use this page if you are blocked on your account, have a Stripe payment question, found an inconsistency in an order, or need guidance on nutrition-related options.',
            'To speed things up, keep your order number, account email, and any relevant screenshot nearby.',
          ],
        },
        {
          title: 'Recommended channels',
          body: [
            `Support email: ${supportEmail}`,
            'FAQ and assistant: ideal for common questions about delivery, payment, meals, challenges, and loyalty.',
          ],
        },
      ]}
      ctas={[
        { label: 'Open the FAQ', to: '/faq', primary: true },
        { label: 'View my orders', to: '/orders' },
        { label: 'Send an email', href: `mailto:${supportEmail}` },
      ]}
    />
  );
};

export default Contact;
