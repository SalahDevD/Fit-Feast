import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { adminAPI } from '../api/axios';
import { emitAndInvalidate } from '../lib/queryClient';
import { liveSyncEvents } from '../lib/liveSync';
import { queryKeys } from '../lib/queryKeys';
import { createStableObject, extractCollection, extractTotalCount } from './utils';

export const useAdminStatsQuery = () =>
  useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: async () => {
      const response = await adminAPI.getStats();
      return response.data;
    },
    refetchInterval: 20 * 1000,
  });

export const useAdminCategoriesQuery = (params = {}) => {
  const normalizedParams = createStableObject(params);

  return useQuery({
    queryKey: queryKeys.admin.categories(normalizedParams),
    queryFn: async () => {
      const response = await adminAPI.listCategories(normalizedParams);
      const rows = extractCollection(response.data);
      return {
        rows,
        total: extractTotalCount(response.data),
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useAdminDishesQuery = (params = {}) => {
  const normalizedParams = createStableObject(params);

  return useQuery({
    queryKey: queryKeys.admin.dishes(normalizedParams),
    queryFn: async () => {
      const response = await adminAPI.listDishes(normalizedParams);
      return {
        rows: extractCollection(response.data),
        total: extractTotalCount(response.data),
      };
    },
    placeholderData: (previousData) => previousData,
  });
};

const invalidateMenuAdminQueries = async (queryClient, type, payload = {}) =>
  emitAndInvalidate(queryClient, type, payload);

export const useAdminDishMutations = () => {
  const queryClient = useQueryClient();

  const createDish = useMutation({
    mutationFn: (payload) => adminAPI.createDish(payload),
    onSuccess: async () => {
      await invalidateMenuAdminQueries(queryClient, liveSyncEvents.MENU_CHANGED);
      toast.success('Plat cree avec succes');
    },
  });

  const updateDish = useMutation({
    mutationFn: ({ id, payload }) => adminAPI.updateDish(id, payload),
    onSuccess: async (_response, variables) => {
      await invalidateMenuAdminQueries(queryClient, liveSyncEvents.MENU_CHANGED, {
        dishId: variables.id,
      });
      toast.success('Plat mis a jour');
    },
  });

  const deleteDish = useMutation({
    mutationFn: (id) => adminAPI.deleteDish(id),
    onSuccess: async (_response, id) => {
      await invalidateMenuAdminQueries(queryClient, liveSyncEvents.MENU_CHANGED, { dishId: id });
      toast.success('Plat supprime');
    },
  });

  return {
    createDish,
    updateDish,
    deleteDish,
  };
};

export const useAdminCategoryMutations = () => {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: (payload) => adminAPI.createCategory(payload),
    onSuccess: async (response) => {
      await invalidateMenuAdminQueries(queryClient, liveSyncEvents.CATEGORY_CHANGED);
      toast.success(response?.data?.message || 'Categorie creee');
    },
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, payload }) => adminAPI.updateCategory(id, payload),
    onSuccess: async (response, variables) => {
      await invalidateMenuAdminQueries(queryClient, liveSyncEvents.CATEGORY_CHANGED, {
        categoryId: variables.id,
      });
      toast.success(response?.data?.message || 'Categorie mise a jour');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => adminAPI.deleteCategory(id),
    onSuccess: async (response, id) => {
      await invalidateMenuAdminQueries(queryClient, liveSyncEvents.CATEGORY_CHANGED, {
        categoryId: id,
      });
      toast.success(response?.data?.message || 'Categorie supprimee');
    },
  });

  return {
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
