import { noVigProbability } from './utils'
import { calcFreeBetConversion } from './freebet'
import { calcProfitBoostArb } from './boost'
import { calcNoSweatArb } from './nosweat'
import { calcTrueArb } from './truearb'
import { OddsRow, Promotion, OpportunityResult } from './types'

export const SHARP_BOOKS = ['pinnacle']

export function buildFairProbabilityMap(rows: OddsRow[]): Map<string, number> {
  const map = new Map<string, number>()

  // Group by (eventId, marketKey), keeping eventId and marketKey separately
  const groups = new Map<string, { eventId: string; marketKey: string; rows: OddsRow[] }>()
  for (const row of rows) {
    const key = `${row.odds_api_event_id}:${row.market_key}`
    if (!groups.has(key)) {
      groups.set(key, { eventId: row.odds_api_event_id, marketKey: row.market_key, rows: [] })
    }
    groups.get(key)!.rows.push(row)
  }

  for (const { eventId, marketKey, rows: groupRows } of groups.values()) {
    const outcomeNames = [...new Set(groupRows.map(r => r.outcome_name))]
    if (outcomeNames.length < 2) continue

    // Try Pinnacle first
    const pinnacleByOutcome = new Map<string, number>()
    for (const row of groupRows.filter(r => r.bookmaker_key === 'pinnacle')) {
      pinnacleByOutcome.set(row.outcome_name, row.price)
    }

    if (pinnacleByOutcome.size >= 2) {
      const entries = [...pinnacleByOutcome.entries()]
      const probs = noVigProbability(entries.map(([, price]) => price))
      entries.forEach(([outcome], i) => {
        map.set(`${eventId}:${marketKey}:${outcome}`, Math.min(Math.max(probs[i], 0.001), 0.999))
      })
      continue
    }

    // Fallback: multi-book average (non-sharp books only)
    const nonSharpBooks = [...new Set(
      groupRows.filter(r => !SHARP_BOOKS.includes(r.bookmaker_key)).map(r => r.bookmaker_key)
    )]

    const probsByOutcome = new Map<string, number[]>()
    for (const book of nonSharpBooks) {
      const bookRows = groupRows.filter(r => r.bookmaker_key === book)
      const bookOutcomeSet = new Set(bookRows.map(r => r.outcome_name))
      if (!outcomeNames.every(o => bookOutcomeSet.has(o))) continue

      // Sort by outcomeNames order for consistent probability assignment
      const sortedRows = outcomeNames.map(name => bookRows.find(r => r.outcome_name === name)!)
      const probs = noVigProbability(sortedRows.map(r => r.price))
      sortedRows.forEach((row, i) => {
        const existing = probsByOutcome.get(row.outcome_name) ?? []
        existing.push(probs[i])
        probsByOutcome.set(row.outcome_name, existing)
      })
    }

    for (const [outcome, probs] of probsByOutcome) {
      if (probs.length === 0) continue
      const mean = probs.reduce((a, b) => a + b, 0) / probs.length
      map.set(`${eventId}:${marketKey}:${outcome}`, Math.min(Math.max(mean, 0.001), 0.999))
    }
  }

  return map
}

export function calcLineValue(params: {
  bookOdds: number
  fairProbability: number
  bookmaker: string
  outcome: string
  stake: number
}): OpportunityResult | null {
  const { bookOdds, fairProbability, bookmaker, outcome, stake } = params
  if (!fairProbability || bookOdds <= 1) return null
  const ev = bookOdds * fairProbability - 1
  if (ev <= 0) return null
  return {
    opportunityType: 'line_value',
    leg1: { bookmaker, outcome, odds: bookOdds, stake },
    guaranteedProfit: null,
    expectedValue: ev * stake,
    roiPercentage: ev * 100,
    calcInputs: { bookOdds, fairProbability, evPct: ev },
  }
}

export function calcFreeBetEV(params: {
  amount: number
  bookOdds: number
  fairProbability: number
  bookmaker: string
  outcome: string
}): OpportunityResult | null {
  const { amount, bookOdds, fairProbability, bookmaker, outcome } = params
  if (!fairProbability || bookOdds <= 1) return null
  const ev = amount * (bookOdds - 1) * fairProbability
  if (ev <= 0) return null
  return {
    opportunityType: 'free_bet_ev',
    leg1: { bookmaker, outcome, odds: bookOdds, stake: amount },
    guaranteedProfit: null,
    expectedValue: ev,
    roiPercentage: (ev / amount) * 100,
    calcInputs: { amount, bookOdds, fairProbability },
  }
}

