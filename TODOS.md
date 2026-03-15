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
