// Cloudflare Pages Function -> /api/search?q=<title>
// Title autocomplete with poster art for films AND TV shows. Uses TMDB when a
// TMDB_API_KEY env var is set (multi-search across movies + TV); otherwise falls
// back to Apple's keyless iTunes Search API (movies only), so suggestions work
// with zero configuration. Returns: { results: [ { id, type, title, year, genre, poster } ], source }

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' },
  });

// TMDB genre ids -> names (movie + TV lists combined; stable).
const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics',
};

async function fromTMDB(q, key) {
  const u = `https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;
  const r = await fetch(u);
  if (!r.ok) throw new Error('tmdb ' + r.status);
  const d = await r.json();
  return (d.results || [])
    .filter(m => m.media_type === 'movie' || m.media_type === 'tv')
    .slice(0, 10)
    .map(m => ({
      id: 'tmdb' + m.media_type + m.id,
      tmdbId: m.id,
      type: m.media_type === 'tv' ? 'tv' : 'movie',
      title: m.title || m.name || m.original_title || m.original_name || '',
      year: ((m.release_date || m.first_air_date) || '').slice(0, 4),
      genre: TMDB_GENRES[(m.genre_ids || [])[0]] || '',
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : '',
    }));
}

async function fromITunes(q) {
  const u = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&entity=movie&country=US&limit=8`;
  const r = await fetch(u);
  if (!r.ok) throw new Error('itunes ' + r.status);
  const d = await r.json();
  return (d.results || []).map(m => ({
    id: 'itunes' + m.trackId,
    tmdbId: 0,
    type: 'movie',
    title: m.trackName || '',
    year: (m.releaseDate || '').slice(0, 4),
    genre: m.primaryGenreName || '',
    poster: (m.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
  }));
}

export async function onRequestGet({ request, env }) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ results: [], source: 'idle' });
  let err = '';
  if (env.TMDB_API_KEY) {
    try { return json({ results: await fromTMDB(q, env.TMDB_API_KEY), source: 'tmdb' }); }
    catch (e) { err = 'tmdb: ' + e.message; }
  }
  try { return json({ results: await fromITunes(q), source: 'itunes' }); }
  catch (e) { err = (err ? err + '; ' : '') + 'itunes: ' + e.message; }
  return json({ results: [], source: 'none', error: err });
}
