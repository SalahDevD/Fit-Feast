import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { cartAPI } from '../api/axios';
import { emitAndInvalidate } from '../lib/queryClient';
import { liveSyncEvents } from '../lib/liveSync';
import { queryKeys } from '../lib/queryKeys';
import { useAuth } from './AuthContext';


const CartContext = createContext(null);


export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};


export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart.detail,
    queryFn: async () => {
      const response = await cartAPI.getCart();
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 15 * 1000,
  });

  const countQuery = useQuery({
    queryKey: queryKeys.cart.count,
    queryFn: async () => {
      const response = await cartAPI.getCount();
      return Number(response.data?.count || 0);
    },
    enabled: isAuthenticated,
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
  });

  const syncCartState = useCallback((cartData = null, fallbackCount = null) => {
    if (cartData) {
      queryClient.setQueryData(queryKeys.cart.detail, cartData);
      queryClient.setQueryData(
        queryKeys.cart.count,
        cartData.total_items || cartData.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0
      );
      return cartData;
    }

    if (typeof fallbackCount === 'number') {
      queryClient.setQueryData(queryKeys.cart.count, fallbackCount);
    }
    return null;
  }, [queryClient]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      syncCartState(null, 0);
      return null;
    }

    const data = await queryClient.fetchQuery({
      queryKey: queryKeys.cart.detail,
      queryFn: async () => {
        const response = await cartAPI.getCart();
        return response.data;
      },
    });

    return syncCartState(data);
  }, [isAuthenticated, queryClient, syncCartState]);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) {
      queryClient.setQueryData(queryKeys.cart.count, 0);
      return 0;
    }

    const nextCount = await queryClient.fetchQuery({
      queryKey: queryKeys.cart.count,
      queryFn: async () => {
        const response = await cartAPI.getCount();
        return Number(response.data?.count || 0);
      },
    });

    return nextCount;
  }, [isAuthenticated, queryClient]);

  const syncFromResponse = useCallback(async (response) => {
    syncCartState(response.data?.cart, Number(response.data?.count || 0));
    await emitAndInvalidate(queryClient, liveSyncEvents.CART_CHANGED);
    return response;
  }, [queryClient, syncCartState]);

  const addItem = useCallback(async (payload) => {
    const response = await cartAPI.addItem(payload);
    return syncFromResponse(response);
  }, [syncFromResponse]);

  const updateItem = useCallback(async (itemId, quantity) => {
    const response = await cartAPI.updateItem(itemId, quantity);
    return syncFromResponse(response);
  }, [syncFromResponse]);

  const removeItem = useCallback(async (itemId) => {
    const response = await cartAPI.removeItem(itemId);
    return syncFromResponse(response);
  }, [syncFromResponse]);

  const clearCart = useCallback(async () => {
    const response = await cartAPI.clearCart();
    return syncFromResponse(response);
  }, [syncFromResponse]);

  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.setQueryData(queryKeys.cart.detail, null);
      queryClient.setQueryData(queryKeys.cart.count, 0);
    }
  }, [isAuthenticated, queryClient]);

  const cart = cartQuery.data ?? null;
  const count =
    cart?.total_items ||
    countQuery.data ||
    cart?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ||
    0;
  const loading = cartQuery.isPending || (isAuthenticated && countQuery.isPending);

  const value = useMemo(
    () => ({
      cart,
      count,
      loading,
      setCart: syncCartState,
      refreshCart,
      refreshCount,
      addItem,
      updateItem,
      removeItem,
      clearCart,
    }),
    [addItem, cart, clearCart, count, loading, refreshCart, refreshCount, removeItem, syncCartState, updateItem]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
