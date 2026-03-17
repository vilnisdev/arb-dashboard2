import { describe, it, expect } from 'vitest'
import { getTypeAccent, getTypeBadge, getLegLabels } from './typeAccent'

describe('getTypeAccent', () => {
  it('arb types get violet accent', () => {
    expect(getTypeAccent('true_arb')).toContain('arb')
    expect(getTypeAccent('profit_boost_arb')).toContain('arb')
    expect(getTypeAccent('free_bet_conversion')).toContain('arb')
  })

  it('promo EV types get amber accent', () => {
    expect(getTypeAccent('free_bet_ev')).toContain('promo')
    expect(getTypeAccent('no_sweat_arb')).toContain('promo')
  })

  it('pure EV types get sky accent', () => {
    expect(getTypeAccent('line_value')).toContain('ev')
    expect(getTypeAccent('boost_ev')).toContain('ev')
    expect(getTypeAccent('odds_boost_ev')).toContain('ev')
  })

  it('unknown type falls back to ev', () => {
    expect(getTypeAccent('unknown_type')).toContain('ev')
  })
})

describe('getTypeBadge', () => {
  it('arb types get arb badge', () => {
    expect(getTypeBadge('true_arb')).toContain('arb')
  })

  it('promo EV types get promo badge', () => {
    expect(getTypeBadge('free_bet_ev')).toContain('promo')
  })

  it('pure EV types get ev badge', () => {
    expect(getTypeBadge('line_value')).toContain('ev')
  })
})

describe('getLegLabels', () => {
  it('free_bet_conversion: Free Bet Token + Cash Hedge', () => {
    expect(getLegLabels('free_bet_conversion')).toEqual({ leg1: 'Free Bet Token', leg2: 'Cash Hedge' })
  })

  it('profit_boost_arb: Cash (Boosted) + Cash Hedge', () => {
    expect(getLegLabels('profit_boost_arb')).toEqual({ leg1: 'Cash (Boosted)', leg2: 'Cash Hedge' })
  })

  it('true_arb: Cash + Cash Hedge', () => {
    expect(getLegLabels('true_arb')).toEqual({ leg1: 'Cash', leg2: 'Cash Hedge' })
  })

  it('no_sweat_arb: No Sweat Bet + Cash Hedge', () => {
    expect(getLegLabels('no_sweat_arb')).toEqual({ leg1: 'No Sweat Bet', leg2: 'Cash Hedge' })
  })

  it('free_bet_ev: Free Bet Token + null', () => {
    expect(getLegLabels('free_bet_ev')).toEqual({ leg1: 'Free Bet Token', leg2: null })
  })

  it('boost_ev: Cash (Boosted) + null', () => {
    expect(getLegLabels('boost_ev')).toEqual({ leg1: 'Cash (Boosted)', leg2: null })
  })

  it('odds_boost_ev: Cash (Boosted) + null', () => {
    expect(getLegLabels('odds_boost_ev')).toEqual({ leg1: 'Cash (Boosted)', leg2: null })
  })

  it('line_value: Cash + null', () => {
    expect(getLegLabels('line_value')).toEqual({ leg1: 'Cash', leg2: null })
  })

  it('unknown type falls back to Cash + null', () => {
    expect(getLegLabels('unknown_type')).toEqual({ leg1: 'Cash', leg2: null })
  })
})
