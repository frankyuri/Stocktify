import {
  buildMockCandles,
  buildMockQuote,
  searchSymbols,
} from './mockData';
import {
  yahooChart,
  yahooQuote,
  yahooQuotesLite,
  yahooSearch,
  type ChartBundle,
} from './yahoo';
import type {
  Candle,
  DividendEvent,
  Holding,
  PortfolioHolding,
  Quote,
  Resolution,
  SearchResult,
  SplitEvent,
} from '@/types/stock';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async function fake<T>(value: T, delay = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

export async function fetchCandles(
  symbol: string,
  resolution: Resolution = '1D',
): Promise<Candle[]> {
  if (USE_MOCK) return fake(buildMockCandles(symbol));
  const { candles } = await yahooChart(symbol, resolution);
  return candles;
}

export async function fetchChartBundle(
  symbol: string,
  resolution: Resolution = '1D',
): Promise<ChartBundle> {
  if (USE_MOCK) {
    const candles = await fake(buildMockCandles(symbol));
    return {
      candles,
      quote: buildMockQuote(symbol),
      dividends: [] as DividendEvent[],
      splits: [] as SplitEvent[],
    };
  }
  return yahooChart(symbol, resolution);
}

export async function fetchQuote(symbol: string): Promise<Quote> {
  if (USE_MOCK) return fake(buildMockQuote(symbol));
  return yahooQuote(symbol);
}

export interface FetchQuotesResult {
  quotes: Quote[];
  failed: string[];
}

export async function fetchQuotes(
  symbols: string[],
): Promise<FetchQuotesResult> {
  if (symbols.length === 0) return { quotes: [], failed: [] };
  if (USE_MOCK) {
    const quotes = await fake(symbols.map(buildMockQuote));
    return { quotes, failed: [] };
  }
  return yahooQuotesLite(symbols);
}

export interface FetchPortfolioResult {
  holdings: PortfolioHolding[];
  failed: string[];
  stale: boolean;
}

export async function fetchPortfolio(
  holdings: Holding[],
): Promise<FetchPortfolioResult> {
  if (holdings.length === 0) return { holdings: [], failed: [], stale: false };
  const { quotes, failed } = await fetchQuotes(holdings.map((h) => h.symbol));
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
  const enriched: PortfolioHolding[] = holdings.map((h) => {
    const q = quoteMap.get(h.symbol);
    const price = q?.price ?? h.avgCost;
    const change = q?.change ?? 0;
    const changePercent = q?.changePercent ?? 0;
    const marketValue = round(h.shares * price);
    const cost = h.shares * h.avgCost;
    const gainLoss = round(marketValue - cost);
    return {
      symbol: h.symbol,
      name: q?.name ?? h.symbol,
      shares: h.shares,
      avgCost: h.avgCost,
      price: round(price),
      change,
      changePercent,
      marketValue,
      gainLoss,
      gainLossPercent: cost ? round((gainLoss / cost) * 100) : 0,
      currency: q?.currency ?? guessCurrency(h.symbol),
    };
  });
  return { holdings: enriched, failed, stale: failed.length > 0 };
}

function guessCurrency(symbol: string): string {
  if (/\.TW$/i.test(symbol)) return 'TWD';
  if (/\.HK$/i.test(symbol)) return 'HKD';
  if (/\.T$/i.test(symbol)) return 'JPY';
  return 'USD';
}

export async function searchTickers(query: string): Promise<SearchResult[]> {
  if (USE_MOCK) return fake(searchSymbols(query), 80);
  return yahooSearch(query);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
