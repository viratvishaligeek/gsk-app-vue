# GSK Play — complete product redesign v3

Base: `main` at `51a24cb7bc871f4c4f15d7abb8bd376101ddd0ff`
Working branch: `redesign/gsk-complete-product-v3`
Draft PR: https://github.com/viratvishaligeek/gsk-app-vue/pull/4

## Implemented in v3

### Android application shell
- [x] Replaced non-matching scoped selectors with styles for the actual `gsk-app-shell`, `gsk-drawer`, `gsk-topbar`, `gsk-main-content` and `gsk-bottom-navigation` markup.
- [x] Added a midnight navy visual system with violet / electric-blue accents, styled drawer, wallet shortcut, active navigation treatment, safe-area spacing and reduced-motion handling.
- [x] Added dark global surface, form, modal, alert and Bootstrap control tokens.

### Dashboard and Games
- [x] Recomposed the dashboard around a personalized welcome, wallet glance, promotion slider, quick actions, featured result, market rail and service shortcuts.
- [x] Kept the existing Bootstrap Carousel instance, touch support, automatic cycling, indicators, previous/next controls, pause-on-hover and reduced-motion behavior. Physical Android interaction testing remains pending.
- [x] Rebuilt Games discovery around a spotlight market, market counts, search, All / Open / Closed filters and schedule/result cards.
- [x] Spotlight market is excluded from the card grid only when it is actually visible; search and active filters continue to show matching markets.

### Gameplay
- [x] Added a v3 visual pass to the existing step-based Game Studio: midnight selection surfaces, animated number selection, mode states, amount controls, generated combinations, review panel and fixed submit dock.
- [x] No gameplay script or game-rule calculation was changed in v3.

### Wallet and payments
- [x] Restyled Wallet overview with a high-contrast balance panel, transaction totals, credit/debit filters, status chips and pagination.
- [x] Restyled Add Money and Withdraw journeys with dark payment surfaces, selected-method states, clearer amount controls, security context and request/history presentation.
- [x] Add Money, Withdraw and Wallet overview script blocks were not edited in v3. Existing payment methods, UPIGateway, manual UPI, UTR, screenshot upload, verification, polling, withdrawal validation, API payloads and wallet synchronization remain in their original scripts.

### Remaining customer screens
- [x] Profile / Edit Profile: dark personal-details and security sections, responsive navigation and form states.
- [x] Play History: dark date-ledger, daily totals, slip cards and status states.
- [x] Monthly Charts: dark period filters, market strip and responsive result matrix.
- [x] Notifications: dark push preference, app update and notification inbox surfaces.
- [x] Referrals: dark invite code, reward summary, referral steps and people list.
- [x] Live Support: dark FAQ workspace and chat surfaces; real-time messaging, media upload and voice recording script preserved.
- [x] Login, registration and password recovery: consistent dark branded auth surfaces; existing auth/API form logic preserved.
- [x] Dynamic CMS page: dark responsive content container.

## Not complete yet
- [ ] Verify every route and state in the built app.
- [ ] Verify carousel auto-slide, touch/swipe, indicators and controls on a physical Android device.
- [ ] Verify gameplay modes and payment workflows end-to-end against the live API.
- [ ] Review keyboard overlap, safe areas, reduced-motion and overflow at 320 / 360 / 375 / 390 / 414 / 430 px.
- [ ] Capture genuine before/after screenshots.

## Validation
- [x] Unit tests passed on GitHub Actions run #43.
- [x] Static lint passed on GitHub Actions run #43.
- [x] Production Vite build passed on GitHub Actions run #43.
- [x] Capacitor Android sync passed on GitHub Actions run #43.
- [x] Android debug APK build and artifact upload passed on GitHub Actions run #43.
- [ ] Physical-device verification remains pending.
- [ ] Verify native navigation and Android back behavior after the shell styling change.

Build: [GitHub Actions run #43](https://github.com/viratvishaligeek/gsk-app-vue/actions/runs/41918464721)\n\nAPK artifact: `gsk-app-debug-apk` · 7,331,307 bytes · artifact ZIP SHA-256 `8a355aafe1f96881bc9873bb29a461d2645848797db0073fbba8272fd260a528`.\n\n## Guardrails
- v3 is based on current `main`; no changes were pushed to `main`.
- No API services, Axios configuration, Pinia stores, auth guards, payment service code, push services, presence services or Android native configuration were changed in this v3 increment.
- No new payment methods or API endpoints were invented. The current router has no separate payment-method management route.
- Do not merge until CI, device testing, visual review and end-to-end checks are complete.
