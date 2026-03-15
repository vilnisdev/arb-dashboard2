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
