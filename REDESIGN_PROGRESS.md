# GSK Play v2 redesign progress

Working branch: `redesign/gsk-product-experience-v2`
Draft PR: https://github.com/viratvishaligeek/gsk-app-vue/pull/3

## Completed in this increment
- [x] Add dedicated authenticated Games discovery route and screen.
- [x] Add market search and All / Open / Closed filters.
- [x] Add market counts, schedule summaries and contextual Play / View results actions.
- [x] Add Games to the drawer and five-destination bottom navigation.
- [x] Replace dashboard's vertically stacked market list with a horizontal market preview.
- [x] Use server time and timezone when deciding whether a result belongs to today.
- [x] Add explicit previous/next controls to the Bootstrap banner carousel.
- [x] Preserve the existing carousel touch support, indicators and reduced-motion-aware auto-slide.
- [x] Verify wallet/Add.vue, Axios, API services, router guard, push/presence services and Capacitor configuration are unchanged in this branch.

## Validation
- [x] Unit tests passed in GitHub Actions.
- [x] Static lint passed in GitHub Actions.
- [x] Production Vite build passed in GitHub Actions.
- [x] Capacitor Android sync passed in GitHub Actions.
- [ ] Android debug APK build and artifact upload (pending at last check).
- [ ] Test Games discovery, filters and navigation on physical Android devices.
- [ ] Test gameplay end-to-end for each existing play mode without changing rules or payloads.
- [ ] Verify wallet, manual UPI, gateway payment, withdrawal and wallet synchronization end-to-end.
- [ ] Verify carousel touch, previous/next, indicators and auto-slide on Android.
- [ ] Capture real before/after screenshots at supported device widths.
- [ ] Continue product-level review and redesign of gameplay, wallet, results, history, profile, notifications, referrals and support screens.

## Guardrails
- Do not modify `src/views/wallet/Add.vue`, API contracts, Axios, Pinia, payment services, push notifications, presence, auth guards or Android native setup without a separately reviewed requirement.
- Do not merge to `main` until the outstanding validation and visual review are complete.
