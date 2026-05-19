import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { dishesAPI } from '../api/axios';
import { emitAndInvalidate } from '../lib/queryClient';
import { liveSyncEvents } from '../lib/liveSync';
import { queryKeys } from '../lib/queryKeys';
import { createStableObject, extractCollection } from './utils';

const MENU_PAGE_SIZE = 100;

const fetchAllDishPages = async (params = {}) => {
  let page = 1;
  let allDishes = [];
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await dishesAPI.getAll({
      ...params,
      page,
      page_size: MENU_PAGE_SIZE,
    });
    const payload = response.data;

    allDishes = [...allDishes, ...extractCollection(payload)];
    hasNextPage = !Array.isArray(payload) && Boolean(payload?.next);
    page += 1;
  }

  return allDishes;
};

const toggleFavoriteInCollection = (collection, dishId, isFavorite) => {
  if (!Array.isArray(collection)) {
    return collection;
  }

  return collection.map((dish) =>
    dish?.id === dishId
      ? {
          ...dish,
          is_favorite: isFavorite,
          favorites_count: Math.max(
            Number(dish.favorites_count || 0) + (isFavorite ? 1 : -1),
            0
          ),
        }
      : dish
  );
};

export const useDishCategoriesQuery = () =>
  useQuery({
    queryKey: queryKeys.dishes.categories,
    queryFn: async () => {
      const response = await dishesAPI.getCategories();
      return extractCollection(response.data);
    },
    staleTime: 5 * 60 * 1000,
  });

export const useMenuDishesQuery = ({ category, search, filters }) => {
  const normalizedFilters = useMemo(
    () =>
      createStableObject({
        category: category || '',
        search: search?.trim() || '',
        favoritesOnly: Boolean(filters?.favoritesOnly),
      }),
    [category, filters, search]
  );

  return useQuery({
    queryKey: queryKeys.dishes.list(normalizedFilters),
    queryFn: async () => {
      const params = {};

      if (normalizedFilters.category) params.category = normalizedFilters.category;
      if (normalizedFilters.search) params.search = normalizedFilters.search;
      if (normalizedFilters.favoritesOnly) params.favorites_only = true;

      return fetchAllDishPages(params);
    },
    placeholderData: (previousData) => previousData,
    refetchOnMount: false,
  });
};

export const useFavoriteDishesQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.dishes.favorites,
    queryFn: async () => {
      const response = await dishesAPI.getFavorites();
      return extractCollection(response.data);
    },
    enabled,
    staleTime: 60 * 1000,
  });

export const useToggleFavoriteDishMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dishId }) => {
      const response = await dishesAPI.toggleFavorite(dishId);
      return response.data;
    },
    onMutate: async ({ dishId, currentState, dishSnapshot }) => {
      const nextFavoriteState = !currentState;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['dishes', 'list'] }),
        queryClient.cancelQueries({ queryKey: queryKeys.dishes.favorites }),
      ]);

      const previousFavoriteDishes = queryClient.getQueryData(queryKeys.dishes.favorites);

      queryClient.setQueriesData({ queryKey: ['dishes', 'list'] }, (current) =>
        Array.isArray(current)
          ? toggleFavoriteInCollection(current, dishId, nextFavoriteState)
          : current
      );

      if (Array.isArray(previousFavoriteDishes)) {
        queryClient.setQueryData(
          queryKeys.dishes.favorites,
          nextFavoriteState
            ? previousFavoriteDishes.some((dish) => dish?.id === dishId)
              ? previousFavoriteDishes
              : [dishSnapshot, ...previousFavoriteDishes].filter(Boolean)
            : previousFavoriteDishes.filter((dish) => dish?.id !== dishId)
        );
      }

      return {
        previousFavoriteDishes,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousFavoriteDishes) {
        queryClient.setQueryData(queryKeys.dishes.favorites, context.previousFavoriteDishes);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all });
    },
    onSuccess: async (data) => {
      toast.success(
        data?.is_favorite ? 'Added to favorites.' : 'Removed from favorites.'
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dishes.favorites }),
      ]);
      await emitAndInvalidate(queryClient, liveSyncEvents.MENU_CHANGED);
    },
  });
};
