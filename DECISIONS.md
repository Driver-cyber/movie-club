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
