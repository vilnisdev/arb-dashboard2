import { describe, it, expect } from 'vitest'
import { findOpportunities } from '../index'
import type { OddsRow, Promotion } from '../types'

function makeRow(overrides: Partial<OddsRow> & Pick<OddsRow, 'bookmaker_key' | 'outcome_name' | 'price'>): OddsRow {
  return {
    market_key: 'h2h',
    odds_api_event_id: 'evt1',
    sport_key: 'basketball_nba',
    event_name: 'Lakers vs Celtics',
    commence_time: '2026-03-20T00:00:00Z',
    ...overrides,
  }
}

// Odds that produce a true arb: 1/2.5 + 1/2.5 = 0.8 < 1
const arbOdds: OddsRow[] = [
  makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Lakers', price: 2.5 }),
  makeRow({ bookmaker_key: 'fanduel', outcome_name: 'Celtics', price: 2.5 }),
]

const freeBetPromo: Promotion = {
  id: 'promo1',
  sportsbook: 'draftkings',
  type: 'free_bet',
  amount: 100,
}

describe('findOpportunities', () => {
  it('true arb with 2 promos → appears once (not twice)', () => {
    const promos: Promotion[] = [
      { id: 'p1', sportsbook: 'draftkings', type: 'free_bet', amount: 50 },
      { id: 'p2', sportsbook: 'fanduel', type: 'free_bet', amount: 50 },
    ]
    const results = findOpportunities(promos, arbOdds, -Infinity, 100)
    const trueArbs = results.filter(r => r.opportunityType === 'true_arb')
    expect(trueArbs.length).toBe(1)
  })

  it('free_bet_ev dropped when free_bet_conversion exists for same promo+outcome', () => {
    const fairProbMap = new Map([['evt1:h2h:Lakers', 0.4]])
    const results = findOpportunities([freeBetPromo], arbOdds, -Infinity, 100, fairProbMap)
    const arbForLakers = results.filter(r => r.opportunityType === 'free_bet_conversion' && r.leg1.outcome === 'Lakers')
    const evForLakers = results.filter(r => r.opportunityType === 'free_bet_ev' && r.promotionId === 'promo1' && r.leg1.outcome === 'Lakers')
    if (arbForLakers.length > 0) {
      expect(evForLakers.length).toBe(0)
    }
  })

  it('Pinnacle never appears in leg1.bookmaker or leg2.bookmaker', () => {
    const oddsWithPinnacle: OddsRow[] = [
      ...arbOdds,
      makeRow({ bookmaker_key: 'pinnacle', outcome_name: 'Lakers', price: 2.6 }),
      makeRow({ bookmaker_key: 'pinnacle', outcome_name: 'Celtics', price: 2.6 }),
    ]
    const results = findOpportunities([freeBetPromo], oddsWithPinnacle, -Infinity, 100)
    for (const r of results) {
      expect(r.leg1.bookmaker).not.toBe('pinnacle')
      if (r.leg2) expect(r.leg2.bookmaker).not.toBe('pinnacle')
    }
  })

  it("activeBooks=['draftkings'] → only opportunities with all legs on DK returned", () => {
    const results = findOpportunities([freeBetPromo], arbOdds, -Infinity, 100, new Map(), ['draftkings'])
    for (const r of results) {
      expect(r.leg1.bookmaker).toBe('draftkings')
      if (r.leg2) expect(r.leg2.bookmaker).toBe('draftkings')
    }
  })

  it('activeBooks=[] → all books returned', () => {
    const multiBookPromo: Promotion = { id: 'p1', sportsbook: 'fanduel', type: 'free_bet', amount: 100 }
    const resultsAll = findOpportunities([multiBookPromo], arbOdds, -Infinity, 100)
    const resultsEmpty = findOpportunities([multiBookPromo], arbOdds, -Infinity, 100, new Map(), [])
    expect(resultsAll.length).toBe(resultsEmpty.length)
  })

  it('line_value surfaces when US book beats fair prob', () => {
    // DK offers 3.0, fair prob is 0.35 → 3.0 * 0.35 - 1 = 0.05 = 5% EV
    const odds: OddsRow[] = [
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Lakers', price: 3.0 }),
      makeRow({ bookmaker_key: 'fanduel', outcome_name: 'Celtics', price: 1.5 }),
    ]
    const fairProbMap = new Map([['evt1:h2h:Lakers', 0.35]])
    const results = findOpportunities([], odds, -Infinity, 100, fairProbMap)
    const lineValues = results.filter(r => r.opportunityType === 'line_value')
    expect(lineValues.length).toBeGreaterThan(0)
    expect(lineValues[0].roiPercentage).toBeCloseTo(5, 1)
  })
})

