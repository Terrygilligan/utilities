---
agent: devin-local
session: chemical-headlight
created: 2026-11-02T07:59:47Z
---
# Utilities: Ship PDF Merge/Split + 3 New Tools

Wave 0 of the Games + Tools Expansion Plan (commit and deploy the already-built PDF Merge &amp; Split tab), then build the first 3 Wave-5 tools — JSON↔CSV, Palette-from-image, and Signature maker — each with its own build gate, commit, and hosting deploy, all inside C:\utilities\utilities only.

## Context

- **Repo/dir:** `C:\utilities\utilities` (`/mnt/c/utilities/utilities` in the agent shell). All commands run here — never from `C:\utilities` (outer folder) and never touching Games Hub or VetCarePro.
- **Deploy target:** `firebase deploy --only hosting` → default site of `farmfresh-5e95e` = https://online-utilities.com. Verified `.firebaserc` + `firebase.json` (hosting `public: dist`, SPA rewrite, no-cache SW headers). Deploy via the `~/.local/bin/firebase` shim (cached token — works from WSL).
- **Build gate:** `npm run build` (`tsc -b && vite build` + PWA generation). npm must be invoked through Windows node: `"/mnt/c/Program Files/nodejs/node.exe" "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build` (per `.agents/workflows.md`; installs use `--legacy-peer-deps` if ever needed).
- **Firestore:** never deploy rules from this repo — union `firestore.rules` is canonical in `C:\SaaS-projects\online_games_hub`. No new Firestore writes in this plan (ratings strip covers new tools automatically via the TOOLS catalog).
- **Commits:** agent shell has no git credentials — commit with per-command identity `git -c user.name=Terrygilligan -c user.email=Terrygilligan@users.noreply.github.com commit`. `git push` will hang/fail here; flag to the user to push from Windows PowerShell after each commit (or batch-push at the end).
- **Style rails (`.agents/rules.md`):** no heredocs for file edits; `import type` under `verbatimModuleSyntax`; `noUnusedLocals`; lucide-react icons only; heavy deps behind `import()`; every user-facing string wrapped in `t()` with entries in all 5 dicts (bg/es/fr/de/nl); namespaced keys get English via the `EN` map; `usePersistentState`/`utility-hub.*` keys only when a tool needs persistence.

## Wave 0 — Ship the built Merge & Split tab

Already on disk, uncommitted: `src/pages/pdf/MergeSplit.tsx` (new), `src/pages/PdfTools.tsx` (4th tab wired), `src/utils/i18n.ts` (18 keys × 5 dicts), `HANDOVER.md` (shared-project caution line).

1. **Close the one gap found in review:** `'Invalid page range - use formats like 1-3, 5, 8-10.'` is called at `MergeSplit.tsx:143` but missing from all 5 dicts → add translations (bg/es/fr/de/nl) so it doesn't silently fall back to English.
2. **HANDOVER.md changelog line** for the new Merge & Split tab (the diff currently only has the caution line).
3. `npm run build` → confirm typecheck + PWA output clean.
4. Commit all four files (identity flags above).
5. `firebase deploy --only hosting` from `C:\utilities\utilities`.
6. Report to user: ask them to `git push` from PowerShell.

## Tool 37 — JSON ↔ CSV (`/json-csv`, Documents & Data)

