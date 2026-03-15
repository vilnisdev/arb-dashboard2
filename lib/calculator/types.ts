export type PromoType = 'free_bet' | 'profit_boost' | 'no_sweat' | 'odds_boost'

export interface Promotion {
  id: string
  sportsbook: string
  type: string
  amount?: number
  boost_percentage?: number
  market_restriction?: string
  sport_restriction?: string
  min_odds?: number
}

export interface OddsRow {
  bookmaker_key: string
  market_key: string
  outcome_name: string
  price: number
  point?: number
  odds_api_event_id: string
  sport_key: string
  event_name: string
  commence_time: string
}

export interface OpportunityResult {
  opportunityType: string
  leg1: { bookmaker: string; outcome: string; odds: number; stake: number }
  leg2?: { bookmaker: string; outcome: string; odds: number; stake: number }
  guaranteedProfit: number | null
  expectedValue: number
  roiPercentage: number
  calcInputs: Record<string, unknown>
}
