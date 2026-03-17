import { describe, it, expect } from 'vitest'
import { decimalToAmerican } from '../utils'

describe('decimalToAmerican', () => {
  it('returns +150 for decimal 2.5', () => {
    expect(decimalToAmerican(2.5)).toBe('+150')
  })

  it('returns -200 for decimal 1.5', () => {
    expect(decimalToAmerican(1.5)).toBe('-200')
  })

  it('returns +100 for decimal 2.0', () => {
    expect(decimalToAmerican(2.0)).toBe('+100')
  })

  it('returns N/A for decimal 1.0', () => {
    expect(decimalToAmerican(1.0)).toBe('N/A')
  })

  it('returns N/A for decimal 0.5', () => {
    expect(decimalToAmerican(0.5)).toBe('N/A')
  })
})
