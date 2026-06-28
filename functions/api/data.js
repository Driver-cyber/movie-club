// Cloudflare Pages Function -> /api/data
// Requires a KV namespace bound as MOVIE_CLUB (Settings -> Functions -> KV bindings).
const KEY = 'movieclub:data';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function onRequestGet({ env }) {
  if (!env.MOVIE_CLUB) return json({ movies: [], error: 'KV not bound' }, 200);
  const val = await env.MOVIE_CLUB.get(KEY);
  return json(val ? JSON.parse(val) : { movies: [] });
}

export async function onRequestPut({ request, env }) {
  if (!env.MOVIE_CLUB) return json({ error: 'KV not bound' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  if (!body || !Array.isArray(body.movies)) return json({ error: 'expected { movies: [] }' }, 400);
  await env.MOVIE_CLUB.put(KEY, JSON.stringify(body));
  return json({ ok: true });
}
