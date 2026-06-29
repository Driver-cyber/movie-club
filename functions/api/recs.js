// Cloudflare Pages Function -> /api/recs
// Movie/TV suggestions from TMDB. Pass ?type=movie&id=<tmdbId> for "more like
// this", or call with no params for "trending this week".
// Returns { results: [ { tmdbId, type, title, year, genre, poster } ] }
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' } });

const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};
const mapItem = m => ({
  tmdbId: m.id,
  type: (m.media_type === 'tv' || (m.name && !m.title)) ? 'tv' : 'movie',
  title: m.title || m.name || '',
  year: ((m.release_date || m.first_air_date) || '').slice(0, 4),
  genre: TMDB_GENRES[(m.genre_ids || [])[0]] || '',
  poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : '',
});

export async function onRequestGet({ request, env }) {
  if (!env.TMDB_API_KEY) return json({ results: [], error: 'no key' });
  const u = new URL(request.url);
  const id = (u.searchParams.get('id') || '').trim();
  const type = u.searchParams.get('type') === 'tv' ? 'tv' : 'movie';
  try {
    const url = id
      ? `https://api.themoviedb.org/3/${type}/${id}/recommendations?api_key=${env.TMDB_API_KEY}&page=1`
      : `https://api.themoviedb.org/3/trending/all/week?api_key=${env.TMDB_API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('tmdb ' + r.status);
    const d = await r.json();
    const results = (d.results || [])
      .filter(m => m.media_type !== 'person')
      .map(mapItem)
      .filter(x => x.title && x.poster)
      .slice(0, 12);
    return json({ results });
  } catch (e) {
    return json({ results: [], error: String(e.message || e) });
  }
}