- New `src/pages/JsonCsv.tsx`, two-mode segmented UI (same pattern as MergeSplit's mode toggle):
  - **JSON → CSV:** paste or FilePicker `.json`; parse, accept array-of-objects (or `{rows: [...]}` / single object → 1 row); recursive flatten of nested objects/arrays into dotted keys; union of keys = headers; RFC-4180 quoting + UTF-8 BOM (reuse the proven pattern from ExpenseTracker's CSV export); download `.csv` + Copy.
  - **CSV → JSON:** paste or `.csv` file; tolerant parser (quoted fields, escaped quotes, `\r\n`); first row = headers; optional "trim empty rows"; output pretty JSON in editable textarea → Copy / `.json` download / ShareButton.
  - Both directions keep a size guard (~5 MB) with a clear too-large message; pure JS, zero deps.
- Wiring: `tools.ts` entry (icon `FileJson` or `TableProperties`), lazy import + `<Route path="json-csv">` in `App.tsx`, nav item in `Layout.tsx` Documents & Data after `/excel`.
- i18n ×5 (~25 keys), HANDOVER line, `npm run build`, commit, deploy.

## Tool 38 — Palette from Image (`/palette`, Media & Design)

- New `src/pages/PaletteMaker.tsx`:
  - FilePicker/drag image → `<canvas>` downscale (~120 px) → `getImageData` → median-cut quantization → 6–8 dominant colors (fixed palette-size segmented control 4/6/8).
  - Swatch grid: each swatch shows hex, click-to-copy (clipboard API w/ textarea fallback); secondary line shows RGB/HSL; dominance % bar.
  - Export: "Copy CSS variables" (`--color-1: #…;`) and "Download .txt" (hex list) via `saveBlob`; ShareButton for the swatch image optional — keep scope tight.
  - Canvas sampling never leaves the device; reuses `FilePicker`, `ui.tsx` card/field classes, dark-mode slate styling.
- Wiring: `tools.ts` (icon `Pipette`/`SwatchBook`), lazy route `palette`, nav item in Media & Design after `/colors`.
- i18n ×5 (~20 keys), HANDOVER line, build, commit, deploy.

## Tool 39 — Signature Maker (`/signature`, Media & Design)

- New subfolder `src/pages/signature/` (multi-part pattern like `pdf/`, `excel/`):
  - `SignatureMaker.tsx` — tab shell: **Draw** and **Type**.
  - `DrawPad.tsx` — `<canvas>` with Pointer Events (mouse+touch+pen), quadratic-curve smoothing between points, pen color + width controls, Undo (stroke stack), Clear; hi-DPI (`devicePixelRatio`) scaling.
  - `TypePad.tsx` — text input rendered to canvas in a script style (cursive system fonts / `font-family: cursive` fallback — no webfont dep; pick from a small list incl. `Segoe Script`/`Brush Script`-ish fallbacks), same color/width (size) controls.
  - Export (shared): transparent-background PNG at 2× via `canvas.toBlob` → `saveBlob`; SVG export serializing stored strokes as `<path>` (draw mode; type mode exports PNG only, or text→path via offscreen canvas raster inside the SVG as embedded PNG — decide at impl, prefer PNG-only for type to stay honest).
- Wiring: `tools.ts` (icon `PenLine`/`Signature`), lazy route `signature`, nav item in Media & Design.
- i18n ×5 (~25 keys), HANDOVER line, build, commit, deploy.

## Version bump

- `APP_VERSION` (`src/lib/updates.ts`) → `1.5.0` **once**, with the last tool's commit — one What's New banner covering the batch rather than re-triggering the tour on each of the 4 deploys.

## Order & gates (per tool)

1. Page/component code → `tools.ts` → `App.tsx` route → `Layout.tsx` nav → i18n ×5 → HANDOVER line
2. `npm run build` must pass before commit (per-file gate — rules.md §2)
3. Commit (per-command identity) → `firebase deploy --only hosting` → next tool
4. After tool 39: bump `APP_VERSION` to 1.5.0 in that commit
5. End of session: remind user to `git push` from Windows PowerShell

## Verification

- `npm run build` clean after every file batch (typecheck + PWA precache summary)
- Spot-check built chunk names for the 3 new lazy routes in `dist/`
- Post-deploy smoke test: `https://online-utilities.com/json-csv`, `/palette`, `/signature`, `/pdf` (Merge & Split tab) return the SPA (curl 200) — full visual check via headless Chrome screenshot if needed
- No `firestore:rules` deploy, no other repo touched

## Deferred (stays in plan for later sessions)

- Games Hub Waves 1–4 (2048, reaction, math-drill, simon, breakout, typing, connect-four, daily-seed) — different repo
- Wave 5 remainder: Favicon generator, HEIC→JPEG (`heic2any` dep), Farm estimators (fence/seed-rate/pond)

## Risks / watch-items

- **Wrong-repo deploy:** the #1 historical incident — re-verify `pwd` is `C:\utilities\utilities` before every `firebase deploy`.
- **npm from WSL:** use the Windows `node.exe` + `npm-cli.js` invocation; plain `npm` shim fails under bash.
- **Push:** not possible from the agent shell — commits stay local until the user pushes.
- **Type-mode SVG export** (signature): raster-in-SVG is misleading; will ship PNG-only for typed signatures unless vector tracing is trivial.
- **Median-cut perf:** palette sampling is O(pixels) on a downscaled canvas — bounded and fast; no worker needed.
