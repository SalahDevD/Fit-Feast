// PaymentButton.js - Bouton pour initier le paiement
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { CreditCardIcon } from '@heroicons/react/24/outline';

const PaymentButton = ({ orderId, disabled = false, className = '' }) => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour payer');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      // Rediriger vers la page de paiement
      navigate(`/checkout/${orderId}`);
    } catch (err) {
      console.error('Error initiating payment:', err);
      toast.error('Erreur lors de l\'initiation du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handlePayment}
      disabled={disabled || loading || !isAuthenticated}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
        transition duration-200 ${className}
        ${disabled || loading || !isAuthenticated
          ? 'bg-gray-400 cursor-not-allowed text-gray-600'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      `}
    >
      {loading ? (
        <>
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          Chargement...
        </>
      ) : (
        <>
          <CreditCardIcon className="h-5 w-5" />
          Payer maintenant
        </>
      )}
    </motion.button>
  );
};

export default PaymentButton;
