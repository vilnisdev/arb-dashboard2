import { OpportunityResult } from './types'

// Profit boost: enhances payout by X%
// boostedOdds = 1 + (origOdds - 1) * (1 + boostPct/100)
// Arb exists when: 1/boostedOdds + 1/hedgeOdds < 1
export function calcProfitBoostArb(params: {
  boostPercentage: number
  originalOdds: number
  hedgeOdds: number
  totalStake: number
  promoBookmaker: string
  hedgeBookmaker: string
  promoOutcome: string
  hedgeOutcome: string
}): OpportunityResult | null {
  const { boostPercentage, originalOdds, hedgeOdds, totalStake, promoBookmaker, hedgeBookmaker, promoOutcome, hedgeOutcome } = params
  const boostedOdds = 1 + (originalOdds - 1) * (1 + boostPercentage / 100)
  const impliedTotal = 1 / boostedOdds + 1 / hedgeOdds
  if (impliedTotal >= 1) return null // no arb

  const promoStake = totalStake / (boostedOdds * (1 / boostedOdds + 1 / hedgeOdds))
  const hStake = totalStake - promoStake
  const guaranteedProfit = promoStake * boostedOdds - totalStake
  const roiPercentage = (guaranteedProfit / totalStake) * 100

  return {
    opportunityType: 'profit_boost_arb',
    leg1: { bookmaker: promoBookmaker, outcome: promoOutcome, odds: boostedOdds, stake: promoStake },
    leg2: { bookmaker: hedgeBookmaker, outcome: hedgeOutcome, odds: hedgeOdds, stake: hStake },
    guaranteedProfit,
    expectedValue: guaranteedProfit,
    roiPercentage,
    calcInputs: { ...params, boostedOdds },
  }
}
