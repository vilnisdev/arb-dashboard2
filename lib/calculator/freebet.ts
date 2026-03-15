import { OpportunityResult } from './types'

// Free bet: winnings only (stake not returned if wins)
// To equalize both outcomes:
// Promo wins: freeBetAmount * (promoOdds - 1) - hedgeStake
// Hedge wins: hedgeStake * (hedgeOdds - 1) - 0 (free bet lost, no cash at risk)
// hedgeStake = freeBetAmount * (promoOdds - 1) / hedgeOdds
export function calcFreeBetConversion(params: {
  freeBetAmount: number
  promoOdds: number
  hedgeOdds: number
  promoBookmaker: string
  hedgeBookmaker: string
  promoOutcome: string
  hedgeOutcome: string
}): OpportunityResult {
  const { freeBetAmount, promoOdds, hedgeOdds, promoBookmaker, hedgeBookmaker, promoOutcome, hedgeOutcome } = params
  const hedgeStake = (freeBetAmount * (promoOdds - 1)) / hedgeOdds
  const promoWinProfit = freeBetAmount * (promoOdds - 1) - hedgeStake
  const hedgeWinProfit = hedgeStake * (hedgeOdds - 1)
  const guaranteedProfit = Math.min(promoWinProfit, hedgeWinProfit)
  const roiPercentage = (guaranteedProfit / freeBetAmount) * 100

  return {
    opportunityType: 'free_bet_conversion',
    leg1: { bookmaker: promoBookmaker, outcome: promoOutcome, odds: promoOdds, stake: freeBetAmount },
    leg2: { bookmaker: hedgeBookmaker, outcome: hedgeOutcome, odds: hedgeOdds, stake: hedgeStake },
    guaranteedProfit,
    expectedValue: guaranteedProfit,
    roiPercentage,
    calcInputs: params,
  }
}
