---
agent: devin-local
session: sordid-patient
created: 2026-11-03T10:57:00Z
---
# A11y round 3 on both hubs: contrast sweep, landmarks & focus, then deploy both sites

Same fixes on both sister apps — Utility Hub (C:\utilities\utilities, pending local commits undeployed) and Games Hub (C:\SaaS-projects\online_games_hub, uncommitted a11y WIP with a missing i18n key): sweep borderline text/button colors to ≥4.5:1, add focus/landmark/ARIA fixes, then build and deploy each repo to its own hosting target.

## Context

Two near-identical React 19 + Tailwind v4 PWAs sharing Firebase project `farmfresh-5e95e`:

- **Utility Hub** — `C:\utilities\utilities` → online-utilities.com (default hosting site). Scan ran against the stale live build; two local a11y commits (`2780812`, `0a127cd`) fix the flagged sky/slate colors, skip link, and search-input ring but were never deployed.
- **Games Hub** — `C:\SaaS-projects\online_games_hub` → games-hub-online.web.app (hosting target `games-hub`). Working tree already has an uncommitted a11y WIP mirroring round 1–2 (skip link, `id="main"`, slate-400→500, sky-600→700 on GameCard/GameRating/ScoreBoard) — **but `games.actions.skipToContent` is missing from all 6 locale JSONs**, so `t()` renders the raw key string. Must add.

