# TODOS

## Analytics

### CLV display — badge on settled bets

**What:** '+CLV' / '-CLV' badge on BetTable; "You beat the close X% of bets" stat on dashboard.

**Why:** Gold standard metric — if you consistently beat the closing line, you have genuine edge.

**Context:** `bets.fair_probability` column added in migration 003. BetTable.tsx → add CLV column using `clv = loggedOdds - (1/fair_probability)`; positive = beat close. Needs 10+ settled bets to be meaningful.

**Effort:** M
**Priority:** P1
**Depends on:** bets.fair_probability column (migration 003) + 10+ settled bets

---

### EV analytics by sport and bookmaker

**What:** 'DraftKings NFL: avg +2.3% EV this month' — table/heatmap of historical edge.

**Why:** Helps users focus promos on softest books for their target sports.

**Context:** `/analytics` page; query bets JOIN opportunities GROUP BY sport_key, leg1_bookmaker.

**Effort:** M
**Priority:** P2
**Depends on:** 20+ settled +EV bets with opportunity linked

---

### Promo conversion rate tracker by sportsbook

**What:** Show historical free bet conversion % per book (e.g., "DK: avg 71%").

**Why:** Helps users know which books to prioritize for free bet promos.

**Context:** Needs 5–10 settled bets of data to be meaningful.

**Effort:** M
**Priority:** P2
**Depends on:** 5–10 settled bets

---

### Surface why a promo produced 0 opportunities

**What:** Add per-promo filter diagnostics to the opportunity engine output so the UI can tell users why their promo isn't matching (sport mismatch, min odds too high, no active books, no current events for sport).

**Why:** Without this, users have no feedback loop when they set aggressive restrictions. They assume the tool is broken rather than their filter settings.

**Context:** Currently `findOpportunities` silently drops non-matching promos. The fix would require a second return value or a diagnostics map keyed by promo ID. Start in `lib/calculator/index.ts` — accumulate filter reasons in the PROMO PASS loop. Changing return type from `FullOpportunity[]` to `{ results: FullOpportunity[], diagnostics: PromoFilterResult[] }` is the likely approach.

**Effort:** M
**Priority:** P2
**Depends on:** sport_restriction + min_odds (shipped in enhanced-promo-entering)

---

## Infrastructure

### Phase 2 — Subscription billing + platform Odds API

**What:** Stripe subscription, platform Odds API key, Vercel cron auto-refresh.

**Why:** Monetization — charge users, pay The Odds API, keep margin.

**Context:** `getOddsApiKey()` in `lib/odds/getKey.ts` already abstracts the key source.

**Effort:** L
**Priority:** P2
**Depends on:** v1 shipped and user base established

---

### Closing probability auto-fill

**What:** At game start, snapshot closing fair probability for all pending bets.

**Why:** Removes need for manual entry; automation makes CLV tracking seamless.

**Context:** Requires a scheduled function that fires at game start time, fetches current fair odds, and writes to `bets.fair_probability` for all pending bets on that event.

**Effort:** M
**Priority:** P2
**Depends on:** Phase 2 cron (Vercel scheduled functions)

---

## API

### Harden promo API — explicit field allowlist

**What:** Replace `...body` spread in POST/PATCH routes with a destructured allowlist of permitted fields.

**Why:** Defense-in-depth; prevents future internal fields (e.g., status, user_id override attempts) from being reachable via API even if RLS catches most cases.

**Context:** `app/api/promos/route.ts` and `app/api/promos/[id]/route.ts` both use `...body` spread directly into Supabase insert/update. `user_id` and `status` are overridden after the spread (safe), but other internal fields are not protected. Every new promo field would require a code change in 2 route files.

**Effort:** S
**Priority:** P3
**Depends on:** None

---

## Completed
