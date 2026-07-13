# 🗺 Movie Club — Evolution & Decision Log

> **Note to Claude:** This project is live and iterative. Read this log before suggesting
> changes — it holds the current vibe, what's settled, and what's parked. `CLAUDE.md` holds
> the principles; this file holds the state. When something real is decided, log it here.

---

## 🎯 North Star (Current Goal)

* **Goal:** Chad & Joelle's private movie club — friends welcome. Keep the couple experience
  excellent; grow the small-scale multi-user club gracefully.
* **Vibe:** *Maintenance + additive.* It works and ships daily. New features are welcome when
  they're small, non-destructive, and preserve the tripwires. The next real feature is a
  **club-wide verdict layered alongside the couple verdict** (not replacing it).

---

## 🛠 Active Tech Stack (grounded in the repo)

* **Frontend:** static `index.html`, no build step; PWA (`sw.js`, `manifest.webmanifest`).
* **API:** Cloudflare Pages Functions — `data.js` (sync store), `search.js`, `trailer.js`,
  `recs.js`.
* **Store:** Cloudflare **KV** (`MOVIE_CLUB`, bound in `wrangler.toml`) is primary;
  **jsonblob.com** is the fallback when KV isn't bound.
* **External data:** **TMDB** when `TMDB_API_KEY` is set (posters, search, trailers, recs);
  keyless **iTunes** search as fallback.
* **Deploy:** GitHub `Driver-cyber/movie-club` → Cloudflare Pages, auto-deploy from `main`.

---

## 📝 Change Log (Pivots & Decisions)

* **[2026-07-12] — Club view: see everyone's take without rating first (v35).** Tapping a
  movie on Shared opens a club-view modal — Shared + All verdicts side by side, every rater
  as a tappable meter (drill into their full scorecard, with back), everyone's
  predictability/recommends/notes, plus Trailer and Open & rate. New additive `addedBy`
  field records who logged each title ("added by Alex A." on rows/modal; backfilled empty
  for legacy). TBR/personal cards now show "All x.x · N rated" when members have rated, and
  unrated Shared rows say "not rated yet · tap to peek" instead of looking dead. Fixes the
  "member added Euphoria and nobody could tell" discovery gap.

* **[2026-07-12] — Board grows threads, edits, and reactions (v34).** Posts gain three
  additive fields (`parentId`, `reacts`, `edited` — normalize backfills; legacy posts
  untouched). Tap a post (or 💬) to open its one-level reply thread; authors can edit their
  own posts inline ("· edited" marker; master can still delete anything, but only authors
  edit their own words); emoji reactions (👍 👎 😂 ❤️ 🔥 😱) toggle per person with names on
  long-press titles. Deleting a parent cascades its replies (tombstoned). Also fixed a
  latent bug: the scorecard-notes input binder was grabbing every `textarea.notes` including
  Board composers — now scoped to `[data-person]`.

* **[2026-07-12] — Duplicate records now auto-combine (v32).** Two phones adding/rating the
  same film near-simultaneously created twin records (id-union sync kept both — the Dunkirk
  bug). `dedupeData()` now runs inside `normalize()`: same `tmdbId` (or exact title+type+year
  when untagged) = same movie. Keeper is deterministic (earliest `created`, then lowest id) so
  all devices converge; per-person ratings merge newest-wins so nobody's scores are lost;
  blanks refill from the absorbed copy; Board tags remap; absorbed ids are tombstoned.
  Different years never auto-merge (remake safety). Add-time guards open the existing record
  instead of duplicating (library + watch lists, per-list scoped). Verified against the live
  bug's shape in headless Chromium. Founding docs committed the same day ("Add founding
  docs", verbatim).

* **[2026-07-11] — Founding docs written retroactively.** The app was already live and had
  outgrown its README. This session excavated the real architecture and set direction. Key
  outcomes:
  * Confirmed the app is **already small-scale multi-user** (hub-and-spoke: Chad master view +
    `?viewer=<slug>` friend views), not the two-person app the README describes.
  * **Direction set:** grow into a real (small) club. The **couple verdict stays the identity
    anchor**; a **club-wide verdict will be added alongside it**, never replacing it.
  * Named four inviolable tripwires in `CLAUDE.md`: public-box/private-key asymmetry,
    forward-compatible data (`normalize` + `SCHEMA_VERSION`), graceful degradation, and
    "never flatten the couple verdict."
  * Recorded that the current store is **KV-primary** (README still says jsonblob-first).
  * Created `CLAUDE.md`, `DECISIONS.md`, and `movie-club-tracker.html`.

---

## 💡 Parking Lot (Future Ideas & Open Questions)

* **Club-verdict definition — the design question before the build.** When we add a club-wide
  verdict, *who counts?* Everyone who rated? Only members who've seen it? Members + couple, or
  members separate from the couple anchor? Decide before implementing.
* **In-app member join.** Membership is a source edit today (edit `MEMBERS`, redeploy). A
  self-serve join flow is a maybe — but it collides with the no-accounts, curated-club ethos.
  Deferred deliberately.
* **Box security at club scale.** "Anyone with the link can read/write" is perfect for a
  couple and fine for a trusted circle. Revisit only if the club grows beyond people you'd
  hand a house key to.
* **README reconciliation.** The README describes a two-person, jsonblob-first app. Bring it
  in line with reality (KV-primary, multi-user) when convenient — a doc fix, not a code fix.
* **Half-stars.** README flags this as an easy add (star component + averaging tweak).
* **`guide.html`.** Undocumented in the README — review and note what it's for.
* **Confirm `TMDB_API_KEY` is set in Production** so trailers and recs are live (they no-op
  without it).

---

## 🧱 Build Tracker

`movie-club-tracker.html` is the visual priority board + machine-readable JSON for the
cross-project dashboard. It uses the **walnut/amber** cross-project standard (not the app's
ink/bone palette) so it renders consistently alongside your other project cards. Its initial
priorities reflect the real next work: the club-wide verdict, README reconciliation, and
committing these founding docs. Keep its `updated` date current.

---

## ⚠️ Named Drift (reality vs. the README)

* README says the store is **jsonblob** → reality is **KV-primary**, jsonblob is fallback.
* README describes a **two-person** app → reality is **small-scale multi-user** (hub-and-spoke).
* Neither is a bug — the code moved ahead of the prose. Log kept so a cold session isn't misled.
