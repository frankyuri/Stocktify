import { useQuery } from '@tanstack/react-query';
import { searchTickers } from '@/services/stocks';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';

const SEARCH_STALE_MS = 60_000;

/** Header / SymbolSearchInput 共用的代號搜尋 */
export function useTickerSearch(query: string, minLength = 1) {
  const debounced = useDebouncedValue(query.trim());
  return useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchTickers(debounced),
    enabled: debounced.length >= minLength,
    staleTime: SEARCH_STALE_MS,
  });
}
