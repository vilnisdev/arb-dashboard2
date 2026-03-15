import { OpportunityResult } from './types'

// True arb: 1/oddsA + 1/oddsB < 1
export function calcTrueArb(params: {
  oddsA: number
  oddsB: number
  totalStake: number
  bookmakerA: string
  bookmakerB: string
  outcomeA: string
  outcomeB: string
}): OpportunityResult | null {
  const { oddsA, oddsB, totalStake, bookmakerA, bookmakerB, outcomeA, outcomeB } = params
  const impliedTotal = 1 / oddsA + 1 / oddsB
  if (impliedTotal >= 1) return null

  const stakeA = totalStake / (oddsA * impliedTotal)
  const stakeB = totalStake - stakeA
  const profit = stakeA * oddsA - totalStake
  const roiPercentage = (profit / totalStake) * 100

  return {
    opportunityType: 'true_arb',
    leg1: { bookmaker: bookmakerA, outcome: outcomeA, odds: oddsA, stake: stakeA },
    leg2: { bookmaker: bookmakerB, outcome: outcomeB, odds: oddsB, stake: stakeB },
    guaranteedProfit: profit,
    expectedValue: profit,
    roiPercentage,
    calcInputs: params,
  }
}
