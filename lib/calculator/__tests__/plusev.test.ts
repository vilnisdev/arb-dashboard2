import { describe, it, expect } from 'vitest'
import { buildFairProbabilityMap, calcLineValue, calcFreeBetEV, calcBoostEV, calcOddsBoostEV } from '../plusev'
import type { OddsRow } from '../types'

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

describe('buildFairProbabilityMap', () => {
  it('Pinnacle present → correct devigged probs (sum ≈ 1.0)', () => {
    const rows: OddsRow[] = [
      makeRow({ bookmaker_key: 'pinnacle', outcome_name: 'Lakers', price: 2.1 }),
      makeRow({ bookmaker_key: 'pinnacle', outcome_name: 'Celtics', price: 1.8 }),
    ]
    const map = buildFairProbabilityMap(rows)
    const p1 = map.get('evt1:h2h:Lakers')!
    const p2 = map.get('evt1:h2h:Celtics')!
    expect(p1 + p2).toBeCloseTo(1.0, 3)
    expect(p1).toBeGreaterThan(0)
    expect(p2).toBeGreaterThan(0)
    // Celtics (lower odds) should have higher probability
    expect(p2).toBeGreaterThan(p1)
  })

  it('Pinnacle absent → multi-book average fallback', () => {
    const rows: OddsRow[] = [
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Lakers', price: 2.0 }),
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Celtics', price: 1.9 }),
      makeRow({ bookmaker_key: 'fanduel', outcome_name: 'Lakers', price: 2.05 }),
      makeRow({ bookmaker_key: 'fanduel', outcome_name: 'Celtics', price: 1.85 }),
    ]
    const map = buildFairProbabilityMap(rows)
    const p1 = map.get('evt1:h2h:Lakers')!
    const p2 = map.get('evt1:h2h:Celtics')!
    expect(p1).toBeGreaterThan(0)
    expect(p2).toBeGreaterThan(0)
    expect(p2).toBeGreaterThan(p1) // Celtics favored
  })

  it('Pinnacle has 1 outcome → falls back to multi-book average', () => {
    const rows: OddsRow[] = [
      makeRow({ bookmaker_key: 'pinnacle', outcome_name: 'Lakers', price: 2.1 }), // only 1 pinnacle outcome
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Lakers', price: 2.0 }),
      makeRow({ bookmaker_key: 'draftkings', outcome_name: 'Celtics', price: 1.9 }),
    ]
    const map = buildFairProbabilityMap(rows)
    const p1 = map.get('evt1:h2h:Lakers')!
    expect(p1).toBeGreaterThan(0)
    expect(p1).toBeLessThan(1)
  })

  it('fairProb near 0 → clamped to 0.001', () => {
    // Extremely lopsided odds
    const rows: OddsRow[] = [
      makeRow({ bookmaker_key: 'pinnacle', outcome_name: 'Lakers', price: 1000 }),
      makeRow({ bookmaker_key: 'pinnacle', outcome_name: 'Celtics', price: 1.001 }),
    ]
    const map = buildFairProbabilityMap(rows)
    const p1 = map.get('evt1:h2h:Lakers')!
    expect(p1).toBeGreaterThanOrEqual(0.001)
  })
})

describe('calcLineValue', () => {
  it('bookOdds beats fair odds → surfaces with correct EV%', () => {
    // 2.2 * 0.5 - 1 = 0.1 = 10%
    const result = calcLineValue({ bookOdds: 2.2, fairProbability: 0.5, bookmaker: 'draftkings', outcome: 'Lakers', stake: 100 })
    expect(result).not.toBeNull()
    expect(result!.roiPercentage).toBeCloseTo(10, 1)
    expect(result!.expectedValue).toBeCloseTo(10, 1)
  })

  it('bookOdds below fair odds → returns null', () => {
    // 1.8 * 0.55 - 1 = -0.01 → null
    const result = calcLineValue({ bookOdds: 1.8, fairProbability: 0.55, bookmaker: 'draftkings', outcome: 'Lakers', stake: 100 })
    expect(result).toBeNull()
  })

  it('bookOdds = 1.0 → returns null', () => {
    const result = calcLineValue({ bookOdds: 1.0, fairProbability: 0.5, bookmaker: 'draftkings', outcome: 'Lakers', stake: 100 })
    expect(result).toBeNull()
  })
})

describe('calcFreeBetEV', () => {
  it('high odds + fair prob → correct EV', () => {
    // EV = 100 * (3.0 - 1) * 0.4 = 80
    const result = calcFreeBetEV({ amount: 100, bookOdds: 3.0, fairProbability: 0.4, bookmaker: 'draftkings', outcome: 'Lakers' })
    expect(result).not.toBeNull()
    expect(result!.expectedValue).toBeCloseTo(80, 1)
    expect(result!.roiPercentage).toBeCloseTo(80, 1)
  })

  it('bookOdds = 1.0 → returns null (EV = 0)', () => {
    const result = calcFreeBetEV({ amount: 100, bookOdds: 1.0, fairProbability: 0.5, bookmaker: 'draftkings', outcome: 'Lakers' })
    expect(result).toBeNull()
  })
})

describe('calcBoostEV', () => {
  it('boosted odds + fair prob → correct EV', () => {
    // boostedOdds = 1 + 1 * 1.2 = 2.2; EV = 100 * 2.2 * 0.5 - 100 = 10
    const result = calcBoostEV({ originalOdds: 2.0, boostPercentage: 20, fairProbability: 0.5, stake: 100, bookmaker: 'draftkings', outcome: 'Lakers' })
    expect(result).not.toBeNull()
    expect(result!.expectedValue).toBeCloseTo(10, 1)
  })

  it('EV <= 0 → returns null', () => {
    // boostedOdds = 1 + 1 * 1.1 = 2.1; EV = 100 * 2.1 * 0.1 - 100 = -79 → null
    const result = calcBoostEV({ originalOdds: 2.0, boostPercentage: 10, fairProbability: 0.1, stake: 100, bookmaker: 'draftkings', outcome: 'Lakers' })
    expect(result).toBeNull()
  })
})

describe('calcOddsBoostEV', () => {
  it('boosted odds + fair prob → correct EV', () => {
    // EV = 100 * 2.5 * 0.5 - 100 = 25
    const result = calcOddsBoostEV({ boostedOdds: 2.5, fairProbability: 0.5, stake: 100, bookmaker: 'draftkings', outcome: 'Lakers' })
    expect(result).not.toBeNull()
    expect(result!.expectedValue).toBeCloseTo(25, 1)
  })

  it('EV <= 0 → returns null', () => {
    // EV = 100 * 1.5 * 0.1 - 100 = -85 → null
    const result = calcOddsBoostEV({ boostedOdds: 1.5, fairProbability: 0.1, stake: 100, bookmaker: 'draftkings', outcome: 'Lakers' })
    expect(result).toBeNull()
  })
})
