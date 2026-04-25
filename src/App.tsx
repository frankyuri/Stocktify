import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Dashboard } from '@/pages/Dashboard';
import { Overview } from '@/pages/Overview';
import { Portfolio } from '@/pages/Portfolio';
import { StockDetail } from '@/pages/StockDetail';
import { Transactions } from '@/pages/Transactions';
import { Assets } from '@/pages/Assets';
import { LineSettings } from '@/pages/LineSettings';
import { DataSettings } from '@/pages/DataSettings';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        {/* 公開頁面：大盤總覽 / 個股研究都不需要登入 */}
        <Route index element={<Dashboard />} />
        <Route path="stock/:symbol" element={<StockDetail />} />

        {/* 個人資產頁面 — 需要登入 */}
        <Route
          path="overview"
          element={
            <RequireAuth>
              <Overview />
            </RequireAuth>
          }
        />
        <Route
          path="portfolio"
          element={
            <RequireAuth>
              <Portfolio />
            </RequireAuth>
          }
        />
        <Route
          path="transactions"
          element={
            <RequireAuth>
              <Transactions />
            </RequireAuth>
          }
        />
        <Route
          path="assets"
          element={
            <RequireAuth>
              <Assets />
            </RequireAuth>
          }
        />
        <Route
          path="settings/line"
          element={
            <RequireAuth>
              <LineSettings />
            </RequireAuth>
          }
        />
        <Route
          path="settings/data"
          element={
            <RequireAuth>
              <DataSettings />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
