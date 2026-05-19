// stripeAPI.js - Service API pour Stripe
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const stripeAPI = {
  /**
   * Crée un PaymentIntent Stripe
   */
  createPaymentIntent: async (orderId, token) => {
    const response = await axios.post(
      `${API_URL}/api/stripe/create-payment-intent/`,
      { order_id: orderId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Confirme un paiement Stripe
   */
  confirmPayment: async (paymentIntentId, token) => {
    const response = await axios.post(
      `${API_URL}/api/stripe/confirm-payment/`,
      { payment_intent_id: paymentIntentId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  /**
   * Récupère le statut d'un paiement
   */
  getPaymentStatus: async (orderId, token) => {
    const response = await axios.get(
      `${API_URL}/api/stripe/payment-status/`,
      {
        params: { order_id: orderId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
