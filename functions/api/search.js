// Cloudflare Pages Function -> /api/search?q=<title>
// Movie title autocomplete with poster art. Uses TMDB when a TMDB_API_KEY
// env var is set (best matches + posters); otherwise falls back to Apple's
// keyless iTunes Search API, so suggestions work with zero configuration.
// Returns: { results: [ { id, title, year, poster } ] }

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' },
  });

// TMDB movie genre id -> name (stable list).
const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

async function fromTMDB(q, key) {
  const u = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${encodeURIComponent(q)}&include_adult=false&language=en-US&page=1`;
  const r = await fetch(u);
  if (!r.ok) throw new Error('tmdb ' + r.status);
  const d = await r.json();
  return (d.results || []).slice(0, 8).map(m => ({
    id: 'tmdb' + m.id,
    title: m.title || m.original_title || '',
    year: (m.release_date || '').slice(0, 4),
    genre: TMDB_GENRES[(m.genre_ids || [])[0]] || '',
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : '',
  }));
}

async function fromITunes(q) {
  const u = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&entity=movie&limit=8`;
  const r = await fetch(u);
  if (!r.ok) throw new Error('itunes ' + r.status);
  const d = await r.json();
  return (d.results || []).map(m => ({
    id: 'itunes' + m.trackId,
    title: m.trackName || '',
    year: (m.releaseDate || '').slice(0, 4),
    genre: m.primaryGenreName || '',
    poster: (m.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
  }));
}

export async function onRequestGet({ request, env }) {
  const q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (q.length < 2) return json({ results: [] });
  try {
    if (env.TMDB_API_KEY) {
      try { return json({ results: await fromTMDB(q, env.TMDB_API_KEY) }); }
      catch (e) { /* fall through to keyless source */ }
    }
    return json({ results: await fromITunes(q) });
  } catch (e) {
    return json({ results: [] });
  }
}
