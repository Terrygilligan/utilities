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
