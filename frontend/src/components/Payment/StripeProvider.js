// StripeProvider.js - Provider pour initialiser Stripe
import React from 'react';
import { loadStripe } from '@stripe/js';
import { Elements } from '@stripe/react-stripe-js';

// Initialiser Stripe une seule fois au niveau de l'application
let stripePromise;

const getStripe = () => {
  if (!stripePromise) {
    // Suppress Stripe.js HTTP warning in development
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.toString?.().includes('You may test your Stripe.js integration over HTTP')) {
        return; // Suppress this specific warning
      }
      originalWarn(...args);
    };

    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
    
    // Restore console.warn after initialization
    console.warn = originalWarn;
  }
  return stripePromise;
};

export const StripeProvider = ({ children }) => {
  return (
    <Elements stripe={getStripe()}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
