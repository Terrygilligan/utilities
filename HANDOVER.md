# Utility Hub — Handover

## What this is

A multi-utility Progressive Web App: a growing collection of everyday browser tools (PDF reader/converter, QR scanner, more to come) behind a shared dashboard. Installable, works offline, zero backend.

- **Repo:** `github.com/Terrygilligan/utilities`
- **Live:** https://farmfresh-5e95e.web.app (first deploy 2026-10-26; also at `farmfresh-5e95e.firebaseapp.com`)
- **Local path:** `C:\utilities\utilities` (the outer `C:\utilities` is just the containing folder)
- **Status (2026-10-26): six tools live** — PdfTools (3-tab: Reader, Image→PDF, PDF→Images), QrScanner (`/qr-scanner`; `/qr` redirects), ExcelTools (`/excel`, 3-tab: preview + drawn PDF, XLSX→CSV, CSV→XLSX), Notebook (`/notebook`: localStorage notes, marked+dompurify preview, .md/.html/.pdf export), VoiceTools (`/voice`: Web Speech API STT + on-device TTS), PasswordGenerator (`/passwords`: crypto.getRandomValues + rejection sampling, passphrase/password modes, entropy meter). `src/components/ShareButton.tsx` is the universal share action — navigator.share (files via `canShare`, else text) → clipboard fallback for text, download fallback for files; wired into every export toolbar (Notebook .md, all PDF/Excel exports, QR results, transcript, passwords). VoiceTools TTS has Play/Pause/Stop. InstallButton (`src/lib/install.ts` + `src/components/InstallButton.tsx`) captures `beforeinstallprompt` — "Add to Home Screen" link in footer + sidebar; hint text where prompt unsupported (iOS). Live custom domain: online-utilities.com. Theme system: `src/lib/theme.ts` (light/dark/system, `utility-hub.theme` localStorage key, `.dark` class on `<html>`, pre-paint script in index.html, `@custom-variant dark` in index.css); ThemeToggle cycles in mobile header + sidebar footer. All pages carry light defaults + `dark:` variants (applied via `scripts/apply-dark-mode.mjs` codemod — token map lives there for reference). Deployed at https://farmfresh-5e95e.web.app.

## Key architectural decisions

- **SPA + PWA, no server.** React Router for navigation; `vite-plugin-pwa` (`generateSW` + `autoUpdate`) precaches the app for offline use and auto-updates users on next visit.
- **Zero-server client processing.** Every tool runs entirely on-device — files and camera data never leave the machine. This is a core promise of the app, not just an implementation detail.
- **Tool pages are code-split.** `PdfTools` and `QrScanner` load via `React.lazy`/`Suspense`, keeping heavy deps (pdfjs ~400 kB, html5-qrcode) out of the ~270 kB initial bundle.
- **Tailwind CSS v4** via the Vite plugin — no config file; dark slate theme (`#0f172a` family) matches the PWA `theme_color`.
- **react-pdf worker pre-wired** in `PdfTools.tsx` (`pdfjs.GlobalWorkerOptions.workerSrc` via `?url` import) — the #1 react-pdf gotcha is already handled.
- **Strict TypeScript** (`tsc -b`, `verbatimModuleSyntax`, unused-checks) and strict component separation — see `.agents/rules.md`.
- **Firebase project: `farmfresh-5e95e`** (reused existing project; linked via `.firebaserc`). Analytics added 2026-10-26 per owner's supplied config — `src/lib/firebase.ts` lazy-loads `@firebase/app` + `@firebase/analytics` in prod only, best-effort (failures swallowed). The **scoped packages replace the `firebase` umbrella** on purpose: it dragged in the vulnerable firestore/gRPC/protobufjs chain we never use (see workflows.md). The web `apiKey` is a public identifier by design and is safe to commit. No other Firebase services in use.

## Structure

```
src/
├── components/
│   ├── Layout.tsx        # shell: mobile top bar + hamburger, desktop sidebar, <Outlet/>
│   └── ToolCard.tsx      # dashboard card → links to a tool
├── pages/
│   ├── Home.tsx          # dashboard grid (2 live cards + "coming soon" tile)
│   ├── PdfTools.tsx      # placeholder: pdfjs worker wired, file picker stub
│   └── QrScanner.tsx     # placeholder: camera preview area, disabled start button
├── App.tsx               # BrowserRouter, lazy routes wrapped in Layout
├── main.tsx / index.css / vite-env.d.ts
```

Config: `vite.config.ts` (react + tailwind + VitePWA, manifest name "Utility Hub" / short "Utilities" / theme `#0f172a` / `display: standalone`), `firebase.json` (hosting: `dist`, SPA rewrite, no-cache SW headers), `public/icon.svg` (manifest icon, any + maskable).

## Verified

`npm run build` passes clean: typecheck, code-split chunks, `sw.js` + `manifest.webmanifest` generated (8 precache entries). Dependencies installed 2026-10-26 with `--legacy-peer-deps` (vite-plugin-pwa peer range vs Vite 7).

## Roadmap

1. **PdfTools**: ~~viewer + page→PNG export~~, ~~images→PDF (pdf-lib)~~, ~~PDF→all-pages PNG/ZIP (jszip)~~ — all done, in `src/pages/pdf/` (tab shell is `PdfTools.tsx`; shared worker/dropzone/buttons in `src/pages/pdf/shared.tsx`; pdf-lib & jszip are dynamically imported inside their handlers). Remaining: password-protected PDF support (react-pdf `onPassword`), image reorder UI.
2. **QrScanner**: ~~wire `Html5Qrcode`~~ done — rear-camera start/stop, gallery image scan, copy/open-link results. Remaining: scan history, Wi-Fi/URI payload formatting.
3. **Firebase**: ~~first deploy~~ done — live at https://farmfresh-5e95e.web.app. Deploys work from the agent shell via the `~/.local/bin/firebase` shim (cached token).
4. Add tools via new `src/pages/<Tool>.tsx` + nav item in `Layout.tsx` + `ToolCard` on `Home.tsx` — the pattern is deliberately mechanical. Multi-part tools get a tab shell + `src/pages/<tool>/` subfolder (see `pdf/` and `excel/`); shared UI lives in `src/components/` (`FilePicker`, `ui.tsx`) and `src/lib/download.ts` — heavy libs (`xlsx`, `pdf-lib`, `jszip`) load via `import()` inside handlers.
5. Polish: install prompt UX, `devOptions` if SW-in-dev is ever needed. App icons now use the real TOG artwork — `scripts/tog-source.png` is the master; regenerate all sizes with `powershell -File scripts\make-icons.ps1` (it crops the dark icon region and clips rounded corners automatically).
