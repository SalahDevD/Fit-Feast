import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { invalidateLiveSyncEvent } from '../lib/queryClient';
import { subscribeToLiveSyncEvent } from '../lib/liveSync';

export const useLiveQuerySync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    return subscribeToLiveSyncEvent((event) => {
      invalidateLiveSyncEvent(queryClient, event);
    });
  }, [queryClient]);
};

