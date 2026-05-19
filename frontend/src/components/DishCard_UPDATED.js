// DishCard.js - MISE À JOUR pour intégration Stripe et Panier
// Remplacez la fonction addToCart dans votre DishCard.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFire, FaDumbbell, FaShoppingCart } from 'react-icons/fa';
import { cartAPI } from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DishCard = ({ dish }) => {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const [addingToCart, setAddingToCart] = useState(false);

  // Récupérer l'URL de l'image
  const getImageUrl = () => {
    if (dish.image_url) {
      return dish.image_url;
    }

    if (dish.image) {
      let url = dish.image;

      if (url.startsWith('http')) {
        return url;
      }

      if (url.startsWith('/')) {
        return `http://localhost:8000${url}`;
      }

      return `http://localhost:8000/media/${url}`;
    }

    return null;
  };

  const imageUrl = getImageUrl();

  // NOUVELLE FONCTION: Ajouter au panier avec Stripe
  const addToCart = async () => {
    // 1. Vérifier si authentifié
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour ajouter au panier');
      navigate('/login');
      return;
    }

    try {
      setAddingToCart(true);

      // 2. Ajouter l'article au panier via API
      const response = await cartAPI.post(
        '/cart/',
        {
          dish_id: dish.id,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success('✅ Article ajouté au panier!');

      // 3. Rediriger vers le panier après 1 seconde
      setTimeout(() => {
        navigate('/cart');
      }, 500);
    } catch (error) {
      console.error('Error adding to cart:', error);

      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Erreur lors de l\'ajout au panier';

      toast.error(errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image du plat */}
      <div className="relative h-48 bg-gradient-to-br from-blue-200 to-blue-300 overflow-hidden group">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-200">
            🍽️
          </div>
        )}

        {/* Badge populaire */}
        {dish.rating > 4.5 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <FaFire /> Populaire
          </div>
        )}

        {/* Badge disponibilité */}
        <div
          className={`absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold text-white ${
            dish.available ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {dish.available ? 'Disponible' : 'Indisponible'}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4 flex flex-col justify-between h-56">
        {/* Nom et description */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">
            {dish.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {dish.description || 'Délicieux plat préparé avec soin'}
          </p>

          {/* Badges de tags */}
          <div className="flex gap-2 flex-wrap mb-3">
            {dish.category && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {dish.category}
              </span>
            )}
            {dish.protein && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                <FaDumbbell size={10} /> {dish.protein}g
              </span>
            )}
          </div>
        </div>

        {/* Prix et bouton */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {dish.price?.toFixed(2)} MAD
            </p>
            {dish.original_price && dish.original_price > dish.price && (
              <p className="text-xs text-gray-500 line-through">
                {dish.original_price?.toFixed(2)} MAD
              </p>
            )}
          </div>

          {/* Bouton ajouter au panier - MISE À JOUR */}
          <motion.button
            onClick={addToCart}
            disabled={addingToCart || !dish.available}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-3 rounded-full transition-all duration-200 ${
              addingToCart
                ? 'bg-gray-400 cursor-wait'
                : !dish.available
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
            }`}
            title={addingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}
          >
            {addingToCart ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FaShoppingCart className="text-white text-lg" />
            )}
          </motion.button>
        </div>

        {/* Avis clients */}
        {dish.rating && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <div className="flex text-yellow-400">
              {'⭐'.repeat(Math.round(dish.rating))}
            </div>
            <span>({dish.reviews_count || 0} avis)</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DishCard;
