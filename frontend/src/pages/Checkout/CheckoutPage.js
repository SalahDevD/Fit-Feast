// CheckoutPage.js - Page de paiement complète
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/js';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import StripeCheckout from '../components/Payment/StripeCheckout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Initialiser Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const CheckoutPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Créer un PaymentIntent au chargement
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails de la commande
        const orderResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/orders/${orderId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setOrder(orderResponse.data);

        // Créer un PaymentIntent Stripe
        const paymentResponse = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/stripe/create-payment-intent/`,
          { order_id: orderId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        setClientSecret(paymentResponse.data.client_secret);
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Erreur lors du chargement';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (orderId && token) {
      createPaymentIntent();
    }
  }, [orderId, token]);

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Confirmer le paiement auprès du backend
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/stripe/confirm-payment/`,
        { payment_intent_id: paymentIntent.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      toast.success('Paiement confirmé avec succès!');
      navigate(`/checkout/success?order_id=${orderId}`);
    } catch (err) {
      console.error('Error confirming payment:', err);
      toast.error('Erreur lors de la confirmation du paiement');
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <motion.div
          className="text-center mb-12"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Paiement sécurisé</h1>
          <p className="text-gray-600">Finalisez votre commande en toute confiance</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de paiement */}
          <motion.div
            className="lg:col-span-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-blue-600 rounded-full"></div>
              </div>
            ) : error ? (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Réessayer
                </button>
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#2563eb',
                      colorBackground: '#ffffff',
                      colorText: '#1f2937',
                      borderRadius: '0.5rem',
                    },
                  },
                }}
              >
                <StripeCheckout
                  clientSecret={clientSecret}
                  orderId={orderId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </Elements>
            ) : null}
          </motion.div>

          {/* Résumé de la commande */}
          <motion.div
            className="lg:col-span-1"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Résumé de commande</h2>
              
              {order && (
                <>
                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Numéro de commande:</span>
                      <span className="font-medium">{order.order_number}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Nombre d'articles:</span>
                      <span className="font-medium">{order.items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Statut:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Sous-total:</span>
                      <span>{order.subtotal?.toFixed(2)} MAD</span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Frais de livraison:</span>
                        <span>{order.delivery_fee?.toFixed(2)} MAD</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Réduction:</span>
                        <span>-{order.discount?.toFixed(2)} MAD</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {order.total_amount?.toFixed(2)} MAD
                      </span>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Adresse de livraison</h3>
                      <p className="text-sm text-gray-600">
                        {order.delivery_address}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutPage;
