import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PortfolioTable } from '@/components/tables/PortfolioTable';
import { HoldingForm } from '@/components/portfolio/HoldingForm';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchPortfolio } from '@/services/stocks';
import { useStockStore } from '@/store/useStockStore';
import { formatCurrency } from '@/lib/format';

export function Portfolio() {
  const holdings = useStockStore((s) => s.holdings);
  const removeHolding = useStockStore((s) => s.removeHolding);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['portfolio', holdings],
    queryFn: () => fetchPortfolio(holdings),
    enabled: holdings.length > 0,
    refetchInterval: 60_000,
  });

  const totals = useMemo(() => {
    if (!data || data.length === 0) {
      return { marketValue: 0, gainLoss: 0, dayChange: 0, cost: 0 };
    }
    const marketValue = data.reduce((a, x) => a + x.marketValue, 0);
    const cost = data.reduce((a, x) => a + x.shares * x.avgCost, 0);
    const gainLoss = data.reduce((a, x) => a + x.gainLoss, 0);
    const dayChange = data.reduce((a, x) => a + x.change * x.shares, 0);
    return { marketValue, gainLoss, dayChange, cost };
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">個人持股</h1>
        <p className="text-sm text-slate-500">
          資料只儲存在你的瀏覽器 (localStorage)，報價經 Yahoo Finance 取得
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="總市值"
          value={formatCurrency(totals.marketValue, 'USD')}
          hint="依最新 Yahoo 報價估算"
        />
        <StatCard
          label="未實現損益"
          value={formatCurrency(totals.gainLoss, 'USD')}
          change={totals.gainLoss}
          changePercent={totals.cost ? (totals.gainLoss / totals.cost) * 100 : 0}
        />
        <StatCard
          label="今日變動"
          value={formatCurrency(totals.dayChange, 'USD')}
          change={totals.dayChange}
          changePercent={
            totals.marketValue ? (totals.dayChange / totals.marketValue) * 100 : 0
          }
        />
      </div>

      <HoldingForm />

      {isError && (
        <div className="card card-body text-sm text-down">
          讀取持股報價失敗：{(error as Error)?.message ?? '未知錯誤'}
        </div>
      )}

      {holdings.length === 0 ? (
        <div className="card card-body py-12 text-center text-slate-500">
          目前沒有持股。用上方表單新增一筆試試看。
        </div>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <PortfolioTable data={data ?? []} onRemove={removeHolding} />
      )}
    </div>
  );
}
