# Utility Hub — Workflows

## Install

```powershell
cd C:\utilities\utilities
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required: `vite-plugin-pwa`'s peer range lags Vite 7 (same quirk as VetCarePro). `npm ci --legacy-peer-deps` for a clean install from lockfile.

**Never run `npm audit fix --force` here** — it once downgraded `firebase` to v9 while leaving vulnerabilities behind. The project deliberately uses scoped `@firebase/app` + `@firebase/analytics` instead of the `firebase` umbrella package: the umbrella pulls in `@firebase/firestore` → `@grpc/proto-loader` → `protobufjs`, which was the entire source of audit findings. With only the two packages we import installed, `npm audit` reports 0 vulnerabilities. Do not reinstall `firebase` unless a service beyond Analytics is added (and record it in `HANDOVER.md`).

## Dev server

```powershell
npm run dev    # → http://localhost:5173
```

## Build & typecheck

```powershell
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve dist/ locally → http://localhost:4173
```

`npm run build` is the verification gate — it runs the strict TypeScript build and the PWA/service-worker generation together. Expect a `PWA` summary block listing precache entries plus `dist/sw.js` + `dist/workbox-*.js`.

## PWA notes

- The service worker is **not** registered in `npm run dev` — test offline/install behaviour with `npm run build && npm run preview`.
- After deploy, `registerType: 'autoUpdate'` means users get new versions automatically on next load; keep `sw.js` served with `Cache-Control: no-cache` (already configured in `firebase.json`).
- Client-side routes (`/pdf`, `/qr`) need the SPA rewrite in `firebase.json` — without it, refreshing a tool page on the hosted site 404s.

## Firebase deployment

`firebase.json` (`public: dist`, SPA rewrite, no-cache headers for `sw.js`/`manifest.webmanifest`) and `.firebaserc` (default project: **`farmfresh-5e95e`**) are already configured. First deploy just needs auth:

```powershell
npm install -g firebase-tools   # once per machine
firebase login
firebase deploy --only hosting  # auto-provisions <project>.web.app on first run
```

## Agent shell note (Windows + WSL)

The agent shell is WSL but Node/npm are Windows-side; `npm` shims fail under bash. Invoke the JS entry directly:

```bash
cd /mnt/c/utilities/utilities
"/mnt/c/Program Files/nodejs/node.exe" 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' <args>
```

`node.exe` requires Windows-style script paths (WSL `/mnt/c/...` is misread as `C:\mnt\c\...`). Installs over `/mnt/c` are slow (~12 min) — run npm from Windows PowerShell when possible.
