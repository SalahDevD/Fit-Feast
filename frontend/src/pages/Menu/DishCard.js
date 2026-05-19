import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaClock,
  FaDumbbell,
  FaExclamationTriangle,
  FaFire,
  FaHeart,
  FaShoppingCart,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const placeholderImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23dbe7df" width="300" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%235e6b62" font-size="18"%3EFit Feast%3C/text%3E%3C/svg%3E';

const DishCard = ({ dish, onToggleFavorite, favoritePending = false }) => {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  const imageUrl = dish.image_url || dish.image || '';

  const addToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to add meals to your cart.');
      return;
    }

    try {
      await addItem({ dish_id: dish.id, quantity: 1 });
      toast.success(`${dish.name} added to your cart.`);
    } catch {
      toast.error('The meal could not be added to your cart.');
    }
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      toast.error('Sign in to save favorites.');
      return;
    }

    onToggleFavorite?.(dish);
  };

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ duration: 0.22 }}
      className="card group relative overflow-hidden"
    >
      <div className="relative">
        <img
          src={imageUrl || placeholderImage}
          alt={dish.name}
          loading="lazy"
          decoding="async"
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          onError={(event) => {
            event.target.src = placeholderImage;
          }}
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-full border border-white/20 bg-slate-950/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
            {dish.category_name || 'Chef selection'}
          </span>
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={favoritePending}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 backdrop-blur transition ${
              dish.is_favorite
                ? 'bg-rose-500 text-white shadow-[0_18px_36px_-24px_rgba(244,63,94,0.8)]'
                : 'bg-slate-950/70 text-white hover:bg-rose-500'
            } ${favoritePending ? 'cursor-not-allowed opacity-70' : ''}`}
            aria-label={dish.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <motion.span
              key={dish.is_favorite ? 'on' : 'off'}
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <FaHeart />
            </motion.span>
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{dish.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{dish.favorites_count || 0} saved by the community</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
            {dish.formatted_price || `${dish.price} DH`}
          </span>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">{dish.description}</p>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-[1.4rem] bg-slate-50/80 p-3 text-sm">
          <div className="rounded-2xl bg-white/90 px-3 py-2 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-orange-500">
              <FaFire />
              <span className="font-semibold text-slate-900">{dish.calories}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">kcal</p>
          </div>
          <div className="rounded-2xl bg-white/90 px-3 py-2 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-sky-500">
              <FaDumbbell />
              <span className="font-semibold text-slate-900">{dish.proteins}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">protein</p>
          </div>
          <div className="rounded-2xl bg-white/90 px-3 py-2 text-center shadow-sm">
            <div className="flex items-center justify-center gap-2 text-violet-500">
              <FaClock />
              <span className="font-semibold text-slate-900">{dish.preparation_time}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">minutes</p>
          </div>
        </div>

        {dish.profile_diet_match ? (
          <div className="mb-3 rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
            <div className="flex items-center gap-2">
              <FaCheckCircle />
              <span>Aligned with your food preferences</span>
            </div>
            <div className="mt-1">{(dish.profile_diet_matches || []).join(' • ')}</div>
          </div>
        ) : null}

        {dish.profile_allergen_alert ? (
          <div className="mb-3 rounded-[1.25rem] bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{dish.profile_allergen_message}</span>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Link to={`/dish/${dish.id}`} className="ff-button-secondary flex-1">
            View details
          </Link>
          <button onClick={addToCart} className="ff-button-primary px-4" title="Add to cart">
            <FaShoppingCart />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default memo(DishCard);
