-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- user_settings
-- =====================
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- Encrypted Odds API key (BYOK phase)
  odds_api_key_encrypted text,
  odds_api_key_iv text,
  odds_api_key_tag text,
  -- Subscription tier: 'free' | 'paid'
  subscription_tier text not null default 'free',
  -- Calculator preferences
  selected_sports text[] not null default array['americanfootball_nfl', 'basketball_nba'],
  default_stake numeric(10, 2) not null default 100,
  min_roi_threshold numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================
-- promotions
-- =====================
create table if not exists public.promotions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sportsbook text not null,
  type text not null check (type in ('free_bet', 'profit_boost', 'no_sweat', 'odds_boost')),
  status text not null default 'available' check (status in ('available', 'pending', 'used', 'expired')),
  amount numeric(10, 2),
  boost_percentage numeric(6, 2),
  max_bet numeric(10, 2),
  market_restriction text,
  sport_restriction text,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promotions_user_id_idx on public.promotions(user_id);
create index if not exists promotions_status_idx on public.promotions(status);

-- =====================
-- odds_cache
-- =====================
create table if not exists public.odds_cache (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  odds_api_event_id text not null,
  sport_key text not null,
  sport_title text,
  commence_time timestamptz not null,
  home_team text not null,
  away_team text not null,
  bookmaker_key text not null,
  market_key text not null,
  outcome_name text not null,
  price numeric(10, 4) not null,
  point numeric(6, 2),
  fetched_at timestamptz not null default now(),
  unique (user_id, odds_api_event_id, bookmaker_key, market_key, outcome_name)
);

create index if not exists odds_cache_user_id_idx on public.odds_cache(user_id);
create index if not exists odds_cache_event_id_idx on public.odds_cache(odds_api_event_id);
create index if not exists odds_cache_commence_time_idx on public.odds_cache(commence_time);

-- =====================
-- opportunities
-- =====================
create table if not exists public.opportunities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  promotion_id uuid references public.promotions(id) on delete set null,
  opportunity_type text not null,
  sport_key text,
  event_name text,
  commence_time timestamptz,
  leg1_bookmaker text not null,
  leg1_outcome text not null,
  leg1_odds numeric(10, 4) not null,
  leg1_stake numeric(10, 2) not null,
  leg2_bookmaker text,
  leg2_outcome text,
  leg2_odds numeric(10, 4),
  leg2_stake numeric(10, 2),
  guaranteed_profit numeric(10, 2),
  expected_value numeric(10, 2),
  roi_percentage numeric(8, 4) not null,
  calc_inputs jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_user_id_idx on public.opportunities(user_id);
create index if not exists opportunities_is_active_idx on public.opportunities(is_active);
create index if not exists opportunities_roi_idx on public.opportunities(roi_percentage desc);

-- =====================
-- bets
-- =====================
create table if not exists public.bets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  promotion_id uuid references public.promotions(id) on delete set null,
  bookmaker text not null,
  event_name text not null,
  outcome text not null,
  odds numeric(10, 4) not null,
  stake numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  profit_loss numeric(10, 2),
  placed_at timestamptz not null default now(),
  settled_at timestamptz
);

create index if not exists bets_user_id_idx on public.bets(user_id);
create index if not exists bets_status_idx on public.bets(status);
create index if not exists bets_placed_at_idx on public.bets(placed_at desc);
