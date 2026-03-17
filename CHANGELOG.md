# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2] - 2026-03-17

### Fixed
- Hydration mismatch crash: moved `getCountdown()` (which calls `Date.now()`) from render-time into a `useEffect` so the server always renders null and the client sets the value after hydration
- Empty dashboard caused by PostgREST 400 error: `promotions(name, amount)` select was querying a non-existent `name` column — changed to `promotions(sportsbook, amount)` to match the actual schema
- Latent crash in Leg 2 block: replaced `!` non-null assertions on `leg2_stake` and `leg2_odds` with `?? 0` / `?? 1` fallbacks so null values don't crash `toFixed()`

## [0.1.1] - 2026-03-15

### Added
- Tests for `decimalToAmerican` and `getLegLabels` utilities
- Always-visible bet instructions on opportunity cards (Leg 1 + Leg 2 blocks always rendered, no expand toggle)
- Shared `Opportunity` type, `decimalToAmerican`, and `getLegLabels` utilities
- `+EV` betting opportunity types: `free_bet_ev`, `boost_ev`, `odds_boost_ev`, `line_value`
- Pinnacle fair odds two-pass calculator
- Supabase-inspired color palette with green-hued dark bg and electric blue CTAs
