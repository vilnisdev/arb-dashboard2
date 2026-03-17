const ARB_TYPES = new Set(['free_bet_conversion', 'profit_boost_arb', 'true_arb'])
const PROMO_EV_TYPES = new Set(['free_bet_ev', 'no_sweat_arb'])

/** Returns the Tailwind classes for the card's left border + background tint by opportunity type. */
export function getTypeAccent(type: string): string {
  if (ARB_TYPES.has(type))      return 'border-l-arb bg-arb/5'
  if (PROMO_EV_TYPES.has(type)) return 'border-l-promo bg-promo/5'
  return 'border-l-ev bg-ev/5'
}

/** Returns the Tailwind classes for the ROI/EV badge by opportunity type. */
export function getTypeBadge(type: string): string {
  if (ARB_TYPES.has(type))      return 'bg-arb/15 text-arb'
  if (PROMO_EV_TYPES.has(type)) return 'bg-promo/15 text-promo'
  return 'bg-ev/15 text-ev'
}

/** Returns per-leg wager type labels for a given opportunity type. */
export function getLegLabels(type: string): { leg1: string; leg2: string | null } {
  switch (type) {
    case 'free_bet_conversion': return { leg1: 'Free Bet Token', leg2: 'Cash Hedge' }
    case 'profit_boost_arb':    return { leg1: 'Cash (Boosted)', leg2: 'Cash Hedge' }
    case 'true_arb':            return { leg1: 'Cash',           leg2: 'Cash Hedge' }
    case 'no_sweat_arb':        return { leg1: 'No Sweat Bet',   leg2: 'Cash Hedge' }
    case 'free_bet_ev':         return { leg1: 'Free Bet Token', leg2: null }
    case 'boost_ev':            return { leg1: 'Cash (Boosted)', leg2: null }
    case 'odds_boost_ev':       return { leg1: 'Cash (Boosted)', leg2: null }
    case 'line_value':          return { leg1: 'Cash',           leg2: null }
    default:                    return { leg1: 'Cash',           leg2: null }
  }
}
