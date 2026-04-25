/**
 * 簡易匯率折算。離線靜態值（更新頻率：低），用於 Asset 走勢圖把不同幣別
 * 折算成 base currency 做合計。實際成交價請以即時報價為準。
 *
 * 之後若接 ECB / Yahoo X=X 即時匯率 API，把這支抽成 fetcher 即可。
 */

/** 1 單位 from 換成多少 to */
const RATE_TABLE: Record<string, number> = {
  // base = USD
  USD_USD: 1,
  TWD_USD: 1 / 32.5,
  HKD_USD: 1 / 7.8,
  JPY_USD: 1 / 155,
  EUR_USD: 1.08,
  CNY_USD: 1 / 7.2,
  GBP_USD: 1.27,

  // base = TWD
  USD_TWD: 32.5,
  TWD_TWD: 1,
  HKD_TWD: 32.5 / 7.8,
  JPY_TWD: 32.5 / 155,
  EUR_TWD: 1.08 * 32.5,
  CNY_TWD: 32.5 / 7.2,
  GBP_TWD: 1.27 * 32.5,
};

export function convert(amount: number, from: string, to: string): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  const direct = RATE_TABLE[`${from}_${to}`];
  if (direct != null) return amount * direct;
  // 無對應對：經 USD 中轉
  const toUsd = RATE_TABLE[`${from}_USD`];
  const fromUsd = RATE_TABLE[`USD_${to}`];
  if (toUsd != null && fromUsd != null) return amount * toUsd * fromUsd;
  return amount; // 找不到 → 不換算（避免靜默變 0）
}

export function isSupported(currency: string): boolean {
  return RATE_TABLE[`${currency}_USD`] != null;
}

export const SUPPORTED_BASE_CURRENCIES = ['TWD', 'USD'] as const;
export type BaseCurrency = (typeof SUPPORTED_BASE_CURRENCIES)[number];