describe('sport_restriction filter', () => {
  const nbaPromo: Promotion = { id: 'p-nba', sportsbook: 'draftkings', type: 'free_bet', amount: 100, sport_restriction: 'basketball_nba' }

  it('promo with sport_restriction=basketball_nba skips NFL events', () => {
    const nflOdds = [
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Chiefs', price: 2.0, sport_key: 'americanfootball_nfl', odds_api_event_id: 'nfl1', event_name: 'Chiefs vs Bills' }),
      makeRow({ bookmaker_key: 'fanduel', outcome_name: 'Bills', price: 2.0, sport_key: 'americanfootball_nfl', odds_api_event_id: 'nfl1', event_name: 'Chiefs vs Bills' }),
    ]
    const results = findOpportunities([nbaPromo], nflOdds, -Infinity, 100)
    expect(results.filter(r => r.promotionId === nbaPromo.id)).toHaveLength(0)
  })

  it('promo with sport_restriction=basketball_nba matches NBA events', () => {
    const results = findOpportunities([nbaPromo], arbOdds, -Infinity, 100) // arbOdds uses basketball_nba
    expect(results.filter(r => r.promotionId === nbaPromo.id).length).toBeGreaterThan(0)
  })

  it('promo with no sport_restriction matches all sports', () => {
    const unrestricted: Promotion = { id: 'p-any', sportsbook: 'draftkings', type: 'free_bet', amount: 100 }
    const results = findOpportunities([unrestricted], arbOdds, -Infinity, 100)
    expect(results.filter(r => r.promotionId === unrestricted.id).length).toBeGreaterThan(0)
  })
})

describe('min_odds filter', () => {
  it('promo.min_odds=2.0 excludes legs with price < 2.0 from leg1', () => {
    const promo: Promotion = { id: 'p-minodds', sportsbook: 'draftkings', type: 'free_bet', amount: 100, min_odds: 2.0 }
    const odds: OddsRow[] = [
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Lakers', price: 1.5 }),
      makeRow({ bookmaker_key: 'fanduel', outcome_name: 'Celtics', price: 2.5 }),
    ]
    const results = findOpportunities([promo], odds, -Infinity, 100)
    for (const r of results.filter(o => o.promotionId === promo.id)) {
      expect(r.leg1.odds).toBeGreaterThanOrEqual(2.0)
    }
  })

  it('promo.min_odds does not affect promo-independent opportunities', () => {
    const promo: Promotion = { id: 'p-hiodds', sportsbook: 'draftkings', type: 'free_bet', amount: 100, min_odds: 10.0 }
    const results = findOpportunities([promo], arbOdds, -Infinity, 100)
    const trueArbs = results.filter(r => r.opportunityType === 'true_arb')
    expect(trueArbs).toHaveLength(1) // unaffected by promo restriction
  })

  it('min_odds=10.0 excludes all promo legs → 0 promo opps, true_arb unaffected', () => {
    // arbOdds prices are 2.5 and 2.5 — both below 10.0
    const promo: Promotion = { id: 'p-noleg', sportsbook: 'draftkings', type: 'free_bet', amount: 100, min_odds: 10.0 }
    const results = findOpportunities([promo], arbOdds, -Infinity, 100)
    expect(results.filter(r => r.promotionId === promo.id)).toHaveLength(0)
    expect(results.filter(r => r.opportunityType === 'true_arb')).toHaveLength(1)
  })

  it('free_bet_conversion: hedge leg below min_odds is still valid', () => {
    // leg1 (promo bet): Celtics at 3.0 ✅ ≥2.0
    // leg2 (hedge): Lakers at 1.5 ✅ allowed — min_odds only restricts leg1
    const promo: Promotion = { id: 'p-hedge', sportsbook: 'fanduel', type: 'free_bet', amount: 100, min_odds: 2.0 }
    const odds: OddsRow[] = [
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Lakers', price: 1.5 }),
      makeRow({ bookmaker_key: 'fanduel', outcome_name: 'Celtics', price: 3.0 }),
    ]
    const results = findOpportunities([promo], odds, -Infinity, 100)
    const conversionOpps = results.filter(r =>
      r.promotionId === promo.id && r.opportunityType === 'free_bet_conversion'
    )
    expect(conversionOpps.length).toBeGreaterThan(0)
  })
})
