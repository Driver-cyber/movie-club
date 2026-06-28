# Movie Club 🎬

A two-person movie rating app for Chad & Joelle. Three categories (Story / Acting / Vibe)
rated out of 5, plus notes, plus a shared verdict tab. Built mobile-first for iPhone,
installable to the home screen, synced across both phones via Cloudflare KV.

## Stack
- Static `index.html` (no build step) + service worker + web manifest
- `functions/api/data.js` — Cloudflare Pages Function, reads/writes one JSON blob in KV
- Sync model: app GETs/PUTs `/api/data`; mirrors to `localStorage` for instant + offline

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
- **People:** edit `PEOPLE`. (Changing keys means existing saved data won't map — do it before you log films.)
- **Half-stars:** ask Claude; it's a small change to the star component + averaging.
