---
agent: devin-local
session: legendary-couch
created: 2026-10-28T08:55:57Z
---
# Finish What's New Banner & Tour: i18n + docs + build verify

Components are already written; remaining work is the 5-language dictionary entries, a HANDOVER.md line, and the build gate.

## Status

Implementation is ~80% done (applied before mode switch):

- `src/lib/updates.ts` — `APP_VERSION='1.2.0'`, `utility-hub.last-seen-version` + `utility-hub.show-update-tours` helpers, semver compare
- `src/components/UpdateBanner.tsx`, `FeatureTourModal.tsx` (3 steps + opt-out checkbox), `SettingsMenu.tsx` (footer link → Preferences toggle)
- `Layout.tsx` footer row: Bug | Suggest | Settings; `Home.tsx` mounts `<UpdateBanner />`

## Remaining steps

1. **`src/utils/i18n.ts`** — append these keys to all 5 dicts (bg/es/fr/de/nl):
   `What's new in`, `What's new`, `Take Tour`, `Dismiss`, `Dashboard Customization`, `Global Feedback`, `Private by design`, the three step bodies, `Don't show update announcements in the future`, `Next`, `Back`, `Settings`, `Preferences`, `Show feature update announcements` (skip any that already exist — English fallback is safe).
2. **`HANDOVER.md`** — add dated line: version constant in `lib/updates.ts` (bump `APP_VERSION` per user-facing release), banner/tour/settings wiring.
3. **Verify** — `npm run build` via Windows node; optional headless screenshot of `/` to see the banner (first visit → `last-seen-version` unset → banner shows).
