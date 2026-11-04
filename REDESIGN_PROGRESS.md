# GSK Play — complete product redesign v3

Base: `main` at `51a24cb7bc871f4c4f15d7abb8bd376101ddd0ff`
Working branch: `redesign/gsk-complete-product-v3`
Draft PR: pending creation

## Implemented in v3

### Android application shell
- Replaced the non-matching scoped selectors with styles for the actual `gsk-app-shell`, `gsk-drawer`, `gsk-topbar`, `gsk-main-content` and `gsk-bottom-navigation` markup.
- Added a midnight navy visual system with violet / electric-blue accents, a styled drawer, balance shortcut, active navigation treatment, safe-area spacing and reduced-motion handling.
- Added dark global surface, form, modal, alert and Bootstrap control tokens.

### Dashboard and Games
- Recomposed the dashboard around a personalized welcome, wallet glance, promotion slider, quick actions, featured result, market rail and service shortcuts.
- Kept the existing Bootstrap Carousel instance, touch support, automatic cycling, indicators, previous/next controls, pause-on-hover and reduced-motion behavior. Physical Android interaction testing is still pending.
- Rebuilt the Games discovery hierarchy with a spotlight market, market counts, search, All / Open / Closed filters and individual schedule/result cards.
- Spotlight market is excluded from the card grid only when it is actually visible; search and active filters continue to show matching markets.

### Wallet
- Restyled Wallet overview with a high-contrast balance panel, transaction totals, credit/debit filters, status chips and pagination.
- Restyled Add Money and Withdraw journeys with dark payment surfaces, selected-method states, clearer amount controls, security context and request/history presentation.
- Add Money, Withdraw and Wallet overview script blocks were not edited in v3. Existing payment methods, UPIGateway, manual UPI, UTR, screenshot upload, verification, polling, withdrawal validation, API payloads and wallet synchronization remain in their original scripts.

## Not complete yet
- Gameplay screen still needs its own v3 visual and interaction pass.
- Login, registration, password recovery, profile, history, charts, notifications, referrals, support and dynamic pages still need a full v3 page-by-page audit and redesign.
- Payment-method management is not a separate route in the current router; do not invent a backend feature or API for it.
- Slider, payments, game entry and navigation need physical-device verification and genuine screenshots.

## Validation
- [ ] Run unit tests, lint and production Vite build against the v3 branch.
- [ ] Run Capacitor sync and Android debug APK build against the v3 branch.
- [ ] Check 320 / 360 / 375 / 390 / 414 / 430 px layouts and safe areas.
- [ ] Verify banner auto-slide, touch/swipe, indicators and controls on an Android device.
- [ ] Verify live gameplay and all payment flows end-to-end.
- [ ] Capture genuine before/after screenshots.

## Guardrails
- v3 is based on the current `main`; no changes were pushed to `main`.
- No API services, Axios configuration, Pinia stores, auth guards, payment service code, push services, presence services or Android native configuration were changed in this v3 increment.
- Do not merge until CI, device testing, visual review and remaining screens are complete.
