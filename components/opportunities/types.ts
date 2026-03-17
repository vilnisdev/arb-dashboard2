export interface Opportunity {
  id: string
  opportunity_type: string
  event_name: string
  commence_time: string
  sport_key: string
  leg1_bookmaker: string
  leg1_outcome: string
  leg1_odds: number
  leg1_stake: number
  leg2_bookmaker?: string | null
  leg2_outcome?: string | null
  leg2_odds?: number | null
  leg2_stake?: number | null
  guaranteed_profit?: number | null
  expected_value?: number | null
  roi_percentage: number
  promotions?: { name: string; amount: number } | null
}
