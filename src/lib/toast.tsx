import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

export type ToastTone = 'info' | 'success' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  push: (tone: ToastTone, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLE: Record<ToastTone, string> = {
  info: 'border-brand/30 bg-white/95 dark:bg-zinc-900/95 text-ink dark:text-zinc-100',
  success:
    'border-up/40 bg-up/[0.08] dark:bg-up/[0.16] text-up dark:text-emerald-300',
  error:
    'border-down/40 bg-down/[0.08] dark:bg-down/[0.16] text-down dark:text-rose-300',
};

const TONE_ICON: Record<ToastTone, string> = {
  info: 'ℹ',
  success: '✓',
  error: '⚠',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
    const handle = timers.current.get(id);
    if (handle) {
      window.clearTimeout(handle);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setToasts((arr) => [...arr, { id, tone, message }]);
      const handle = window.setTimeout(() => dismiss(id), 4200);
      timers.current.set(id, handle);
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((h) => window.clearTimeout(h));
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2"
      >
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-left text-sm shadow-pop backdrop-blur-xl transition',
              TONE_STYLE[t.tone],
            )}
          >
            <span className="mt-0.5 font-mono text-base leading-none">
              {TONE_ICON[t.tone]}
            </span>
            <span className="flex-1 leading-snug">{t.message}</span>
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: (_, m) => console.warn('[toast: no provider]', m),
      success: (m) => console.warn('[toast: no provider]', m),
      error: (m) => console.warn('[toast: no provider]', m),
      info: (m) => console.warn('[toast: no provider]', m),
    };
  }
  return ctx;
}
