alter table public.user_settings
  add column if not exists onboarding_completed boolean not null default false;
