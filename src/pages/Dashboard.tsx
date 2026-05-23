import { useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { WatchlistTable } from '@/components/tables/WatchlistTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchChartBundle, fetchQuote, fetchQuotes } from '@/services/stocks';
import { useStockStore } from '@/store/useStockStore';
import { formatNumber, formatPercent, changeColor } from '@/lib/format';
import { cn } from '@/lib/cn';
import { symbolsKey } from '@/lib/queryKeys';
import type { Quote } from '@/types/stock';

const StockChart = lazy(() =>
  import('@/components/charts/StockChart').then((m) => ({ default: m.StockChart })),
);

const INDEX_SYMBOLS = [
  { symbol: '^GSPC', label: 'S&P 500' },
  { symbol: '^IXIC', label: 'Nasdaq' },
  { symbol: '^DJI', label: 'Dow Jones' },
  { symbol: '^TWII', label: '加權指數' },
];

const CHART_REFETCH_MS = 5 * 60_000;
const QUOTE_REFETCH_MS = 60_000;

export function Dashboard() {
  const selected = useStockStore((s) => s.selectedSymbol);
  const watchlist = useStockStore((s) => s.watchlist);
  const setSelected = useStockStore((s) => s.setSelectedSymbol);
  const remove = useStockStore((s) => s.removeFromWatchlist);
  const qc = useQueryClient();

  const indexSymbols = INDEX_SYMBOLS.map((x) => x.symbol);
  const indices = useQuery({
    queryKey: ['quotes-lite', symbolsKey(indexSymbols)],
    queryFn: () => fetchQuotes(indexSymbols),
    refetchInterval: QUOTE_REFETCH_MS,
  });

  const bundle = useQuery({
    queryKey: ['chart-bundle', selected, '1D'],
    queryFn: () => fetchChartBundle(selected, '1D'),
    refetchInterval: CHART_REFETCH_MS,
  });

  const quote = useQuery({
    queryKey: ['quote', selected],
    queryFn: () => fetchQuote(selected),
    refetchInterval: QUOTE_REFETCH_MS,
    placeholderData: () =>
      qc.getQueryData<Awaited<ReturnType<typeof fetchChartBundle>>>([
        'chart-bundle',
        selected,
        '1D',
      ])?.quote,
  });

  const watch = useQuery({
    queryKey: ['quotes-lite', symbolsKey(watchlist)],
    queryFn: () => fetchQuotes(watchlist),
    enabled: watchlist.length > 0,
    refetchInterval: QUOTE_REFETCH_MS,
  });

  const indexMap = new Map(
    (indices.data?.quotes ?? []).map((q) => [q.symbol, q]),
  );

  const displayQuote = quote.data ?? bundle.data?.quote;

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-6">
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">大盤總覽</h1>
          <p className="mt-1.5 text-[15px] text-ink-mute">
            主要指數即時行情、個股 K 線、自選清單（每 60 秒更新）
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDEX_SYMBOLS.map((ix) => {
            const q = indexMap.get(ix.symbol);
            return (
              <IndexCard key={ix.symbol} label={ix.label} symbol={ix.symbol} quote={q} />
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">{selected} · 日 K 線</h2>
            <p className="section-hint">滾輪縮放 · 拖曳平移 · MA20；點自選切換</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {watchlist.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelected(s)}
                className={`btn text-sm ${selected === s ? 'btn-primary' : ''}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {displayQuote && (
          <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="font-mono text-[32px] font-semibold tracking-tight text-ink num">
              {formatNumber(displayQuote.price)}
            </span>
            <span
              className={cn(
                'font-mono text-[15px] font-medium num',
                changeColor(displayQuote.change),
              )}
            >
              {displayQuote.change > 0 ? '+' : ''}
              {formatNumber(displayQuote.change)} (
              {formatPercent(displayQuote.changePercent)})
            </span>
            <span className="text-sm text-ink-mute">
              前收 {formatNumber(displayQuote.previousClose)} · 開盤{' '}
              {formatNumber(displayQuote.open ?? 0)} · 高{' '}
              {formatNumber(displayQuote.dayHigh ?? 0)} · 低{' '}
              {formatNumber(displayQuote.dayLow ?? 0)} · {displayQuote.currency}
            </span>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            {bundle.isLoading ? (
              <Skeleton className="h-[420px] w-full" />
            ) : bundle.data?.candles ? (
              <Suspense fallback={<Skeleton className="h-[420px] w-full" />}>
                <StockChart data={bundle.data.candles} />
              </Suspense>
            ) : (
              <p className="py-16 text-center text-ink-mute">無法載入圖表資料</p>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">自選清單</h2>
            <p className="section-hint">每 60 秒自動更新（經 Yahoo Finance）</p>
          </div>
        </div>
        {watch.isLoading ? (
          <div className="p-6">
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <WatchlistTable
            data={watch.data?.quotes ?? []}
            onRemove={remove}
            stale={(watch.data?.failed.length ?? 0) > 0}
          />
        )}
      </section>
    </div>
  );
}

function IndexCard({
  label,
  symbol,
  quote,
}: {
  label: string;
  symbol: string;
  quote?: Quote;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <p className="label-caps">{label}</p>
        <span className="font-mono text-xs text-ink-faint">{symbol}</span>
      </div>
      <p className="mt-3 font-mono text-[28px] font-semibold leading-none tracking-tight text-ink num">
        {quote ? formatNumber(quote.price) : '—'}
      </p>
      {quote && (
        <p className={cn('mt-3 text-[15px] font-medium num', changeColor(quote.change))}>
          {quote.change > 0 ? '+' : ''}
          {quote.change.toFixed(2)}{' '}
          <span className="text-sm opacity-80">
            ({formatPercent(quote.changePercent)})
          </span>
        </p>
      )}
      {quote?.dayHigh != null && quote?.dayLow != null && (
        <p className="mt-2 text-xs text-ink-mute">
          區間 {formatNumber(quote.dayLow)} – {formatNumber(quote.dayHigh)}
        </p>
      )}
    </div>
  );
}
