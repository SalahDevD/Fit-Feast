import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { allergiesAPI } from '../api/axios';
import { emitAndInvalidate } from '../lib/queryClient';
import { liveSyncEvents } from '../lib/liveSync';
import { queryKeys } from '../lib/queryKeys';
import { extractCollection } from './utils';

export const useAllergensQuery = () =>
  useQuery({
    queryKey: queryKeys.allergies.allergens,
    queryFn: async () => {
      const response = await allergiesAPI.getAllergens();
      return extractCollection(response.data);
    },
    staleTime: 10 * 60 * 1000,
  });

export const useDietTypesQuery = () =>
  useQuery({
    queryKey: queryKeys.allergies.diets,
    queryFn: async () => {
      const response = await allergiesAPI.getDietTypes();
      return extractCollection(response.data);
    },
    staleTime: 10 * 60 * 1000,
  });

export const useUserAllergiesQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.allergies.userAllergies,
    queryFn: async () => {
      const response = await allergiesAPI.getUserAllergies();
      return extractCollection(response.data);
    },
    enabled,
  });

export const useUserDietsQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.allergies.userDiets,
    queryFn: async () => {
      const response = await allergiesAPI.getUserDiets();
      return extractCollection(response.data);
    },
    enabled,
  });

export const usePreferenceMutations = () => {
  const queryClient = useQueryClient();

  const toggleAllergy = useMutation({
    mutationFn: async ({ allergenId, hasAllergy, userAllergies }) => {
      if (hasAllergy) {
        const allergyToRemove = userAllergies.find((item) => item.allergen === allergenId);
        if (!allergyToRemove) {
          return null;
        }
        await allergiesAPI.removeAllergy(allergyToRemove.id);
        return { removed: true };
      }

      await allergiesAPI.addAllergy({ allergen_id: allergenId });
      return { removed: false };
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.allergies.userAllergies }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
      ]);
      await emitAndInvalidate(queryClient, liveSyncEvents.PROFILE_CHANGED);
      toast.success(result?.removed ? 'Allergie supprimee' : 'Allergie ajoutee');
    },
  });

  const toggleDiet = useMutation({
    mutationFn: async ({ dietId, hasDiet, userDiets }) => {
      if (hasDiet) {
        const dietToRemove = userDiets.find((item) => item.diet === dietId);
        if (!dietToRemove) {
          return null;
        }
        await allergiesAPI.removeDiet(dietToRemove.id);
        return { removed: true };
      }

      await allergiesAPI.addDiet({ diet_id: dietId });
      return { removed: false };
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.allergies.userDiets }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dishes.all }),
      ]);
      await emitAndInvalidate(queryClient, liveSyncEvents.PROFILE_CHANGED);
      toast.success(result?.removed ? 'Regime supprime' : 'Regime ajoute');
    },
  });

  return {
    toggleAllergy,
    toggleDiet,
  };
};
