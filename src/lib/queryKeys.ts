import type { Holding } from '@/types/stock';

/**
 * 把 holdings 序列化成穩定字串，作為 React Query queryKey 的一部分。
 * 同一組 (symbol, shares, avgCost) 永遠產生相同字串 → 不會因 array
 * reference 變動而重打 API。
 */
export function holdingsKey(holdings: Holding[]): string {
  if (holdings.length === 0) return '';
  return [...holdings]
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    .map((h) => `${h.symbol}:${h.shares}:${h.avgCost}`)
    .join('|');
}

/** 多個 symbol 的穩定 key（順序不影響） */
export function symbolsKey(symbols: string[]): string {
  if (symbols.length === 0) return '';
  return [...symbols].sort().join(',');
}
