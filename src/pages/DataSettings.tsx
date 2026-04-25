import { useMemo, useRef, useState } from 'react';
import { useStockStore, buildBackupSnapshot, type BackupSnapshot } from '@/store/useStockStore';
import { useToast } from '@/lib/toast';
import { formatNumber } from '@/lib/format';

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function isValidSnapshot(x: unknown): x is BackupSnapshot {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    Array.isArray(o.transactions) &&
    Array.isArray(o.assets) &&
    Array.isArray(o.watchlist)
  );
}

export function DataSettings() {
  const transactions = useStockStore((s) => s.transactions);
  const assets = useStockStore((s) => s.assets);
  const watchlist = useStockStore((s) => s.watchlist);
  const importBackup = useStockStore((s) => s.importBackup);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [previewError, setPreviewError] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      transactions: transactions.length,
      assets: assets.length,
      watchlist: watchlist.length,
    }),
    [transactions, assets, watchlist],
  );

  function handleExport() {
    const snapshot = buildBackupSnapshot();
    downloadJson(`stock-ledgery-backup-${todayStamp()}.json`, snapshot);
    toast.success(`已匯出備份（${snapshot.transactions.length} 筆交易）`);
  }

  async function handleImport(file: File) {
    setPreviewError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!isValidSnapshot(parsed)) {
        throw new Error('檔案格式不符（缺少 transactions / assets / watchlist 欄位）');
      }
      const ok = window.confirm(
        `將以這份備份覆寫現有資料：\n` +
          `  · 交易：${parsed.transactions.length} 筆\n` +
          `  · 淨值快照：${parsed.assets.length} 筆\n` +
          `  · 自選：${parsed.watchlist.length} 檔\n\n` +
          `現有資料會被取代，建議先匯出一份目前的備份。確定繼續？`,
      );
      if (!ok) return;
      importBackup(parsed);
      toast.success('匯入完成，持股已重新計算');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '無法解析檔案';
      setPreviewError(msg);
      toast.error(`匯入失敗：${msg}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">資料備份與還原</h1>
        <p className="mt-1.5 text-[15px] text-ink-mute">
          所有持股 / 交易 / 淨值快照都存在你瀏覽器的 localStorage。
          換瀏覽器、清快取或重灌前請務必匯出 JSON 備份。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="交易紀錄" value={stats.transactions} />
        <Stat label="淨值快照" value={stats.assets} />
        <Stat label="自選股" value={stats.watchlist} />
      </div>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">匯出備份</h2>
            <p className="section-hint">下載一份 JSON，可以儲存到雲端硬碟或 USB</p>
          </div>
          <button type="button" onClick={handleExport} className="btn btn-primary">
            ↓ 下載 JSON
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="section-title">從備份還原</h2>
            <p className="section-hint">
              選擇之前匯出的 JSON 檔；持股會依交易紀錄自動重新計算
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImport(f);
            }}
            className="hidden"
            id="backup-import"
          />
          <label htmlFor="backup-import" className="btn cursor-pointer">
            選擇檔案…
          </label>
        </div>
        {previewError && (
          <div className="card-body border-t border-down/20 bg-down/[0.05] text-sm text-down">
            {previewError}
          </div>
        )}
      </section>

      <section className="card card-body text-xs text-ink-mute">
        <p className="font-medium text-ink-soft">小提醒</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>備份檔包含完整交易歷史，請避免外流（檔案沒加密）。</li>
          <li>還原會「覆寫」目前資料，不是合併；建議先匯出再還原。</li>
          <li>未來接上後端後，這份檔案也能用作初始匯入。</li>
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-6">
      <p className="label-caps">{label}</p>
      <p className="mt-3 font-mono text-[28px] font-semibold text-ink num">
        {formatNumber(value, 0)}
      </p>
    </div>
  );
}