Scan mechanics: findings capped at 50/criterion, so the sweep covers all borderline spots, not just flagged ones. The 50× 2.1.1 errors flag focusable elements inside `hidden md:flex` (display:none at scanner's viewport) — correctly removed from tab order; documented artifact, not a code bug (previous HANDOVER already assessed it).

## Repo A — `C:\utilities\utilities`

1. **Contrast sweep** (`text-slate-500` on `bg-slate-50` ≈ 4.48 coin-flip → `slate-600`; `slate-400` text → `slate-500`; `dark:text-slate-500` text → `dark:text-slate-400`):
   - `Layout.tsx`: nav-group toggles + Favorites label `slate-500`→`slate-600`; footer caption/tagline/Games Hub link →`slate-600`; Search + ExternalLink icons `slate-400`→`slate-500`; Brand icon `text-sky-600`→`sky-700` (3.2:1 borderline non-text); skip link `bg-sky-600`→`bg-sky-700` (white text = 4.0:1).
   - `ToolCard.tsx`: icon chip `text-sky-600`→`sky-700`; rating avg `text-amber-600`→`amber-700`; count `text-slate-400`→`slate-500` + `dark:slate-500`→`dark:slate-400`; unfavorited star `slate-300`→`slate-400`.
   - `BugReport.tsx`, `FeatureSuggest.tsx`: triggers/notes `slate-500`→`slate-600`; cooldown `amber-600`→`amber-800`; submit `bg-sky-500`→`bg-sky-700`, `hover:bg-sky-400`→`hover:bg-sky-600` (white-on-sky-500 ≈ 2.9:1).
   - `FeatureTourModal.tsx`: caption `slate-500`→`slate-600`; 2× `bg-sky-500`→`bg-sky-700` buttons; step icon `text-sky-600`→`sky-700`.
   - `ToolRating.tsx`: submit `bg-sky-500`→`bg-sky-700`.
   - `SettingsMenu.tsx`, `BackupPanel.tsx`, `InstallButton.tsx`, `FilePicker.tsx`, `ui.tsx`, `Home.tsx`: `slate-500`/`slate-400` small text →`slate-600`/`slate-500`.
2. **Structural (`Layout.tsx`):** `<main id="main" tabIndex={-1}>`; `aria-label` on sidebar + mobile-drawer `<nav>` (new i18n key ×5 dicts in `src/utils/i18n.ts`); `aria-expanded`/`aria-controls` on nav-group toggles + hamburger; `tabIndex={0}` + `role="region"`/`aria-label` on scrollable nav; Escape closes mobile menu.
3. **`src/index.css`:** unlayered `:focus-visible { outline: 2px solid #0284c7; outline-offset: 2px }` + `.dark` variant `#38bdf8`.
4. **Build + deploy:** `npm run build`, then `~/.local/bin/firebase deploy --only hosting` — from `C:\utilities\utilities` (this repo's hosting config has no target → default site = online-utilities.com; `--only hosting` also avoids touching shared `firestore.rules`).
5. Commit locally (per-command identity), `HANDOVER.md` round-3 entry; user runs `git push`.

## Repo B — `C:\SaaS-projects\online_games_hub`

Builds on the uncommitted WIP (4 modified files: Layout, GameCard, GameRating, ScoreBoard — keep and extend).

1. **Fix missing i18n key:** add `games.actions.skipToContent` to all 6 `src/i18n/locales/*.json` + a nav landmark label key (e.g. `games.nav.navigation`).
2. **Contrast sweep** (same rules as Repo A):
   - `Layout.tsx`: nav-group toggles + Favorites label + "installable" caption `slate-500`→`slate-600`; ExternalLink icon `slate-400`→`slate-500`; Brand icon `sky-600`→`sky-700`; skip link `bg-sky-600`→`bg-sky-700`.
   - `src/components/shared/GlobalFooterBar.tsx` (vendored portable module — change belongs upstream): rating caption `slate-400`→`slate-500`/`dark:500`→`dark:400`; `emerald-500`→`emerald-700` thanks; writeReview link `slate-400`→`slate-600`; coffee `amber-700`→`amber-800`/`dark:amber-200`; install `sky-600`→`sky-800`/`dark:sky-200`; clear-data `slate-400`→`slate-500`/`dark:400`; hint/backup/tagline/privacy `slate-500`→`600`, `slate-400`→`500`/`dark:400`; submit `bg-sky-600`→`bg-sky-700`.
   - `BugReport.tsx`, `FeatureSuggest.tsx`, `SettingsMenu.tsx`: triggers `slate-400`→`slate-600`, notes `slate-500`→`600`, submits `bg-sky-500`→`bg-sky-700`.
   - `GameCard.tsx`: "Play now" `bg-sky-600`→`bg-sky-700` (on the scanned home grid); heart icon `slate-300`→`slate-400`.
   - White-on-sky in-game buttons → `bg-sky-700` (`hover:bg-sky-600`): `GameRating.tsx`, `NicknameGate.tsx` ×2, `lexicon/LexiconGame.tsx`, `lexicon/RoundHUD.tsx`, `mathdrill` ×2, `memory` ×2, `minesweeper` ×2, `sudoku`, `wordguess/Keyboard.tsx`.
   - Leave `NicknameGate` dark-modal `slate-400` text (passes on slate-800/900) and `sky-200` crossword-cell fills.
3. **Structural:** same as Repo A — `main tabIndex={-1}`, nav `aria-label`s, `aria-expanded`/`aria-controls`, scrollable-nav `tabIndex={0}`/`role="region"`, Escape close, global `:focus-visible` outline in `index.css`.
4. **Build + deploy from `C:\SaaS-projects\online_games_hub`:** `npm run build`, then `firebase deploy --only hosting` — resolves to target `games-hub` via this repo's firebase.json/.firebaserc. **Never bare `firebase deploy`** — it would also push this repo's `firestore.rules` and clobber the shared `(default)` DB ruleset used by both apps.
5. Commit locally, `HANDOVER.md` entry; user pushes.

## Verification

- [ ] `npm run build` green in both repos
- [ ] Deploy repo A (`--only hosting`) and repo B (`--only hosting` → games-hub target); confirm correct site each time
- [ ] Headless-Chrome screenshots of both live sites render correctly
- [ ] Keyboard pass on both: Tab reaches sidebar items, visible focus ring, skip link first
- [ ] Re-run compliance engine on both URLs → expect 1.4.3 / 2.4.7 / 2.4.1 cleared

## Risks / notes

- **2.1.1 will likely persist on both sites** — scanner flags elements inside `display:none` breakpoint-hidden containers; correctly out of tab order. Document as manual-review artifact in both HANDOVERs.
- Deploys mutate production — announcing each repo folder before building/deploying per project rules.
- `git push` for both repos must be run by the user in PowerShell (no git creds in agent shell).
- `GlobalFooterBar.tsx` is marked "identical file in every hub project" — changes here should be ported if other copies surface (none found under C:\utilities, C:\SaaS-projects, C:\dictionary_game).
- Games-hub has uncommitted WIP — folded into this commit rather than stashed.
