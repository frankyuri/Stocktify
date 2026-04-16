import { changeColor, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  changePercent?: number;
  hint?: string;
}

export function StatCard({ label, value, change, changePercent, hint }: StatCardProps) {
  const showChange = typeof change === 'number' && typeof changePercent === 'number';
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-100">{value}</p>
      {showChange && (
        <p className={cn('mt-1 text-sm font-medium', changeColor(change!))}>
          {change! > 0 ? '+' : ''}
          {change!.toFixed(2)} ({formatPercent(changePercent!)})
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
