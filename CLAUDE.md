# CLAUDE.md — Movie Club Constitution

> A private movie & TV rating app for Chad & Joelle, with a small circle of friends
> layered in. Live and deployed. This file is the *constitution* — what is always
> true. Current state and settled-but-changeable decisions live in `DECISIONS.md`.
> **Read `DECISIONS.md` before starting any task.**

---

## 🧭 Session Startup

* **Read `DECISIONS.md` first.** It holds the current vibe, the parking lot, and any
  in-flight decisions. This constitution holds principles; that file holds state.
* **Check the tracker.** Read `movie-club-tracker.html` for current priorities before
  starting work. Update it at the end of any session that changes priorities.
* **Token-thrift.** Don't read the whole repo. `index.html` is ~1,500 lines — `grep`
  for the anchor you need (`SCHEMA_VERSION`, `PEOPLE`, `MEMBERS`, `COUPLE`, `normalize`,
  `CATEGORIES`) rather than reading it end to end. Ask for specific paths when unsure.
* **Measure twice, cut once.** Before any multi-file or schema-touching edit, propose a
  short plan and wait for an explicit "go." This is a real constraint, not a formality.
* **Verify against the code.** Any claim this doc makes about a function, field, or
  formula is true *as of writing*. Code is authoritative; confirm before relying on it.

---

## 🎯 North Star

Movie Club is **Chad & Joelle's movie club — friends welcome.** It is not a general-purpose
review platform and not a social network. It is a calm, private, mobile-first tool for two
people to rate what they watch together, with a small curated circle of friends able to add
their own ratings, recommendations, and watch lists.

The identity anchor is the **couple**. Friends enrich the club; they don't redefine it.

---

## 🚧 Tripwires (Inviolable)

These look editable but are not. Changing any of them is a conscious architectural decision,
never a casual "simplification."

1. **Public box / private key asymmetry.** The `box` id is *intentionally public* — it rides
   in the invite link so sharing just works; anyone with it can read/write, which is fine for
   a private list. The `TMDB_API_KEY` is *intentionally server-side only* — it lives in the
   Cloudflare environment and is used exclusively by the Pages Functions. **The key never
   reaches the client.** Never call TMDB from the browser. Never assume the box is secret.

2. **Forward-compatible data.** The data contract is `{ movies: [] }`. `normalize()` backfills
   newly-added fields so an old backup restores cleanly into a newer version. Bump
   `SCHEMA_VERSION` when the shape changes, and **test any schema change against legacy-shaped
   data** before shipping. This is the single most load-bearing development rule.

3. **Graceful degradation.** Every dependency has a fallback: KV → jsonblob, TMDB → iTunes,
   network → `localStorage` mirror, plus Export/Import as insurance. No single dependency
   failing should brick the app. New features must preserve this property.

4. **Never flatten the couple verdict.** The headline "Shared verdict" is `COUPLE = ['chad',
   'joelle']` *by design*, even though the whole club rates. A club-wide verdict may be added
   **alongside** it — never in place of it. Do not "helpfully" average everyone into the
   headline number.

---

## 🏗 Architecture (as it actually is)

* **Frontend:** a single static `index.html`, **no build step**. Mobile-first, installable PWA
  (`sw.js` + `manifest.webmanifest`). *Why:* zero-toolchain means every `git push` just deploys.
* **API:** four Cloudflare Pages Functions under `functions/api/`:
  * `data.js` — the sync store. **KV-primary** (`MOVIE_CLUB` namespace bound in `wrangler.toml`);
    jsonblob.com is the **fallback** when no KV binding is present. Keyed by `?box=<id>`.
  * `search.js` — title autocomplete + posters. TMDB when keyed, keyless iTunes otherwise.
  * `trailer.js` — YouTube trailer lookup via TMDB (requires the key).
  * `recs.js` — "more like this" / trending via TMDB (requires the key).
* **Sync model:** app GET/PUTs `/api/data?box=<id>`; mirrors to `localStorage` for instant +
  offline; Export/Import for durable backup.
* **Deploy:** GitHub `Driver-cyber/movie-club` → Cloudflare Pages, auto-deploy from `main`.
  Framework preset None, no build command, output = repo root.

> Note: `recs.js` and `trailer.js` return `{ error: 'no key' }` without `TMDB_API_KEY`. Those
> features only light up when the key is set in the Production environment.

---

## 👥 The Multi-User Model

**Hub-and-spoke.**

* **Hub:** Chad's view is the master — no `?viewer` param.
* **Spokes:** Joelle and each friend get a `?viewer=<slug>` view. `memberLink(slug)` builds it.
* **Roster:** `PEOPLE = { chad, joelle, ...MEMBERS }`. `VIEWERS = { joelle, ...MEMBERS }`
  (everyone with a URL view). `COUPLE = ['chad','joelle']` (the anchor verdict). `MEMBERS`
  are the friends of the club.
* **What members can do:** rate all categories, leave 👍/👎 recommendations, and keep their
  **own separate watch list**, tagged with their name.
* **Membership is a curated source edit.** Adding a friend = add them to the `MEMBERS` object
  and redeploy. There is no in-app "join" flow, and that is currently a feature, not a gap —
  the club is small and hand-picked.

---

## 📐 Domain Non-Negotiables

* **13 rating categories.** Ten are 1–5 stars. **Predictability** is a slider
  (predictable ↔ shocking) counted at **half weight (`0.5`)** so it shapes the score without
  dominating. A person's average is the weighted mean of their rated categories.
* **Changing a person key is a migration, not a config edit.** Person keys map saved ratings;
  renaming or removing one orphans existing data. Treat it as a schema change (normalize +
  `SCHEMA_VERSION`), and do it deliberately.
* **The verdict is layered:** couple verdict (anchor) first; any club verdict is additive.

---

## 🎨 Design Language

* **This app keeps its own palette** — an **ink / bone / gold "screening-room"** look. It does
  **not** use the cross-project walnut/amber standard. (The *tracker* file does, for dashboard
  consistency — that's the one exception.)
* **Type:** Fraunces (serif accents) for a warm, editorial feel.
* **Calm, not gamified.** No streaks, badges, notifications, or re-engagement nudges. This is a
  private tool for people who already want to use it.
* **Mobile-first.** Designed for a phone in the hand, installed to the home screen.

---

## 🤝 How We Work

* **Ordo ab chao.** Bring order where it helps; accept some chaos in the result. Don't let
  perfect be the enemy of good. The messy middle is where the work happens — don't rush past it.
* **Focused elegance, uncompromising utility.** It must work first. Then make the path to that
  result simple, elegant, and a little joyful.
* **Rules are defaults; judgment is primary.** "idk" is an honest, valid stance — when a
  pattern stops making sense, pause and ask rather than improvising alone.
* **Appreciation and humility.** This is a partnership. Push back constructively when a
  decision has an unconsidered tradeoff.

---

## 🔧 Maintenance Protocol

* **Update `DECISIONS.md`** after any real decision or pivot. Ask: "Should I log this?"
* **Update `movie-club-tracker.html`** at the end of sessions that complete or change
  priorities (bump the `updated` date in both the visual header and the JSON block).
* **Red team checkpoint** — argue *against* recent decisions at these triggers: after ~2–3
  completed features, at a phase transition, or at the start of a session after a real time gap.
  Outcomes are **Confirmed / Revised / Scheduled** — no vague "seems fine."
* **Reconcile the README.** It still describes an older two-person, jsonblob-first app. When
  convenient, bring it in line with current reality (KV-primary, multi-user hub-and-spoke).
