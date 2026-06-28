// Cloudflare Pages Function -> /api/data
// Zero-setup cross-device sync via jsonblob.com (no account, no dashboard, no
// KV binding). Each couple gets a shared "box" id that lives on their devices
// (localStorage) and is passed as ?box=<id>. The first device creates a box
// (POST) and shares the id/invite link; the second device adopts it.
// Low-security by design (anyone with the id can read/write) — fine for a
// private two-person movie-ratings list.
const BLOB_API = 'https://jsonblob.com/api/jsonBlob';
const H = { Accept: 'application/json', 'Content-Type': 'application/json' };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

const validShape = b => b && Array.isArray(b.movies);
const boxId = request => (new URL(request.url).searchParams.get('box') || '').trim();

export async function onRequestGet({ request }) {
  const box = boxId(request);
  if (!box) return json({ movies: [], unconfigured: true });
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

export async function onRequestPut({ request }) {
  const box = boxId(request);
  if (!box) return json({ error: 'no box' }, 400);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  if (!validShape(body)) return json({ error: 'expected { movies: [] }' }, 400);
  try {
    const r = await fetch(`${BLOB_API}/${encodeURIComponent(box)}`, { method: 'PUT', headers: H, body: JSON.stringify(body) });
    if (!r.ok) return json({ error: 'store ' + r.status }, 502);
    return json({ ok: true });
  } catch (e) {
    return json({ error: 'put failed' }, 502);
  }
}

// Create a new shared box, seeded with the posted data (or an empty list).
// Returns { ok, box } — the id the devices then store and share.
export async function onRequestPost({ request }) {
  let body;
  try { body = await request.json(); } catch { body = { movies: [] }; }
  if (!validShape(body)) body = { movies: [] };
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
