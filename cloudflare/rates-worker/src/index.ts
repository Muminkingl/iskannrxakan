interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ALLOWED_ORIGIN?: string;
}

const CACHE_SECONDS = 30;
const CACHE_KEY = 'https://iskan-nrxakan-rates.internal/rates';
const RATE_COLUMNS = [
  'id',
  'base_currency_code',
  'base_currency_name',
  'unit_label',
  'base_flag_emoji',
  'buy_rate',
  'sell_rate',
  'category',
  'updated_at',
].join(',');

// The DOM lib included by some editor TypeScript configurations omits
// Cloudflare's `caches.default` property, so keep the runtime-specific cast in
// one place while Wrangler still supplies the correct Worker implementation.
const edgeCache = (caches as unknown as { default: Cache }).default;

function corsHeaders(origin: string): Headers {
  return new Headers({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=120`,
    Vary: 'Origin',
  });
}

function jsonResponse(body: unknown, status: number, origin: string): Response {
  const headers = corsHeaders(origin);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN?.trim() || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === '/health') {
      return jsonResponse({ ok: true }, 200, origin);
    }

    if (url.pathname !== '/' && url.pathname !== '/rates') {
      return jsonResponse({ error: 'Not found' }, 404, origin);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    const cacheKey = new Request(CACHE_KEY, { method: 'GET' });
    const cached = await edgeCache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('Access-Control-Allow-Origin', origin);
      return new Response(request.method === 'HEAD' ? null : cached.body, {
        status: cached.status,
        headers,
      });
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ error: 'Worker is not configured' }, 500, origin);
    }

    const upstreamUrl = new URL(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rates`);
    upstreamUrl.searchParams.set('select', RATE_COLUMNS);
    upstreamUrl.searchParams.set('order', 'base_currency_code.asc');

    try {
      const upstream = await fetch(upstreamUrl, {
        headers: {
          Accept: 'application/json',
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      });

      if (!upstream.ok) {
        return jsonResponse({ error: 'Rates provider unavailable' }, 502, origin);
      }

      const rows = await upstream.json();
      const response = jsonResponse(
        { version: new Date().toISOString(), generatedAt: new Date().toISOString(), rates: rows },
        200,
        origin,
      );

      // Store the response only after a successful provider read. Every user
      // at this edge location then receives the same small cached snapshot.
      ctx.waitUntil(edgeCache.put(cacheKey, response.clone()));
      return request.method === 'HEAD'
        ? new Response(null, { status: response.status, headers: response.headers })
        : response;
    } catch {
      return jsonResponse({ error: 'Rates provider unavailable' }, 502, origin);
    }
  },
};
