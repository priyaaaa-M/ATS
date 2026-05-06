import { useQuery } from '@tanstack/react-query'
import { candidatesApi } from '../api'

export function useCandidates(filters: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: () => candidatesApi.list(filters),
    staleTime: 30_000,
  })
}
