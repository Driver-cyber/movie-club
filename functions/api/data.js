// Cloudflare Pages Function -> /api/data
// Cross-device sync store. Prefers Cloudflare KV (durable, private, in your own
// account) when a KV namespace is bound as MOVIE_CLUB. Falls back to the free
// jsonblob.com service when KV isn't bound, so it works with zero setup.
// Data is keyed by a per-couple "box" id passed as ?box=<id>.
const BLOB_API = 'https://jsonblob.com/api/jsonBlob';
const H = { Accept: 'application/json', 'Content-Type': 'application/json' };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const validShape = b => b && Array.isArray(b.movies);
const boxId = request => (new URL(request.url).searchParams.get('box') || '').trim();

export async function onRequestGet({ request, env }) {
  const box = boxId(request);
  if (!box) return json({ movies: [], unconfigured: true });
  if (env.MOVIE_CLUB) {
    try { const v = await env.MOVIE_CLUB.get(box); return json(v ? JSON.parse(v) : { movies: [] }); }
    catch (e) { return json({ movies: [], error: 'kv get' }, 502); }
  }
  try {
    const r = await fetch(`${BLOB_API}/${encodeURIComponent(box)}`, { headers: H });
    if (r.status === 404) return json({ movies: [], error: 'box not found' }, 404);
    if (!r.ok) return json({ movies: [], error: 'store ' + r.status }, 502);
    const data = await r.json();
    return json(validShape(data) ? data : { movies: [] });
  } catch (e) {
    return json({ movies: [], error: 'fetch failed' }, 502);
  }
}

export async function onRequestPut({ request, env }) {
  const box = boxId(request);
  if (!box) return json({ error: 'no box' }, 400);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  if (!validShape(body)) return json({ error: 'expected { movies: [] }' }, 400);
  if (env.MOVIE_CLUB) {
    try { await env.MOVIE_CLUB.put(box, JSON.stringify(body)); return json({ ok: true }); }
    catch (e) { return json({ error: 'kv put' }, 502); }
  }
  try {
    const r = await fetch(`${BLOB_API}/${encodeURIComponent(box)}`, { method: 'PUT', headers: H, body: JSON.stringify(body) });
    if (!r.ok) return json({ error: 'store ' + r.status }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'put failed' }, 502);
  }
}

// Create a new shared store, seeded with the posted data. With KV we mint our
// own id; with jsonblob we use the id it returns.
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { body = { movies: [] }; }
  if (!validShape(body)) body = { movies: [] };
  if (env.MOVIE_CLUB) {
    try {
      const id = (crypto.randomUUID && crypto.randomUUID()) || ('mc' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
      await env.MOVIE_CLUB.put(id, JSON.stringify(body));
      return json({ ok: true, box: id });
    } catch (e) { return json({ error: 'kv create' }, 502); }
  }
  try {
    const r = await fetch(BLOB_API, { method: 'POST', headers: H, body: JSON.stringify(body) });
    if (!r.ok) return json({ error: 'store ' + r.status }, 502);
    const loc = r.headers.get('Location') || r.headers.get('X-jsonblob') || '';
    const id = loc.split('/').filter(Boolean).pop() || '';
    if (!id) return json({ error: 'no id returned' }, 502);
    return json({ ok: true, box: id });
  } catch (e) {
    return json({ error: 'create failed' }, 502);
  }
}
