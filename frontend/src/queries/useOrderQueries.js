import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { adminAPI, ordersAPI } from '../api/axios';
import { emitAndInvalidate } from '../lib/queryClient';
import { liveSyncEvents } from '../lib/liveSync';
import { queryKeys } from '../lib/queryKeys';
import { createStableObject, extractCollection, extractTotalCount } from './utils';

export const useMyOrdersQuery = () =>
  useQuery({
    queryKey: queryKeys.orders.my,
    queryFn: async () => {
      const response = await ordersAPI.getMyOrders();
      return extractCollection(response.data);
    },
    refetchInterval: 15 * 1000,
  });

export const useAdminOrdersQuery = (params) => {
  const normalizedParams = createStableObject(params);

  return useQuery({
    queryKey: queryKeys.admin.orders(normalizedParams),
    queryFn: async () => {
      const response = await adminAPI.listOrders(normalizedParams);
      return {
        rows: extractCollection(response.data),
        total: extractTotalCount(response.data),
      };
    },
    placeholderData: (previousData) => previousData,
    refetchInterval: 10 * 1000,
  });
};

export const useAdminOrderStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }) => {
      const response = await adminAPI.updateOrderStatus(orderId, status);
      return response.data;
    },
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.ordersRoot });

      const snapshots = queryClient
        .getQueriesData({ queryKey: queryKeys.admin.ordersRoot })
        .map(([queryKey, data]) => [queryKey, data]);

      snapshots.forEach(([queryKey, data]) => {
        if (!data?.rows) {
          return;
        }

        queryClient.setQueryData(queryKey, {
          ...data,
          rows: data.rows.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                }
              : order
          ),
        });
      });

      queryClient.setQueryData(queryKeys.orders.my, (current = []) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
              }
            : order
        )
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error('Could not update the order status.');
    },
    onSuccess: async (_data, variables) => {
      await emitAndInvalidate(queryClient, liveSyncEvents.ORDER_CHANGED, {
        orderId: variables.orderId,
      });
      toast.success('Order status updated.');
    },
  });
};
