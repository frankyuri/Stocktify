// Cloudflare Worker: Yahoo Finance CORS proxy for Stock-Ledgery
// Deploy to Cloudflare Workers (free tier). Frontend sets VITE_YAHOO_PROXY_URL
// to this Worker's URL, e.g. https://stock-ledgery-yahoo-proxy.<account>.workers.dev
//
// 允許的 Origin 透過環境變數 ALLOWED_ORIGINS 控制（逗號分隔，含 protocol）。
// 設定方式（wrangler.toml 已預留 [vars] 區塊）：
//   ALLOWED_ORIGINS = "https://frank.github.io,http://localhost:5173"
// 沒設定則 fallback 為 localhost dev origin（Production 部署請務必設定）。

const YAHOO_ORIGIN = 'https://query1.finance.yahoo.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const ALLOWED_PREFIXES = ['/v8/finance/chart/', '/v1/finance/search'];

const DEFAULT_ALLOWED = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function parseAllowed(env) {
  const raw = env?.ALLOWED_ORIGINS;
  if (!raw || typeof raw !== 'string') return DEFAULT_ALLOWED;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickOrigin(requestOrigin, allowed) {
  if (!requestOrigin) return null;
  if (allowed.includes(requestOrigin)) return requestOrigin;
  // 支援 wildcard subdomain：*.example.com
  for (const a of allowed) {
    if (a.startsWith('*.')) {
      const suffix = a.slice(1); // ".example.com"
      try {
        const u = new URL(requestOrigin);
        if (u.host.endsWith(suffix.slice(1))) return requestOrigin;
      } catch {
        /* invalid origin */
      }
    }
  }
  return null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin ?? '',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const allowed = parseAllowed(env);
    const requestOrigin = request.headers.get('Origin');
    const matchedOrigin = pickOrigin(requestOrigin, allowed);

    if (request.method === 'OPTIONS') {
      // 預檢請求：origin 不在白名單時回 204 但不附 ACAO，瀏覽器會擋
      return new Response(null, {
        status: 204,
        headers: corsHeaders(matchedOrigin),
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders(matchedOrigin),
      });
    }

    if (requestOrigin && !matchedOrigin) {
      return new Response('Origin not allowed', {
        status: 403,
        headers: corsHeaders(null),
      });
    }

    const url = new URL(request.url);
    if (!ALLOWED_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders(matchedOrigin),
      });
    }

    const upstream = new URL(YAHOO_ORIGIN + url.pathname + url.search);
    const upstreamRes = await fetch(upstream.toString(), {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json,text/plain,*/*',
      },
      cf: { cacheTtl: 30, cacheEverything: true },
    });

    const headers = new Headers(upstreamRes.headers);
    for (const [k, v] of Object.entries(corsHeaders(matchedOrigin))) {
      headers.set(k, v);
    }
    headers.delete('set-cookie');

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers,
    });
  },
};
