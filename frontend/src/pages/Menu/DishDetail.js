import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaClock,
  FaDumbbell,
  FaExclamationTriangle,
  FaFire,
  FaShoppingCart,
  FaTint,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import { dishesAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';


const fallbackImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="18"%3EImage non disponible%3C/text%3E%3C/svg%3E';


const DishDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const fetchDishDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dishesAPI.getById(id);
      setDish(response.data);
    } catch (error) {
      console.error('Erreur chargement detail plat', error);
      toast.error('Erreur lors du chargement du plat');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDishDetail();
  }, [fetchDishDetail]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour ajouter au panier');
      return;
    }

    try {
      setAddingToCart(true);
      await addItem({ dish_id: dish.id, quantity });
      toast.success(`${quantity} x ${dish.name} ajoute au panier`);
      setQuantity(1);
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!dish) {
    return (
      <div className="container mx-auto px-4 py-12">
        <button onClick={() => navigate('/menu')} className="mb-4 flex items-center text-primary hover:text-secondary">
          <FaArrowLeft className="mr-2" /> Retour au menu
        </button>
        <p className="text-center text-gray-600">Plat non trouve</p>
      </div>
    );
  }

  const imageUrl = dish.image_url || dish.image || fallbackImage;

  return (
    <div className="container mx-auto px-4 py-8">
      <button onClick={() => navigate('/menu')} className="mb-6 flex items-center font-semibold text-primary hover:text-secondary">
        <FaArrowLeft className="mr-2" /> Retour au menu
      </button>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex items-center justify-center">
          <img
            src={imageUrl}
            alt={dish.name}
            className="h-auto w-full rounded-lg object-cover shadow-lg"
            onError={(event) => {
              event.target.src = fallbackImage;
            }}
          />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{dish.name}</h1>
            {dish.profile_diet_match ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                <FaCheckCircle />
                Compatible avec votre regime
              </span>
            ) : null}
          </div>

          {dish.category_names?.length ? (
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Categories: <span className="font-semibold text-primary">{dish.category_names.join(' • ')}</span>
            </p>
          ) : null}

          <div className="mb-6">
            <p className="mb-2 text-5xl font-bold text-primary">{dish.formatted_price || `${dish.price} DH`}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Prix final en dirham marocain</p>
          </div>

          <p className="mb-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">{dish.description}</p>

          {dish.profile_diet_match ? (
            <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
              <div className="font-semibold">✅ Compatible avec votre regime :</div>
              <div className="mt-2">{(dish.profile_diet_matches || []).join(' • ')}</div>
            </div>
          ) : null}

          {dish.profile_allergen_alert ? (
            <div className="mb-6 rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
              <div className="flex items-start gap-2 font-semibold">
                <FaExclamationTriangle className="mt-1" />
                <span>⚠️ {dish.profile_allergen_message}</span>
              </div>
            </div>
          ) : null}

          <div className="mb-6 rounded-lg bg-gray-100 p-6 dark:bg-gray-800">
            <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Informations nutritionnelles</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex flex-col items-center">
                <FaFire className="mb-2 text-2xl text-orange-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Calories</p>
                <p className="font-bold text-gray-900 dark:text-white">{dish.calories} kcal</p>
              </div>

              <div className="flex flex-col items-center">
                <FaDumbbell className="mb-2 text-2xl text-blue-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Proteines</p>
                <p className="font-bold text-gray-900 dark:text-white">{dish.proteins} g</p>
              </div>

              <div className="flex flex-col items-center">
                <span className="mb-2 text-2xl text-yellow-500">C</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Glucides</p>
                <p className="font-bold text-gray-900 dark:text-white">{dish.carbs} g</p>
              </div>

              <div className="flex flex-col items-center">
                <FaTint className="mb-2 text-2xl text-emerald-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Lipides</p>
                <p className="font-bold text-gray-900 dark:text-white">{dish.fats} g</p>
              </div>
            </div>
          </div>

          {dish.preparation_time ? (
            <div className="mb-6 flex items-center text-gray-600 dark:text-gray-400">
              <FaClock className="mr-2" />
              <span>
                Temps de preparation: <strong>{dish.preparation_time} min</strong>
              </span>
            </div>
          ) : null}

          {dish.ingredients?.length ? (
            <div className="mb-6">
              <h3 className="mb-3 font-bold text-gray-900 dark:text-white">Ingredients</h3>
              <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                {dish.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mb-8 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <h3 className="mb-2 font-bold text-red-900 dark:text-red-100">⚠️ Allergenes</h3>
            <p className="text-red-800 dark:text-red-100">
              {dish.allergens?.length ? dish.allergens.join(', ') : 'Aucun allergene majeur detecte'}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                −
              </button>
              <span className="px-6 py-2 font-semibold text-gray-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={addingToCart || !isAuthenticated}
              className="btn-primary flex-1 py-3 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <FaShoppingCart />
              <span>{addingToCart ? 'Ajout...' : 'Ajouter au panier'}</span>
            </button>
          </div>

          {!isAuthenticated ? <p className="mt-3 text-sm text-orange-500">Veuillez vous connecter pour ajouter au panier</p> : null}
        </div>
      </div>
    </div>
  );
};


export default DishDetail;
