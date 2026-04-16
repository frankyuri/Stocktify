import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/', label: '大盤總覽', icon: '📊' },
  { to: '/portfolio', label: '個人持股', icon: '💼' },
  { to: '/stock/AAPL', label: '個股研究', icon: '🔍' },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-800 bg-surface/60 backdrop-blur md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          S
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-100">Stocktify</p>
          <p className="text-xs text-slate-500">個人股票追蹤</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-brand/15 text-brand'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
              )
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-3 text-xs text-slate-500">
        v0.2.0 · Yahoo Finance
      </div>
    </aside>
  );
}
