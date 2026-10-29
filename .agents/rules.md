# Utility Hub — Project Rules

These rules apply to every coding agent working in this repo (Devin, Jules, Cascade, Cursor). Read `HANDOVER.md` before making architectural changes.

## Tech stack (locked)

- **Vite 7** + **React 19** + **TypeScript** (strict mode, `tsc -b` project references)
- **Tailwind CSS v4** via `@tailwindcss/vite` — no `tailwind.config.*`, theme tokens live in CSS. `src/index.css` contains only `@import "tailwindcss";`
- **react-router-dom v7** for client-side routing
- **vite-plugin-pwa** for the service worker + web manifest (Workbox `generateSW`, `registerType: 'autoUpdate'`)
- **lucide-react** for all icons — do not add other icon libraries or inline SVG icon sets
- **react-pdf** (PDF viewing), **html5-qrcode** (camera QR scanning)

## Offline-first, client-side only

- All tool logic runs **on-device**. No uploads, no servers, no accounts. A file the user picks never leaves their machine.
- Do not introduce a backend, API calls, or tracking without an explicit decision recorded in `HANDOVER.md` first. The **one sanctioned exception** is Firebase Analytics (`src/lib/firebase.ts`): prod-only, lazy-loaded, best-effort. Do not add Auth/Firestore/Storage usage on top of it without a recorded decision.
- New heavy libraries (like `react-pdf`'s bundled pdfjs) must be loaded behind `React.lazy` route boundaries so they never reach the initial bundle.
- PWA installability/offline behaviour is a feature, not an afterthought — check `npm run build` PWA output after changing routing or assets.

## Component separation (strict)

- `src/components/` — reusable UI only (e.g. `Layout.tsx`, `ToolCard.tsx`). Components here must not contain tool-specific logic.
- `src/pages/` — one self-contained page per tool (e.g. `PdfTools.tsx`, `QrScanner.tsx`). A page may keep tool-local state and sub-components; if a sub-component becomes reusable across tools, promote it to `src/components/`.
- `src/App.tsx` owns routing only. `src/components/Layout.tsx` owns the shell (sidebar/header/nav). Keep both free of tool logic.
- Prefer self-contained, portable tool implementations — the goal is "write once, deploy many times". Tool pages should not import project-specific glue beyond the router.

## Mobile-first design

- Design at mobile width first, then enhance with `sm:` / `md:` / `lg:` breakpoints.
- The shell pattern: hamburger top bar on `<md`, persistent sidebar on `md+` (see `Layout.tsx`). New pages render inside `<Outlet />` — they must not add their own nav.
- Touch targets ≥ 40 px, generous padding, no hover-only interactions.
- Dark slate theme is the baseline: `bg-slate-950` surface, `slate-800/900` cards, `sky-400` accents. `theme_color: #0f172a` in the manifest matches `bg-slate-950`.

## TypeScript & code style

- `verbatimModuleSyntax` is on — use `import type` for type-only imports.
- `noUnusedLocals`/`noUnusedParameters` are enforced — clean up dead code.
- Compact, idiomatic React: function components, hooks, no classes, no prop-types.
- Don't add comments unless asked; don't add deps without checking they're needed.

## Never commit

- `.env*`, API keys, service-account JSON, personal emails/uids. `.env.example` stays blank if added later.
- `node_modules/`, `dist/`, `dev-dist/` are already gitignored.
# Codebase Refactoring & Localization Rules

## 1. Zero Broad Regex Sweeps
- NEVER perform global or batch multi-file regex replacements across user-facing component files (`src/tools/`, `src/components/`).
- Do NOT wrap class names, SQL queries, timezone identifiers, HTML elements, mathematical operators (`+`, `-`), or dynamic key expressions into translation dictionaries or string replacements.

## 2. Incremental Batching & Build Gates
- When extracting strings or refactoring legacy tools, process files **ONE BY ONE** (or maximum 2 files per iteration).
- **Mandatory Build Verification:** You MUST run `npm run build` (or `npx tsc --noEmit`) immediately after modifying a file. If the build fails, revert that specific file instantly before touching any other part of the codebase.

## 3. Preserved Modules
- Do NOT touch or refactor files inside `src/tools/` marked as active user work (e.g., `SolarAutonomy.tsx`, `RainwaterEstimator.tsx`, `MortarConcreteEstimator.tsx`, `SwaleGradient.tsx`) unless explicitly directed in the prompt.
- Protect all state initialization, hooks, and complex JSX interpolation when extracting hardcoded labels into `t()` calls.

## 4. Context-Aware Localization
- **Domain-scoped key naming:** name keys by functional context, not generic single words — e.g. `solar.status_safe` / `tools.common.status_safe` instead of a bare `safe`; `action.clear_data` / `form.clear_input` instead of `clear`. Namespaced keys get their English text from the `EN` map in `src/utils/i18n.ts`; plain English keys remain their own English text.
- **UI intent over literal meaning:** action buttons → imperative/command forms ("Run" → "Ausführen" / "Стартирай"); status indicators → descriptive states ("Safe" → "Sicher" / "Безопасно"); form hints & labels → natural localized web-UI terminology for each target language. Never do literal 1:1 word translations — translate for how/where the text appears.
- **No string concatenation for dynamic text:** use parameterized keys with variables — `t('search.results_count', { count })` mapping to `"Found {count} items"` — instead of `t('found') + count + t('items')`. `t()` accepts an optional `vars` object and interpolates `{name}` placeholders.

## 5. File Editing Constraints
- NEVER use shell heredocs (`cat << 'EOF'`) for file modifications or documentation updates — they corrupt delimiters and mangle lines (backticks/`$`/`\` get shell-processed).
- Always use targeted single-file write operations, atomic patches, or the standard file writing tools (`edit`/`write`).