export function calcBoostEV(params: {
  originalOdds: number
  boostPercentage: number
  fairProbability: number
  stake: number
  bookmaker: string
  outcome: string
}): OpportunityResult | null {
  const { originalOdds, boostPercentage, fairProbability, stake, bookmaker, outcome } = params
  if (!fairProbability) return null
  const boostedOdds = 1 + (originalOdds - 1) * (1 + boostPercentage / 100)
  const ev = stake * boostedOdds * fairProbability - stake
  if (ev <= 0) return null
  return {
    opportunityType: 'boost_ev',
    leg1: { bookmaker, outcome, odds: boostedOdds, stake },
    guaranteedProfit: null,
    expectedValue: ev,
    roiPercentage: (ev / stake) * 100,
    calcInputs: { originalOdds, boostPercentage, boostedOdds, fairProbability },
  }
}

export function calcOddsBoostEV(params: {
  boostedOdds: number
  fairProbability: number
  stake: number
  bookmaker: string
  outcome: string
}): OpportunityResult | null {
  const { boostedOdds, fairProbability, stake, bookmaker, outcome } = params
  if (!fairProbability) return null
  const ev = stake * boostedOdds * fairProbability - stake
  if (ev <= 0) return null
  return {
    opportunityType: 'odds_boost_ev',
    leg1: { bookmaker, outcome, odds: boostedOdds, stake },
    guaranteedProfit: null,
    expectedValue: ev,
    roiPercentage: (ev / stake) * 100,
    calcInputs: { boostedOdds, fairProbability },
  }
}

// --- Handler functions (called once per promo×event) ---

export function processFreeBet(
  promo: Promotion,
  h2hOdds: OddsRow[],
  fairProbMap: Map<string, number>,
  eventId: string,
  defaultStake: number,
): OpportunityResult[] {
  if (!promo.amount) return []
  const results: OpportunityResult[] = []
  const promoSide = h2hOdds.filter(o => o.bookmaker_key === promo.sportsbook)
  const hedgeSides = h2hOdds.filter(o => o.bookmaker_key !== promo.sportsbook)

  for (const pOdds of promoSide) {
    const oppositeHedge = hedgeSides.filter(o => o.outcome_name !== pOdds.outcome_name)
    for (const hOdds of oppositeHedge) {
      results.push(calcFreeBetConversion({
        freeBetAmount: promo.amount!,
        promoOdds: pOdds.price,
        hedgeOdds: hOdds.price,
        promoBookmaker: promo.sportsbook,
        hedgeBookmaker: hOdds.bookmaker_key,
        promoOutcome: pOdds.outcome_name,
        hedgeOutcome: hOdds.outcome_name,
      }))
    }
    // EV single-leg play
    const fairProb = fairProbMap.get(`${eventId}:h2h:${pOdds.outcome_name}`)
    if (fairProb) {
      const ev = calcFreeBetEV({
        amount: promo.amount!,
        bookOdds: pOdds.price,
        fairProbability: fairProb,
        bookmaker: promo.sportsbook,
        outcome: pOdds.outcome_name,
      })
      if (ev) results.push(ev)
    }
  }
  return results
}

export function processProfitBoost(
  promo: Promotion,
  h2hOdds: OddsRow[],
  fairProbMap: Map<string, number>,
  eventId: string,
  defaultStake: number,
): OpportunityResult[] {
  if (!promo.boost_percentage) return []
  const results: OpportunityResult[] = []
  const promoSide = h2hOdds.filter(o => o.bookmaker_key === promo.sportsbook)
  const hedgeSides = h2hOdds.filter(o => o.bookmaker_key !== promo.sportsbook)

  for (const pOdds of promoSide) {
    const oppositeHedge = hedgeSides.filter(o => o.outcome_name !== pOdds.outcome_name)
    for (const hOdds of oppositeHedge) {
      const arb = calcProfitBoostArb({
        boostPercentage: promo.boost_percentage!,
        originalOdds: pOdds.price,
        hedgeOdds: hOdds.price,
        totalStake: defaultStake,
        promoBookmaker: promo.sportsbook,
        hedgeBookmaker: hOdds.bookmaker_key,
        promoOutcome: pOdds.outcome_name,
        hedgeOutcome: hOdds.outcome_name,
      })
      if (arb) results.push(arb)
    }
    // EV single-leg play
    const fairProb = fairProbMap.get(`${eventId}:h2h:${pOdds.outcome_name}`)
    if (fairProb) {
      const ev = calcBoostEV({
        originalOdds: pOdds.price,
        boostPercentage: promo.boost_percentage!,
        fairProbability: fairProb,
        stake: defaultStake,
        bookmaker: promo.sportsbook,
        outcome: pOdds.outcome_name,
      })
      if (ev) results.push(ev)
    }
  }
  return results
}

