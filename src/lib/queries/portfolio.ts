import { queryOptions } from '@tanstack/react-query';
import { fetchPortfolio } from '@/services/stocks';
import { holdingsKey } from '@/lib/queryKeys';
import type { Holding } from '@/types/stock';

const PORTFOLIO_REFETCH_MS = 60_000;

/** 持股報價：Overview / Portfolio / Assets 共用，React Query 會自動去重 */
export function portfolioQueryOptions(holdings: Holding[]) {
  const key = holdingsKey(holdings);
  return queryOptions({
    queryKey: ['portfolio', key],
    queryFn: () => fetchPortfolio(holdings),
    enabled: holdings.length > 0,
    staleTime: 30_000,
    refetchInterval: PORTFOLIO_REFETCH_MS,
  });
}
