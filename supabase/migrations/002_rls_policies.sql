-- Enable Row Level Security on all tables
alter table public.user_settings enable row level security;
alter table public.promotions enable row level security;
alter table public.odds_cache enable row level security;
alter table public.opportunities enable row level security;
alter table public.bets enable row level security;

-- =====================
-- user_settings policies
-- =====================
create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- promotions policies
-- =====================
create policy "Users can view own promotions"
  on public.promotions for select
  using (auth.uid() = user_id);

create policy "Users can insert own promotions"
  on public.promotions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own promotions"
  on public.promotions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own promotions"
  on public.promotions for delete
  using (auth.uid() = user_id);

-- =====================
-- odds_cache policies
-- =====================
create policy "Users can view own odds cache"
  on public.odds_cache for select
  using (auth.uid() = user_id);

create policy "Users can insert own odds cache"
  on public.odds_cache for insert
  with check (auth.uid() = user_id);

create policy "Users can update own odds cache"
  on public.odds_cache for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own odds cache"
  on public.odds_cache for delete
  using (auth.uid() = user_id);

-- =====================
-- opportunities policies
-- =====================
create policy "Users can view own opportunities"
  on public.opportunities for select
  using (auth.uid() = user_id);

create policy "Users can insert own opportunities"
  on public.opportunities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own opportunities"
  on public.opportunities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own opportunities"
  on public.opportunities for delete
  using (auth.uid() = user_id);

-- =====================
-- bets policies
-- =====================
create policy "Users can view own bets"
  on public.bets for select
  using (auth.uid() = user_id);

create policy "Users can insert own bets"
  on public.bets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bets"
  on public.bets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own bets"
  on public.bets for delete
  using (auth.uid() = user_id);
