alter table public.promotions
  add column if not exists min_odds numeric(10,4)
    check (min_odds is null or min_odds >= 1.01);
