import { calcFreeBetConversion } from './freebet'
import { calcProfitBoostArb } from './boost'
import { calcNoSweatArb } from './nosweat'
import { calcTrueArb } from './truearb'
import { americanToDecimal } from './utils'
import { OpportunityResult, OddsRow, Promotion } from './types'
import {
  SHARP_BOOKS,
  buildFairProbabilityMap,
  calcLineValue,
  calcFreeBetEV,
  calcBoostEV,
  calcOddsBoostEV,
  processFreeBet,
  processProfitBoost,
  processNoSweat,
  processOddsBoost,
  scanTrueArb,
  scanLineValue,
} from './plusev'

export {
  calcFreeBetConversion, calcProfitBoostArb, calcNoSweatArb, calcTrueArb, americanToDecimal,
  buildFairProbabilityMap, calcLineValue, calcFreeBetEV, calcBoostEV, calcOddsBoostEV,
  SHARP_BOOKS,
}
export type { OpportunityResult, OddsRow, Promotion }

type FullOpportunity = OpportunityResult & {
  promotionId: string
  eventId: string
  eventName: string
  commenceTime: string
  sportKey: string
}

const ARB_TYPES = new Set(['free_bet_conversion', 'profit_boost_arb', 'true_arb'])
const EV_COUNTERPARTS = new Set(['free_bet_ev', 'boost_ev', 'odds_boost_ev'])

export function findOpportunities(
  promos: Promotion[],
  odds: OddsRow[],
  minRoi: number,
  defaultStake: number,
  fairProbMap: Map<string, number> = new Map(),
  activeBooks: string[] = [],
): FullOpportunity[] {
  const results: FullOpportunity[] = []

  // Group odds by event
  const eventMap = new Map<string, OddsRow[]>()
  for (const row of odds) {
    const rows = eventMap.get(row.odds_api_event_id) ?? []
    rows.push(row)
    eventMap.set(row.odds_api_event_id, rows)
  }

  // PROMO PASS: promo × event
  for (const promo of promos) {
    for (const [eventId, eventOdds] of eventMap) {
      const h2hOdds = eventOdds.filter(o => o.market_key === 'h2h')
      if (h2hOdds.length < 2) continue
      const { event_name, commence_time, sport_key } = eventOdds[0]

      // Sport restriction filter
      if (promo.sport_restriction && promo.sport_restriction !== sport_key) continue

      // Filter sharp books — never appear in bet slip legs
      const bettableOdds = h2hOdds.filter(o => !SHARP_BOOKS.includes(o.bookmaker_key))
      const meta = { promotionId: promo.id, eventId, eventName: event_name, commenceTime: commence_time, sportKey: sport_key }

      let promoResults: OpportunityResult[] = []
      if (promo.type === 'free_bet') {
        promoResults = processFreeBet(promo, bettableOdds, fairProbMap, eventId, defaultStake)
      } else if (promo.type === 'profit_boost') {
        promoResults = processProfitBoost(promo, bettableOdds, fairProbMap, eventId, defaultStake)
      } else if (promo.type === 'no_sweat') {
        promoResults = processNoSweat(promo, bettableOdds, fairProbMap, eventId, defaultStake)
      } else if (promo.type === 'odds_boost') {
        promoResults = processOddsBoost(promo, bettableOdds, fairProbMap, eventId, defaultStake)
      }

      // min_odds applies to leg1 (the promo leg) only — hedge legs may legitimately be at low odds
      if (promo.min_odds && promo.min_odds > 0) {
        promoResults = promoResults.filter(r => r.leg1.odds >= promo.min_odds!)
      }

      for (const r of promoResults) {
        results.push({ ...r, ...meta })
      }
    }
  }

  // PROMO-INDEPENDENT PASS: runs once per event (fixes true arb duplication bug)
  for (const [eventId, eventOdds] of eventMap) {
    const h2hOdds = eventOdds.filter(o => o.market_key === 'h2h')
    if (h2hOdds.length < 2) continue
    const { event_name, commence_time, sport_key } = eventOdds[0]
    const bettableOdds = h2hOdds.filter(o => !SHARP_BOOKS.includes(o.bookmaker_key))
    const meta = { promotionId: '', eventId, eventName: event_name, commenceTime: commence_time, sportKey: sport_key }

    const arbResult = scanTrueArb(bettableOdds, defaultStake)
    if (arbResult) results.push({ ...arbResult, ...meta })

    for (const r of scanLineValue(eventId, bettableOdds, fairProbMap, defaultStake, 'h2h')) {
      results.push({ ...r, ...meta })
    }
  }

  // Dedup: collect arb keys, drop EV counterparts for same promo+outcome
  const arbKeys = new Set<string>()
  for (const r of results) {
    if (ARB_TYPES.has(r.opportunityType) && r.promotionId) {
      arbKeys.add(`${r.promotionId}:${r.eventId}:${r.leg1.outcome}`)
    }
  }

  const deduped = results.filter(r => {
    if (EV_COUNTERPARTS.has(r.opportunityType) && r.promotionId) {
      if (arbKeys.has(`${r.promotionId}:${r.eventId}:${r.leg1.outcome}`)) return false
    }
    return true
  })

  // Filter by activeBooks (all legs must be on registered books)
  const bookFiltered = activeBooks.length === 0 ? deduped : deduped.filter(r => {
    const books = [r.leg1.bookmaker]
    if (r.leg2) books.push(r.leg2.bookmaker)
    return books.every(b => activeBooks.includes(b))
  })

  return bookFiltered
    .filter(r => r.roiPercentage >= minRoi)
    .sort((a, b) => b.roiPercentage - a.roiPercentage)
}
