## TODO: Phase 2 — Subscription billing + platform Odds API
- **What:** Stripe subscription, platform Odds API key, Vercel cron auto-refresh
- **Why:** Monetization — charge users, pay The Odds API, keep margin
- **Effort:** L | **Priority:** P2
- **Depends on:** v1 shipped and user base established
- **How to start:** getOddsApiKey() in lib/odds/getKey.ts already abstracts the key source

## TODO: CLV display — badge on settled bets
- **What:** '+CLV' / '-CLV' badge on BetTable; "You beat the close X% of bets" stat on dashboard
- **Why:** Gold standard metric — if you consistently beat the closing line, you have genuine edge
- **Effort:** M | **Priority:** P1
- **Depends on:** bets.fair_probability column (added in migration 003) + 10+ settled bets
- **How to start:** BetTable.tsx → add CLV column using clv = loggedOdds - (1/fair_probability); positive = beat close

## TODO: Closing probability auto-fill
- **What:** At game start, snapshot closing fair probability for all pending bets
- **Why:** Removes need for manual entry; automation makes CLV tracking seamless
- **Effort:** M | **Priority:** P2
- **Depends on:** Phase 2 cron (Vercel scheduled functions)

## TODO: EV analytics by sport and bookmaker
- **What:** 'DraftKings NFL: avg +2.3% EV this month' — table/heatmap of historical edge
- **Why:** Helps users focus promos on softest books for their target sports
- **Effort:** M | **Priority:** P2
- **Depends on:** 20+ settled +EV bets with opportunity linked
- **How to start:** /analytics page; query bets JOIN opportunities GROUP BY sport_key, leg1_bookmaker

## TODO: Promo conversion rate tracker by sportsbook
- **What:** Show historical free bet conversion % per book (e.g., "DK: avg 71%")
- **Why:** Helps users know which books to prioritize for free bet promos
- **Effort:** M | **Priority:** P2
- **Depends on:** 5-10 settled bets of data to be meaningful

## TODO: Surface why a promo produced 0 opportunities
- **What:** Add per-promo filter diagnostics so the UI can tell users why their promo isn't matching (sport mismatch, no active books, no current events)
- **Why:** Without this, users assume the tool is broken rather than their filter settings
- **Effort:** M | **Priority:** P2
- **How to start:** lib/calculator/index.ts → accumulate filter reasons; change return type to `{ results, diagnostics }`

## TODO: Harden promo API — explicit field allowlist
- **What:** Replace `...body` spread in POST/PATCH promo routes with a destructured allowlist
- **Why:** Defense-in-depth; prevents future internal fields from being reachable via API
- **Effort:** S | **Priority:** P3
- **How to start:** app/api/promos/route.ts and app/api/promos/[id]/route.ts

## TODO: Welcome email on confirmation
- **What:** Trigger a transactional welcome email the moment a user confirms their email
- **Why:** Re-engage users who confirm hours later; guide them to their first arb opportunity
- **Effort:** S | **Priority:** P1
- **Depends on:** Resend SMTP (custom verification email PR)
- **How to start:** Supabase Auth Hook → `send_email` event → call Resend API with welcome template

## TODO: Resend bounce/complaint webhook
- **What:** `POST /api/webhooks/resend` endpoint that receives bounce and spam complaint events from Resend
- **Why:** Protect sender reputation; clean the list before bounces get ArbDash blocklisted
- **Effort:** S | **Priority:** P2
- **Depends on:** Resend SMTP (custom verification email PR)
- **How to start:** Resend dashboard → Webhooks → add endpoint; handler marks user email as `bounced` in `user_settings`
