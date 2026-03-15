import { OpportunityResult } from './types'

// No-sweat bet: if you lose, you get a free bet refund
// EV uses fairProbability weighting instead of naive 50/50
export function calcNoSweatArb(params: {
  stake: number
  promoOdds: number
  hedgeOdds: number
  refundPercentage: number // 0-100
  freeBetConversionRate: number // typically 0.65-0.75
  fairProbability: number // fair win probability for the promo outcome
  promoBookmaker: string
  hedgeBookmaker: string
  promoOutcome: string
  hedgeOutcome: string
}): OpportunityResult {
  const { stake, promoOdds, hedgeOdds, refundPercentage, freeBetConversionRate, fairProbability, promoBookmaker, hedgeBookmaker, promoOutcome, hedgeOutcome } = params
  const refundValue = stake * (refundPercentage / 100) * freeBetConversionRate
  // Optimal hedge: equalize (promoWin) vs (hedgeWin + refundValue)
  const hedgeStake = (stake * promoOdds - refundValue) / hedgeOdds
  const promoWinProfit = stake * promoOdds - stake - hedgeStake
  const hedgeWinProfit = hedgeStake * (hedgeOdds - 1) - stake + refundValue
  // FIX: use fairProbability weighting instead of naive 50/50
  const expectedValue = promoWinProfit * fairProbability + hedgeWinProfit * (1 - fairProbability)
  const roiPercentage = (expectedValue / stake) * 100

  return {
    opportunityType: 'no_sweat_arb',
    leg1: { bookmaker: promoBookmaker, outcome: promoOutcome, odds: promoOdds, stake },
    leg2: { bookmaker: hedgeBookmaker, outcome: hedgeOutcome, odds: hedgeOdds, stake: hedgeStake },
    guaranteedProfit: Math.min(promoWinProfit, hedgeWinProfit),
    expectedValue,
    roiPercentage,
    calcInputs: params,
  }
}
