// Cloudflare Pages Function -> /api/trailer
// Finds a YouTube trailer for a title. Either pass ?type=movie&id=<tmdbId>
// (preferred), or ?q=<title>&type=movie to look it up by name first.
// Returns { key, url } where key is the YouTube video id ('' if none).
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' } });

async function videoKey(type, id, key) {
  const r = await fetch(`https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${key}&language=en-US`);
  if (!r.ok) throw new Error('videos ' + r.status);
  const d = await r.json();
  const yt = (d.results || []).filter(v => v.site === 'YouTube');
  const pick = yt.find(v => v.type === 'Trailer' && v.official)
    || yt.find(v => v.type === 'Trailer')
    || yt.find(v => v.type === 'Teaser')
    || yt[0];
  return pick ? pick.key : '';
}
async function lookupId(q, type, key) {
  const r = await fetch(`https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${encodeURIComponent(q)}&page=1`);
  if (!r.ok) return '';
  const d = await r.json();
  const m = (d.results || [])[0];
  return m ? m.id : '';
}

export async function onRequestGet({ request, env }) {
  if (!env.TMDB_API_KEY) return json({ key: '', error: 'no key' });
  const u = new URL(request.url);
  const type = u.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  let id = (u.searchParams.get('id') || '').trim();
  const q = (u.searchParams.get('q') || '').trim();
  try {
    if (!id && q) id = await lookupId(q, type, env.TMDB_API_KEY);
    if (!id) return json({ key: '', error: 'not found' });
    const key = await videoKey(type, id, env.TMDB_API_KEY);
    return json({ key, url: key ? `https://www.youtube.com/watch?v=${key}` : '' });
  } catch (e) {
    return json({ key: '', error: String(e.message || e) });
  }
}
