import { describe, it, expect } from 'vitest'
import { getTypeAccent, getTypeBadge } from './typeAccent'

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
