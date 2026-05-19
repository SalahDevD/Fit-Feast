import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiMinus,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiTrash2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import { APP_BASE_URL } from '../../api/axios';
import EmptyState from '../../components/Common/EmptyState';
import { useCart } from '../../context/CartContext';

const formatMoney = (value) => `${Number(value || 0).toFixed(2)} MAD`;
const toNumber = (value) => Number(value || 0);

const resolveImageUrl = (imagePath) => {
  if (!imagePath) {
    return '';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${APP_BASE_URL}${imagePath.startsWith('/') ? imagePath : `/media/${imagePath}`}`;
};

const buildOptimisticCart = (currentCart, itemId, nextQuantity) => {
  if (!currentCart) {
    return currentCart;
  }

  const items = currentCart.items.reduce((nextItems, item) => {
    if (item.id !== itemId) {
      nextItems.push(item);
      return nextItems;
    }

    if (nextQuantity <= 0) {
      return nextItems;
    }

    const unitPrice = toNumber(item.unit_price);
    nextItems.push({
      ...item,
      quantity: nextQuantity,
      line_total: (unitPrice * nextQuantity).toFixed(2),
    });
    return nextItems;
  }, []);

  const subtotal = items.reduce((sum, item) => sum + toNumber(item.line_total), 0);
  const totalItems = items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
  const deliveryFee = toNumber(currentCart.delivery_fee);
  const total = subtotal + deliveryFee;

  return {
    ...currentCart,
    items,
    items_count: items.length,
    subtotal: subtotal.toFixed(2),
    total_items: totalItems,
    total: total.toFixed(2),
    total_formatted: `${total.toFixed(2)} DH`,
  };
};

const buildClearedCart = (currentCart) => {
  if (!currentCart) {
    return currentCart;
  }

  return {
    ...currentCart,
    items: [],
    items_count: 0,
    subtotal: '0.00',
    total_items: 0,
    total: '0.00',
    total_formatted: '0.00 DH',
  };
};

const CartPage = () => {
  const navigate = useNavigate();
  const {
    clearCart: clearCartItems,
    refreshCart,
    removeItem,
    setCart: syncCartState,
    updateItem,
  } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingItemIds, setPendingItemIds] = useState([]);
  const [clearing, setClearing] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const cartData = await refreshCart();
      setCart(cartData);
    } catch (error) {
      console.error('Cart loading error:', error);
      toast.error('Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  }, [refreshCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const setItemPending = useCallback((itemId, isPending) => {
    setPendingItemIds((currentIds) => {
      if (isPending) {
        return currentIds.includes(itemId) ? currentIds : [...currentIds, itemId];
      }

      return currentIds.filter((currentId) => currentId !== itemId);
    });
  }, []);

  const updateItemQuantity = useCallback(async (itemId, quantity) => {
    if (!cart) {
      return;
    }

    const previousCart = cart;
    const optimisticCart = buildOptimisticCart(cart, itemId, quantity);

    setCart(optimisticCart);
    syncCartState(optimisticCart);
    setItemPending(itemId, true);

    try {
      const response = quantity <= 0 ? await removeItem(itemId) : await updateItem(itemId, quantity);
      const nextCart = response.data?.cart;

      if (nextCart) {
        setCart(nextCart);
        syncCartState(nextCart);
      } else {
        const refreshedCart = await refreshCart();
        setCart(refreshedCart);
      }
    } catch (error) {
      console.error('Cart update error:', error);
      setCart(previousCart);
      syncCartState(previousCart);
      toast.error('Cart update failed.');
    } finally {
      setItemPending(itemId, false);
    }
  }, [cart, refreshCart, removeItem, setItemPending, syncCartState, updateItem]);

  const clearCart = useCallback(async () => {
    if (!cart) {
      return;
    }

    const previousCart = cart;
    const clearedCart = buildClearedCart(cart);

    setClearing(true);
    setCart(clearedCart);
    syncCartState(clearedCart);

    try {
      const response = await clearCartItems();
      const nextCart = response.data?.cart;

      if (nextCart) {
        setCart(nextCart);
        syncCartState(nextCart);
      } else {
        const refreshedCart = await refreshCart();
        setCart(refreshedCart);
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      setCart(previousCart);
      syncCartState(previousCart);
      toast.error('Could not clear the cart.');
    } finally {
      setClearing(false);
    }
  }, [cart, clearCartItems, refreshCart, syncCartState]);

  if (loading) {
    return (
      <div className="ff-page flex min-h-[70vh] items-center justify-center">
        <div className="rounded-full border border-slate-200 bg-white/90 px-6 py-4 text-sm font-medium text-slate-700 shadow-lg dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100">
          Loading your cart...
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="ff-page">
        <div className="ff-page__inner ff-page__inner--narrow">
          <EmptyState
            icon={FiShoppingBag}
            title="Your cart is empty"
            description="Build your order first, then come back for the Stripe checkout flow."
            action={(
              <button type="button" onClick={() => navigate('/menu')} className="ff-button-primary">
                Explore the menu
                <FiArrowRight />
              </button>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <div className="ff-page__inner space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="ff-panel--dark rounded-[2.5rem] px-6 py-8 text-white"
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
                Cart review
              </p>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                Review your meals before secure checkout.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                We create the order on the backend first, then hand you off to Stripe for card
                collection and confirmation.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-black/10 bg-black p-5 text-white shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
                <p className="text-sm text-white/70 dark:text-slate-300">Items</p>
                <p className="mt-2 text-3xl font-semibold text-white">{cart.total_items || cart.items.length}</p>
              </div>
              <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                <p className="text-sm text-emerald-100">Current subtotal</p>
                <p className="mt-2 text-3xl font-semibold text-white">{formatMoney(cart.subtotal)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.08fr,0.92fr]">
          <div className="space-y-5">
            {cart.items.map((item, index) => {
              const isItemUpdating = pendingItemIds.includes(item.id) || clearing;
              const imageUrl = resolveImageUrl(
                item?.dish_details?.image ||
                  item?.dish_details?.image_url ||
                  item?.custom_dish_details?.image_url ||
                  item?.custom_dish_details?.image
              );

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="ff-panel ff-panel--strong rounded-[2rem] p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className="h-28 w-28 overflow-hidden rounded-[1.5rem] bg-slate-200 dark:bg-white/10">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.item_name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {item.item_name}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Unit price:{' '}
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {formatMoney(item.unit_price)}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Line total:{' '}
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {formatMoney(item.line_total)}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start rounded-full border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/5">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          disabled={isItemUpdating}
                          className="rounded-full p-2 text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <FiMinus />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          disabled={isItemUpdating}
                          className="rounded-full p-2 text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <FiPlus />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, 0)}
                          disabled={isItemUpdating}
                          className="rounded-full p-2 text-rose-500 transition hover:bg-white hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/10"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="ff-panel ff-panel--strong rounded-[2rem] p-6">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Checkout summary</h2>

              <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatMoney(cart.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Calculated at checkout</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-base font-semibold text-slate-900 dark:border-white/10 dark:text-white">
                  <span>Estimated total</span>
                  <span>{formatMoney(cart.subtotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                Continue to checkout
                <FiArrowRight />
              </button>

              <button
                type="button"
                onClick={clearCart}
                disabled={clearing || pendingItemIds.length > 0}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:border-rose-400/20 dark:hover:text-rose-300"
              >
                Clear cart
              </button>
            </div>

            <div className="ff-panel--dark rounded-[2rem] p-6 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <FiShield />
                Payment safety
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Stripe handles card collection and authentication. Your app stores transaction
                records, statuses, and webhook history without exposing secret keys in the browser.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
