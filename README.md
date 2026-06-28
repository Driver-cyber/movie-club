# Movie Club 🎬

A two-person movie rating app for Chad & Joelle. Eleven categories (Plot, Writing, Pacing,
Acting — Performance, Acting — Casting, Cinematography, Soundtrack, Soundscape, Satisfying
ending, Predictability, Overall enjoyment), plus notes, plus a shared verdict tab. Add a
film by typing its title — suggestions and poster art autocomplete in. Built mobile-first
for iPhone, installable to the home screen, synced across both phones via Cloudflare KV.

## Stack
- Static `index.html` (no build step) + service worker + web manifest
- `functions/api/data.js` — Cloudflare Pages Function, reads/writes one JSON blob in KV
- `functions/api/search.js` — title autocomplete + posters (TMDB if keyed, else keyless iTunes)
- Sync model: app GETs/PUTs `/api/data`; mirrors to `localStorage` for instant + offline

## Ratings
- Ten categories are rated 1–5 stars (tap a lit star again to clear).
- **Predictability** is a slider from *predictable* to *shocking*. It counts toward the
  verdict but at half a normal category's weight — predictable nudges the score down a
  little, shocking nudges it up — so it shapes the average without dominating it.
- A person's average is the weighted mean of their rated categories; the shared verdict is
  the mean of the two people's averages.

---

## Deploy

### 1. Push to GitHub
```bash
cd movie-club
git init
git add .
git commit -m "Movie Club"
git branch -M main
git remote add origin git@github.com:Driver-cyber/movie-club.git   # create the empty repo first
git push -u origin main
```

### 2. Create the Cloudflare Pages project
Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
Build settings:
- Framework preset: **None**
- Build command: **(leave empty)**
- Build output directory: **`/`**

Deploy. You'll get a `*.pages.dev` URL.

### 3. Add the KV store (this is what makes it sync)
1. **Workers & Pages → KV → Create namespace**, name it `movie-club`.
2. Pages project → **Settings → Functions → KV namespace bindings → Add**:
   - Variable name: **`MOVIE_CLUB`**  ← must match exactly
   - Namespace: `movie-club`
   - Add it for **Production** (and Preview if you want).
3. **Re-deploy** (Deployments → Retry/redeploy) so the binding takes effect.

Until KV is bound, the app still runs but only saves locally on each phone. Once bound,
both phones share one list.

### 3b. (Optional) Better posters & search with TMDB
Autocomplete works out of the box using Apple's keyless iTunes Search API. For sharper
posters and better matching, add a free [TMDB](https://www.themoviedb.org/settings/api)
API key: Pages project → **Settings → Environment variables → Add**:
- Variable name: **`TMDB_API_KEY`**
- Value: your TMDB v3 API key
- Add it for **Production**, then **re-deploy**.

If the key is missing or a TMDB request fails, search automatically falls back to iTunes.

### 4. (Recommended) Lock it to just you two
The `/api/data` endpoint is open by default. Gate the whole site with **Cloudflare Access** (free):
Zero Trust → **Access → Applications → Add → Self-hosted** → your pages domain →
policy: **Allow** → emails → add Chad's and Joelle's. Now only you two can open it.

### 5. Add to the iPhone home screen
Open the site in **Safari → Share → Add to Home Screen**. Launches full-screen, no browser chrome.

---

## Local dev (optional)
```bash
npm i -g wrangler          # or npx
npx wrangler pages dev .    # uncomment the [[kv_namespaces]] block in wrangler.toml first
```

## Tweaks
- **Categories:** edit the `CATEGORIES` array near the top of the `<script>` in `index.html`.
  Add `type:'slider'` for a predictable↔shocking style scale, and `weight:<n>` to change how
  much a category counts toward the verdict (default `1`; predictability ships at `0.5`).
- **People:** edit `PEOPLE`. (Changing keys means existing saved data won't map — do it before you log films.)
- **Half-stars:** ask Claude; it's a small change to the star component + averaging.
