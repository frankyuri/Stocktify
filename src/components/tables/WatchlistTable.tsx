import { useMemo } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import type { Quote } from '@/types/stock';
import { changeColor, formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Props {
  data: Quote[];
  onRemove?: (symbol: string) => void;
}

export function WatchlistTable({ data, onRemove }: Props) {
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<Quote>[]>(
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
        accessorKey: 'price',
        header: '現價',
        cell: (ctx) => (
          <span className="font-mono">{formatNumber(ctx.getValue<number>())}</span>
        ),
      },
      {
        accessorKey: 'change',
        header: '漲跌',
        cell: (ctx) => {
          const v = ctx.getValue<number>();
          return <span className={cn('font-medium', changeColor(v))}>{formatNumber(v)}</span>;
        },
      },
      {
        accessorKey: 'changePercent',
        header: '漲跌幅',
        cell: (ctx) => {
          const v = ctx.getValue<number>();
          return <span className={cn('font-medium', changeColor(v))}>{formatPercent(v)}</span>;
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-800 text-sm">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
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
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">
                尚未加入任何股票
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
