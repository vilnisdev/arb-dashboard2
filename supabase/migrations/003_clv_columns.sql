-- CLV tracking columns on bets (nullable, no default, non-breaking)
ALTER TABLE public.bets
  ADD COLUMN IF NOT EXISTS fair_probability DECIMAL(6,4),
  ADD COLUMN IF NOT EXISTS closing_probability DECIMAL(6,4);

-- Sportsbook accounts: tracks which books the user has registered accounts with
CREATE TABLE IF NOT EXISTS public.sportsbook_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bookmaker_key text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, bookmaker_key)
);

CREATE INDEX IF NOT EXISTS sportsbook_accounts_user_id_idx ON public.sportsbook_accounts(user_id);

ALTER TABLE public.sportsbook_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sportsbook accounts"
  ON public.sportsbook_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sportsbook accounts"
  ON public.sportsbook_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sportsbook accounts"
  ON public.sportsbook_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sportsbook accounts"
  ON public.sportsbook_accounts FOR DELETE
  USING (auth.uid() = user_id);