export function processNoSweat(
  promo: Promotion,
  h2hOdds: OddsRow[],
  fairProbMap: Map<string, number>,
  eventId: string,
  defaultStake: number,
): OpportunityResult[] {
  // No-sweat: stake is covered by refund if lost. Use amount as max stake if provided.
  const stake = promo.amount ? Math.min(defaultStake, promo.amount) : defaultStake
  const results: OpportunityResult[] = []
  const promoSide = h2hOdds.filter(o => o.bookmaker_key === promo.sportsbook)
  const hedgeSides = h2hOdds.filter(o => o.bookmaker_key !== promo.sportsbook)

  for (const pOdds of promoSide) {
    const fairProb = fairProbMap.get(`${eventId}:h2h:${pOdds.outcome_name}`) ?? 0.5
    const oppositeHedge = hedgeSides.filter(o => o.outcome_name !== pOdds.outcome_name)
    for (const hOdds of oppositeHedge) {
      results.push(calcNoSweatArb({
        stake,
        promoOdds: pOdds.price,
        hedgeOdds: hOdds.price,
        refundPercentage: 100,
        freeBetConversionRate: 0.7,
        fairProbability: fairProb,
        promoBookmaker: promo.sportsbook,
        hedgeBookmaker: hOdds.bookmaker_key,
        promoOutcome: pOdds.outcome_name,
        hedgeOutcome: hOdds.outcome_name,
      }))
    }
  }
  return results
}

export function processOddsBoost(
  promo: Promotion,
  h2hOdds: OddsRow[],
  fairProbMap: Map<string, number>,
  eventId: string,
  defaultStake: number,
): OpportunityResult[] {
  if (!promo.boost_percentage) return []
  const results: OpportunityResult[] = []
  const promoSide = h2hOdds.filter(o => o.bookmaker_key === promo.sportsbook)

  for (const pOdds of promoSide) {
    const fairProb = fairProbMap.get(`${eventId}:h2h:${pOdds.outcome_name}`)
    if (!fairProb) continue
    const boostedOdds = 1 + (pOdds.price - 1) * (1 + promo.boost_percentage! / 100)
    const ev = calcOddsBoostEV({
      boostedOdds,
      fairProbability: fairProb,
      stake: defaultStake,
      bookmaker: promo.sportsbook,
      outcome: pOdds.outcome_name,
    })
    if (ev) results.push(ev)
  }
  return results
}

export function scanTrueArb(h2hOdds: OddsRow[], totalStake: number): OpportunityResult | null {
  const outcomes = new Map<string, OddsRow[]>()
  for (const row of h2hOdds) {
    outcomes.set(row.outcome_name, [...(outcomes.get(row.outcome_name) ?? []), row])
  }
  const outcomeNames = Array.from(outcomes.keys())
  if (outcomeNames.length < 2) return null

  const [nameA, nameB] = outcomeNames
  const bestA = outcomes.get(nameA)!.reduce((a, b) => a.price > b.price ? a : b)
  const bestB = outcomes.get(nameB)!.reduce((a, b) => a.price > b.price ? a : b)
  if (bestA.bookmaker_key === bestB.bookmaker_key) return null

  return calcTrueArb({
    oddsA: bestA.price,
    oddsB: bestB.price,
    totalStake,
    bookmakerA: bestA.bookmaker_key,
    bookmakerB: bestB.bookmaker_key,
    outcomeA: nameA,
    outcomeB: nameB,
  })
}

export function scanLineValue(
  eventId: string,
  h2hOdds: OddsRow[],
  fairProbMap: Map<string, number>,
  stake: number,
  marketKey: string,
): OpportunityResult[] {
  const results: OpportunityResult[] = []
  const seen = new Set<string>()

  for (const row of h2hOdds) {
    const fairProb = fairProbMap.get(`${eventId}:${marketKey}:${row.outcome_name}`)
    if (!fairProb) continue
    const key = `${row.bookmaker_key}:${row.outcome_name}`
    if (seen.has(key)) continue
    seen.add(key)
    const result = calcLineValue({ bookOdds: row.price, fairProbability: fairProb, bookmaker: row.bookmaker_key, outcome: row.outcome_name, stake })
    if (result) results.push(result)
  }
  return results
}
