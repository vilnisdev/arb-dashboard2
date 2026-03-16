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
