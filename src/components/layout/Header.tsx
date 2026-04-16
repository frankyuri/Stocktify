import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchTickers } from '@/services/stocks';
import { cn } from '@/lib/cn';

export function Header() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchTickers(query),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function goto(symbol: string) {
    setOpen(false);
    setQuery('');
    navigate(`/stock/${encodeURIComponent(symbol)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-800 bg-surface/80 px-4 backdrop-blur md:px-6">
      <div ref={wrapRef} className="relative flex-1 max-w-lg">
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) goto(results[0].symbol);
          }}
          placeholder="搜尋股票代號或公司名稱（例：AAPL、2330）"
          className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand focus:outline-none"
        />
        {open && query && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-surface-card shadow-xl">
            {results.map((r) => (
              <li key={r.symbol}>
                <button
                  type="button"
                  onClick={() => goto(r.symbol)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-800',
                  )}
                >
                  <span>
                    <span className="font-semibold text-slate-100">{r.symbol}</span>
                    <span className="ml-2 text-slate-400">{r.name}</span>
                  </span>
                  <span className="chip">{r.exchange}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
        <span className="chip">Yahoo Finance</span>
        <span className="chip">React Query Cache</span>
      </div>
    </header>
  );
}
