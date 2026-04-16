import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import type { PortfolioHolding } from '@/types/stock';
import { changeColor, formatCurrency, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  data: PortfolioHolding[];
  onRemove?: (symbol: string) => void;
}

export function PortfolioTable({ data, onRemove }: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'marketValue', desc: true },
  ]);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<PortfolioHolding>[]>(
    () => [
      {
        accessorKey: 'symbol',
        header: '代號',
        cell: (ctx) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-100">{ctx.row.original.symbol}</span>
            <span className="text-xs text-slate-500">{ctx.row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'shares',
        header: '持有股數',
        cell: (ctx) => formatNumber(ctx.getValue<number>(), 0),
      },
      {
        accessorKey: 'avgCost',
        header: '平均成本',
        cell: (ctx) => formatNumber(ctx.getValue<number>()),
      },
      {
        accessorKey: 'price',
        header: '現價',
        cell: (ctx) => (
          <span className="font-mono">{formatNumber(ctx.getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'changePercent',
        header: '今日',
        cell: (ctx) => {
          const v = ctx.getValue<number>();
          return <span className={cn('font-medium', changeColor(v))}>{formatPercent(v)}</span>;
        },
      },
      {
        accessorKey: 'marketValue',
        header: '市值',
        cell: (ctx) => formatCurrency(ctx.getValue<number>(), 'USD'),
      },
      {
        accessorKey: 'gainLoss',
        header: '損益',
        cell: (ctx) => {
          const row = ctx.row.original;
          return (
            <div className={cn('flex flex-col font-medium', changeColor(row.gainLoss))}>
              <span>{formatNumber(row.gainLoss)}</span>
              <span className="text-xs">{formatPercent(row.gainLossPercent)}</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: (ctx) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(ctx.row.original.symbol);
            }}
            className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-down"
          >
            移除
          </button>
        ),
      },
    ],
    [onRemove],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div>
          <h3 className="text-base font-semibold text-slate-100">個人持股</h3>
          <p className="text-xs text-slate-500">點擊列可進入個股研究頁</p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="搜尋..."
          className="w-40 rounded-md border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand focus:outline-none"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-slate-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' && '▲'}
                        {sorted === 'desc' && '▼'}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/stock/${encodeURIComponent(row.original.symbol)}`)}
                className="cursor-pointer transition hover:bg-slate-800/40"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-5 py-3 text-slate-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">
                  沒有符合條件的持股
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
