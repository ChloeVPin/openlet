import { QueryClient } from '@tanstack/react-query'

/**
 * Shared QueryClient defaults tuned for snappy navigation:
 * - staleTime keeps list data instant when hopping back/forth
 * - gcTime retains cache during a long study session
 * - retries stay low so failures feel responsive
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  set: (id: string) => ['set', id] as const,
  session: ['session'] as const,
}
