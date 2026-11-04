# GSK Play v2 redesign progress

Working branch: `redesign/gsk-product-experience-v2`
Draft PR: https://github.com/viratvishaligeek/gsk-app-vue/pull/3

## Completed implementation

### Product shell and discovery
- [x] Dedicated authenticated Games discovery screen with search and All / Open / Closed filters.
- [x] Game counts, schedule/result summaries and contextual Play / View results actions.
- [x] Games added to drawer and five-destination bottom navigation.
- [x] Dashboard market preview changed from vertically stacked full market cards to a horizontal swipeable rail.
- [x] Today's result labels use the API server date and timezone.
- [x] Explicit previous/next banner controls added; Bootstrap carousel swipe, indicators, wrapping, auto-rotation and reduced-motion support retained.

### Gameplay
- [x] Replaced the old Jodi / Harup / Crossing tab panel with a step-based Game Studio.
- [x] New play-mode selector, amount selection, number/digit grids, crossing combination preview, review summary and persistent confirmation dock.
- [x] Kept the existing gameplay script intact: mode selection, selection state, calculation rules, min/max settings validation, confirmation dialog, API endpoint and payload, balance synchronization and success/error handling.

### Wallet and payments
- [x] Add Money UI now presents a guided amount → method → confirmation journey, security context and improved payment choice hierarchy.
- [x] Withdraw UI now presents a destination → amount → request journey, clearer payout destination selection and improved request history presentation.
- [x] Wallet overview has direct Add Money / Withdraw / History actions and a clearer transaction destination.
- [x] The complete `<script setup>` block in `src/views/wallet/Add.vue` was preserved byte-for-byte during the UI update. Gateway order creation, UPIGateway verification, manual UPI, UTR, screenshot validation/upload, pending payments, resume, polling, app lifecycle and wallet refresh logic were not rewritten.
- [x] The complete existing `<script setup>` blocks in Withdraw.vue and wallet View.vue were preserved during their UI updates.

### Other account screens
- [x] Profile: direct navigation between personal details and password/security sections; responsive two-column desktop layout.
- [x] Play history: shortcuts to result charts and Games, stronger date-ledger hierarchy.
- [x] Monthly charts: shortcuts to history and Games; improved horizontal market strip and sticky date column on narrow screens.
- [x] Notifications: direct wallet/history destinations and grouped inbox presentation; existing push permission toggle and update flow retained.
- [x] Referrals: clearer Share → Friend joins → Earn journey; copy/share/apply-code logic preserved.
- [x] Live support: FAQ-first workspace and improved full-height conversation layout; real-time messaging, media upload and voice recording script preserved.
- [x] Authentication screens (Login, SignUp, ForgotPassword) reviewed; existing separate branded authentication architecture and API/form logic retained.
- [x] Existing dynamic CMS page remains route-backed and available.

## Validation status
- [x] GitHub Actions unit tests passed on the earlier gameplay commit.
- [x] Static lint passed on the earlier gameplay commit.
- [x] Production Vite build passed on the earlier gameplay commit.
- [x] Capacitor Android sync passed on the earlier gameplay commit.
- [ ] Re-run / confirm validation on the latest complete UI commit (new commits triggered additional Actions runs).
- [ ] Android debug APK build and artifact upload for the latest head.
- [ ] Test Games discovery, filters and navigation on physical Android devices.
- [ ] Test each gameplay mode end-to-end with the live API and wallet.
- [ ] Verify gateway and manual UPI end-to-end, including Android app resume/back behavior.
- [ ] Verify withdrawals, payment history and wallet synchronization.
- [ ] Verify carousel touch, previous/next, indicators and auto-slide on Android.
- [ ] Capture genuine before/after screenshots at supported device widths.

## Guardrails
- No API services, Axios configuration, Pinia stores, authentication guards, push/presence services or Android native configuration were changed in this increment.
- Wallet Add Money business logic was retained; only its template and scoped presentation were changed.
- Do not merge to `main` until latest CI, real-device workflows and visual review are complete.
