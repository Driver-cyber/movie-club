# Movie Club 🎬

A two-person movie rating app for Chad & Joelle. Thirteen categories (Plot, Writing, Pacing,
Acting — Performance, Acting — Casting, Cinematography, Special effects, Set design & costumes,
Soundtrack, Soundscape, Satisfying ending, Predictability, Overall enjoyment), plus a genre
tag, notes, and a shared verdict tab. Add a film by typing its title — suggestions, genre, and
poster art autocomplete in. Built mobile-first for iPhone, installable to the home screen,
synced across both phones with no account or dashboard setup.

## Stack
- Static `index.html` (no build step) + service worker + web manifest
- `functions/api/data.js` — Cloudflare Pages Function proxying a free no-login JSON store
  (jsonblob.com). Each couple gets a shared "box" id; GET/PUT/POST `/api/data?box=<id>`
- `functions/api/search.js` — title autocomplete + posters (TMDB if keyed, else keyless iTunes)
- Sync model: app GETs/PUTs `/api/data?box=<id>`; mirrors to `localStorage` for instant + offline

## Ratings
- Ten categories are rated 1–5 stars (tap a lit star again to clear).
- **Predictability** is a slider from *predictable* to *shocking*. It counts toward the
  verdict but at half a normal category's weight — predictable nudges the score down a
  little, shocking nudges it up — so it shapes the average without dominating it.
- A person's average is the weighted mean of their rated categories; the shared verdict is
  the mean of the two people's averages.

## Posters & covers
- Picking a search suggestion attaches its poster automatically.
- For films search can't find, use **Add cover / Change cover** on the rating card (or
  **Upload cover image** in the add-film form) to upload your own. Images are downscaled to a
  small JPEG and stored inline with the data, so they travel with backups and sync.

## Cross-phone sync (no account, no dashboard)
On the **Shared** tab, tap **Turn on cross-phone sync**. The app creates a shared "box" on a
free no-login store and saves its id on this device. Then **Copy invite link** and open it on
the other phone (or use **Enter a code**) — both phones now read/write the same list. Sync is
low-security by design: anyone with the box id can read/write, which is fine for a private
movie list. Every device also keeps a `localStorage` copy and you can Export backups, so data
survives even if the store is unreachable. (jsonblob purges boxes untouched for ~30 days, so
keep using the app or take the occasional Export.)

## Backup & roll-forward
The **Shared** tab has **Export data (.json)** and **Import data**. Export downloads a
self-contained state file (`{ app, schema, exported, data }`). Import accepts that file (or a
raw `{ movies: [] }` blob) and runs it through `normalize()`, which backfills any newly-added
fields — so a backup taken on an older version restores cleanly into a newer one. Bump
`SCHEMA_VERSION` in `index.html` when the shape changes.

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

### 3. Turn on cross-phone sync (in the app — no dashboard needed)
Sync is built into the app and needs no KV binding or account. On the **Shared** tab tap
**Turn on cross-phone sync**, then **Copy invite link** and open it on the other phone. See
[Cross-phone sync](#cross-phone-sync-no-account-no-dashboard) above. Until you turn it on, the
app still works and saves locally on each phone.

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
