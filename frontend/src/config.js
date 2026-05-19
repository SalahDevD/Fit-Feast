// config.js - Configuration de l'API
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';

// Base axios instance pour les requêtes authentifiées
import axios from 'axios';

export const createAuthAxios = (token) => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
};

// API endpoints
export const API_ENDPOINTS = {
  // Paiement Stripe
  STRIPE: {
    CREATE_PAYMENT_INTENT: '/api/stripe/create-payment-intent/',
    CONFIRM_PAYMENT: '/api/stripe/confirm-payment/',
    PAYMENT_STATUS: '/api/stripe/payment-status/',
  },
  
  // Commandes
  ORDERS: {
    LIST: '/api/orders/',
    DETAIL: (id) => `/api/orders/${id}/`,
    CREATE: '/api/orders/',
    UPDATE: (id) => `/api/orders/${id}/`,
  },
  
  // Utilisateur
  USER: {
    PROFILE: '/api/users/me/',
    UPDATE: (id) => `/api/users/${id}/`,
  },
};
