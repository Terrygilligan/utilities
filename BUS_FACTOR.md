# Utility Hub — Emergency Onboarding ("bus factor")

If you're reading this because the usual maintainer is unavailable and something needs fixing or redeploying **now**, this page is everything you need.

## What it is / where it lives

- **App:** "Utility Hub" — a static PWA of browser tools. **There is no server and no database**; the entire app is files built into `dist/` and served from Firebase Hosting (a CDN).
- **Code:** `github.com/Terrygilligan/utilities` (private). Canonical local checkout: `C:\utilities\utilities`.
- **Access needed:** (1) the GitHub account for the repo, (2) the Google account that owns the Firebase project. Both belong to the owner — credentials are **not** in this repo by design. If you can't reach either account, recovery goes through GitHub/Google account recovery first.

## Rebuild from scratch (local)

Prerequisites: Windows machine with Node.js (`C:\Program Files\nodejs`), Git, and the repo cloned.

```powershell
cd C:\utilities\utilities
npm install --legacy-peer-deps   # the flag is REQUIRED (peer-dep quirk)
npm run build                    # must pass — this is the health check
npm run preview                  # optional: verify locally on :4173
```

If `npm install` fails with an `ERESOLVE`/peer error → you forgot `--legacy-peer-deps`. If the build fails, read the error — the project builds clean as of the last handover (see `HANDOVER.md`), so a failure is almost certainly a local/env issue.

## Firebase Hosting

- The site is hosted on **Firebase Hosting**, project **`farmfresh-5e95e`** (linked via `.firebaserc`), owned by the owner's Google account. Live at `https://online-utilities.com` (also `farmfresh-5e95e.web.app`).
- Console: `https://console.firebase.google.com` → project → **Hosting** shows the live URL, release history, and rollback button.
- Deploy: `firebase deploy --only hosting` (config in `firebase.json`: serves `dist/` with an SPA rewrite — do not remove it).
- If tooling isn't installed: `npm install -g firebase-tools`, then `firebase login`.
- **Recovery:** Hosting keeps previous releases — in the console, Hosting → release history → **Rollback** restores the last good version in seconds. For a lost machine, re-clone + the rebuild steps above + `firebase deploy` fully restores the site; nothing else is needed.

## How updates reach users

`registerType: 'autoUpdate'` — the service worker auto-updates; after a deploy, users pick up the new version on their next visit (worst case: one refresh later). No app store, no manual user action.

## Common emergencies

- **Site down:** check Hosting status in the Firebase console first, then Firebase status page. A static PWA rarely "crashes" — it's almost always hosting/DNS.
- **Deployed a broken version:** console → Hosting → rollback (see above).
- **A tool page 404s on refresh:** the SPA rewrite in `firebase.json` was removed or the site isn't using it — restore that file and redeploy.
- **"Changes not showing" after deploy:** service worker cache — hard refresh / clear site data; verify `sw.js` serves `no-cache`.

## Golden rules

- Never commit credentials, `.env`, or account details anywhere in this repo.
- `npm run build` is the gate — never deploy from a tree that doesn't build.
